---
name: d360-segments-activations
description: >-
  Query and build Salesforce Data 360 (Data Cloud) HCP segments from plain
  English for the customer POC, via the data360 MCP server. Use when the user asks
  to count, build a segment from a count, describe, rebuild, or activate an HCP
  segment for any brand. Enforces OCL/Snowflake count validation (never Einstein).
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

- **Entity:** Health Care Professional (HCP) profiles and their related engagement/consent objects in Data 360.
- **Fields (illustrative — confirm exact API names with the Data Cloud Architect):**
  opt-in / consent status, state/region, brand affiliation, website-visit / web-engagement events + timestamps.
- **Operations:** read/count (Query family), read/describe segments, create + publish segments (Segment family), create + trigger activation to the SFMC target (Activation family).
- **DMOs/fields/joins:** never guess them from field names. Map every request through the semantic layer [../../reference/dataModel.yaml](../../reference/dataModel.yaml) — see [../../reference/using-the-data-model.md](../../reference/using-the-data-model.md). An `...Id` suffix does **not** imply a join key in the SSOT model.
- **Still off-limits:** deleting production segments; **any use of Einstein segment counts**. Confirm the exact field API names and reference segment ID with the Data Cloud Architect before running against production. Placeholders below are marked `<...>`.

---

## Discovery mode (governance toggle)

Set by the governance owner at authoring time. Controls how far Claude may look **beyond** the locked
semantic layer at runtime. Discovery/retrieval is an **authoring-time** accelerator (Phase 0) that
*drafts* scope for a human to review, override, and lock; at **runtime** Claude stays inside the
locked artifact.

- **`strict`** (default for locked POC / production): use **only** the `verified` DMOs/fields/joins in
  [../../reference/dataModel.yaml](../../reference/dataModel.yaml). Do **not** run metadata/discovery
  ops at runtime. If a request needs a concept that isn't in the locked model, **stop and ask a human
  to add it** (authoring time) — do not look it up live. This is the requirements doc's
  *"constrained, not discoverable."*
- **`propose`** (authoring / build-out only): if a concept isn't in the model, Claude may run a
  **read-only** metadata op to find the real DMO/field and add it to `dataModel.yaml` as a `VERIFY`
  proposal — never treated as authoritative until a human flips it to `verified`.

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
  `feedback/session-log.md`. Do **not** edit `SKILL.md` or `dataModel.yaml`. The skill owner reviews
  the logs and makes the single canonical adjustment. This is what prevents a divergent skill on
  every machine.
- **`self-tune`** (Phase 0 build / POC hardening only): you may **additionally** propose concrete
  edits to the governed files — but only via the author → PR → owner-review → merge loop into the
  shared repo, tracked in [../../feedback/improvement-backlog.md](../../feedback/improvement-backlog.md).
  Never as silent local memory or a per-machine copy.

**Current mode:** `<log-only | self-tune>` — set by the skill owner before deployment.

---

## Environment facts

- **Count source of truth = OCL/Snowflake.** Einstein Segment Creation is explicitly ruled out — its counts do not match OCL/Snowflake. Never present an Einstein-derived count as validated.
- **A Data 360 count is not "validated" until compared to the OCL/Snowflake benchmark** within the agreed 2–5% threshold **and** in the same refresh window. See the validation harness.
- **Governance gate:** do not create/publish/activate against production data unless the governance owner has signed off (the human running you confirms this).
- **Semantic layer = how you know the schema.** DMOs, fields (with types + PII flags), join keys, cardinality, and reusable join paths live in [../../reference/dataModel.yaml](../../reference/dataModel.yaml). It is verified against the org before Phase 1 and re-verified on data-model changes ([../../reference/before-using-and-on-data-model-changes.md](../../reference/before-using-and-on-data-model-changes.md)). Trust its `verified` elements; for `VERIFY` elements, still answer but note the mapping is unverified.

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

**Trigger:** the user asks "how many …" about HCPs for a brand.

1. Restate the request as explicit filter criteria and **confirm the interpretation** with the user before querying (brand, state, opt-in status, engagement window). Example intent:
   *opted-in + brand = `<brand>` + state = NY + website visit within last 60 days.*
