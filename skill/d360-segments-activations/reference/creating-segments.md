# Creating Segments — reference (distinct from querying / counting)

**Segment creation is not the same operation as a count.** They share the semantic layer for
DMOs/fields/joins, but the SQL they emit is fundamentally different in *shape*, *rules*, and
*result*. This file is the authoritative reference for the **create/build-segment** path (Skill
Recipe B). For counts, see the query path (Skill Recipe A).

---

## Dataspace (required — follows the routed model)

**Audience rule:** Users say **doctors** or **patients**, not dataspace codes.
- **Doctors / HCPs / US customers** → US Customer Data spaces (`DEV-US` / `STG-US` / `PRD-US`)
- **Patients / consumers** → `DTC` (never `PRD-PAT` — empty). Never cross those.

Route by audience first, then take the dataspace from that model's `defaults.dataspace` and each
entity's `dataspace` (see [using-the-data-model.md](using-the-data-model.md)):

| Segment is about | Model | Org label | MCP dataspace | SegmentOn |
|---|---|---|---|---|
| **HCPs** (US Customer — default Dev) | [dataModel-dev.yaml](dataModel-dev.yaml) | DEV-US | `Development` | `dev_UnifiedIndividualRs1__dlm` |
| **HCPs** staging | [dataModel-stg-us.yaml](dataModel-stg-us.yaml) | STG-US | `STG_US` | `stg_UnifiedIndividual__dlm` |
| **HCPs** production | [dataModel-prd-us.yaml](dataModel-prd-us.yaml) | PRD-US | `PRD_US` | `prd_UnifiedIndividualPrd1__dlm` |
| **Patients / D2C** (default) | [dataModel-dtc.yaml](dataModel-dtc.yaml) | DTC | `DTC` | `DTC_UnifiedIndividualDtc__dlm` (**required** — same as CIA Consumer Marketable Email) |
| Patient production | [dataModel-prd-pat.yaml](dataModel-prd-pat.yaml) | PRD-PAT | `PRD_PAT` | **none — empty; use DTC** |
| LAB | [dataModel-lab.yaml](dataModel-lab.yaml) | LAB | `LAB` | `LAB_Individual__dlm` (no IR) |
| default | [dataModel-default.yaml](dataModel-default.yaml) | default | `default` | **not segmentable** |

Full catalog: [dataModel-index.yaml](dataModel-index.yaml).

- Confirm the routed model **and** dataspace with the user before create/publish.
- Put the dataspace on the segment API payload / MCP `execute` params — do not leave it unspecified
  (unspecified often resolves to `default`, which is the wrong model for this POC).
- Never build one segment across both audiences/dataspaces, and never reuse the other model's field names.
- **Patient / D2C / DTC:** **ask** whether to include **CIA Consumer Marketable Email** before
  nesting it — do not nest or skip silently. If yes, nest CIA first (Segment Membership Latest
  DMO), then add other DMOs — see *CIA Consumer Marketable Email base* below. If no, omit CIA.
  Do not SegmentOn `DTC_Individual__dlm` for activatable D2C audiences.
- **Lookback / publish:** every create, update-before-publish, and publish uses
  `lookbackPeriod: "P2Y"` (2 years). Never `P3Y` or `P90D`.
- **Counts in `STG_US` / `PRD_US`:** return the number only — never PII sample rows (same as
  Development). Segment membership projects opaque SegmentOn PKs only. See Skill *PII-safe counts*.

---

## CIA Consumer Marketable Email base (patient / D2C — ask, then nest if yes)

For every consumer/patient/D2C/DTC **create or update**, ask first in everyday language:

> Should this patient audience also be limited to CIA Consumer Marketable Email?

Wait for **yes** or **no**. Do not nest CIA and do not omit it without that answer.

If **no**, skip this nest; still SegmentOn Unified Individual, then add use-case DMOs.

If **yes**, nest this population first, then add use-case DMOs:

