# DTC combined segment counts (multi-DMO)

Patient / D2C sample use cases that **join multiple populated DTC DMOs** to showcase
segment-style counts. Dataspace: **`DTC`**. Audience tag: **D2C**.

- **Seen:** `2026-08-11` via MCP `d360_query_sql` (count-only, no PII)
- **Model:** [../reference/dataModel-dtc.yaml](../reference/dataModel-dtc.yaml)
- **Prompts:** [../prompts/example-prompts.md](../prompts/example-prompts.md) (*Sample use cases* → combined DMO)

Do **not** include DTC email engagement in these demos — person linkage is test/partial.

---

## Recommended demo path

1. **Brand + opt-in** (Premarin) — clearest marketer story, two DMOs.
2. **Brand + opt-in + email** (Premarin) — three-DMO marketable audience.
3. **Unified Nurtec opt-in** — shows the full identity-resolution path (5 DMOs).

---

**Created live (2026-08-12):**

| Field | Value |
| --- | --- |
| Display name | `DEMO_D2C_Premarin_Opted_In` |
| API name | `DTC_DEMO_D2C_Premarin_Opted_In` |
| Dataspace | `DTC` |
| SegmentOn | `DTC_Individual__dlm` |
| Status | `ACTIVE` |
| **Data 360 segment member count** | **26,531** |
| Recipe A count (same filters) | 26,531 (match) |

**Snowflake validation SQL** (stream ACTIVE — run in Snowflake to dual-report):

```sql
-- Brand side
SELECT COUNT(DISTINCT INDIVIDUAL_ID) -- confirm column name in source
FROM CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES
WHERE UPPER(BRAND) = 'PREMARIN';

-- Consent side (opt-in) — join path depends on source keys; agent should align filters
-- Source stream: DTC_OT_EMAIL_CONSENT / DTC_OT_CONSENT_PREFERENCE
```

If Snowflake is not reachable from the agent session:

```text
**Data 360 count:** 26,531
**Snowflake source count:** PENDING (provide validation SQL above)
  Source: CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES
```

---

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.  
> Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md) · Full bank: [../prompts/example-prompts.md](../prompts/example-prompts.md).

## Use case A — Brand profile + opted in

**Dataspace:** `DTC` (patient / D2C)  
**Populated DMOs:** `DTC_BrandProfile__dlm` + `DTC_ContactPointConsent__dlm`  
**Snowflake:** `CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES` ⨝ `DTC_OT_EMAIL_CONSENTS`

**Copy-paste (low clarifying steps):**

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Dual-report Data 360 + Snowflake validation against DTC_BRAND_PROFILES joined to DTC_OT_EMAIL_CONSENTS in CDP_US_DTC_STG_DB.DTC_DC_IN. If Snowflake is unreachable, return the exact validation SQL and mark PENDING. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A).
```

**Short FAQ prompt:** For patients, how many Premarin brand-profile consumers are opted in?

**DMOs:** `DTC_BrandProfile__dlm` + `DTC_ContactPointConsent__dlm`

```sql
SELECT COUNT(DISTINCT bp."IndividualId__c") AS n
FROM DTC_BrandProfile__dlm bp
INNER JOIN DTC_ContactPointConsent__dlm c
  ON c."PartyId__c" = bp."IndividualId__c"
WHERE bp."Brand__c" = 'PREMARIN'
  AND c."ConsentStatusId__c" = 'IN';
```

| Brand | Data 360 count |
| --- | ---: |
| PREMARIN | 26,531 |
| COMIRNATY | 22,722 |
| LITFULO | 8,334 |
| PAXLOVID | 2,510 |

Swap the `Brand__c` literal for the other brands.

**Create-segment prompt:** For patients, create a D2C segment of opted-in Premarin brand-profile consumers.

---

## Use case B — Brand profile + email on file

**Prompt:** For patients, how many Litfulo brand-profile consumers have an email on file?

**DMOs:** `DTC_BrandProfile__dlm` + `DTC_ContactPointEmail__dlm`

```sql
SELECT COUNT(DISTINCT bp."IndividualId__c") AS n
FROM DTC_BrandProfile__dlm bp
INNER JOIN DTC_ContactPointEmail__dlm e
  ON e."PartyId__c" = bp."IndividualId__c"
