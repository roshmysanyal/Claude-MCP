# D360 vs Snowflake stream-source count (required dual report)

Every natural-language **HCP or patient count** must be reported as **two numbers**:

1. **Count in Data 360** (DMO / segment query)
2. **Count from the Snowflake source table** that feeds the data stream for that DMO

Do **not** present a D360-only count as the final answer when a Snowflake stream source is known.

Source inventory: [../reference/snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
(and CSV). Skill Recipe A must follow this file after the D360 count.

---

## Required user-facing output shape

```text
**Data 360 count:** <N> HCPs (dataspace <STG_US|Development|PRD_US|DTC>, DMO <api_name>)
**Snowflake source count:** <M> HCPs
  Source: <DATABASE>.<SCHEMA>.<TABLE>
  Stream: <data_stream_name>
```

When this count is for a **segment** (inspect or after create), also include:

```text
**Data 360 segment link:** https://<org-lightning-host>/lightning/r/MarketSegment/<marketSegmentId>/view
Segment: <display name> (<segmentApiName>) · ID: <marketSegmentId>
```

**If the Snowflake query does not return a count** (error, empty, timeout, access denied, stream
not ACTIVE, connector not Snowflake, or no session), still tally by showing:

```text
**Data 360 count:** <N>
**Snowflake source count:** PENDING | N/A
  Source: <DATABASE>.<SCHEMA>.<TABLE>
**Snowflake validation SQL:**
  <exact SQL>
**Snowflake query output:**
  <error text | empty result | status — never PII rows>
```

Optional when both ran successfully:

```text
**Delta:** <abs(N-M)> (<pct>%) — VALIDATED | NOT VALIDATED | PENDING (window / access)
```

Still **never** return PII. Both sides are counts only (`COUNT` / `COUNT(DISTINCT …)`), or
non-count Snowflake diagnostics without person attributes.

---

## How to map D360 → Snowflake

1. Identify the **primary fact/event DMO** used in the count (e.g. Stage HQ email →
   `stg_Headquarter_Email_Engagement__dlm`).
2. Look up that stream in [snowflake-stream-sources.md](../reference/snowflake-stream-sources.md)
   by dataspace + stream/DLO family. Use `database` / `schema` / `table` (`object`).
3. Build a Snowflake count with the **same business filters** and the same person grain
   (`COUNT(DISTINCT <person_key>)`), using source column names (often closer to the stream
   field names than the DMO `__c` API names).
4. Run / **tally** it if Snowflake access is available. If it returns an integer, pair it with the
   D360 count. **If it does not return a count**, still give the user the exact SQL **and the
   Snowflake query output** (error/empty/status — never PII), and mark
   **Snowflake source count: PENDING — run against `<DATABASE>.<SCHEMA>.<TABLE>`**.

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
  actual Snowflake column names before running).
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
**Data 360 count:** 376,055 HCPs (dataspace STG_US, DMO stg_Headquarter_Email_Engagement__dlm)
**Snowflake source count:** <M> HCPs
  Source: CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
  Stream: STG_HCP_OCL_HEADQUARTER_EMAIL
```

---

## Relationship to OCL benchmark

- **Stream-source parity** (this file) = D360 DMO vs the **immediate Snowflake table** behind the
  data stream. Required on every count when the connector is Snowflake.
- **OCL/Snowflake benchmark** ([run-benchmark.md](run-benchmark.md) /
  [compare-counts.md](compare-counts.md)) = formal POC validation against the agreed OCL view.
  Still required for Phase 1 “validated” label; does not replace stream-source dual reporting.