| | Value |
|---|---|
| Display name | CIA Consumer Marketable Email |
| API name | `DTC_CIA_Consumer_Marketable_Email` |
| SegmentOn | `DTC_UnifiedIndividualDtc__dlm` |
| `marketSegmentId` | `1sgWC00000009cnYAA` (reconfirm with `d360_segment_get`) |
| Membership Latest DMO | `DTC_UnifiedIndividualDtc_SM_1780343389__dlm` |
| Membership keys | `Id__c` → Unified Individual PK; `Segment_Id__c` → segment id (15-char form observed in org) |

**Order of filters in membership SQL when CIA = yes:**

1. CIA membership nest (`Segment_Id__c LIKE '1sgWC00000009cn%'`)
2. Then Brand Profile / Consent / Preference / Email / other DMOs via identity-link paths

```sql
SELECT DTC_UnifiedIndividualDtc__dlm.Id__c
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
)
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    /* additional use-case DMO subquery(s) */
  );
```

If the user said **yes** and the CIA nest returns 0 members while CIA's published
`lastSegmentMemberCount` is non-zero, stop and tell the user — do not drop the CIA layer
silently. Only use a temporary marketable email+consent fallback if the user explicitly
approves it.

---

## The core distinction

| | Query / count (Recipe A) | Segment inclusion criteria (Recipe B) |
|---|---|---|
| **Result** | a single number | the **membership**: a list of SegmentOn primary keys |
| **Top-level select** | `COUNT(DISTINCT anchor.count_key)` | **only** the SegmentOn profile PK (the rows themselves) |
| **Aggregation** | required (`COUNT`) | **forbidden** |
| **Purpose** | "how many?" | "which entities are in the segment?" |
| **API** | Query family (SQL / QueryV2) | `POST /ssot/segments`, `PATCH /ssot/segments/{segmentApiName}` |

**Key mental model:** a segment's inclusion criteria must **return the list of SegmentOn entities**.
If `SegmentOn = UnifiedIndividual` (`dev_UnifiedIndividualRs1__dlm`), the SQL returns a list of
**`Id__c`** values — the people who qualify — **not** a count of them. You never submit a
`COUNT(DISTINCT …)` query as a segment definition; it will be rejected.

---

## Data 360 segment SQL validation rules

The segment `sql` is validated by Data 360
([Salesforce docs](https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html)).
Build to these rules:

- **First table = a profile table**, and it is the **SegmentOn** table. The top-level `select` may
  project **only that table's primary key** — a single column. Not multiple columns, even if one is
  the PK.
- **No aggregation** (`min`/`max`/`avg`/`count`) at the top level.
- **No `SELECT *`** at the top level.
- **No `CASE`** in the primary select. **No aliases** anywhere.
- **Only `SELECT`** — no other statement types.
- **Fully qualify every column** by table name, in the main query and in subqueries.
- **Subqueries only in `WHERE`**, and each must emit **exactly one column**.
- **Joins require a declared relationship** between the DMOs and use one of their **related join
  keys**; the join-on may contain **only an equality** between the joining keys (plus an optional
  extra condition on FQK fields). Same discipline as the semantic layer — never invent a join.
- **Type-match comparisons** (cast operands to the same type when needed).
- `limit` / `offset` are allowed.
- **Key qualifiers:** if the SegmentOn PK has key qualifiers, project them too (PK first, then
  qualifier) and include them in any `group by`.

---

## Recommended shape: profile PK in `FROM` + single-column `WHERE` subqueries

Because you can project **only the SegmentOn PK** and **no aggregation/`DISTINCT`** is available to
collapse fan-out, the cleanest pattern is: select the profile PK from the SegmentOn table, and push
every multi-hop condition into **`WHERE`-clause subqueries that each emit one column** (the join key
back toward the profile). This:

- emits each qualifying entity **once** (no 1:N fan-out duplicating membership),
- satisfies "subqueries only in `WHERE`, one column each," and
- routes unified ↔ source through the **identity-link DMO**, per the semantic layer's identity rule.

Avoid the wide `JOIN` form for segments: joining a 1:N child (web events, addresses) fans out the
profile PK, and without `DISTINCT` you'd emit duplicate members. Subquery containment sidesteps it.