2. **Map the request through the semantic layer** [../../reference/dataModel.yaml](../../reference/dataModel.yaml): pick the anchor, map each concept to its real DMO/field, choose the connecting `path` (routing unified↔source through the identity-link DMO), and note the `count_key`. Do not invent DMOs, fields, or join keys. If a concept isn't in the model, behavior depends on the **Discovery mode** toggle above: in `propose` mode, **discover-and-propose, don't guess-and-proceed** — run a read-only metadata op to find the real DMO/field, add it to `dataModel.yaml` as a `VERIFY` entry (a proposal for the architect to verify); in `strict` mode, **do not look it up live — stop and ask a human to add it** to the locked model. If any mapped element is still `VERIFY`, **still answer** — just attach a one-line note that the schema mapping is unverified pending architect confirmation. See [../../reference/before-using-and-on-data-model-changes.md](../../reference/before-using-and-on-data-model-changes.md) for the verification + sharing loop.
3. `search` the **Query** family for a SQL/QueryV2 count operation.
4. Build a `COUNT(DISTINCT <anchor count_key>)` query using the mapped joins and confirmed filters (DISTINCT on the anchor so 1:N fan-out never inflates the number). Return **the count only** — do not dump PII rows.
5. `execute` and capture: **the count** and the **Data 360 data-stream last-refresh timestamp** (query it if not returned).
6. **Record what you observed** in [../../reference/observed-values.md](../../reference/observed-values.md), and **profile on empty**:
   - **If the count comes back 0 / empty**, don't stop at "0". **Profile the DMO** that filtered it out. The GA facade has **no dedicated data-profiler** — `d360_profile_query`/`d360_profile_metadata` are the *Profile query API* (they query/describe the unified profile DMOs), not a column-statistics tool. So profiling means **writing aggregation SQL through the Query SQL op** (`d360_query_sql`): per-column populated count + percent (the fill-rate expression below), cardinality (`COUNT(DISTINCT …)`), and — for non-PII, low-cardinality categorical fields — the value breakdown (`GROUP BY`). **You enforce PII-safety** — for `pii:true` fields query **fill-rate only, never the literals**. Use the result to tell the user *what values ARE present* and to distinguish "zero matches" from "the field isn't populated at all."
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
   it as a segment.
4. **Confirm before writing** (show the user the segment definition), then `execute` create and
   `execute` publish.
