---
name: d360-segments-activations
description: >-
  Query and build Salesforce Data 360 (Data Cloud) HCP and patient segments from
  plain English for the customer POC, via the data360 MCP server. Use when the
  user asks to count, build a segment from a count, describe, rebuild, or
  activate a segment for any brand. Routes by audience: HCP asks use
  reference/dataModel-dev.yaml in dataspace Development (DEV-US); patient/consumer
  (DTC) asks use reference/dataModel-dtc.yaml in dataspace DTC. Enforces
  OCL/Snowflake count validation (never Einstein). Always ask which dataspace
  (Dev / Stage / Prod) before any HCP or patient count unless the user already
  named one. Count responses never include PII. For "within N miles of
  ZIP/landmark" asks, precompute ZIP centroids into an IN list (see ZIP-radius
  section) — do not invent in-SQL Haversine.
---

# Data 360 Segment POC (Governed Skill)

You interface with Salesforce **Data 360** through the **`data360` MCP server** to (1) return
verified HCP segment counts from plain English and (2) turn a counted population into a segment —
typically the segment you just counted, or a rebuilt reference segment — and activate it. This Skill
is the **version-controlled data-access contract** for the customer POC. Follow it exactly.

> **This file is a governance artifact.** It is reviewed and approved by the named governance owner
> before deployment. Any change to the validation contract or tool scope requires re-review.

---

## Working scope

The user may ask about **any brand**. When a request names a brand (or none), work within the same
entity model and operations below — no brand allowlist.