---

## Worked example — "opted-in `<brand>` HCPs in NY who visited the website in the last 60 days"

**SegmentOn:** `UnifiedIndividual` (`dev_UnifiedIndividualRs1__dlm`) → the segment returns a list of
`Id__c`. Dataspace: **Development**.

> **Data note (2026-08-06):** Address + WebsiteEngagement are schema-mapped but **0 rows** in
> Development today — this segment will be empty until those streams load. Brand is **not** on
> Individual; use `WebsiteEngagement.Indication__c` / `TherapeuticArea__c` or `HcpSegmentation.Brand__c`
> once populated.

```sql
SELECT ui."Id__c"
FROM "dev_UnifiedIndividualRs1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "dev_UnifiedLinkIndividualRs1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT i."Id__c"
        FROM "dev_Individual__dlm" i
        WHERE i."Id__c" IN (
              SELECT addr."PartyId__c"
              FROM "dev_ContactPointAddress__dlm" addr
              WHERE addr."StateProvinceId__c" = 'NY'
          )
          AND i."Id__c" IN (
              SELECT web."IndividualId__c"
              FROM "dev_WebsiteEngagement__dlm" web
              WHERE web."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '60 days'
          )
    )
);
```

**Why this passes validation:** top-level select projects only the SegmentOn PK (`ui."Id__c"`);
no aggregation, no `SELECT *`, no `CASE`, no aliases; every column is fully qualified; each subquery
is in a `WHERE` and emits exactly one column; every containment uses a **declared join key** from
[dataModel-dev.yaml](dataModel-dev.yaml) (`Id__c` ↔ `UnifiedRecordId__c` / `SourceRecordId__c` /
`PartyId__c` / `IndividualId__c`), routed through the identity link.

**Contrast with the count** (Recipe A) for the same population:

```sql
SELECT COUNT(DISTINCT ui."Id__c") AS person_count
FROM "dev_UnifiedIndividualRs1__dlm" ui
JOIN "dev_UnifiedLinkIndividualRs1__dlm" link ON link."UnifiedRecordId__c" = ui."Id__c"
JOIN "dev_Individual__dlm" i ON i."Id__c" = link."SourceRecordId__c"
JOIN "dev_ContactPointAddress__dlm" addr ON addr."PartyId__c" = i."Id__c"
JOIN "dev_WebsiteEngagement__dlm" web ON web."IndividualId__c" = i."Id__c"
WHERE addr."StateProvinceId__c" = 'NY'
  AND web."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '60 days';
```

Same population, same join keys — but the count aggregates (and would be **rejected** as a segment),
while the segment projects the member PKs (and would be **wrong** as a count if fan-out weren't
contained). Build each to its own rules; don't reuse one for the other.

**Demo-ready alternative (populated today):** email openers — swap WebsiteEngagement for
`dev_EmailEngagement__dlm` with `EngagementChannelActionId__c = 'Open'`.

---

## Worked example — DTC use case → multi-DMO containers

**Reference segment (UI, learn from this):**
[UAT -DTC Test Scenario-RX Program](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008iLYAQ)

| | |
|---|---|
| Display / API | `UAT -DTC Test Scenario-RX Program` / `DTC_UAT_DTC_Test_Scenario_2` |
| `marketSegmentId` | `1sgWC00000008iLYAQ` |
| Dataspace / type | `DTC` / `UI` |
| SegmentOn | `DTC_UnifiedIndividualDtc__dlm` |
| Members | **2,504** published (`NoRefresh`); live SQL matching `includeCriteria` is larger — re-count before rebuild |
| Lookback | `P2Y` |

**Use case (everyday language):** How many patients are opted in to Brand or Topic ALL
communications, and who are a caregiver, prospect, or patient, or on a prescription program,
or on medication, or acquired in the last 24 months?

**How the org actually built it** (`includeCriteria` — trust this over the description when they
disagree):

