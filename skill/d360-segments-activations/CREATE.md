# Create / update a segment (Recipes B + U)

**Do not read this file for a count-only ask.** Counts: [COUNT.md](COUNT.md).
Status after create: [STATUS.md](STATUS.md). Publish: [PUBLISH.md](PUBLISH.md).
Do **not** also load the full [SKILL.md](SKILL.md) unless you need Discovery / self-tune toggles.

Cross-refs: Recipe A = [COUNT.md](COUNT.md). Recipe S = [STATUS.md](STATUS.md). Recipe P = [PUBLISH.md](PUBLISH.md).

**Route:** doctors → `STG_US`; patients → `DTC`. Never ask Dev / Stage / Prod unless they named another space.
**MCP:** `search` → `payload_examples` → `execute`. Never guess operation names.
**Patients:** ask CIA before writing (see CIA section below). Names end with `test`. `lookbackPeriod: P2Y`.
**ZIP / miles:** [reference/zip-radius.md](reference/zip-radius.md) — do not invent Haversine SQL.

---
## Recipe B — Push (build a segment → activate)

**Trigger:** the user wants to turn a population into a segment — a **plain-English use case**
("build a segment of patients who have a copay card with a card number"), **"now build that as
a segment"** right after a Recipe A count, or (for Phase-2 validation) **"rebuild this reference
segment."** For natural language, start at **Entry point 0**.

**Mental model:** a segment is the **same population as a count, expressed as membership** (the list
of SegmentOn primary keys) instead of a number. The criteria you mapped for the count *are* the
criteria for the segment — you're changing the **shape of the SQL**, not re-deriving the population.
So don't re-interpret the request; reuse the mapping you already have.

There are three entry points; they converge on the same build-and-status core.

### Entry point 0 — build directly from a natural-language use case

**Trigger:** the user describes a population in plain English and asks to **create / build a
segment** (with or without a prior count). Also use this when they paste a Data 360 segment URL
and ask you to **learn from it** or **rebuild** it.

**Canonical UI references (learn the container shape, then apply Skill deltas):**

| Learn from | URL | What it teaches |
| --- | --- | --- |
| UAT RX Program (multi-DMO) | [1sgWC00000008iLYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008iLYAQ) | Two **AND** containers (Consent Preference + Brand Profile), OR inside Brand Profile |
| Copay Card on Individual (single DMO) | [1sgWC00000009ePYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000009ePYAQ) | One related-DMO container, `count ≥ 1`, AND of "in list" + "has value"; SegmentOn Individual |
| UAT copay + brand + recency | [1sgWC00000008jxYAA](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008jxYAA) | One Copay Card container on Unified; AND of has-value + brand IN list + 36-month acquisition **and** recency. Description "Copay and Voucher" has **no voucher DMO** |
| UAT email OR (two engagement DMOs) | [1sgWC00000008lZYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008lZYAQ) (original) Â· [1sgWC00000008vFYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008vFYAQ) (Mariana clone) | Top-level **OR** (union) of SFMC Email Engagement **or** HQ Email Engagement; different action literals and person-link names per DMO. Both have the **same** `includeCriteria` |

Full walkthroughs: [reference/creating-segments.md](reference/creating-segments.md)
*Worked example — DTC use case → multi-DMO containers*, *Worked example — copay card (natural
language → one container)*, *Worked example — copay + brand + recency (UAT scenario 3)*, and
*Worked example — email engagement OR (two DMOs)*.

**Playbook — natural language → segment (always this order):**

1. **Route.** Everyday language: *doctors* → HCP + named US space; *patients / consumers* → `DTC` +
   [dataModel-dtc.yaml](reference/dataModel-dtc.yaml). Do not make the user say "HCP" or "DTC".
   Still **confirm audience type (HCP vs DTC)** before any email/SMS contactability intersection —
   if unclear, ask **"Doctors or patients?"** and wait.