- **Dataspace (required — ask before counting):** For every **HCP or patient count**, if the user
  has not already named a dataspace, **ask whether to pull from Dev, Stage, or Prod** before
  querying. Do **not** silently default. Map the answer and load that YAML:

  | User says | HCP dataspace / model | Patient dataspace / model |
  | --- | --- | --- |
  | **Dev** / Development / DEV-US | `Development` → [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | Prefer `DTC` → [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) (or `DEV_PAT` if they name patient-dev) |
  | **Stage** / Staging / STG-US | `STG_US` → [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | Ask which patient space if unclear (`DTC` / `DEV_PAT`); no separate STG patient model |
  | **Prod** / Production / PRD-US | `PRD_US` → [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | `PRD_PAT` is empty — stop; offer `DTC` if they meant live patient data |

  Every dataspace has a YAML in [../../reference/dataModel-index.yaml](../../reference/dataModel-index.yaml).
  Pass the chosen dataspace on every Query SQL and Segment op. **Do not** silently fall back to
  `default`.
- **Entity:** Health Care Professional (HCP) profiles, or DTC patient/consumer profiles, plus their
  related engagement/consent objects in Data 360.
- **Fields (illustrative — confirm exact API names with the Data Cloud Architect):**
  opt-in / consent status, state/region, brand affiliation, website-visit / web-engagement events + timestamps.
- **Operations:** read/count (Query family), read/describe segments, create + publish segments (Segment family), create + trigger activation to the SFMC target (Activation family).
- **DMOs/fields/joins:** never guess them from field names. Map every request through the semantic layer for the **routed** audience (see *Semantic layer routing* below) — see [../../reference/using-the-data-model.md](../../reference/using-the-data-model.md). An `...Id` suffix does **not** imply a join key in the SSOT model.
- **Still off-limits:** deleting production segments; **any use of Einstein segment counts**;
  **returning PII with any HCP or patient/DTC count** (names, emails, phones, addresses, NPI,
  DOB, customer IDs, health attributes — see *PII-safe counts*). Confirm the exact field API
  names and reference segment ID with the Data Cloud Architect before running against production.
  Placeholders below are marked `<...>`.

---

## PII-safe counts (HCP and patient/DTC — always on)

**A count answer is the number — never a person.** Do not relax this for debugging, demos, or
"just a sample."

### Dataspace coverage (no exceptions)

| Dataspace | Model | Count output |
| --- | --- | --- |
| **`STG_US`** (Staging / STG-US) | [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | **Number only** — never PII |
| **`PRD_US`** (Production / PRD-US) | [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | **Number only** — never PII |
| `Development` (DEV-US) | [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | **Number only** — never PII |
| `DTC` / `DEV_PAT` (patient) | [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) / [dataModel-dev-pat.yaml](../../reference/dataModel-dev-pat.yaml) | **Number only** — never PII (+ no individual health values) |
| `LAB` | [dataModel-lab.yaml](../../reference/dataModel-lab.yaml) | **Number only** — never PII |

When the user asks to count against **staging** or **production**, route to `STG_US` /
`PRD_US`, load that YAML, pass that dataspace on every query — and still return **only the
count**. Production is not a reason to preview people; staging is not a reason to dump sample
rows. Empty-result SQL under **SQL (for validation)** (allowed for `STG_US` / `Development`)
must remain `COUNT(DISTINCT …)` only — never add PII columns.

### What you may return for a count

- The **integer count** (and plain-English restatement: e.g. "**12,431 HCPs** match").
- Dataspace name (`STG_US` / `PRD_US` / …), refresh timestamps, and OCL/Snowflake validation deltas.
- Non-PII **aggregate** diagnostics only when needed (fill-rates; `GROUP BY` on `pii:false`
  categorical fields). For empty POC Staging/Development results, the **literal count SQL** under
  **SQL (for validation)** — that SQL must itself be count-only (see below).

### What you must never return with a count

- Any `pii:true` field literal from the routed model (name, email, phone, address, postal code,
  DOB, NPI / identification number, Pfizer customer ID, etc.).
- Sample rows, preview tables, or "example HCPs/patients" from the counted population — including
  when querying **`STG_US`** or **`PRD_US`**.
- Patient health attributes at individual grain (disease, diagnosis date, therapy, medication,
  pregnancy) — **counts-only / filter-only** even when `pii` is not yet marked.
- `SELECT` lists that project person attributes. Count SQL shape is only:

  ```sql
  SELECT COUNT(DISTINCT "<SegmentOn_or_anchor_PK>") AS person_count
  FROM ...
  WHERE ...   -- filters may reference PII columns; SELECT must not
  ```

### Enforcement checklist (before `execute` and before answering)

1. **Confirm dataspace** (`STG_US` / `PRD_US` / Development / DTC / …) and the matching YAML.
2. **SQL projects only the count** — no PII columns in `SELECT` (filters in `WHERE`/`JOIN` are OK).
3. **Do not run a follow-up `SELECT` of people** to "show who matched" or to explain a zero.
4. **Profiling:** `pii:true` → fill-rate only; never `GROUP BY` / never print PII literals.
5. **User-facing answer** leads with the number; never paste query result grids that include PII.
6. **Segments (Recipe B)** return membership as opaque SegmentOn PKs only — never enrich the
   member list with PII columns before activation. `PRD_US` writes still need governance sign-off.

Honor every field's `pii` flag in the **routed** YAML
([../../reference/dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml),
[../../reference/dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml),
[../../reference/dataModel-dev.yaml](../../reference/dataModel-dev.yaml),
[../../reference/dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml), and siblings). When unsure
whether a field is PII, **treat it as PII** (filter-only) until the architect confirms.

---

## Semantic layer routing (pick the YAML *before* you map anything)

There is **one semantic-layer file per dataspace**. Catalog:
[../../reference/dataModel-index.yaml](../../reference/dataModel-index.yaml). Your **first step on
every count** is: (1) decide audience (HCP vs patient), (2) **ask Dev / Stage / Prod** unless
already named, (3) load that YAML, (4) announce the choice before querying.

### Ask before every HCP or patient count (required)

Unless the user already named a dataspace in the same message (e.g. "in staging", "in PRD_US",
"in Development"), **stop and ask**:

> Which dataspace should I use for this count — **Dev**, **Stage**, or **Prod**?

Do **not** run the count until they answer. Then map:

| Choice | HCP | Patient |
| --- | --- | --- |
| **Dev** | `Development` / [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | `DTC` (or `DEV_PAT` if they specify patient-dev) |
| **Stage** | `STG_US` / [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | Confirm patient space (`DTC` / `DEV_PAT`) |
| **Prod** | `PRD_US` / [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | `PRD_PAT` empty — stop; offer `DTC` |

If they also omit the audience noun ("people", "customers"), ask **audience and dataspace**
together before running.

### Catalog (explicit dataspace → file)

| Dataspace (API name) | Label | Audience | File | Notes |
| --- | --- | --- | --- | --- |
| `Development` | DEV-US | HCP | [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | POC default for HCP |
| `DTC` | DTC | PATIENT | [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) | Default for patient/consumer |
| `PRD_US` | PRD-US | HCP | [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | Production — governance sign-off before writes; **counts = number only, never PII** |
| `STG_US` | STG-US | HCP | [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | Staging; identity link = `stg_IndividualIdentityLink__dlm`; **counts = number only, never PII** |
| `DEV_PAT` | DEV-PAT | PATIENT | [dataModel-dev-pat.yaml](../../reference/dataModel-dev-pat.yaml) | Patient-dev; thinner than DTC |
| `PRD_PAT` | PRD-PAT | PATIENT | [dataModel-prd-pat.yaml](../../reference/dataModel-prd-pat.yaml) | **EMPTY** of profile DMOs — stop, do not improvise |
| `LAB` | LAB | HCP | [dataModel-lab.yaml](../../reference/dataModel-lab.yaml) | No IR; segment on `LAB_Individual__dlm` |
| `default` | default | — | [dataModel-default.yaml](../../reference/dataModel-default.yaml) | ssot__ inventory; Individual not segmentable |

**Routing rules**

1. **Audience noun decides HCP vs patient.** "How many **HCPs**…" → HCP models. "How many
   **patients** / consumers…" → patient models. Brand names alone do **not** decide it.
2. **Ask Dev / Stage / Prod before every count** unless the dataspace is already named in the
   request. Never silently default to Development or DTC for counts.
3. **An explicit dataspace in the request wins.** Load that space's YAML from the table above and
   restate the choice before running.
4. **Ambiguous audience → ask, don't guess.** "people," "individuals," "audience," or "customers"
   with no audience noun → ask audience (and dataspace if missing) first.
5. **One model per query. Never mix.** Do **not** join across dataspaces or carry a field/literal
   from one model into another. Field names differ (e.g. DTC email engagement uses `Individual__c`;
   LAB specialty is `Primary_Specialty__c` with an underscore; STG's identity link DMO name differs).
6. **Empty / inventory spaces → stop.** `PRD_PAT` has no profile DMOs; `default` is not enabled for
   segments. Tell the user; do not invent schema.
7. **Identity-resolution rule** (where a unified profile exists): traverse the identity-link DMO
   between unified and source — never join them directly. Exception: **LAB** has no IR layer.
8. **Patient health data is counts-only.** In DTC (and any patient model with health attributes),
   filter on disease/therapy/pregnancy fields when asked; never return individual-level values.
9. **Production writes need sign-off.** `PRD_US` / `PRD_PAT` create/publish/activate require
   governance confirmation.

**Data availability (seed 2026-08-07):** DTC is well populated (~191K patients); Development has
people/email but several brand/Rx objects empty; DTC email engagement is `VERIFY` (sparse linkage);
PRD_PAT is empty of profiles.

---

## Discovery mode (governance toggle)

Set by the governance owner at authoring time. Controls how far Claude may look **beyond** the locked
semantic layer at runtime. Discovery/retrieval is an **authoring-time** accelerator (Phase 0) that
*drafts* scope for a human to review, override, and lock; at **runtime** Claude stays inside the
locked artifact.

- **`strict`** (default for locked POC / production): use **only** the `verified` DMOs/fields/joins in
  the **routed** model ([../../reference/dataModel-dev.yaml](../../reference/dataModel-dev.yaml) for HCP,
  [../../reference/dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) for patients). Do **not**
  run metadata/discovery ops at runtime. If a request needs a concept that isn't in the locked model,
  **stop and ask a human to add it** (authoring time) — do not look it up live, and do not borrow it
  from the other audience's model. This is the requirements doc's *"constrained, not discoverable."*
- **`propose`** (authoring / build-out only): if a concept isn't in the model, Claude may run a
  **read-only** metadata op to find the real DMO/field and add it to the **routed** YAML as a
  `VERIFY` proposal — never treated as authoritative until a human flips it to `verified`.

**Current mode:** `<strict | propose>` — set by the governance owner before deployment.

---

## Self-improvement logging (governance toggle)

Set by the skill owner, like Discovery mode. As you run, **capture friction** to
[../../feedback/session-log.md](../../feedback/session-log.md) whenever, in a session:

- the user had to clarify, rephrase, or correct your interpretation **more than once**,
- a step **failed** (tool error, wrong operation name, rejected segment SQL, bad join),
- the user needed something **not in this skill or the semantic layer**,
- a skill instruction was **ambiguous** and sent you the wrong way, or
- the user reached for a **workaround** off the documented recipe.

Follow the logging rules in that file (**no PII / no data literals / no secrets**; stamp date +
mode; categorize). Logging is *notes, not a behavior change* — it never overrides the guardrails
below, and you **never fork this skill on the local machine** (see
[../../scaling-via-repo.md](../../scaling-via-repo.md)). Improvements reach every user only through the
skill owner's git loop.

- **`log-only`** (default once in users' hands / production): **only** append to
  `feedback/session-log.md`. Do **not** edit `SKILL.md` or `dataModel-dev.yaml`. The skill owner reviews
  the logs and makes the single canonical adjustment. This is what prevents a divergent skill on
  every machine.
- **`self-tune`** (Phase 0 build / POC hardening only): you may **additionally** propose concrete
  edits to the governed files — but only via the author → PR → owner-review → merge loop into the
  shared repo, tracked in [../../feedback/improvement-backlog.md](../../feedback/improvement-backlog.md).
  Never as silent local memory or a per-machine copy.

**Current mode:** `<log-only | self-tune>` — set by the skill owner before deployment.

---

## Environment facts

- **Dataspace follows the user's choice.** For HCP or patient **counts**, ask **Dev / Stage / Prod**
  unless already named; then use that model's `defaults.dataspace` on every op. Restate the choice
  before running. Do not silently query Development or DTC.
- **Count source of truth = OCL/Snowflake.** Einstein Segment Creation is explicitly ruled out — its counts do not match OCL/Snowflake. Never present an Einstein-derived count as validated.
- **A Data 360 count is not "validated" until compared to the OCL/Snowflake benchmark** within the agreed 2–5% threshold **and** in the same refresh window. See the validation harness.
- **Governance gate:** do not create/publish/activate against production data unless the governance owner has signed off (the human running you confirms this).
- **Semantic layer = how you know the schema.** DMOs, fields (with types + PII flags), join keys, cardinality, and reusable join paths live in the routed model — [../../reference/dataModel-dev.yaml](../../reference/dataModel-dev.yaml) (HCP) or [../../reference/dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) (patient/DTC). Each is verified against the org before Phase 1 and re-verified on data-model changes ([../../reference/before-using-and-on-data-model-changes.md](../../reference/before-using-and-on-data-model-changes.md)). Trust its `verified` elements; for `VERIFY` elements, still answer but note the mapping is unverified.

---

## Facade-tool protocol (always follow this order)

The `data360` server exposes three tools. **Never guess an operation name or payload.**

1. **`search`** — discover the operation. Search by intent/keyword (e.g. `"query sql count"`, `"create segment"`, `"publish segment"`, `"activation target"`). Read back the exact operation name.
2. **`payload_examples`** — before any create/update, fetch a working JSON payload for that operation. Adapt it; do not invent fields.
3. **`execute`** — run the operation by its exact name with your parameters.

If `search` returns multiple candidates, prefer the one whose description matches the intent
(count/read for Pull; create+publish for Push; activation for the SFMC step) and confirm with the
user if ambiguous.

---

## Recipe A — Pull (natural-language count)

**Trigger:** the user asks "how many …" about HCPs or patients for a brand.

0. **Route first — ask dataspace.** Decide audience (HCP vs patient). If the user did **not** name
   a dataspace, **ask: Dev, Stage, or Prod?** and wait. Then load the matching YAML. Ambiguous
   audience → ask audience + dataspace before querying.
1. Restate the request as explicit filter criteria and **confirm the interpretation** with the user before querying (brand, state, opt-in status, engagement window). Example intent:
   *opted-in + brand = `<brand>` + state = NY + website visit within last 60 days.*
   Also **restate the chosen dataspace** (Dev → `Development` / Stage → `STG_US` / Prod → `PRD_US`
   for HCP; patient spaces per the ask table above).
2. **Map the request through the routed semantic layer** ([../../reference/dataModel-dev.yaml](../../reference/dataModel-dev.yaml) or [../../reference/dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml)): pick the anchor, map each concept to its real DMO/field (and that entity's `dataspace`), choose the connecting `path` (routing unified↔source through the identity-link DMO), and note the `count_key`. Do not invent DMOs, fields, or join keys. If a concept isn't in the model, behavior depends on the **Discovery mode** toggle above: in `propose` mode, **discover-and-propose, don't guess-and-proceed** — run a read-only metadata op to find the real DMO/field, add it to `dataModel-dev.yaml` as a `VERIFY` entry (a proposal for the architect to verify); in `strict` mode, **do not look it up live — stop and ask a human to add it** to the locked model. If any mapped element is still `VERIFY`, **still answer** — just attach a one-line note that the schema mapping is unverified pending architect confirmation. See [../../reference/before-using-and-on-data-model-changes.md](../../reference/before-using-and-on-data-model-changes.md) for the verification + sharing loop.
   - **ZIP-radius / "within N miles" asks:** do **not** invent Haversine SQL or assume a ZIP-centroid DMO. Follow *ZIP-radius geographic filters* below — precompute the ZIP5 list externally and filter with `SUBSTRING(PostalCodeId__c FROM 1 FOR 5) IN (...)`.
3. `search` the **Query** family for a SQL/QueryV2 count operation.
4. Build a `COUNT(DISTINCT <anchor count_key>)` query using the mapped joins and confirmed filters (DISTINCT on the anchor so 1:N fan-out never inflates the number). **SELECT only that count** — never project `pii:true` columns (or patient health attributes) into the result set. Return **the count only** to the user — no sample rows, no name/email/NPI/address dumps. Same rule for HCP and patient/DTC.
5. `execute` with the **user-chosen dataspace** and capture: **the count** and the **Data 360 data-stream last-refresh timestamp** (query it if not returned).
6. **Record what you observed** in [../../reference/observed-values.md](../../reference/observed-values.md), and **profile on empty / unknown values**:
   - **If the count comes back 0 / empty**, don't stop at "0". **Profile the DMO** that filtered it out. The GA facade has **no dedicated data-profiler** — `d360_profile_query`/`d360_profile_metadata` are the *Profile query API* (they query/describe the unified profile DMOs), not a column-statistics tool. So profiling means **writing aggregation SQL through the Query SQL op** (`d360_query_sql`): per-column populated count + percent (the fill-rate expression below), cardinality (`COUNT(DISTINCT …)`), and — for non-PII, low-cardinality categorical fields — the value breakdown (`GROUP BY`). **You enforce PII-safety** — for `pii:true` fields query **fill-rate only, never the literals**. Use the result to tell the user *what values ARE present* and to distinguish "zero matches" from "the field isn't populated at all."
   - **When the user asks about a specific value, or you are unsure what values a field holds**, run a value-distribution query **before** (or instead of) guessing literals. Canonical shape (non-PII fields only):

     ```sql
     SELECT
         t."<group_field>"                    AS group_value,
         COUNT(DISTINCT t."<count_key>")      AS n
     FROM "<object>" t
     WHERE t."<filter_field>" = '<value>'     -- optional; drop if no filter
     GROUP BY t."<group_field>"
     ORDER BY n DESC                          -- order by the alias, not COUNT() again
     LIMIT 20;                                -- top-N; drop for the full distribution
     ```

     Use the entity's `count_key` / primary key for `"<count_key>"` when counting people or events
     at the right grain. Drop the `WHERE` when you want the full field vocabulary. For `pii:true`
     fields: **fill-rate only — never `GROUP BY` the PII column.**
   - **Persist what you learn:**
     1. Always append to [../../reference/observed-values.md](../../reference/observed-values.md)
        (dataspace + date + value counts). Hint cache only.
     2. When the vocabulary is stable and useful for future filters, also propose adding /
        updating `sampleValues` on the field in the **routed** dataModel YAML
        (`dataModel-dev.yaml`, `dataModel-dtc.yaml`, etc.) as `VERIFY` until the architect
        confirms — never invent sample values without a live profile.
   - **POC Staging empty-result rule:** when the routed dataspace is **`STG_US`** (Staging) **or** **`Development`** (DEV-US — the POC primary), and the count is **0 / empty** (including "DMO has 0 rows"), **always return the literal SQL you executed** in the user-facing answer — copy-pasteable, as run — so the team can validate the query in lieu of a result. Lead with the plain-English empty finding, then the SQL under a **SQL (for validation)** heading. This overrides the default "hide SQL" presentation rule for empty POC Staging / Development counts only.
   - Append what you learned to the observed-values notebook: non-PII categorical values (with counts, `org` + date), PII fields as **fill-rate only**, and any empty asks under *Asked but unavailable*. It's a hint cache, not the governed schema.
   - Fill-rate SQL (null-and-empty-safe — in Data Cloud unpopulated text is often `''`, not NULL, so `IS NOT NULL` alone over-reports): `SUM(CASE WHEN "fld" IS NOT NULL AND CAST("fld" AS VARCHAR) <> '' THEN 1 ELSE 0 END)`. Still never surface PII values.
7. **Do not call the number "validated" yet.** Instruct the user (or perform, if you have access) to run the OCL/Snowflake benchmark: [../../validation/run-benchmark.md](../../validation/run-benchmark.md).
8. Compare per [../../validation/compare-counts.md](../../validation/compare-counts.md). Report:
   - D360 count + refresh timestamp
   - OCL/Snowflake count + snapshot timestamp
   - delta % and whether it is within threshold and same refresh window
9. If the delta exceeds threshold or windows don't match: **say the count is not yet validated**, and recommend investigating or waiting for the next refresh. Never present a mismatched count as a result.

## Recipe B — Push (build a segment → activate)

**Trigger:** the user wants to turn a population into a segment — most commonly **"now build that as
a segment"** right after a Recipe A count, or (for Phase-2 validation) **"rebuild this reference
segment."**

**Mental model:** a segment is the **same population as a count, expressed as membership** (the list
of SegmentOn primary keys) instead of a number. The criteria you mapped for the count *are* the
criteria for the segment — you're changing the **shape of the SQL**, not re-deriving the population.
So don't re-interpret the request; reuse the mapping you already have.

There are two entry points; they converge on the same build-and-activate core.

### Entry point 1 — build from the count you just ran (primary)

1. Start from the **criteria you already confirmed and mapped in Recipe A** (anchor/SegmentOn,
   DMOs/fields, filters). Reuse that exact mapping — do not re-interpret the plain-English request.
2. Confirm with the user that the population they just counted is the one they want as a segment.

### Entry point 2 — rebuild a reference segment (Phase-2 equivalence test)

1. **Read the reference segment** `<REFERENCE_SEGMENT_ID>`: `search` the Segment family for a
   get/describe operation, `execute`, and read its filter logic.
2. **Describe it in plain English** back to the user — the human-readable definition. This is the
   **only** input allowed into the rebuild; do **not** copy the original raw filter JSON forward.
   Then map that description through the semantic layer exactly as in entry point 1.

### Then — for either entry point (build → publish → validate → activate)

3. **Translate the criteria into segment `sql`** per
   [../../reference/creating-segments.md](../../reference/creating-segments.md): `search` for
   create-segment, `payload_examples` for the payload, then build SQL that **returns the membership**
   — project the **SegmentOn PK** *(plus its **key qualifier** if the PK has one — source DMOs like
   `ssot__Individual__dlm` require projecting `KQ_Id__c` alongside `ssot__Id__c`)*. **No
   `DISTINCT`/aggregation**, no `SELECT *`/`CASE`/aliases; fully-qualified columns; joins only on
   declared keys; subqueries only in `WHERE`. Never submit a `COUNT(DISTINCT …)` — Data 360 rejects
   it as a segment. Create/publish in the **routed dataspace** — `Development` (DEV-US) for HCP
   segments, `DTC` for patient segments — unless the user explicitly chose another. For ZIP-radius
   populations, reuse the **same precomputed ZIP5 `IN` list** from the count
   ([../../reference/zip-radius.md](../../reference/zip-radius.md)).
4. **Confirm before writing** (show the user the segment definition **and dataspace**), then
   `execute` create and `execute` publish.
5. **Sanity-check membership against the count.** Pull the segment's member count and confirm it
   matches the Recipe A count for the same criteria — same population, so they should agree. If they
   diverge, **stop and reconcile** before activating (a mismatch usually means the segment SQL and the
   count SQL don't express the same filters).
   - **POC Staging empty-result rule:** when the routed dataspace is **`STG_US`** or **`Development`**
     and membership is **0 / empty** (or the underlying DMOs have no rows so the segment cannot be
     meaningfully validated), **always return the literal segment `sql`** you built/submitted —
     copy-pasteable — under a **SQL (for validation)** heading, so the team can validate the
     definition in lieu of members. Still do not dump PII rows.
6. **Validate against OCL/Snowflake** (Recipe A steps 7–9) if this population isn't already validated.
7. *(Rebuild variant only)* **Confirm segment equivalence** — list the rebuilt filters vs. the
   reference for the user/customer team to confirm they match.
8. **Activate to SFMC:** `search` the Activation family, wire the segment to the **existing** SFMC
   activation target (do **not** create a new target), `execute` to trigger, and **confirm SFMC
   receipt**.
9. **Report the success criteria:** for a rebuild — (1) count match, (2) segment equivalence, (3)
   SFMC receipt; for build-from-count — (1) segment membership matches the count, (2) SFMC receipt.

### Segment-definition SQL is its own thing — see the reference

Segment creation follows **different SQL rules than the Recipe A count**, and its result is
different: a segment's inclusion criteria must **return the list of SegmentOn primary keys** (the
membership), not a count. If `SegmentOn = UnifiedIndividual`, the SQL returns a list of
`UnifiedRecordId__c` — never `COUNT(DISTINCT …)`, which Data 360 will reject.

**Build every segment `sql` per [../../reference/creating-segments.md](../../reference/creating-segments.md)** —
the authoritative reference for the validation rules (project the SegmentOn profile PK — **plus its
key qualifier if the PK has one**; no aggregation/`DISTINCT`/`SELECT *`/`CASE`/aliases;
fully-qualified columns; joins only on declared relationship keys; subqueries only in `WHERE`, one
column), the recommended `WHERE`-subquery shape that avoids fan-out, and a worked example. Do not
reuse a count query as a segment definition.

---

## ZIP-radius geographic filters (required method)

**Trigger:** the user asks for people **within N miles of a ZIP** (or a landmark that resolves to a
ZIP — e.g. MetLife Stadium → `07073`).

Data 360 usually has **no** ZIP→lat/long reference DMO and segment SQL cannot run a reliable
distance function against an external geo table. **Do not** invent in-SQL Haversine or guess nearby
ZIPs by state/prefix. Always:

1. Resolve the origin ZIP (confirm landmark → ZIP when needed) and origin lat/lon (landmark coords
   when known; else that ZIP’s centroid).
2. Derive the ZIP5 list **outside** D360 from a public US postal-code centroid file (default:
   [GeoNames US.zip](https://download.geonames.org/export/zip/US.zip), CC BY 4.0) using **Haversine**
   with radius ≤ N miles. Deduplicate ZIP5.
3. Filter address postal code with
   `SUBSTRING("<address_dmo>"."PostalCodeId__c" FROM 1 FOR 5) IN ('…', '…', …)` on the routed
   model’s address path (HCP: ContactPointAddress → Individual → IdentityLink → UnifiedIndividual).
4. Use the **same** `IN` list for both the Recipe A count and the Recipe B segment SQL.
5. Comment the SQL with source, origin coords, radius, ZIP count, and that the boundary is
   **centroid-approximate**. If Address is unpopulated, still return the SQL (POC empty-result rule)
   and say the geo list is ready but address data has not landed.

Authoritative detail + worked MetLife example:
[../../reference/zip-radius.md](../../reference/zip-radius.md).

---

## Talking to the user — marketer-facing output (presentation layer)

The people using this Skill are **marketers**, not data engineers. Raw DMO API names
(`ssot__Individual__dlm`), field API names (`ssot__Salutation__c`), and SQL
(`COUNT(DISTINCT …)`) mean nothing to them and erode trust. **Translate every user-facing
answer into business language; keep the technical form for execution and for anyone who asks.**

- **Use business labels, not API names.** Refer to entities and fields by their `label` in the
  routed model (e.g. *HCP* or *Patient*, not
  `ssot__Individual__dlm`; *Salutation*, not `ssot__Salutation__c`). The labels are governed in
  the locked semantic layer, so this works in `strict` mode without a live metadata call.
- **State counts in plain language.** "**1 HCP** matches" / "**191,425 patients** match" — never `COUNT(DISTINCT ssot__Id__c) = 1`, and never accompany the number with PII samples.
- **Describe criteria in plain English.** "HCPs whose salutation is *Mr.*" — not a raw SQL `WHERE` clause.
- **Hide SQL and API names by default.** Don't lead with the segment `sql` or DMO/field API names.
  Offer them on demand (*"want to see the technical definition?"*) or tuck them under a clearly
  labeled **Technical details** aside for auditors — present, but not in the marketer's face.
  **Exception — POC Staging empty results:** in dataspace **`STG_US`** or **`Development`**, when a
  count or segment returns no data, **always surface the literal SQL** under **SQL (for validation)**
  so the team can validate the query (see Recipe A / B empty-result rules). That SQL must remain
  count-only / membership-PK-only — never add PII columns "for clarity."
- **Confirm mutations in business terms too.** At the mutation gate (create/publish/activate), lead
  with the plain-English definition; the raw SQL is the appendix, not the headline.
- **Friendly phrasing never relaxes the data guardrails.** Still never surface PII, still never dump rows — including when explaining HCP or patient/DTC counts.

---

## Guardrails (always on)

- **Speak marketer, not schema.** User-facing output uses business `label`s and plain-English counts/criteria (see *Talking to the user*), never raw DMO/field API names or SQL by default. Keep the technical form for execution; show it only on request or in a labeled Technical-details aside. **Exception:** in POC Staging (`STG_US`) or Development (`DEV-US`), empty count/segment results **must** include the literal SQL under **SQL (for validation)**.
- **PII never rides with a count.** For every HCP or patient/DTC count — including **`STG_US`
  (staging)** and **`PRD_US` (production)** — answer with the number (and validation metadata)
  only. Count SQL must `SELECT COUNT(DISTINCT …)` only — filters may use PII columns; results
  must not. No sample people, no PII grids, no health-attribute row dumps. See *PII-safe counts*.
- **POC Staging — return SQL when empty.** For counts (Recipe A) and segments (Recipe B) in **`STG_US`** or **`Development`**: if the result is 0 / empty / underlying DMO unpopulated, return the exact SQL that was run (or the segment `sql` that was built) so the team can validate it in lieu of a result. That SQL stays count-only / membership-PK-only — **still never dump PII rows** (same bar as `PRD_US`).
- **Production counts are not a preview.** In **`PRD_US`**, never return people or PII to "validate"
  a count; use the integer (+ OCL/Snowflake benchmark). Writes still need governance sign-off.
- **Profile unknown / asked-about values — don't guess literals.** When the user asks whether a value exists, or you are unsure what a non-PII field contains, run the value-distribution `GROUP BY` query (Recipe A step 6), then append results to [../../reference/observed-values.md](../../reference/observed-values.md) and, when stable, propose `sampleValues` on the routed dataModel YAML. Never invent filter literals.
- **ZIP-radius = precomputed `IN` list.** For "within N miles of ZIP/landmark," derive ZIP5s outside D360 (GeoNames centroids + Haversine) and filter `SUBSTRING(PostalCodeId__c FROM 1 FOR 5) IN (...)`. Do **not** invent in-SQL distance math or assume a ZIP-centroid DMO unless it is `verified` in the routed model. Same list for count and segment. See [../../reference/zip-radius.md](../../reference/zip-radius.md).
- **Ask Dev / Stage / Prod before every HCP or patient count.** Do not silently default to
  Development or DTC. If the dataspace is already named in the request, honor it and restate it;
  otherwise ask and wait. Then load the matching YAML from [../../reference/dataModel-index.yaml](../../reference/dataModel-index.yaml). Ambiguous audience → **ask**. Never mix models. `PRD_PAT` is empty and `default` is not segmentable — stop, don't improvise.
- **Use the chosen dataspace on every op.** Pass it on each query and segment build. Do not silently
  query another dataspace.
- **Patient health data is counts-only.** In the DTC model, BrandProfile health attributes (disease
  state, diagnosis date, therapy, medication, pregnancy) may be filtered on but never returned.
- **Einstein is out.** If asked to use Einstein counts for speed, decline and explain it invalidates the POC.
- **Refresh-timing gate.** Always capture and report both timestamps; never compare across different refresh windows.
- **No unbounded reads.** Return counts and definitions, not raw HCP/patient/PII rows. Never `SELECT *` on people tables for a count ask.
- **Segment SQL ≠ count SQL.** A segment's inclusion criteria return the **list of SegmentOn PKs** (the membership), not a number: project the **SegmentOn profile PK** (**plus its key qualifier if the PK has one** — e.g. `ssot__Individual__dlm` requires `KQ_Id__c` alongside `ssot__Id__c`) — no aggregation, no `DISTINCT`, no `SELECT *`, no aliases, no `CASE`; fully-qualified columns; joins only on declared relationship keys; subqueries only in `WHERE` (one column). Never submit a `COUNT(DISTINCT …)` query as a segment. See [../../reference/creating-segments.md](../../reference/creating-segments.md).
- **Never guess the schema.** DMOs, fields, and join keys come from the routed model — not from field-name inference, and not from the other audience's model. Count people with `COUNT(DISTINCT` anchor `count_key)`. A count built on a `VERIFY` element is still returned — just note the mapping is unverified pending architect confirmation.
- **Stay in the entity model.** Only the authorized objects/fields in the routed model and the listed operations, regardless of brand.
- **Respect Discovery mode.** In `strict` mode, never run runtime metadata/discovery ops — use only the locked, `verified` model; ask a human to add anything missing. Runtime discovery is allowed only in `propose` mode, and only as a `VERIFY` proposal.
- **Log friction, don't fork the skill.** Capture clarifications/failures/gaps/workarounds to [../../feedback/session-log.md](../../feedback/session-log.md) per the *Self-improvement logging* toggle (no PII/data literals). In `log-only` (production default) never edit the governed skill yourself — improvements ship only via the owner's one-canonical-copy git loop.
- **Governance sign-off** required before any production write (create/publish/activate).
- **Confirm before mutating.** Always show the user what you will create/publish/activate and get a go-ahead before `execute` on a write operation.
- **Prefer the MCP path.** If the MCP server is unavailable, the same recipes may run via `sf` CLI (`sf data ...` / `sf api request rest ...`, `--allow-non-ga-tools` for Developer Preview ops) — the scope, validation, and guardrails are unchanged.

---

## Example invocation

User: *"How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60 days?"*

You:
1. **Ask dataspace** (not named): *Which dataspace — Dev, Stage, or Prod?*
2. User: *"Dev."* → **Route:** HCP model [../../reference/dataModel-dev.yaml](../../reference/dataModel-dev.yaml),
   dataspace **Development (DEV-US)**. Confirm filters (opt-in = true, brand = `<brand>`, state = NY,
   web visit ≤ 60 days) and that routing.
3. Map through that model (anchor, path, fields, dataspace).
4. `search "query sql count"` → get the Query op name.
5. `execute` a `COUNT(DISTINCT ...)` query with `dataspace: Development` → e.g. `12,431` (D360 refresh: `<ts>`).
6. Prompt/run the OCL/Snowflake benchmark → `12,290` (snapshot: `<ts>`).
7. Delta = 1.1% → within 2–5% threshold, same refresh window → **validated: ~12.3–12.4K opted-in `<brand>` HCPs in NY**.

Then (Recipe B — build from that count):

User: *"Great — build that as a segment."*

You:
8. Reuse the **same mapping/filters** from the count (don't re-interpret). Confirm the population.
9. `search "create segment"` → `payload_examples` → translate those filters into segment `sql` that
   projects the SegmentOn PK (plus its key qualifier if present), **no `DISTINCT`** — per
   [../../reference/creating-segments.md](../../reference/creating-segments.md).
10. Confirm the definition with the user → `execute` create → `execute` publish.
11. Pull the segment's member count and confirm it matches the ~12.4K from the count; then activate to
    the existing SFMC target and confirm receipt.

### Routing variant — dataspace already named

User: *"In staging, how many HCPs opened an email in the last 90 days?"*

You: Honor **Stage** → `STG_US` / [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml);
restate and run (no need to re-ask Dev/Stage/Prod).

### Routing variant — the same ask, patient side

User: *"How many `<brand>` patients opted in to email?"*

You:
1. **Ask dataspace:** Dev / Stage / Prod (patient map: usually Dev→`DTC`, Prod patient space empty).
2. After they choose, load that model and map brand through *Brand profile* and opt-in through
   *Consent* — **not** the HCP model's objects or literals.
3. Everything downstream (count → benchmark → segment → activation) is unchanged, except every
   `execute` carries the chosen patient dataspace.

Ambiguous variant — *"How many people are opted in?"* — has no audience noun and no dataspace, so
**ask** both (HCPs vs patients, and Dev / Stage / Prod) before running anything.