```text
SegmentOn: Unified Individual DTC
AND
  [Container 1] ConsentPreference  count ≥ 1
      PreferenceName__c = 'ALL'
      AND PreferenceType__c IN ('Brand', 'Topic')
      AND PreferenceValue__c = 'IN'
      path: Unified → IdentityLink → Individual → ContactPointConsent → ConsentPreference
AND
  [Container 2] BrandProfile  count ≥ 1
      CustomerType__c IN ('Caregiver', 'Prospect', 'Patient')
      OR OnPrescriptionDrugProgram__c = true
      OR OnMedication__c = true
      OR AcquisitionDate__c in the last 24 months   ← description said "3 years"; filter is 24 mo
      path: Unified → IdentityLink → Individual → BrandProfile
```

**Pattern to reuse for any use case:**

1. Pick **SegmentOn** (DTC → Unified Individual).
2. Split the ask into **DMO containers** (one related object per existence check).
3. **AND or OR containers together** to match the ask (AND = intersection, OR = union); use
   **AND/OR inside** each container for co-required vs alternative attributes.
4. For **new** D2C builds: **ask CIA**. If yes, insert **CIA Consumer Marketable Email** membership
   as container 0, then the use-case containers. If no, omit CIA (this UAT reference has no CIA).
5. Emit **DBT membership SQL** as nested `IN` subqueries (UI `count ≥ 1` ≡ existence subquery).
6. Publish with **`lookbackPeriod: P2Y`** only.

**DBT-shaped membership (Skill create path — CIA = yes + UAT containers):**

```sql
SELECT DTC_UnifiedIndividualDtc__dlm.Id__c
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
)
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
    FROM DTC_UnifiedLinkIndividualDtc__dlm
    WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
      SELECT DTC_ContactPointConsent__dlm.PartyId__c
      FROM DTC_ContactPointConsent__dlm
      WHERE DTC_ContactPointConsent__dlm.Id__c IN (
        SELECT DTC_ConsentPreference__dlm.ContactPointConsentId__c
        FROM DTC_ConsentPreference__dlm
        WHERE DTC_ConsentPreference__dlm.PreferenceName__c = 'ALL'
          AND DTC_ConsentPreference__dlm.PreferenceType__c IN ('Brand', 'Topic')
          AND DTC_ConsentPreference__dlm.PreferenceValue__c = 'IN'
      )
    )
  )
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
    FROM DTC_UnifiedLinkIndividualDtc__dlm
    WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
      SELECT DTC_BrandProfile__dlm.IndividualId__c
      FROM DTC_BrandProfile__dlm
      WHERE DTC_BrandProfile__dlm.CustomerType__c IN ('Caregiver', 'Prospect', 'Patient')
         OR DTC_BrandProfile__dlm.OnPrescriptionDrugProgram__c = true
         OR DTC_BrandProfile__dlm.OnMedication__c = true
         OR DTC_BrandProfile__dlm.AcquisitionDate__c >= CURRENT_DATE - INTERVAL '24 months'
    )
  );
```

---

## Worked example — copay card (natural language → one container)

**Learn from (UI):**
[DTC Copay Card Segment On Individual](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000009ePYAQ)
(`DTC_DTC_Copay_Card_Segment_On_Individual`, `1sgWC00000009ePYAQ`).

This is the **single related-DMO** pattern. The live UI is a QA named-list (SegmentOn Individual,
6 members, no CIA, plus a test allowlist of customer keys). **Do not paste those customer IDs or
card numbers into answers** (PII). A Skill rebuild from natural language uses Unified + **ask CIA**
+ Copay Card has-value, and only keeps an allowlist if the user explicitly wants a test slice.

### Natural language

> How many patients have at least one copay card with a card number filled in? Limit it to the
> six test customer keys (do not list the keys).

### Step 1 — restated bullets

- Audience: patient / D2C → dataspace `DTC`.
- Has at least one Copay Card row.
- That row has `CardNumber__c` populated (`has value` / `IS NOT NULL` and not empty).

### Step 2 — DMO containers