2. **Restate the use case as bullets** the user can confirm. Example from the copay-card segment:
   *Patients who have at least one copay card with a card number filled in* (the live UI also
   restricts to a test allowlist of customer keys — do **not** copy those IDs into answers; they
   are customer IDs / PII).
   If the use case is for **email or SMS**, state that the audience will also be limited to the
   matching **marketable base segment** (contactability layer) per
   [reference/consent-segments.md](reference/consent-segments.md).
   If channel was not named at the Recipe A follow-up, **ask Email or SMS** and wait.
3. **Decompose into DMO containers** (UI = `NumberAggregation` count ≥ 1 on a related DMO;
   DBT = one `SegmentOn.PK IN (SELECT related.FK …)` subquery per container):
   - One **related DMO** per existence check (Copay Card, Brand Profile, Consent, Preference,
     Email Engagement, Headquarter Email Engagement, …).
   - **Between containers:** take the operator from the use case. **AND** = intersection (must
     satisfy every container — UAT RX). **OR** = union (qualify via *either* related DMO — UAT
     email scenario 4). Do not default to AND when the ask is "SFMC **or** HQ email."
   - **Inside a container:** **AND** for co-required attributes (`Open/Click` AND `Journey name
     has value`); **OR** for alternatives (`Caregiver OR Prospect OR Patient`).
   - **Action literals are DMO-specific.** SFMC `DTC_Email_Engagement__dlm` uses `Open` / `Click`.
     HQ `DTC_HeadquarterEmailEngagement__dlm` uses `Open Email` / `Click Email` / `Send Email` /
     `Email Delivered`. Never copy HCP `OPENED` or mix the two vocabularies.
   - **Person-link names differ:** Email Engagement → `Individual__c`; HQ Email → `IndividualId__c`.
   - Map every field through the routed YAML — never guess join keys.
   - Related DMOs on Unified SegmentOn always traverse the **identity link**
     (Unified → Link → source Individual → related DMO).
   - Trust live `includeCriteria` over description **and** over `lookbackPeriod` when they
     disagree (this UI segment's lookback is `P90D` but HQ filter is **1 year**).
4. **Patient/D2C — ASK CIA, then apply Skill deltas:**
   - SegmentOn = **`DTC_UnifiedIndividualDtc__dlm`** (not `DTC_Individual__dlm`).
   - **Ask:** *Should this patient audience also be limited to CIA Consumer Marketable Email?* Wait for
     yes or no. **Yes** → Container 0 = CIA membership DMO, then the use-case containers.
     **No** → omit CIA; use-case containers only. Never nest or skip without that answer.
5. **Count first (Recipe A).** Same filters / same CIA nest. Natural English + Query. Skip
   "build a segment?" — they already asked to create. Still ask **Email or SMS** if the channel
   is not named. If the count is 0 because a DMO or CIA SM nest is empty, show the SQL and
   do not imply the created segment will have members.
6. **Confirm** display name (must end with ` test`), API name (must end with `_test`),
   `lookbackPeriod: P2Y`, dataspace, SegmentOn, containers, AND/OR, and expected count.
7. **Translate to membership SQL** (SegmentOn PK only — no `COUNT`, no aliases). Create with
   `d360_segment_create` (`segmentType: Dbt`, `lookbackPeriod: "P2Y"`, `publishSchedule: NoRefresh`
   unless asked). Then publish on confirmation (`d360_segment_publish`).
8. **Read back** with Recipe S: member count in natural English, the Query, and **Open this
   audience**. Prefer live `includeCriteria` over a marketing description when they diverge.

**UAT RX Program natural-language example (from `1sgWC00000008iLYAQ`) — canonical AND of two DMOs:**

> How many patients are opted in to Brand or Topic ALL communications, and who are a caregiver,
> prospect, or patient, or on a prescription program, or on medication, or acquired in the last
> 24 months? Build that as a segment.

**Copay-card natural-language example (from `1sgWC00000009ePYAQ`):**

> How many patients have at least one copay card with a card number filled in? Limit it to the
> six test customer keys (do not list the keys — they are PII).

**UAT copay + brand + recency natural-language example (from `1sgWC00000008jxYAA`):**

> Patients who have a copay card with a card number on file for NURTEC, XELJANZ, PAXLOVID,
> EUCRISA, or LORBRENA, acquired in the last 36 months, with activity in the last 36 months.

**Email-engagement OR natural-language example (from `1sgWC00000008lZYAQ`; Mariana clone `1sgWC00000008vFYAQ` has the same `includeCriteria`):**

> Consumers who opened or clicked a journey email, or who had a headquarter email send, open,
> click, or delivered in the last year.

**Doctor / HCP example:**

> How many doctors opened a Comirnaty headquarter email in the last 90 days?

**UAT RX Program — how the agent maps it**

| Step | What you do |
| --- | --- |
| Route | *Patients* → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then **AND** of: (1) Consent Preference count ≥ 1, `PreferenceName__c = 'ALL'` AND type IN (`Brand`,`Topic`) AND value `IN`; path Unified → Link → Individual → ContactPointConsent → ConsentPreference. (2) Brand Profile count ≥ 1, `CustomerType__c` IN (`Caregiver`,`Prospect`,`Patient`) **OR** `OnPrescriptionDrugProgram__c` **OR** `OnMedication__c` **OR** `AcquisitionDate__c` last 24 months; FK `IndividualId__c` |
| SQL shape | `(optional CIA AND) ConsentPreference AND BrandProfile` |
| Watch | Description says "enrolled in the last **3 years**"; live filter is **24 months**. UI has **no CIA**. Published members are a `NoRefresh` snapshot — re-count with Recipe A before rebuild. Publish lookback is always **`P2Y`**. |

The live UI is already SegmentOn Unified. A Skill rebuild **asks CIA**, keeps **AND between** containers and **OR inside** Brand Profile, and uses 24 months not 3 years.

**Copay-card — how the agent maps it**

| Step | What you do |
| --- | --- |
| Route | *Patients* → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then Copay Card (`DTC_CopayCard__dlm`) count ≥ 1, `CardNumber__c` has value. Path: Unified → Link → Individual → Copay Card `IndividualId__c` |
| Do not copy | The UI allowlist of six test customer keys (PII). Only keep an allowlist if the user explicitly wants a test slice. |
| Count | `COUNT(DISTINCT` Unified `Id__c`) with the same nests (same CIA choice) |
| Create | Membership SQL: optional CIA `IN` subquery AND Copay Card `IN` subquery; SegmentOn Unified Individual; name ends with `test`; `lookbackPeriod: P2Y` before publish |

