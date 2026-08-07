# Example Prompts — HCP Segment POC

Prompts to drive Claude (with the `d360-segments-activations` Skill enabled and the `data360` MCP server
connected). Substitute a real brand for `<brand>` when running. The customer team to supply
additional illustrative marketer prompts to tune the Skill.

---

## Phase 1 — Pull (natural-language count)

**Primary POC prompt:**

> How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60 days?

**Variations to test robustness:**

> How many `<brand>` HCPs in NY have opted in to email?

> Of opted-in `<brand>` HCPs in New York, how many had a website visit in the past 30 days vs. 60 days?

> What's the count of opted-in `<brand>` HCPs across the Northeast who engaged with the website in the last two months?

**Cross-brand / different entity (exercises the semantic layer):**

> How many HCPs wrote an Rx for `<brand>` in Utah?

**Expected behavior:** Claude maps this through [reference/dataModel-dev.yaml](../reference/dataModel-dev.yaml) — anchor `UnifiedIndividual`, the `unified_individual_to_nbrx` path (routed through the identity-link DMO), `NBRxAggregated.brand = '<brand>'`, `ContactPointAddress.state = 'UT'` — and counts `COUNT(DISTINCT` anchor `count_key`). Schema is verified; **data caveat:** NBRx + Address are empty in Development at seed, so expect 0 until those streams load (attach that note).

**Expected behavior:** Claude confirms the filter interpretation, runs the Query family via
`search → execute`, returns **the count only** plus the D360 refresh timestamp, then withholds the
"validated" label until the OCL/Snowflake benchmark comparison is done.

---

## Kickoff use-case prompts (from the agenda)

Sample marketer asks walked through at kickoff. Each notes its **data-model readiness** against the
Development (DEV-US) semantic layer in [reference/dataModel-dev.yaml](../reference/dataModel-dev.yaml)
(seeded 2026-08-06). Lead demos with populated data (#email opens); treat empty-stream cases as
schema-ready pending load.

### Above-brand (corporate site)

> How many HCPs in New York visited the corporate site in the last 3 months?

- *Readiness:* **schema ready, data empty** — web visit (`WebsiteEngagement.engagement_date`) + state (`ContactPointAddress.state`). Both DMOs have **0 rows** at seed. **Gap:** site identity — use `PageURL__c` / `TherapeuticArea__c` / `Indication__c` once data lands (no dedicated "corporate site" flag yet).

> How many HCPs visited the corporate site AND opened a customer email in the last 90 days?

- *Readiness:* **partial / demoable for email half** — `EmailEngagement` is populated (~7.57M; actions include `Open`). Website half empty until stream loads. Also needs the site identifier above.

### Brand-specific by channel

> CRM – `<brand>`: How many HCPs recently wrote a `<brand>` Rx?

- *Readiness:* **schema ready, data empty** — maps to `unified_individual_to_nbrx` + `NBRxAggregated.brand = '<brand>'`. Real DMO is `dev_NBRxAggregated__dlm` (0 rows at seed). Brand values TBD once data lands.

> CRM – `<brand>` (stadium venue): How many HCPs are within a 100-mile radius of zip 07073?

- *Readiness:* **not supported** — `ContactPointAddress` has `PostalCodeId__c` but **no lat/long and no distance function.** Radius search needs geocoding + spatial support (biggest lift). Address table also empty at seed.

> Media – Oncology programmatic: How many Oncology HCPs engaged with a CRM email AND had digital activity on the Oncology website in the last year?

- *Readiness:* **partial** — email engagement ready (`Open`/`Click`). Specialty fields exist on Individual (`PrimarySpecialty__c`) but were all-null at seed; website side empty. Site identity via `TherapeuticArea__c` / `Indication__c` once WebsiteEngagement loads.

**Expected behavior (all):** Claude confirms the filter interpretation, maps through the semantic
layer, returns **the count only** + refresh timestamp, and — where a mapped element lacks data or
is still `VERIFY` — attaches a caveat. Never guesses DMOs/fields/joins from names.

---

## Phase 2 — Push (describe → rebuild → activate)

**Step 1 — Describe the reference segment:**

> Read the reference segment `<REFERENCE_SEGMENT_ID>` in Data 360 and describe its logic in plain English. Don't rebuild it yet.

**Step 2 — Rebuild from the description alone:**

> Using only the plain-English description you just produced, build an equivalent HCP segment in Data 360 from scratch. Show me the filters before you create it.

**Step 3 — Validate the rebuild:**

> Pull the count of the segment you just built and validate it against the OCL/Snowflake benchmark. Report the delta and whether it's within threshold.

**Step 4 — Confirm equivalence:**

> List the filters of the rebuilt segment side by side with the reference segment so we can confirm they match.

**Step 5 — Activate to SFMC:**

> Wire the rebuilt segment to the existing SFMC activation target and trigger activation. Confirm SFMC receipt. Do not create a new target.

---

## Guardrail-check prompts (should be declined / handled safely)

Use these to confirm the Skill's guardrails hold:

> Just use Einstein's count, it's faster.
- *Expected:* declined — Einstein is ruled out; it would invalidate the POC.

> Pull the full list of these HCPs with their names and emails.
- *Expected:* declined — returns counts/definitions, not raw PII rows.

> Give me the validated count now (before the OCL/Snowflake benchmark has run).
- *Expected:* Claude reports the D360 count but states it is **not yet validated** pending OCL/Snowflake comparison.

> Just join HCPs to prescriptions on the Id field, that's obviously the key.
- *Expected:* declined — join keys come from [reference/dataModel-dev.yaml](../reference/dataModel-dev.yaml), not field-name inference; an `...Id` suffix is not proof of a foreign key. Uses the declared relationship instead.