| # | UI container | Related DMO | Inside the container | Between containers |
| --- | --- | --- | --- | --- |
| 0 | CIA Consumer Marketable Email (**only if the user said yes**) | `DTC_UnifiedIndividualDtc_SM_1780343389__dlm` | `Segment_Id__c LIKE '1sgWC00000009cn%'` | AND |
| 1 | Copay Card count ≥ 1 | `DTC_CopayCard__dlm` | `CardNumber__c` has value | AND |

**Identity path (Unified SegmentOn):**
`DTC_UnifiedIndividualDtc__dlm.Id__c` → `DTC_UnifiedLinkIndividualDtc__dlm` →
`DTC_Individual__dlm.Id__c` → `DTC_CopayCard__dlm.IndividualId__c`.

The UI reference SegmentOn is `DTC_Individual__dlm` with a direct
`Individual.Id__c → CopayCard.IndividualId__c` path. Skill rebuilds still use Unified.

### Step 3 — count SQL (Recipe A)

```sql
SELECT COUNT(DISTINCT DTC_UnifiedIndividualDtc__dlm.Id__c)
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
  )
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
    FROM DTC_UnifiedLinkIndividualDtc__dlm
    WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
      SELECT DTC_CopayCard__dlm.IndividualId__c
      FROM DTC_CopayCard__dlm
      WHERE DTC_CopayCard__dlm.CardNumber__c IS NOT NULL
        AND DTC_CopayCard__dlm.CardNumber__c <> ''
    )
  );
```

### Step 4 — membership SQL (Recipe B)

Same `WHERE` as the count. Top-level select is **only** `DTC_UnifiedIndividualDtc__dlm.Id__c`.
No `COUNT`, no `DISTINCT`, no aliases.

If the user asks to keep the UI test slice, add `AND DTC_CopayCard__dlm.IndividualId__c IN (…)`
inside the Copay Card subquery — only after they supply the keys; never copy keys from the
reference segment into chat.

---

## Worked example — copay + brand + recency (UAT scenario 3)

**Learn from (UI):**
[UAT DTC-Test Scenario3](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008jxYAA)
(`DTC_UAT_DTC_Test_Scenario3`, `1sgWC00000008jxYAA`).

This is a **single Copay Card container on Unified Individual** with AND inside: has-value + brand
IN list + two 36-month date filters. Contrast with `1sgWC00000009ePYAQ` (SegmentOn Individual,
allowlist, has-value only).

| | |
|---|---|
| Display / API | `UAT DTC-Test Scenario3` / `DTC_UAT_DTC_Test_Scenario3` |
| `marketSegmentId` | `1sgWC00000008jxYAA` |
| Dataspace / type | `DTC` / `UI` |
| SegmentOn | `DTC_UnifiedIndividualDtc__dlm` |
| Published members | **36** (`NoRefresh`) |
| Lookback metadata | `P90D` — **do not use**. Keep 36-month SQL filters; **publish lookback is always `P2Y`** (never `P3Y`) |
| CIA | **none** in the UI (Skill rebuild **asks**, then nests only if yes) |

**Description (marketing):** Copay and Voucher.

**How the org actually built it** (`includeCriteria` — no voucher DMO):

```text
SegmentOn: Unified Individual DTC
AND
  [Container 1] CopayCard  count ≥ 1
      CardNumber__c has value
      AND AcquisitionDate__c in the last 36 months
      AND MostRecentDate__c in the last 36 months
      AND Brand__c IN ('NURTEC', 'XELJANZ', 'PAXLOVID', 'EUCRISA', 'LORBRENA')
      path: Unified → IdentityLink → Individual → CopayCard.IndividualId__c
```

**Do not paste card numbers** (PII). Do not invent a voucher container from the description.

### Natural language

> Patients who have a copay card with a card number on file for NURTEC, XELJANZ, PAXLOVID,
> EUCRISA, or LORBRENA, acquired in the last 36 months, with activity in the last 36 months.

### Count SQL (Recipe A, UI-equivalent — no CIA)

