# Creating Segments — reference (distinct from querying / counting)

**Segment creation is not the same operation as a count.** They share the semantic layer for
DMOs/fields/joins, but the SQL they emit is fundamentally different in *shape*, *rules*, and
*result*. This file is the authoritative reference for the **create/build-segment** path (Skill
Recipe B). For counts, see the query path (Skill Recipe A).

---

## Dataspace (required — follows the routed model)

**Audience rule:** US Customer Data spaces (`DEV-US` / `STG-US` / `PRD-US`) = **HCP**. Patient
spaces (`DTC` / `PRD-PAT`) = **patient / D2C**. Never cross those.

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
- **Patient / D2C / DTC:** always nest **CIA Consumer Marketable Email** first (Segment Membership
  Latest DMO), then add other DMOs — see *CIA Consumer Marketable Email base* below. Do not
  SegmentOn `DTC_Individual__dlm` for activatable D2C audiences.
- **Counts in `STG_US` / `PRD_US`:** return the number only — never PII sample rows (same as
  Development). Segment membership projects opaque SegmentOn PKs only. See Skill *PII-safe counts*.

---

## CIA Consumer Marketable Email base (patient / D2C — required)

Every consumer/patient/D2C/DTC segment must start from this population, then add use-case DMOs.

| | Value |
|---|---|
| Display name | CIA Consumer Marketable Email |
| API name | `DTC_CIA_Consumer_Marketable_Email` |
| SegmentOn | `DTC_UnifiedIndividualDtc__dlm` |
| `marketSegmentId` | `1sgWC00000009cnYAA` (reconfirm with `d360_segment_get`) |
| Membership Latest DMO | `DTC_UnifiedIndividualDtc_SM_1780343389__dlm` |
| Membership keys | `Id__c` → Unified Individual PK; `Segment_Id__c` → segment id (15-char form observed in org) |

**Order of filters in membership SQL:**

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

If the CIA nest returns 0 members while CIA's published `lastSegmentMemberCount` is non-zero, stop
and tell the user — do not drop the CIA layer silently. Only use a temporary marketable
email+consent fallback if the user explicitly approves it.

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
| Members | ~2,504 |
| Lookback | `P2Y` |

**Use case (description):** Target Prospects, Caregivers, or Patients on medication or a
prescription program, enrolled in the last 3 years, and opted in to communications.

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
3. **AND** containers together; use **AND/OR inside** each container to match the ask.
4. For **new** D2C builds under this Skill: insert **CIA Consumer Marketable Email** membership as
   container 0, then the use-case containers (this UAT reference predates that Skill rule).
5. Emit **DBT membership SQL** as nested `IN` subqueries (UI `count ≥ 1` ≡ existence subquery).

**DBT-shaped membership (Skill create path — CIA first + UAT containers):**

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

## Before you submit a segment — checklist

- [ ] Audience routed to the right model, and the dataspace matches it — **`Development` (DEV-US)**
      for HCP, **`DTC`** for patient — confirmed with the user / payload (not `default`).
- [ ] **Patient/D2C only:** **CIA Consumer Marketable Email** membership DMO is the **first** filter;
      SegmentOn is `DTC_UnifiedIndividualDtc__dlm`; then other DMOs are added.
- [ ] `SegmentOn` chosen and it's a **profile table**; top-level select projects **only its PK**.
- [ ] No aggregation, no `SELECT *`, no `CASE`, no aliases.
- [ ] Every column fully qualified; every subquery in `WHERE` and single-column.
- [ ] Every join/containment uses a **declared relationship + join key** from
      [dataModel-dev.yaml](dataModel-dev.yaml) / [dataModel-dtc.yaml](dataModel-dtc.yaml)
      (unified ↔ source routed via the identity-link DMO).
- [ ] Key qualifiers projected + grouped if the PK has them.
- [ ] Filters translated **from the plain-English description** (Recipe B), not copied from the
      reference segment's raw JSON.
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

Required output:

```text
Segment: <display name> (<API name>)
**Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view
**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
Segment member count: <N | PENDING>
**Data 360 count:** <N>
**Snowflake source count:** PENDING | N/A
**Snowflake validation SQL:** <exact SQL>
> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.
Publication status: <returned status>
Activation status: <ACTIVATED | CONFIGURED, NOT ACTIVE | NOT ACTIVATED | UNKNOWN>
```

Always emit **Snowflake validation SQL** for the segment's primary DMO/filters (do **not** probe
Snowflake MCP). Always include the **Data 360 segment link** and **Data 360 DMO link** after create
and on every segment count/status read. Resolve DMO id with `d360_dmo_get`.