The live UI segment is SegmentOn **Individual**, 6 members, **no CIA** — a QA named-list. A Skill
rebuild is Unified + **ask CIA** + Copay Card has-value (full population unless the user asks to
keep a test list).

**UAT copay + brand + recency — how the agent maps it**

| Step | What you do |
| --- | --- |
| Route | *Patients* → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then Copay Card (`DTC_CopayCard__dlm`) count ≥ 1: `CardNumber__c` has value **AND** `Brand__c` IN (`NURTEC`,`XELJANZ`,`PAXLOVID`,`EUCRISA`,`LORBRENA`) **AND** `AcquisitionDate__c` last 36 months **AND** `MostRecentDate__c` last 36 months. Path: Unified → Link → Individual → Copay Card `IndividualId__c` |
| SQL shape | `(optional CIA AND) CopayCard` (one related DMO; AND inside the container) |
| Do not copy | Card numbers (PII). Description "Copay and Voucher" — **no voucher DMO** in `includeCriteria`. |
| Watch | Lookback metadata is `P90D`; live filters are **36 months**. Keep the 36-month SQL filters; **publish lookback is always `P2Y`** (never `P3Y`). Published members are a `NoRefresh` snapshot. |

The live UI is already SegmentOn Unified and has **no CIA**. A Skill rebuild **asks CIA**, keeps the single Copay Card container, keeps 36-month SQL filters (not `P90D`), publishes with **`P2Y`**, and does not invent a voucher object.