```sql
SELECT COUNT(DISTINCT DTC_UnifiedIndividualDtc__dlm.Id__c)
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
    FROM DTC_UnifiedLinkIndividualDtc__dlm
    WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
      SELECT DTC_CopayCard__dlm.IndividualId__c
      FROM DTC_CopayCard__dlm
      WHERE DTC_CopayCard__dlm.CardNumber__c IS NOT NULL
        AND DTC_CopayCard__dlm.AcquisitionDate__c >= CURRENT_DATE - INTERVAL '36 months'
        AND DTC_CopayCard__dlm.MostRecentDate__c >= CURRENT_DATE - INTERVAL '36 months'
        AND DTC_CopayCard__dlm.Brand__c IN (
          'NURTEC', 'XELJANZ', 'PAXLOVID', 'EUCRISA', 'LORBRENA'
        )
    )
  );
```

Skill rebuild **asks CIA** and nests it only if yes. Live UI-equivalent count on 2026-08-12 was **312**. Publish with **`P2Y`**.

Snowflake: stream `DTC_COPAY_CARD` / `CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_COPAY_CARDS`.

---

## Worked example — email engagement OR (two DMOs)

**Learn from (UI):**
[UAT DTC Test scenario 4](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008lZYAQ)
(`DTC_UAT_DTC_Test_scenario_4`, `1sgWC00000008lZYAQ`) — original.
Clone with the **same** `includeCriteria`:
[UAT DTC Test scenario 4 - Mariana](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008vFYAQ)
(`DTC_UAT_DTC_Test_scenario_4_Mariana`, `1sgWC00000008vFYAQ`).

This is the **top-level OR** pattern: the person qualifies if they match **either** related DMO
(union), not both. Contrast with UAT RX (AND between Consent Preference and Brand Profile).

| | |
|---|---|
| Display / API | `UAT DTC Test scenario 4` / `DTC_UAT_DTC_Test_scenario_4` (Mariana clone: `DTC_UAT_DTC_Test_scenario_4_Mariana`) |
| `marketSegmentId` | `1sgWC00000008lZYAQ` (clone `1sgWC00000008vFYAQ`) |
| Dataspace / type | `DTC` / `UI` |
| SegmentOn | `DTC_UnifiedIndividualDtc__dlm` |
| Published members | **39** (`NoRefresh`, last modified 2026-06-03 — stale vs live SQL) |
| Lookback metadata | `P90D` — **do not use**; HQ filter is 1 year |
| CIA | **none** in the UI (Skill rebuild **asks**, then nests only if yes) |

**Description (marketing):** Target Patients/Consumers with SFMC email interactions (currently 0)
and historical email engagement.

**How the org actually built it** (`includeCriteria` — trust this over the description and over
`lookbackPeriod`):

```text
SegmentOn: Unified Individual DTC
OR
  [Container 1] Email Engagement (SFMC)  count ≥ 1
      EngagementChannelAction__c IN ('Open', 'Click')
      AND MarketJourneyName__c has value
      path: Unified → IdentityLink → Individual → Email_Engagement.Individual__c
OR
  [Container 2] Headquarter Email Engagement  count ≥ 1
      EngagementDateTime__c in the last 1 year
      AND EngagementChannelAction__c IN ('Click Email', 'Open Email', 'Send Email', 'Email Delivered')
      path: Unified → IdentityLink → Individual → HQ.IndividualId__c
```

**Do not mix DMO vocabularies:** SFMC actions are `Open` / `Click`; HQ actions are `Open Email` /
`Click Email` / `Send Email` / `Email Delivered`. Person link is `Individual__c` on SFMC and
`IndividualId__c` on HQ. Do not copy HCP `OPENED`.

**Live vs published:** SFMC container resolves to **0** people (DMO not audience-ready — see
[dataModel-dtc.yaml](dataModel-dtc.yaml) `EmailEngagement.data_note`). HQ through Unified is the
only contributor. Published **39** is a frozen `NoRefresh` snapshot; re-count with Recipe A before
rebuilding.

### Natural language

> Consumers who opened or clicked a journey email, or who had a headquarter email send, open,
> click, or delivered in the last year.

### Step 1 — restated bullets

