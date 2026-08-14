# Demo segments — D360 count + warehouse SQL (technical)

> **Not for marketer-facing chat.** Cursor answers are everyday English + the Data 360 Query.
> This file is a warehouse SQL cookbook for architects. Do not paste Snowflake counts or matching
> tables into the chat.

**Dataspace:** `STG_US` (Stage)  
**Why Stage:** Profile / website / consent / NBRx DMOs are empty in Dev & Prod today.
Stage **Headquarter email** and **IQVIA** are populated **and** backed by **ACTIVE Snowflake
streams** — the only path that demo dual-validation end-to-end.

| D360 DMO | Stream | Snowflake source |
| --- | --- | --- |
| `stg_Headquarter_Email_Engagement__dlm` | `STG_HCP_OCL_HEADQUARTER_EMAIL` | `CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL` |
| `stg_IQVIACompetitorSalesFact__dlm` | `STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING` | `CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING` |

**Grain:** `COUNT(DISTINCT IndividualId__c)` / `COUNT(DISTINCT INDIVIDUAL_ID)` — never PII.  
**D360 counts** below are live MCP snapshots as of **2026-08-10**.  
**Snowflake columns** are illustrative (mapped from DMO names) — run `DESCRIBE TABLE` once and
adjust if your warehouse uses different casing/names.

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.  
> Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md) · FAQ bank: [../prompts/example-prompts.md](../prompts/example-prompts.md).

---

## How to demo (2 minutes)

1. Ask the Skill (or run the D360 SQL): *“In Stage, how many HCPs …?”*
2. Report: **Data 360 count:** *N*
3. Run the matching Snowflake SQL in the same window.
4. Report: **Snowflake source count:** *M* · Source: `DATABASE.SCHEMA.TABLE`
5. If delta ≤ agreed threshold (2–5%) and windows match → **stream-source parity OK**

---

## Segment A — HQ email openers (last 90 days)

**Plain English:** HCPs who opened a headquarter email in the last 90 days.

| Side | Value |
| --- | --- |
| **Data 360 count** | **376,660** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment B — HQ email clickers (last 90 days)

**Plain English:** HCPs who clicked a headquarter email in the last 90 days.

| Side | Value |
| --- | --- |
| **Data 360 count** | **46,472** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'CLICKED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'CLICKED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment C — Paxlovid HQ openers (last 90 days)

**Plain English:** HCPs who opened a **Paxlovid** headquarter email in the last 90 days.

| Side | Value |
| --- | --- |
| **Data 360 count** | **134,790** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360** — brand field is `Brand__c` (not `BrandName__c`).

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'PAXLOVID'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'PAXLOVID'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment D — Paxlovid HQ clickers (last 90 days)

**Plain English:** HCPs who clicked a **Paxlovid** headquarter email in the last 90 days.
Good “engaged interest” story vs Segment C.

| Side | Value |
| --- | --- |
| **Data 360 count** | **16,879** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'PAXLOVID'
  AND "EngagementChannelAction__c" = 'CLICKED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'PAXLOVID'
  AND ENGAGEMENT_CHANNEL_ACTION = 'CLICKED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment E — Abrysvo HQ openers (last 90 days)

**Plain English:** HCPs who opened an **Abrysvo** headquarter email in the last 90 days.

| Side | Value |
| --- | --- |
| **Data 360 count** | **92,016** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'ABRYSVO'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'ABRYSVO'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment F — Nurtec HQ openers (last 90 days)

**Plain English:** HCPs who opened a **Nurtec** headquarter email in the last 90 days.
Smaller, crisp number for a short demo.

| Side | Value |
| --- | --- |
| **Data 360 count** | **14,556** |
| Snowflake source | `…HCP_OCL_HEADQUARTER_EMAIL` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'NURTEC'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'NURTEC'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Segment G — Eliquis writers with NRx > 0 (IQVIA)

**Plain English:** HCPs with **Eliquis** competitive prescribing NRx volume greater than zero.

| Side | Value |
| --- | --- |
| **Data 360 count** | **606,740** |
| Snowflake source | `…HCP_IQVIA_COMPETITIVE_PRESCRIBING` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_IQVIACompetitorSalesFact__dlm"
WHERE "BrandName__c" = 'ELIQUIS'
  AND "NRXVolume__c" > 0;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING
WHERE BRAND_NAME = 'ELIQUIS'
  AND NRX_VOLUME > 0;
```

---

## Segment H — Eliquis “high writers” (NRx > 10)

**Plain English:** HCPs with Eliquis NRx volume **> 10** — tighter activation-style segment.

| Side | Value |
| --- | --- |
| **Data 360 count** | **2,142** |
| Snowflake source | `…HCP_IQVIA_COMPETITIVE_PRESCRIBING` |

**D360**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_IQVIACompetitorSalesFact__dlm"
WHERE "BrandName__c" = 'ELIQUIS'
  AND "NRXVolume__c" > 10;
```

**Snowflake**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING
WHERE BRAND_NAME = 'ELIQUIS'
  AND NRX_VOLUME > 10;
```

---

## Recommended demo path (pick 3)

| Order | Segment | Why |
| --- | ---: | --- |
| 1 | **A** HQ openers 90d | Big number, simple filter, easy Snowflake match |
| 2 | **C** Paxlovid openers | Brand story; same table as A |
| 3 | **G** or **H** Eliquis IQVIA | Second stream (IQVIA) — proves dual-source validation |

Optional closer: **D** Paxlovid clickers (16,879) vs **C** openers (134,790) — engagement funnel.

---

## Do **not** use for Snowflake dual-validation demos (today)

| Ask | Why |
| --- | --- |
| Dev/Prod CRM email Open/Click | Live in D360, but typically **not** Snowflake-stream fed → Snowflake count **N/A** |
| Website / NY / opt-in / NBRx / ZIP radius | DMO empty (0) in Dev & Prod; Stage profile empty |
| Classic “opted-in NY website visitors” POC prompt | Needs address + website + consent streams |

Use those only to show Skill mapping / empty-stream honesty — not stream-source parity.

---

## Output shape (always)

```text
**Data 360 count:** <N> HCPs (dataspace STG_US, DMO <…>)
**Snowflake source count:** <M> HCPs
  Source: CDP_US_HCP_STG_DB.HCP_DC_IN.<TABLE>
  Stream: STG_HCP_<…>
**Delta:** <abs(N-M)> (<pct>%) — VALIDATED | NOT VALIDATED | PENDING
```

See [../validation/d360-vs-snowflake-stream.md](../validation/d360-vs-snowflake-stream.md).