**Email-engagement OR — how the agent maps it**

| Step | What you do |
| --- | --- |
| Route | *Patients / consumers* → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then **OR** of: (1) `DTC_Email_Engagement__dlm` count ≥ 1, action IN (`Open`,`Click`) AND `MarketJourneyName__c` has value, FK `Individual__c`; (2) `DTC_HeadquarterEmailEngagement__dlm` count ≥ 1, action IN (`Click Email`,`Open Email`,`Send Email`,`Email Delivered`) AND `EngagementDateTime__c` in last 1 year, FK `IndividualId__c` |
| SQL shape | `(optional CIA AND) (SFMC IN-subquery OR HQ IN-subquery)` — not three ANDs |
| Watch | SFMC container is **0** (person link not audience-ready). Published members **39** are `NoRefresh` from 2026-06-03; live Unified HQ path is larger. Description "SFMC currently 0" matches; `P90D` lookback does **not** override the 1-year HQ filter. Publish lookback is always **`P2Y`**. |

The live UI is already SegmentOn Unified and has **no CIA**. A Skill rebuild **asks CIA**, keeps the **OR** of the two engagement containers, and uses each DMO's own action literals and FK name.

### Entry point 1 — build from the count you just ran (primary)

1. Start from the **criteria you already confirmed and mapped in Recipe A** (anchor/SegmentOn,
   DMOs/fields, filters). Reuse that exact mapping — do not re-interpret the plain-English request.
   Reconfirm **audience type (HCP vs DTC)** and **channel** (email / SMS / neither). If the count
   targeted email/SMS, the segment SQL **must** retain the same marketable base-segment
   membership subquery from [reference/consent-segments.md](reference/consent-segments.md).
2. Confirm with the user that the population they just counted is the one they want as a segment.

### Entry point 2 — rebuild a reference segment (Phase-2 equivalence test)

1. **Read the reference segment** `<REFERENCE_SEGMENT_ID>`: `search` the Segment family for a
   get/describe operation, `execute`, and read its filter logic.
2. **Describe it in plain English** back to the user — the human-readable definition. This is the
   **only** input allowed into the rebuild; do **not** copy the original raw filter JSON forward.
   Then map that description through the semantic layer exactly as in entry point 1.
   Confirm **audience type (HCP vs DTC)** and whether the rebuild is for an **email/SMS** channel;
   if so, intersect the matching marketable base segment's latest-audience DMO per
   [reference/consent-segments.md](reference/consent-segments.md) (same grain or
   IdentityLink — never guess). If audience type cannot be determined, **stop and ask**.

### CIA Consumer Marketable Email base (D2C) — ask, then nest if yes

For every **patient / consumer / D2C / DTC** segment create or update:

0. **Ask first (required):** *Should this patient audience also be limited to CIA Consumer
   Marketable Email?* Wait for **yes** or **no**. Do not nest CIA and do not omit it without that answer.
1. **SegmentOn** must be **`DTC_UnifiedIndividualDtc__dlm`**. Do **not** SegmentOn
   `DTC_Individual__dlm` for activatable D2C audiences.
2. **If yes** — nest the **CIA Consumer Marketable Email** segment membership DMO as the first
   filter, then AND every other use-case DMO:
   - Display name: **CIA Consumer Marketable Email**
   - Segment API name: `DTC_CIA_Consumer_Marketable_Email`
   - `marketSegmentId`: `1sgWC00000009cnYAA` (confirm with `d360_segment_get` if stale)
   - Membership Latest DMO: `DTC_UnifiedIndividualDtc_SM_1780343389__dlm`
     (`segmentMembershipDmo.latestTable` on the CIA segment)
   - Confirmed fields (2026-08-12): `Id__c` = Unified Individual PK; `Segment_Id__c` = segment id
     (org stores **15-char** ids in this DMO — use `1sgWC00000009cn` or
     `Segment_Id__c LIKE '1sgWC00000009cn%'`; confirm before publish)