WHERE bp."Brand__c" = 'LITFULO';
```

**Data 360 count:** 8,413

---

## Use case C — Opted in + email (marketable)

**Prompt:** For patients, how many opted-in consumers have an email on file?

**DMOs:** `DTC_ContactPointConsent__dlm` + `DTC_ContactPointEmail__dlm`

```sql
SELECT COUNT(DISTINCT c."PartyId__c") AS n
FROM DTC_ContactPointConsent__dlm c
INNER JOIN DTC_ContactPointEmail__dlm e
  ON e."PartyId__c" = c."PartyId__c"
WHERE c."ConsentStatusId__c" = 'IN';
```

**Data 360 count:** 170,455

---

## Use case D — Brand + opt-in + email (3-way)

**Prompt:** For patients, how many Premarin brand-profile consumers are opted in and have an email on file?

**DMOs:** `DTC_BrandProfile__dlm` + `DTC_ContactPointConsent__dlm` + `DTC_ContactPointEmail__dlm`

```sql
SELECT COUNT(DISTINCT bp."IndividualId__c") AS n
FROM DTC_BrandProfile__dlm bp
INNER JOIN DTC_ContactPointConsent__dlm c
  ON c."PartyId__c" = bp."IndividualId__c"
INNER JOIN DTC_ContactPointEmail__dlm e
  ON e."PartyId__c" = bp."IndividualId__c"
WHERE bp."Brand__c" = 'PREMARIN'
  AND c."ConsentStatusId__c" = 'IN';
```

**Data 360 count:** 26,529

---

## Use case E — Brand consent preference IN

**Prompt:** For patients, how many consumers have a Premarin consent preference set to IN?

**DMOs:** `DTC_ConsentPreference__dlm` + `DTC_ContactPointConsent__dlm`

```sql
SELECT COUNT(DISTINCT c."PartyId__c") AS n
FROM DTC_ConsentPreference__dlm p
INNER JOIN DTC_ContactPointConsent__dlm c
  ON c."Id__c" = p."ContactPointConsentId__c"
WHERE UPPER(p."PreferenceName__c") = 'PREMARIN'
  AND p."PreferenceValue__c" = 'IN';
```

**Data 360 count:** 27,443

---

## Use case F — Unified path (identity resolution + brand + opt-in)

**Prompt:** For patients, how many Nurtec brand-profile consumers are opted in (unified count)?

**DMOs:** `DTC_UnifiedIndividualDtc__dlm` + `DTC_UnifiedLinkIndividualDtc__dlm` +
`DTC_Individual__dlm` + `DTC_BrandProfile__dlm` + `DTC_ContactPointConsent__dlm`

```sql
SELECT COUNT(DISTINCT ui."Id__c") AS n
FROM DTC_UnifiedIndividualDtc__dlm ui
INNER JOIN DTC_UnifiedLinkIndividualDtc__dlm link
  ON link."UnifiedRecordId__c" = ui."Id__c"
INNER JOIN DTC_Individual__dlm i
  ON i."Id__c" = link."SourceRecordId__c"
INNER JOIN DTC_BrandProfile__dlm bp
  ON bp."IndividualId__c" = i."Id__c"
INNER JOIN DTC_ContactPointConsent__dlm c
  ON c."PartyId__c" = i."Id__c"
WHERE bp."Brand__c" = 'NURTEC'
  AND c."ConsentStatusId__c" = 'IN';
```

**Data 360 count:** 1,493

This is the Skill-canonical anchor path (`unified_individual_to_brand_profile` + consent).

---

## Membership SQL note (create segment)

Count SQL uses `COUNT(DISTINCT …)`. Segment membership SQL must project **SegmentOn PK only**
(no `COUNT`, no aggregation) — typically `DTC_UnifiedIndividualDtc__dlm."Id__c"` (plus key
qualifier if required). See [create-segment-from-count.md](create-segment-from-count.md) and
[../reference/creating-segments.md](../reference/creating-segments.md).

---

## Snowflake dual-report

Brand, consent, and preference DMOs are on **ACTIVE** Snowflake streams under connection
`DTC_CDP_US`. Report:

```text
**Data 360 count:** <N>
**Snowflake source count:** <M or PENDING> (Source: CDP_US_DTC_STG_DB.DTC_DC_IN.<TABLE>)
```

If Snowflake is not connected from the agent session, still return the validation SQL and mark
Snowflake **PENDING**.
