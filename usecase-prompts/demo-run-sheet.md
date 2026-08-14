# Demo run sheet — Data 360 counts (Cursor)

**Audience:** live room / leadership walkthrough  
**Goal:** NL prompt in Cursor → **everyday English count + the Query** (counts only, no PII)  
**Dataspace:** `STG_US` (Stage) for HQ / IQVIA demos  
**Skill:** `d360-segments-activations` · **MCP:** `data360`

Full SQL library: [demo-segments-d360-snowflake.md](demo-segments-d360-snowflake.md) · Prompt bank: [../prompts/example-prompts.md](../prompts/example-prompts.md) · Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md)

> Query Data 360 only. Answer in everyday English, then put the Query. Do not include a Snowflake count, matching table, PENDING, or Delta.

---

## Say this / don’t say that

| Say | Don’t say |
| --- | --- |
| “Ask in Cursor — no Salesforce **UI** required.” | “No Salesforce access / no Salesforce identity.” |
| “We answer in everyday English, then show the Query.” | “Einstein segment count.” |
| “We return **counts only** — never HCP/patient rows or PII.” | “I’ll show a few sample doctors/patients.” |
| “Today’s live path is **Stage HQ email / IQVIA**.” | “Any dataspace, any prompt works the same.” |

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
| 5 | Dry-run Prompt 1 → everyday English + Query | Presenter | ☐ |

**If #5/#6 fail:** still demo D360 live; run Snowflake SQL in Snowsight; say “Snowflake MCP wiring is next — source SQL is already governed in the skill.”

---

## Room script (~8 minutes)

### 0. Frame (30 sec)

> “Marketer asks in plain English. Cursor uses Data 360 MCP. The answer is a sentence they can understand, then the Query — no PII, no Salesforce UI, no Snowflake matching table.”

### 1. Primary prompt (locked) — ~3 min

**Paste exactly:**

> In Stage, how many HCPs opened a headquarter email in the last 90 days?

**Expected shape:**

```text
There are about 376,660 doctors in Stage who opened a headquarter email in the last 90 days.

**Query**
SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;
```

**Architects only (do not show in the room):** warehouse SQL for this DMO is in
[d360-vs-snowflake-stream.md](../skill/d360-segments-activations/validation/d360-vs-snowflake-stream.md).

**Narrate:** grain = distinct doctors · Stage only · everyday English then the Query.

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
