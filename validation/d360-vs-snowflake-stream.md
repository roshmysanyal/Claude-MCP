# D360 vs Snowflake stream-source count (required dual report)

Every natural-language **HCP or patient count** must be reported as:

1. **Live count in Data 360** (DMO / segment query via Data 360 MCP)
2. **Snowflake validation SQL** for the source table that feeds the data stream for that DMO
   (Snowflake cell marked **PENDING** — do **not** probe Snowflake MCP)

Do **not** present a D360-only count as the final answer when a Snowflake stream source is known.
Do **not** authenticate Snowflake MCP, check connector connectivity, or execute the warehouse
query from the agent.

Source inventory: [../reference/snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
(and CSV). Skill Recipe A must follow this file after the D360 count.

---

## Required user-facing output shape — a table

Render the two sides **in a Markdown table** (not prose), for both HCP and DTC, on
pull (count / status) and push (create / update):

```text
| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | <N> | Dataspace <STG_US or Development or PRD_US or DTC> · DMO <api_name> · refreshed <ts> |
| Snowflake source | PENDING or N/A | <DATABASE.SCHEMA.TABLE> · stream <data_stream_name> |

Delta: PENDING / N/A

**Snowflake validation SQL:**
  <exact SQL — same filters / person grain as the D360 count>

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
DMO: <label> (<api_name>) · ID: <dmoId>
**Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view
Segment: <display name> (<segmentApiName>) · ID: <marketSegmentId>
```

Resolve `<dmoId>` with `d360_dmo_get` (`dataModelObjectName`). Multi-DMO counts list one DMO link
per primary fact DMO. For pure DMO/SQL counts with no MarketSegment, set:

```text
**Data 360 segment link:** N/A — DMO count only (no MarketSegment)
```

Copy-paste prompts that name dataspace + populated DMOs (low clarifying steps):
[../prompts/example-prompts.md](../prompts/example-prompts.md) · chat starters:
[../prompts/chat-starters.md](../prompts/chat-starters.md).

If the stream is **not Snowflake-fed** (SFMC / CRM / UploadedFiles), mark **N/A — connector not
Snowflake** instead of PENDING and still name the DMO + DMO link.

Still **never** return PII. Both sides are counts only (`COUNT` / `COUNT(DISTINCT …)`).

---

## How to map D360 → Snowflake

1. Identify the **primary fact/event DMO** used in the count (e.g. Stage HQ email →
   `stg_Headquarter_Email_Engagement__dlm`).
2. Look up that stream in [snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
   by dataspace + stream/DLO family. Use `database` / `schema` / `table` (`object`).
3. Build a Snowflake count with the **same business filters** and the same person grain
   (`COUNT(DISTINCT <person_key>)`), using source column names (often closer to the stream
   field names than the DMO `__c` API names).
4. **Do not run** the Snowflake query from the agent. Emit the exact SQL, mark
   **Snowflake source count: PENDING**, and include the note above. Resolve the DMO link via
   `d360_dmo_get`.

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

If the DMO is fed by **SFMC / CRM / UploadedFiles** (not Snowflake), say so explicitly:
**Snowflake source count: N/A — stream connector is not Snowflake** and fall back to the
OCL/Snowflake benchmark only when that benchmark is defined for the ask
([ocl-benchmark.sql](ocl-benchmark.sql)).

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

**Answer format:**

```text
| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | 376,055 | Dataspace STG_US · DMO stg_Headquarter_Email_Engagement__dlm |
| Snowflake source | PENDING | CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL · stream STG_HCP_OCL_HEADQUARTER_EMAIL |

Delta: PENDING

**Snowflake validation SQL:**
  SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
  FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
  WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
    AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
**Data 360 segment link:** N/A — DMO count only (no MarketSegment)
```

---

## Relationship to OCL benchmark

- **Stream-source parity** (this file) = D360 DMO vs the **immediate Snowflake table** behind the
  data stream. Required on every count when the connector is Snowflake (SQL + PENDING; no MCP probe).
- **OCL/Snowflake benchmark** ([run-benchmark.md](run-benchmark.md) /
  [compare-counts.md](compare-counts.md)) = formal POC validation against the agreed OCL view.
  Still required for Phase 1 “validated” label; does not replace stream-source dual reporting.