3. **If no** — omit the CIA nest. Build the use-case DMO containers only (still Unified SegmentOn).
4. **Then** add the necessary DMOs for the ask via declared join keys / identity-link paths in
   [reference/dataModel-dtc.yaml](reference/dataModel-dtc.yaml).
5. **Shape (membership) when CIA = yes:**

```sql
SELECT DTC_UnifiedIndividualDtc__dlm.Id__c
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
)
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    /* additional DMO subquery(s) for brand / consent / etc. */
  );
```

6. **Counts (Recipe A)** for the same population must use the same CIA choice so the count matches
   the segment. Prefer `COUNT(DISTINCT DTC_UnifiedIndividualDtc__dlm.Id__c)`.
7. **If the user said yes and CIA membership rows are missing** in the Latest SM DMO (nest returns
   0 while `lastSegmentMemberCount` on CIA is non-zero): **do not silently drop the CIA layer**.
   Tell the user the nest is empty, show the SQL, and only if they explicitly approve a temporary
   fallback, replicate marketable email+consent filters from `reference_segments` /
   `journeys.marketable_patients` — still SegmentOn Unified Individual, still tag **D2C**, and still
   call out that the durable pattern is the CIA membership DMO.

### Then — for any entry point (build → create → publish → validate → optional activate)

3. **Translate the criteria into segment `sql`** per
   [reference/creating-segments.md](reference/creating-segments.md): `search` for
   create-segment, `payload_examples` for the payload, then build SQL that **returns the membership**
   — project the **SegmentOn PK** *(plus its **key qualifier** if the PK has one — source DMOs like
   `ssot__Individual__dlm` require projecting `KQ_Id__c` alongside `ssot__Id__c`)*. **No
   `DISTINCT`/aggregation**, no `SELECT *`/`CASE`/aliases; fully-qualified columns; joins only on
   declared keys; subqueries only in `WHERE`. Never submit a `COUNT(DISTINCT …)` — Data 360 rejects
   it as a segment. Create/publish in the **routed dataspace** — an **HCP** segment goes to the HCP
   dataspace the user chose (`Development` / `STG_US` / `PRD_US`); a **patient/D2C** segment goes to
   `DTC` — unless the user explicitly chose another. **For patient/D2C, ask whether to include CIA
   Consumer Marketable Email, then apply the CIA base layer above only if they said yes.** **For any
   email/SMS segment**, also include the **marketable base-segment membership subquery** for that
   audience Ã— channel (latest-audience DMO; same-grain or IdentityLink) per
   [reference/consent-segments.md](reference/consent-segments.md) — contactability layer
   on top of consent/preference, not a substitute. For ZIP-radius
   populations, reuse the **same precomputed ZIP5 `IN` list** from the count
   ([reference/zip-radius.md](reference/zip-radius.md)).
4. Propose deterministic names — **tag the audience** so every segment name states who it targets,
   and **always append `test`**:
   - **Audience tag (required):** a **doctor** segment is tagged **`HCP`**; a **patient/consumer**
     segment is tagged **`D2C`**. Put the tag in both names.
   - `displayName`: human-readable, prefixed `DEMO_` for demo segments, include the audience tag,
     and **end with ` test`** — e.g. `DEMO_HCP_<brand>_Email_Openers_90d test` or
     `DEMO_D2C_<brand>_Brand_Profile test`. Do not double-append if it already ends with `test`.
   - `developerName`: API-safe and stable, also carrying the tag, and **end with `_test`** — e.g.
     `DEMO_HCP_<brand>_email_openers_90d_test`; do not overwrite an existing segment silently.
   - `lookbackPeriod`: always **`P2Y`** (2 years) on create (and when updating before republish).
   - `publishSchedule`: `NoRefresh` unless the user requested and approved another schedule.