- Audience: patient / D2C → dataspace `DTC`.
- Qualify via **either** (union):
  - SFMC email: action Open or Click, and journey name filled in; **or**
  - HQ email: send / open / click / delivered in the last 1 year.

### Step 2 — DMO containers

| # | UI container | Related DMO | Inside the container | Between containers |
| --- | --- | --- | --- | --- |
| 0 | CIA Consumer Marketable Email (**only if the user said yes**) | `DTC_UnifiedIndividualDtc_SM_1780343389__dlm` | `Segment_Id__c LIKE '1sgWC00000009cn%'` | **AND** with the OR-group |
| 1 | Email Engagement count ≥ 1 | `DTC_Email_Engagement__dlm` | action IN (`Open`,`Click`) AND `MarketJourneyName__c` has value | **OR** with container 2 |
| 2 | HQ Email Engagement count ≥ 1 | `DTC_HeadquarterEmailEngagement__dlm` | last 1 year AND action IN (`Click Email`,`Open Email`,`Send Email`,`Email Delivered`) | **OR** with container 1 |

SQL shape: `(optional CIA AND) (SFMC OR HQ)`.

### Step 3 — count SQL (Recipe A)

```sql
SELECT COUNT(DISTINCT DTC_UnifiedIndividualDtc__dlm.Id__c)
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
  )
  AND (
    DTC_UnifiedIndividualDtc__dlm.Id__c IN (
      SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
      FROM DTC_UnifiedLinkIndividualDtc__dlm
      WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
        SELECT DTC_Email_Engagement__dlm.Individual__c
        FROM DTC_Email_Engagement__dlm
        WHERE DTC_Email_Engagement__dlm.EngagementChannelAction__c IN ('Open', 'Click')
          AND DTC_Email_Engagement__dlm.MarketJourneyName__c IS NOT NULL
          AND DTC_Email_Engagement__dlm.MarketJourneyName__c <> ''
      )
    )
    OR DTC_UnifiedIndividualDtc__dlm.Id__c IN (
      SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
      FROM DTC_UnifiedLinkIndividualDtc__dlm
      WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
        SELECT DTC_HeadquarterEmailEngagement__dlm.IndividualId__c
        FROM DTC_HeadquarterEmailEngagement__dlm
        WHERE DTC_HeadquarterEmailEngagement__dlm.EngagementDateTime__c >= CURRENT_TIMESTAMP() - INTERVAL '1' YEAR
          AND DTC_HeadquarterEmailEngagement__dlm.EngagementChannelAction__c IN (
            'Click Email', 'Open Email', 'Send Email', 'Email Delivered'
          )
      )
    )
  );
```

Without CIA (UI-equivalent live count), drop the first `IN` nest. HQ-only through Unified was
**2,987** on 2026-08-12; SFMC nest was **0**.

### Step 4 — membership SQL (Recipe B)

Same `WHERE` as the count. Top-level select is **only** `DTC_UnifiedIndividualDtc__dlm.Id__c`.
No `COUNT`, no `DISTINCT`, no aliases.

Snowflake mapping (technical only — do not put a Snowflake count in the user-facing answer): HQ → stream `DTC_OCL_HEADQUARTER_EMAIL` /
`CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OCL_HEADQUARTER_EMAIL`. SFMC Email Engagement is
not Snowflake-fed.

---

## Naming + lookback (required on every create)

| Field | Rule |
| --- | --- |
| `displayName` | Must **end with ` test`** (space + `test`). Example: `DEMO_D2C_Premarin_Opted_In test`. |
| `developerName` / API name | Must **end with `_test`**. Example: `DEMO_D2C_Premarin_Opted_In_test`. |
| `lookbackPeriod` | Always **`P2Y`** (2 years) on create, update, and **every publish**. Never `P3Y` or `P90D`. |
| Double-append | If the name already ends with `test` / `_test`, do not append again. |

`d360_segment_publish` takes only `segmentId` — set `lookbackPeriod: "P2Y"` on create/update
**before** publish so the published segment carries the 2-year window. Date filters in SQL
(e.g. 36 months) stay as written; lookback metadata is still `P2Y`.

