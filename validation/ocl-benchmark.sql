-- =============================================================================
-- OCL / Snowflake Benchmark Query — HCP Segment POC
-- =============================================================================
-- PURPOSE: This is the SOURCE-OF-TRUTH count the Data 360 result is validated
--          against. (Einstein counts are ruled out per the POC.)
--
-- OWNER:   Salesforce Data Cloud Architect must confirm the exact OCL/Snowflake view /
--          table names and column names below before Phase 1. The structure
--          here is a TEMPLATE — replace every <PLACEHOLDER>.
--
-- INTENT:  Count of opted-in <brand> HCPs in New York who visited the customer
--          website in the last 60 days. (Matches the primary POC prompt.)
--          Set the brand parameter below to the brand being validated.
--
-- IMPORTANT: Capture the snapshot timestamp at the SAME refresh window as the
--            Data 360 count (see run-benchmark.md). Do not compare across
--            different refresh windows.
-- =============================================================================

-- Parameters (edit these; keep them in sync with the Claude/D360 query filters)
SET brand              = '<BRAND>';        -- e.g. the brand named in the request
SET target_state       = 'NY';
SET web_visit_days     = 60;

-- ---------------------------------------------------------------------------
-- Benchmark count
-- ---------------------------------------------------------------------------
SELECT
    COUNT(DISTINCT hcp.<HCP_ID_COLUMN>) AS opted_in_brand_hcp_web_visitors,
    CURRENT_TIMESTAMP()                 AS snapshot_ts   -- record this value
FROM <OCL/Snowflake_HCP_TABLE>                    AS hcp           -- e.g. OCL/Snowflake.PUBLIC.HCP_PROFILE
JOIN <OCL/Snowflake_CONSENT_TABLE>                AS consent       -- opt-in / consent table
      ON consent.<HCP_ID_COLUMN> = hcp.<HCP_ID_COLUMN>
JOIN <OCL/Snowflake_WEB_ENGAGEMENT_TABLE>         AS web           -- website visit / engagement events
      ON web.<HCP_ID_COLUMN> = hcp.<HCP_ID_COLUMN>
WHERE hcp.<BRAND_COLUMN>          = $brand
  AND hcp.<STATE_COLUMN>          = $target_state
  AND consent.<OPT_IN_COLUMN>     = TRUE                 -- opted-in flag
  AND web.<VISIT_TS_COLUMN>       >= DATEADD('day', -$web_visit_days, CURRENT_TIMESTAMP());

-- ---------------------------------------------------------------------------
-- OPTIONAL: also capture the freshness of the underlying OCL/Snowflake data so it can be
-- matched to the D360 data-stream last-refresh timestamp.
-- ---------------------------------------------------------------------------
-- SELECT MAX(web.<VISIT_TS_COLUMN>) AS latest_event_ts,
--        MAX(hcp.<LOAD_TS_COLUMN>)  AS latest_load_ts
-- FROM <OCL/Snowflake_HCP_TABLE> hcp
-- JOIN <OCL/Snowflake_WEB_ENGAGEMENT_TABLE> web ON web.<HCP_ID_COLUMN> = hcp.<HCP_ID_COLUMN>;