5. **Confirm before creating.** Show display/API name (with `test` suffix), `lookbackPeriod: P2Y`,
   dataspace, SegmentOn DMO, **CIA yes/no** (D2C only), plain-English filters, membership SQL,
   expected Recipe A count, and whether empty profile streams will force zero members. Creation is
   a write; wait for explicit confirmation.
6. `search` → `payload_examples` → `execute` **`d360_segment_create`** with the routed
   `dataspace` / `input.dataSpace`, `segmentType: "Dbt"`, `lookbackPeriod: "P2Y"`,
   `segmentOnApiName`, and one DBT model whose SQL is the membership query. Capture the returned
   **`marketSegmentId`**, API/developer name, and dataspace — you will need them for the
   **Open this audience** link.
7. **Do not publish automatically just because create succeeded.** Read the created definition
   with `d360_segment_get`, confirm `lookbackPeriod` is `P2Y` and the name ends with `test`,
   show it to the user (including **Open this audience**), and ask for publish confirmation.
   On confirmation, follow **Recipe P** (`d360_segment_publish` with **`segmentId`** =
   `marketSegmentId`, not the API name). DBT create may already show `ACTIVE` after COUNTING —
   that is evaluation, not a substitute for an on-demand publish when the user asked to publish
   or needs a fresh `NoRefresh` snapshot.
8. **Sanity-check membership against the count.** Follow Recipe S to pull the
   segment's member count and publication status, then confirm it
   matches the Recipe A count for the same criteria — same population, so they should agree. If they
   diverge, **stop and reconcile** before activating (a mismatch usually means the segment SQL and the
   count SQL don't express the same filters). Answer the Recipe A-style count per *How to share a
   count* (Query on Stage; Prod = count only; **no segment link** on the count). Then include
   **Open this audience** because this is a create, not a count-only ask. Do **not**
   show a Snowflake count or matching table.
   - **POC Staging empty-result rule:** when the routed dataspace is **`STG_US`** or **`Development`**
     and membership is **0 / empty** (or the underlying DMOs have no rows so the segment cannot be
     meaningfully validated), **always return the literal segment `sql`** you built/submitted —
     copy-pasteable — under **Query**, so the team can validate the
     definition in lieu of members. Still do not dump PII rows.
9. **Validate against OCL/Snowflake** (Recipe A steps 8–9) only if the user asked for a validated
   label and this population isn't already validated.
10. *(Rebuild variant only)* **Confirm segment equivalence** — list the rebuilt filters vs. the
   reference for the user/customer team to confirm they match.
11. **Activation is optional and separately confirmed.** Do not activate merely because the user
   asked to create a segment. If requested, show the existing target and activation configuration,
   require governance/user confirmation, then `search` the Activation family, wire the segment to
   the **existing** SFMC
   activation target (do **not** create a new target), `execute` to trigger, and **confirm SFMC
   receipt**.
12. **Read back lifecycle status.** Follow Recipe S after create/publish/activation and report the
    evaluated member count in natural English, publication state, activation state, **Open this
    audience**, and the Query **only on Stage**.
13. **Report the success criteria:** for a rebuild — (1) count match, (2) segment equivalence, (3)
   SFMC receipt; for build-from-count — (1) segment membership matches the count, (2) SFMC receipt.
   Always close with natural English + **Open this audience**. On **Stage**, also put the Query.
   On **Prod**, omit the Query. Do **not** add a segment link to a prior Recipe A count.


---

## Recipe U — Update an existing segment

**Trigger:** the user asks to change an existing segment's criteria (broaden/narrow filters, change
brand, window, threshold), rename it, or change its schedule.

1. **Ask dataspace + audience first** (Dev/Stage/Prod; HCP vs patient) if not already named, then
   load the routed YAML.
2. **Read the current segment** with `d360_segment_get` (Recipe S) and restate its definition in
   plain English so the user confirms what they're changing from.