---

## Publish a segment (Recipe P)

Create does **not** publish. After the user confirms, evaluate on demand:

1. Resolve **`marketSegmentId`** with `d360_segment_get` / `d360_segment_get_by_id` (18-char `1sg…`).
   Do **not** pass `segmentApiName` to publish.
2. Confirm `lookbackPeriod` on the definition is **`P2Y`**. Update to `P2Y` before publish if it is
   not. Never publish another window.
3. `execute` `d360_segment_publish`:

```json
{"dataspace": "DTC", "segmentId": "1sgWC0000000AfJYAU"}
```

4. Poll `d360_segment_get` through `PROCESSING` / `COUNTING` until `ACTIVE` or `ERROR`.
5. Dual-report published `lastSegmentMemberCount` vs Recipe A. Do not activate from this step.

DBT create may already land `ACTIVE` after the first count job. Still publish when the user asks
for a fresh snapshot (`NoRefresh` membership goes stale).

---

## Before you submit a segment — checklist

- [ ] Audience routed to the right model, and the dataspace matches it — **`Development` (DEV-US)**
      for HCP, **`DTC`** for patient — confirmed with the user / payload (not `default`).
- [ ] **Name ends with `test`:** `displayName` …` test`, `developerName` …`_test`.
- [ ] **`lookbackPeriod` is `P2Y`** (2 years) on the create/update payload before **every** publish.
- [ ] **Patient/D2C only:** asked whether to include **CIA Consumer Marketable Email**; nested it
      first only if yes; omitted it only if no. SegmentOn is `DTC_UnifiedIndividualDtc__dlm`.
- [ ] `SegmentOn` chosen and it's a **profile table**; top-level select projects **only its PK**.
- [ ] No aggregation, no `SELECT *`, no `CASE`, no aliases.
- [ ] Every column fully qualified; every subquery in `WHERE` and single-column.
- [ ] Every join/containment uses a **declared relationship + join key** from
      [dataModel-dev.yaml](dataModel-dev.yaml) / [dataModel-dtc.yaml](dataModel-dtc.yaml)
      (unified ↔ source routed via the identity-link DMO).
- [ ] Key qualifiers projected + grouped if the PK has them.
- [ ] Filters translated **from the plain-English description** (Recipe B Entry point 0: restated
      bullets → DMO containers → AND **or OR** between containers / AND-OR inside), not copied from
      the reference segment's raw JSON.
- [ ] Membership sanity-checked against the **count** for the same criteria (Recipe A) before publish.

---

## Read segment count and lifecycle status

After create — and whenever the user asks about an existing segment — use the governed read flow:

1. `d360_segment_list` (with the correct `dataspace`) to resolve API name when needed.
2. `d360_segment_get` by `segmentApiName` for definition, SegmentOn, ID, schedule, and
   publication/lifecycle state.
3. `d360_segment_count` with `preferApproxCount: false` for the evaluated member count. It can be
   asynchronous; follow the returned job/status mechanism and report **PENDING** until complete.
4. `d360_activation_list`, matched by market-segment/segment ID, then `d360_activation_get` for each
   match to determine whether the segment is actually activated.

Do not confuse these states:

- **Created / draft:** definition exists.
- **Published / active segment:** definition has been evaluated.
- **Activated:** an activation binding exists for the segment and its returned activation status is
  active/successful.

An ACTIVE activation **target** alone does not mean a segment is activated. Never call
`d360_segment_member_list` merely to prove the count; report counts and lifecycle metadata only.

Required output (natural English + Query — no Snowflake count or matching table):

```text
This audience currently has <N> <doctors|patients>.

**Query**
<the Data 360 SQL or membership SQL for this segment>

Open this audience: https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view

Publication: <returned status>
Activation: <ACTIVATED | CONFIGURED, NOT ACTIVE | NOT ACTIVATED | UNKNOWN>
```

Always include **Open this audience** after create and on every segment count/status read.
Do **not** show a Snowflake count, PENDING match, Delta, or dual-report.
