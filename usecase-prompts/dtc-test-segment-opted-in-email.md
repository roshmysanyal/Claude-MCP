# DTC test segment — consumers opted in to email (D2C build package)

**Use case (plain English):** *For patients in DTC, build a D2C segment of consumers who are
opted in to email.* **Name it `DTC test segment`.**

This is a **Recipe B (Push / build-a-segment)** package for the governed
[`d360-segments-activations`](../skill/d360-segments-activations/SKILL.md) Skill. It is the
reviewable, version-controlled definition an operator pastes into Cursor with the `data360` MCP
connected to actually create the segment. It follows the governance contract exactly:
SegmentOn Unified Individual, **CIA Consumer Marketable Email nested first**, then the opt-in
filter, counts-only, and a Data 360 + Snowflake **dual-report**.

> **Environment note (why this is a package, not a live create):** at authoring time the `data360`
> MCP server was **not connected** and the **Snowflake MCP was in an error state** in this session,
> and no `sf` CLI / Salesforce credentials were available. Per the Skill this cannot silently invent
> a result — so the definition, membership SQL, count SQL, and validation SQL are provided ready to
> run, with the Snowflake side marked **PENDING**.
>
> **Note:** Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.

---

## Routing (confirmed)

| Decision | Value | Source |
| --- | --- | --- |
| Audience | **Patient / consumer (D2C)** | "For patients in DTC" (explicit) |
| Dataspace | **`DTC`** | [dataModel-dtc.yaml](../reference/dataModel-dtc.yaml) |
| SegmentOn | **`DTC_UnifiedIndividualDtc__dlm`** (Unified Individual) | Required for activatable D2C |
| Opt-in mapping | **`DTC_ContactPointConsent__dlm.ConsentStatusId__c = 'IN'`** | Consent DMO (email consent stream) |
| Base layer (required) | **CIA Consumer Marketable Email** membership, nested first | Skill D2C rule |

**Plain-English filters**

1. Member of **CIA Consumer Marketable Email** (US targetable, email-marketable consumers) — the
   mandatory D2C base layer.
2. Has an email **consent status = opted in (`IN`)** — i.e. opted in to email.

---

## Proposed names (audience-tagged)

| Field | Value | Notes |
| --- | --- | --- |
| `displayName` | **`DTC test segment`** | Exactly as requested. `DTC` denotes the Direct-to-Consumer / patient audience. |
| `developerName` | **`DTC_Test_Segment_D2C`** | API-safe + carries the required **`D2C`** audience tag (Skill guardrail). Org may prefix the created API name with `DTC_`. |
| `publishSchedule` | `NoRefresh` | Skill default unless the operator approves a schedule. |
| `segmentType` | `Dbt` | Membership SQL below. |

---

## Membership SQL (segment definition — CIA base first, then opt-in)

Projects **only** the SegmentOn PK, no aggregation / `DISTINCT` / aliases; every column fully
qualified; subqueries only in `WHERE`; joins route Unified → Identity Link → source Individual per
the identity-resolution rule. Validated against the
[creating-segments](../reference/creating-segments.md) rules.

```sql
SELECT DTC_UnifiedIndividualDtc__dlm.Id__c
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    -- 1. CIA Consumer Marketable Email base (required first)
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
)
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    -- 2. Opted in to email (consent status = IN), routed via identity link
    SELECT DTC_UnifiedLinkIndividualDtc__dlm.UnifiedRecordId__c
    FROM DTC_UnifiedLinkIndividualDtc__dlm
    WHERE DTC_UnifiedLinkIndividualDtc__dlm.SourceRecordId__c IN (
        SELECT DTC_ContactPointConsent__dlm.PartyId__c
        FROM DTC_ContactPointConsent__dlm
        WHERE DTC_ContactPointConsent__dlm.ConsentStatusId__c = 'IN'
    )
  );
```

## Count SQL (Recipe A — same filters, for the pre-create expected count)

```sql
SELECT COUNT(DISTINCT ui."Id__c") AS patient_count
FROM DTC_UnifiedIndividualDtc__dlm ui
WHERE ui."Id__c" IN (
    SELECT sm."Id__c"
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm sm
    WHERE sm."Segment_Id__c" LIKE '1sgWC00000009cn%'
)
AND ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM DTC_UnifiedLinkIndividualDtc__dlm link
    WHERE link."SourceRecordId__c" IN (
        SELECT c."PartyId__c"
        FROM DTC_ContactPointConsent__dlm c
        WHERE c."ConsentStatusId__c" = 'IN'
    )
);
```