3. **Re-map the new criteria** through the semantic layer (same rules as Recipe B). Rebuild the
   **membership SQL** (SegmentOn PK only — no `COUNT`, no PII). For patient/D2C updates, **ask CIA**
   (keep, add, or omit the nest per the answer), then apply the changed DMOs.
4. **Count the new population first (Recipe A)** — query Data 360 only (do **not** probe
   Snowflake MCP). Answer per *How to share a count* (Query on Stage; Prod = count only; **no
   segment link** on this count). Skip "build a segment?" — this is an update. Still ask
   **Email or SMS** if the channel is not named. This shows the impact of the
   change before writing. Do **not** show a Snowflake count or matching table.
5. **Confirm before writing.** Show old vs new definition, dataspace, the new expected count, and
   **Open this audience**. If renaming, keep / append the `test` suffix
   (`displayName` …` test`, API …`_test`). Set / keep `lookbackPeriod: "P2Y"`. For D2C, **ask CIA**
   if the update would add or remove that nest.
6. `search` → `payload_examples` → `execute` **`d360_segment_update`** in the routed dataspace
   (include `lookbackPeriod: "P2Y"`). Do not re-publish or re-activate automatically — publish only
   on confirmation (**Recipe P**), and re-activate only on separate confirmation.
7. **Read back** with Recipe S (member count in natural English, Query, publication status,
   activation status, **Open this audience**) and report the three states separately.

### Segment-definition SQL is its own thing — see the reference

Segment creation follows **different SQL rules than the Recipe A count**, and its result is
different: a segment's inclusion criteria must **return the list of SegmentOn primary keys** (the
membership), not a count. If `SegmentOn = UnifiedIndividual`, the SQL returns a list of
`UnifiedRecordId__c` — never `COUNT(DISTINCT …)`, which Data 360 will reject.

**Build every segment `sql` per [reference/creating-segments.md](reference/creating-segments.md)** —
the authoritative reference for the validation rules (project the SegmentOn profile PK — **plus its
key qualifier if the PK has one**; no aggregation/`DISTINCT`/`SELECT *`/`CASE`/aliases;
fully-qualified columns; joins only on declared relationship keys; subqueries only in `WHERE`, one
column), the recommended `WHERE`-subquery shape that avoids fan-out, and a worked example. Do not
reuse a count query as a segment definition.

---

## ZIP-radius geographic filters (required method)

**Trigger:** the user asks for people **within N miles of a ZIP** (or a landmark that resolves to a
ZIP — e.g. MetLife Stadium → `07073`).

Data 360 usually has **no** ZIP→lat/long reference DMO and segment SQL cannot run a reliable
distance function against an external geo table. **Do not** invent in-SQL Haversine or guess nearby
ZIPs by state/prefix. Always:

1. Resolve the origin ZIP (confirm landmark → ZIP when needed) and origin lat/lon (landmark coords
   when known; else that ZIP's centroid).
2. Derive the ZIP5 list **outside** D360 from a public US postal-code centroid file (default:
   [GeoNames US.zip](https://download.geonames.org/export/zip/US.zip), CC BY 4.0) using **Haversine**
   with radius ≤ N miles. Deduplicate ZIP5.
3. Filter address postal code with
   `SUBSTRING("<address_dmo>"."PostalCodeId__c" FROM 1 FOR 5) IN ('…', '…', …)` on the routed
   model's address path (HCP: ContactPointAddress → Individual → IdentityLink → UnifiedIndividual).
4. Use the **same** `IN` list for both the Recipe A count and the Recipe B segment SQL.
5. Comment the SQL with source, origin coords, radius, ZIP count, and that the boundary is
   **centroid-approximate**. If Address is unpopulated, still return the SQL (POC empty-result rule)
   and say the geo list is ready but address data has not landed.

Authoritative detail + worked MetLife example:
[reference/zip-radius.md](reference/zip-radius.md).