5. **Sanity-check membership against the count.** Pull the segment's member count and confirm it
   matches the Recipe A count for the same criteria — same population, so they should agree. If they
   diverge, **stop and reconcile** before activating (a mismatch usually means the segment SQL and the
   count SQL don't express the same filters).
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

## Talking to the user — marketer-facing output (presentation layer)

The people using this Skill are **marketers**, not data engineers. Raw DMO API names
(`ssot__Individual__dlm`), field API names (`ssot__Salutation__c`), and SQL
(`COUNT(DISTINCT …)`) mean nothing to them and erode trust. **Translate every user-facing
answer into business language; keep the technical form for execution and for anyone who asks.**

- **Use business labels, not API names.** Refer to entities and fields by their `label` in
  [../../reference/dataModel.yaml](../../reference/dataModel.yaml) (e.g. *HCP*, not
  `ssot__Individual__dlm`; *Salutation*, not `ssot__Salutation__c`). The labels are governed in
  the locked semantic layer, so this works in `strict` mode without a live metadata call.
- **State counts in plain language.** "**1 HCP** matches" — never `COUNT(DISTINCT ssot__Id__c) = 1`.
- **Describe criteria in plain English.** "HCPs whose salutation is *Mr.*" — not a raw SQL `WHERE` clause.
- **Hide SQL and API names by default.** Don't lead with the segment `sql` or DMO/field API names.
  Offer them on demand (*"want to see the technical definition?"*) or tuck them under a clearly
  labeled **Technical details** aside for auditors — present, but not in the marketer's face.
- **Confirm mutations in business terms too.** At the mutation gate (create/publish/activate), lead
  with the plain-English definition; the raw SQL is the appendix, not the headline.
- **Friendly phrasing never relaxes the data guardrails.** Still never surface PII, still never dump rows.

---

## Guardrails (always on)

- **Speak marketer, not schema.** User-facing output uses business `label`s and plain-English counts/criteria (see *Talking to the user*), never raw DMO/field API names or SQL by default. Keep the technical form for execution; show it only on request or in a labeled Technical-details aside.
- **Einstein is out.** If asked to use Einstein counts for speed, decline and explain it invalidates the POC.
- **Refresh-timing gate.** Always capture and report both timestamps; never compare across different refresh windows.
- **No unbounded reads.** Return counts and definitions, not raw HCP/PII rows.
- **Segment SQL ≠ count SQL.** A segment's inclusion criteria return the **list of SegmentOn PKs** (the membership), not a number: project the **SegmentOn profile PK** (**plus its key qualifier if the PK has one** — e.g. `ssot__Individual__dlm` requires `KQ_Id__c` alongside `ssot__Id__c`) — no aggregation, no `DISTINCT`, no `SELECT *`, no aliases, no `CASE`; fully-qualified columns; joins only on declared relationship keys; subqueries only in `WHERE` (one column). Never submit a `COUNT(DISTINCT …)` query as a segment. See [../../reference/creating-segments.md](../../reference/creating-segments.md).
- **Never guess the schema.** DMOs, fields, and join keys come from [../../reference/dataModel.yaml](../../reference/dataModel.yaml) — not from field-name inference. Count people with `COUNT(DISTINCT` anchor `count_key)`. A count built on a `VERIFY` element is still returned — just note the mapping is unverified pending architect confirmation.
- **Stay in the entity model.** Only the authorized HCP objects/fields and the listed operations, regardless of brand.
- **Respect Discovery mode.** In `strict` mode, never run runtime metadata/discovery ops — use only the locked, `verified` model; ask a human to add anything missing. Runtime discovery is allowed only in `propose` mode, and only as a `VERIFY` proposal.
- **Log friction, don't fork the skill.** Capture clarifications/failures/gaps/workarounds to [../../feedback/session-log.md](../../feedback/session-log.md) per the *Self-improvement logging* toggle (no PII/data literals). In `log-only` (production default) never edit the governed skill yourself — improvements ship only via the owner's one-canonical-copy git loop.
- **Governance sign-off** required before any production write (create/publish/activate).
- **Confirm before mutating.** Always show the user what you will create/publish/activate and get a go-ahead before `execute` on a write operation.
- **Prefer the MCP path.** If the MCP server is unavailable, the same recipes may run via `sf` CLI (`sf data ...` / `sf api request rest ...`, `--allow-non-ga-tools` for Developer Preview ops) — the scope, validation, and guardrails are unchanged.

---

## Example invocation

User: *"How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60 days?"*

You:
1. Confirm filters (opt-in = true, brand = `<brand>`, state = NY, web visit ≤ 60 days).
2. Map through [../../reference/dataModel.yaml](../../reference/dataModel.yaml) (anchor, path, fields).
3. `search "query sql count"` → get the Query op name.
4. `execute` a `COUNT(DISTINCT ...)` query → e.g. `12,431` (D360 refresh: `<ts>`).
5. Prompt/run the OCL/Snowflake benchmark → `12,290` (snapshot: `<ts>`).
6. Delta = 1.1% → within 2–5% threshold, same refresh window → **validated: ~12.3–12.4K opted-in `<brand>` HCPs in NY**.

Then (Recipe B — build from that count):

User: *"Great — build that as a segment."*

You:
7. Reuse the **same mapping/filters** from the count (don't re-interpret). Confirm the population.
8. `search "create segment"` → `payload_examples` → translate those filters into segment `sql` that
   projects the SegmentOn PK (plus its key qualifier if present), **no `DISTINCT`** — per
   [../../reference/creating-segments.md](../../reference/creating-segments.md).
9. Confirm the definition with the user → `execute` create → `execute` publish.
10. Pull the segment's member count and confirm it matches the ~12.4K from the count; then activate to
    the existing SFMC target and confirm receipt.