**Reference (opt-in alone, without the CIA base)** — distinct opted-in consumers on
`DTC_ContactPointConsent__dlm` (`ConsentStatusId__c = 'IN'`) was **~170,719** at the 2026-08-12
inventory. The CIA-nested segment count is the **intersection** of that population with CIA
membership, so expect **≤ 170,719**.

---

## Dual-report (Data 360 + Snowflake)

| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | **PENDING** (run count SQL above) — reference opt-in-only ≈ 170,719 | Dataspace `DTC` · SegmentOn `DTC_UnifiedIndividualDtc__dlm` · filter DMO `DTC_ContactPointConsent__dlm` |
| Snowflake source | **PENDING** (MCP not connected) | `CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_EMAIL_CONSENTS` · stream `DTC_OT_EMAIL_CONSENT` (ACTIVE) |

Delta: **PENDING**
Data 360 segment link: **PENDING** — populated after create as
`https://<org-lightning-host>/lightning/r/MarketSegment/<marketSegmentId>/view`

**Snowflake validation SQL** (email-consent stream — confirm exact column casing with `DESCRIBE TABLE`):

```sql
SELECT COUNT(DISTINCT PARTY_ID) AS opted_in_count   -- confirm ID column in source
FROM CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_EMAIL_CONSENTS
WHERE UPPER(CONSENT_VALUE) = 'IN';                   -- confirm CONSENT_VALUE literal / column
```

**Snowflake query output:** PENDING — Snowflake MCP was in an error state in this session, so the
query was not tallied. Reconnect the Snowflake MCP and run the SQL above to fill the count and delta.

> **Note:** Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.

---

## CIA base gap (must surface — do not silently drop)

The 2026-08-12 harvest recorded that the CIA Consumer Marketable Email **Segment Membership Latest
DMO** (`DTC_UnifiedIndividualDtc_SM_1780343389__dlm`) had **0 rows** for `Segment_Id__c LIKE
'1sgWC00000009cn%'`, while CIA's published `lastSegmentMemberCount` was **190,926**
([dataModel-dtc.yaml](../reference/dataModel-dtc.yaml) `reference_segments`). If that is still true
at create time, the CIA-nested membership above evaluates to **0 members** even though the
opt-in population is ~170K.

Per the Skill, **do not drop the CIA layer silently.** When creating:

1. Run the count SQL. If it returns 0 because the CIA nest is empty, tell the user the CIA
   membership DMO has not repopulated and show this SQL — do **not** imply the segment will have
   members.
2. Only if the operator **explicitly approves** a temporary fallback, replace the CIA nest with the
   marketable email + consent filters (still SegmentOn Unified Individual, still tagged **D2C**),
   and call out that the durable pattern is the CIA membership DMO.

---

## Operator run steps (with the `data360` MCP connected)

1. Confirm dataspace `DTC` + audience D2C + the two filters above.
2. `d360_segment_get` on `DTC_CIA_Consumer_Marketable_Email` to reconfirm `marketSegmentId`
   `1sgWC00000009cnYAA` and that the Latest SM DMO has rows (CIA base gap above).
3. Run the **Count SQL** → capture the Data 360 count + refresh timestamp; tally the Snowflake
   validation SQL → fill the dual-report table.
4. `search "create segment"` → `payload_examples` → `execute` **`d360_segment_create`** with
   `dataspace: DTC`, `segmentType: Dbt`, `segmentOnApiName: DTC_UnifiedIndividualDtc__dlm`, the
   membership SQL, `displayName: DTC test segment`, `developerName: DTC_Test_Segment_D2C`,
   `publishSchedule: NoRefresh`. Capture `marketSegmentId`.
5. `d360_segment_get` → show the definition + **Data 360 segment link**; get publish confirmation;
   then `d360_segment_publish`.
6. Recipe S read-back: member count, publication status, activation status (NOT ACTIVATED unless a
   binding is wired), and the dual-report table with the segment link. Activation is a separate,
   explicitly-confirmed step.

---

## Guardrails honored

- Counts-only — no PII in any `SELECT`; consent/identity fields used only in filters/joins.
- SegmentOn Unified Individual; **CIA Consumer Marketable Email nested first**, then opt-in.
- Dual-report table with Snowflake **PENDING** + validation SQL (never dropped silently).
- Einstein counts not used. Create / publish / activate remain separate confirmed writes.
