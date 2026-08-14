# D360 vs Snowflake stream-source count (technical cookbook)

> **Not for marketer-facing answers.** Chat output is natural English + the Data 360 Query.
> Do **not** put a Snowflake count, matching table, PENDING, or Delta in the user-facing answer.
> This file is for architects who later run warehouse SQL themselves.

Every natural-language **HCP or patient count** is answered from **Data 360** only:

1. **Live count in Data 360** (DMO / segment query via Data 360 MCP) — this is the number you say in English
2. **Query** — the Data 360 SQL that produced that number

Do **not** authenticate Snowflake MCP, check connector connectivity, or execute the warehouse
query from the agent. Do **not** show a Snowflake count in the chat answer.

Source inventory: [../reference/snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
(and CSV). Use this file only when someone asks for warehouse validation SQL.

---

## Warehouse validation SQL shape (technical — not the chat answer)

If a technical user asks for warehouse SQL, you may share **the query only** — no Snowflake
count, no matching table, no PENDING, no Delta.

```sql
SELECT COUNT(DISTINCT <ID>)
FROM DATABASE.SCHEMA.TABLE
WHERE <same filters / person grain as the Data 360 count>;
```

Copy-paste prompts: [../prompts/example-prompts.md](../prompts/example-prompts.md) ·
[../prompts/chat-starters.md](../prompts/chat-starters.md).

Still **never** return PII. Warehouse SQL is `COUNT` / `COUNT(DISTINCT …)` only.

---

## How to map D360 → Snowflake

1. Identify the **primary fact/event DMO** used in the count (e.g. Stage HQ email →
   `stg_Headquarter_Email_Engagement__dlm`).
2. Look up that stream in [snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
   by dataspace + stream/DLO family. Use `database` / `schema` / `table` (`object`).
3. Build a Snowflake count with the **same business filters** and the same person grain
   (`COUNT(DISTINCT <person_key>)`), using source column names (often closer to the stream
   field names than the DMO `__c` API names).
4. **Do not run** the Snowflake query from the agent. Share the SQL only if a technical user asks.
   Never put a Snowflake count in the chat answer.

### Common Stage (`STG_US`) mappings (2026-08-07)

| D360 DMO / use case | Stream | Snowflake source |
| --- | --- | --- |
| `stg_Headquarter_Email_Engagement__dlm` (HQ email opens/clicks) | `STG_HCP_OCL_HEADQUARTER_EMAIL` | `CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL` |
| `stg_IQVIACompetitorSalesFact__dlm` (IQVIA NRx) | `STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING` | `CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING` |

### Common Development mappings (when streams are active)

| D360 concept | Typical Snowflake DB | Schema | Example tables |
| --- | --- | --- | --- |
| HCP profile / engagement family | `CDP_US_HCP_DEV_DB` | `HCP_DC_IN` | `DIM_CUST`, `HCP_WEB_INTERACTIONS`, … |
| Email engagement (CRM) | Confirm stream in inventory — may be SFMC, not Snowflake | — | — |

If the DMO is fed by **SFMC / CRM / UploadedFiles** (not Snowflake), there is no warehouse
query to share. Fall back to the OCL/Snowflake benchmark only when that benchmark is defined
for the ask ([ocl-benchmark.sql](ocl-benchmark.sql)).

---

## Filter parity rules

- Same time window (e.g. last 90 days) and same timezone semantics when possible.
- Same action/brand literals (Stage HQ: `OPENED` / `CLICKED`, not Dev `Open` / `Click`).
- Same distinct person key (Stage HQ/IQVIA: `IndividualId` / `INDIVIDUAL_ID` style — confirm
  actual Snowflake column names before documenting).
- No PII in either SELECT list.

---

## Example — Stage HQ email opens (last 90 days)

**D360 (illustrative):**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90 days';
```

**Snowflake source (illustrative — confirm column names in Snowflake):**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

**If a technical user asks for warehouse SQL, share the query only (no count, no matching table):**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

---

## Relationship to OCL benchmark

- **Stream-source mapping** (this file) = which Snowflake table feeds a DMO. For architects only —
  not the chat answer.
- **OCL/Snowflake benchmark** ([run-benchmark.md](run-benchmark.md) /
  [compare-counts.md](compare-counts.md)) = formal POC validation against the agreed OCL view,
  used only when someone asks for a **"validated"** label.
