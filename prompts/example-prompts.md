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

**Expected behavior:** Claude maps this through [reference/dataModel.yaml](../reference/dataModel.yaml) — anchor `UnifiedIndividual`, the `unified_individual_to_prescriptions` path (routed through the identity-link DMO), `Prescription.product_name = '<brand>'`, `Individual.state = 'UT'` — and counts `COUNT(DISTINCT` anchor `count_key)`. Because the Rx/Prescription entity is `VERIFY`, Claude **still returns the count** but attaches a one-line note that the schema mapping is unverified pending architect confirmation.

**Expected behavior:** Claude confirms the filter interpretation, runs the Query family via
`search → execute`, returns **the count only** plus the D360 refresh timestamp, then withholds the
"validated" label until the OCL/Snowflake benchmark comparison is done.

---

## Kickoff use-case prompts (from the agenda)

Sample marketer asks walked through at kickoff. Each notes its **data-model readiness** — several
depend on model elements not yet in [reference/dataModel.yaml](../reference/dataModel.yaml) (all
fields are `VERIFY` until the org is connected). Lead demos with the ready ones (#1, #3); treat the
rest as roadmap pending Phase 0 data-model work.

### Above-brand (corporate site)

> How many HCPs in New York visited the corporate site in the last 3 months?

- *Readiness:* **mostly ready** — web visit (`WebEngagement.visit_ts`) + state (`ContactPointAddress.state`). **Gap:** a **site identifier** to distinguish "the corporate site" from other sites (`WebEngagement` only has `event_type` today).

> How many HCPs visited the corporate site AND opened a customer email in the last 90 days?

- *Readiness:* **partial** — **Gap:** no **email-engagement DMO** (opens/clicks); `ContactPointEmail` models consent/opt-out, not engagement. Also needs the site identifier above.

### Brand-specific by channel

> CRM – `<brand>`: How many HCPs recently wrote a `<brand>` Rx?

- *Readiness:* **placeholder** — maps to `unified_individual_to_prescriptions` + `Prescription.product_name = '<brand>'`. **Gap:** the `Prescription`/`Rx__dlm` entity is an explicit placeholder — needs the **real Rx/claims DMO** and allowed brand values. Claude still returns a count with an "unverified mapping" note.

> CRM – `<brand>` (stadium venue): How many HCPs are within a 100-mile radius of zip 07073?

- *Readiness:* **not supported** — **Gap:** `ContactPointAddress` has state/country only; **no zip/postal, no lat/long, no distance function.** Radius search needs geocoding + spatial support (biggest lift). Protect geo *precision* via data-space/FLS scoping, not masking.

> Media – Oncology programmatic: How many Oncology HCPs engaged with a CRM email AND had digital activity on the Oncology website in the last year?

- *Readiness:* **multiple gaps** — needs HCP **specialty/therapeutic-area** (not on `Individual`), **email-engagement** event, and a **site identifier** for the Oncology site. Stacks three missing elements.

**Expected behavior (all):** Claude confirms the filter interpretation, maps through the semantic
layer, returns **the count only** + refresh timestamp, and — where a mapped element is `VERIFY` or
missing — either attaches an "unverified mapping" note or (in `strict` mode) stops and asks a human
to add the concept. Never guesses DMOs/fields/joins from names.

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
- *Expected:* declined — join keys come from [reference/dataModel.yaml](../reference/dataModel.yaml), not field-name inference; an `...Id` suffix is not proof of a foreign key. Uses the declared relationship instead.
