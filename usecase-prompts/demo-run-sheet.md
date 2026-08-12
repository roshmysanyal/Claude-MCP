# Demo run sheet — Data 360 + Snowflake dual counts (Cursor)

**Audience:** live room / leadership walkthrough  
**Goal:** NL prompt in Cursor → **Data 360 count + Snowflake source count** (counts only, no PII)  
**Dataspace for dual tally:** `STG_US` (Stage) only  
**Skill:** `d360-segments-activations` · **MCPs:** `data360` + Snowflake  

Full SQL library: [demo-segments-d360-snowflake.md](demo-segments-d360-snowflake.md) · Prompt bank: [../prompts/example-prompts.md](../prompts/example-prompts.md) · Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md)

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360. Use copy-paste prompts that name **dataspace + populated DMO** so the agent does not re-ask routing questions.

---

## Say this / don’t say that

| Say | Don’t say |
| --- | --- |
| “Ask in Cursor — no Salesforce **UI** required.” | “No Salesforce access / no Salesforce identity.” |
| “Every count is validated against the Snowflake stream source.” | “Einstein segment count.” |
| “We return **counts only** — never HCP/patient rows or PII.” | “I’ll show a few sample doctors/patients.” |
| “Today’s dual-tally path is **Stage HQ email / IQVIA** (ACTIVE streams).” | “Any dataspace, any prompt works the same.” |
| “Dev/Prod HCP streams are mostly not activated yet — we won’t demo those for Snowflake parity.” | “Prod is empty so Data Cloud is wrong.” |
| “Delta within 2–5% with matched refresh windows = pass.” | “The numbers must be identical every time.” |

---

## Owners (fill before the room)

| Role | Name | Job in this demo |
| --- | --- | --- |
| Presenter (Cursor) | __________ | Runs prompts; narrates table |
| Data Cloud | __________ | Streams ACTIVE + refresh timestamp |
| Snowflake | __________ | MCP server + PAT + table SELECT |
| Governance | __________ | Approves count-only / who may use MCP |

**Agreed delta threshold:** ______% (default **2–5%**)

---

## Preflight (T−60 min) — all must be green

| # | Check | Owner | OK? |
| --- | --- | --- | --- |
| 1 | Cursor: `data360` MCP authenticated | Presenter | ☐ |
| 2 | Skill `d360-segments-activations` enabled | Presenter | ☐ |
| 3 | Stream `STG_HCP_OCL_HEADQUARTER_EMAIL` = **ACTIVE** + refreshed | Data Cloud | ☐ |
| 4 | Stream `STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING` = **ACTIVE** (backup) | Data Cloud | ☐ |
| 5 | Snowflake MCP connected (tools discover; not error) | Snowflake | ☐ |
| 6 | Dry-run Prompt 1 → both integers (not PENDING) | Presenter | ☐ |
| 7 | Capture D360 last-refresh + Snowflake query time | Presenter | ☐ |

**If #5/#6 fail:** still demo D360 live; run Snowflake SQL in Snowsight; say “Snowflake MCP wiring is next — source SQL is already governed in the skill.”

---

## Room script (~8 minutes)

### 0. Frame (30 sec)

> “Marketer asks in plain English. Cursor uses Data 360 MCP for the cloud count and Snowflake MCP for the source tally. Output is a count table — no PII, no Salesforce UI.”

### 1. Primary prompt (locked) — ~3 min

**Paste exactly:**

> In Stage, how many HCPs opened a headquarter email in the last 90 days?

**Expected shape:**

| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | ~376,660 | Dataspace `STG_US` · DMO `stg_Headquarter_Email_Engagement__dlm` |
| Snowflake source | *M* | `CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL` · stream `STG_HCP_OCL_HEADQUARTER_EMAIL` |

Delta: |N−M| (≤ threshold) — VALIDATED

**D360 SQL (agent should use):**

```sql
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Snowflake SQL (agent or Snowsight fallback):**

```sql
SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());
```

**Narrate:** grain = distinct HCP · Stage only · stream ACTIVE · both sides same business filter.

### 2. Brand follow-up (optional) — ~2 min

> In Stage, how many HCPs opened a Paxlovid headquarter email in the last 90 days?

~**134,790** D360 · same Snowflake table with `BRAND = 'PAXLOVID'`.

### 3. Second lane / backup — ~2 min

**IQVIA (also ACTIVE Snowflake):**

> In Stage, how many HCPs have Eliquis NRx volume greater than zero in IQVIA competitive prescribing?

~**606,740** D360 · source `…HCP_IQVIA_COMPETITIVE_PRESCRIBING`.

**Or patient lane (DTC streams ACTIVE; dual-tally if Snowflake MCP can read DTC DB):**

> For patients, how many consumers are in the Premarin brand profile?

~**37,463** — say “patient path works in DTC; today’s parity spotlight is Stage HCP email.”

### 4. Close (30 sec)

> “What’s left for broader prompts: activate remaining HCP streams (Dev/Prod) and finish Snowflake MCP for every laptop. The skill and Data 360 path are already the governed contract.”

---

## Do not open in the room

| Prompt / area | Why |
| --- | --- |
| Dev/Prod “website visits / consent / profile dual Snowflake” | Streams mostly `NEEDS_ACTIVATION` or empty for parity |
| “Show me the list of HCPs / emails / NPIs” | PII — skill forbids |
| Einstein segment count | Invalidates the POC |
| `PRD_PAT` patient asks | Empty — use `DTC` |
| Create + activate to SFMC | Separate Phase 2 demo; not this dual-count run |

---

## Backup prompts (if primary drifts)

| # | Prompt | ~D360 | Snowflake table |
| --- | ---: | ---: | --- |
| B1 | In Stage, how many HCPs clicked a headquarter email in the last 90 days? | 46,472 | `HCP_OCL_HEADQUARTER_EMAIL` |
| B2 | In Stage, how many HCPs opened an Abrysvo headquarter email in the last 90 days? | 92,016 | same |
| B3 | In Stage, how many HCPs have Eliquis NRx volume greater than 10 in IQVIA competitive prescribing? | 2,142 | `HCP_IQVIA_COMPETITIVE_PRESCRIBING` |

---

## Day-of failure cards

| Symptom | What to do / say |
| --- | --- |
| Snowflake count **PENDING** | Run Snowflake SQL in Snowsight; “MCP connect is the remaining wire — SQL is ready.” |
| D360 count 0 / error | Re-auth `data360`; confirm dataspace `STG_US`; refresh stream. |
| Large delta | Check refresh timestamps first; don’t argue accuracy mid-demo — “outside window; re-run after refresh.” |
| Audience asks for Prod dual tally | “Prod connection/streams not activated for this parity path yet — Stage is the live proof.” |
| “Can people with no SF login use this?” | “Today: Data 360 license + Cursor OAuth, no UI. True shared/headless identity is a governance follow-up.” |

---

## Post-demo ask (one slide)

1. Activate remaining Stage/Dev streams needed for the next prompt set.  
2. Ship Snowflake MCP URL + PAT to demo laptops.  
3. Confirm governance language: **no UI** vs **no Salesforce identity**.  
4. Lock delta threshold in writing.
