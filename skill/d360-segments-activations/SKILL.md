---
name: d360-segments-activations
description: >-
  Query and build Salesforce Data 360 (Data Cloud) HCP and patient segments from
  plain English for the customer POC, via the data360 MCP server. Use when the
  user asks to count, list/read a segment, read its member count, determine
  whether it is published or activated, build a segment from a use case/count,
  describe, rebuild, update, publish, or activate a segment for any brand. Routes
  by audience: US Customer Data spaces (DEV-US/STG-US/PRD-US → Development/STG_US/PRD_US)
  are always HCP; patient spaces (DTC, PRD-PAT) are always patient/D2C — default live
  patient model is reference/dataModel-dtc.yaml in DTC (PRD-PAT is empty). Enforces
  OCL/Snowflake count validation (never Einstein). Always ask which dataspace before
  any count, create, update, or status check unless the user already named one. Every
  count — including the count behind a create/update and any status check — dual-reports
  Data 360 vs the Snowflake data-stream source table **in a Markdown table** (Data 360 row +
  Snowflake source row + Delta). Query **Data 360 only** for the live count — do **not** check
  Snowflake MCP connectivity or run the Snowflake connector. Always provide the Snowflake
  validation SQL below the table, mark Snowflake **PENDING** (or **N/A** if not Snowflake-fed),
  and include the note that Snowflake is not queried via MCP. This table is required for both HCP
  and DTC, on pull (count/status) and push (create/update). Under every count **and** create table
  always include the **Data 360 DMO link(s)** (`d360_dmo_get` → `MktDataModelObject/<id>/view`)
  **and** the **Data 360 segment link** (`MarketSegment/<id>/view`) — never omit the segment line
  on a Recipe A count. Count responses never include PII. For
  patient/consumer/D2C/DTC segment creates and updates, **always ask** whether to
  include CIA Consumer Marketable Email before nesting it — do not nest or skip
  silently. If the user says yes, nest CIA first on DTC_UnifiedIndividualDtc__dlm,
  then add the other required DMOs. Every segment create and publish uses
  lookbackPeriod P2Y (2 years) — never a different window. Append "test" to the
  segment name on create. For "within N miles of ZIP/landmark" asks, precompute
  ZIP centroids into an IN list (see ZIP-radius section) — do not invent in-SQL Haversine.
---

# Data 360 Segment POC (Governed Skill)

You interface with Salesforce **Data 360** through the **`data360` MCP server** to (1) return
verified HCP segment counts from plain English, (2) list/read existing segments, their member
counts, publication state, and activation state, and (3) turn a use case or counted population
into a segment — typically the segment you just counted, or a rebuilt reference segment — publish
it and, only when approved, activate it. This Skill is the **version-controlled data-access
contract** for the customer POC. Follow it exactly.

> **This file is a governance artifact.** It is reviewed and approved by the named governance owner
> before deployment. Any change to the validation contract or tool scope requires re-review.

---

## Working scope

The user may ask about **any brand**. When a request names a brand (or none), work within the same
entity model and operations below — no brand allowlist.

- **Dataspace (required — ask first, every time):** For every **use case** — whether the user asks
  to **count**, **create a segment**, **update a segment**, or **check a segment's count/status** —
  if the user has not already named a dataspace, **ask which dataspace** before doing anything else.
  Do **not** silently default. Org Data Spaces (labels → MCP API name):

  | Org label | MCP API name | Org description | Audience |
  | --- | --- | --- | --- |
  | **DEV-US** | `Development` | Development environment for US Customer Data | **HCP** |
  | **STG-US** | `STG_US` | Staging environment for US Customer Data | **HCP** |
  | **PRD-US** | `PRD_US` | Production environment for US Customer Data | **HCP** |
  | **DTC** | `DTC` | DTC | **Patient / D2C** |
  | **PRD-PAT** | `PRD_PAT` | Patient Production Data Space | **Patient** (empty — do not audience-query; offer `DTC`) |
  | **LAB** | `LAB` | LAB | Lab sandbox |

  **Audience rule (fixed):**
  - **US Customer Data** spaces (`DEV-US` / `STG-US` / `PRD-US`) → always **HCP**
  - **Patient** spaces (`DTC` / `PRD-PAT`) → always **patient / consumer / D2C**
  - Never put a patient ask in a US-\* space, or an HCP ask in `DTC` / `PRD-PAT`

  | User says | Route |
  | --- | --- |
  | **Dev** / DEV-US (HCP) | `Development` → [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) |
  | **Stage** / STG-US (HCP) | `STG_US` → [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) |
  | **Prod** / PRD-US (HCP) | `PRD_US` → [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) |
  | **Patient** / DTC / D2C | `DTC` → [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) |
  | **PRD-PAT** | Stop — empty; offer `DTC` for live patient data |

  Catalog: [../../reference/dataModel-index.yaml](../../reference/dataModel-index.yaml).
  Pass the chosen dataspace on every Query SQL and Segment op. **Do not** silently fall back to
  `default`.
- **Audience routing (required — decide before mapping):** A **doctor / HCP / US customer** use case
  routes to an **HCP** US space (`Development` / `STG_US` / `PRD_US`). A **patient / consumer /
  DTC / D2C** use case routes to **`DTC`** ([dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml)).
  If audience is ambiguous, ask "**HCP (US customer) or patient (DTC)?**" together with which
  dataspace, then load the matching YAML. Never build one request across both audiences.
- **Patient / consumer / D2C / DTC segments — ASK CIA first:** Whenever you **build**
  (Recipe B) or **update** (Recipe U) a patient/consumer/D2C/DTC segment, **ask before writing:**
  *Include CIA Consumer Marketable Email as the first membership filter?* Do **not** nest CIA
  silently and do **not** skip it silently. If **yes**, nest CIA first (Segment Membership Latest
  DMO on `DTC_UnifiedIndividualDtc__dlm`), then the other DMOs. If **no**, omit the CIA nest;
  still SegmentOn Unified Individual. Details: *CIA Consumer Marketable Email base (D2C)* under
  Recipe B.
- **Always dual-report against Snowflake SQL (count / create / update / status) — without probing
  Snowflake MCP:** Any operation that produces a member count — a Recipe A count, the count behind
  a **create** or **update**, or a **segment status** read — must map to the **Snowflake
  data-stream source table** for that DMO (see
  [../../validation/d360-vs-snowflake-stream.md](../../validation/d360-vs-snowflake-stream.md)).
  **Query Data 360 for the live count.** Do **not** authenticate Snowflake MCP, check connector
  connectivity, or execute the warehouse query from the agent.
  - Always show **Data 360 count** (live) + **Snowflake source count: PENDING** (or **N/A —
    connector not Snowflake**) naming `DATABASE.SCHEMA.TABLE` / stream.
  - Always include **Snowflake validation SQL** (same filters / person grain) under the table.
  - Always include the note: *Snowflake is not queried via MCP. Run the validation SQL in
    Snowflake to complete the dual report; the Data 360 count above is live from Data 360.*
- **Always return Data 360 DMO + segment links — count (pull) and create (push):**
  - **DMO link(s):** for each primary fact DMO, call `d360_dmo_get` and emit
    `https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view`
    (use the live org host when context differs).
  - **Segment link (required on every count and every create):** emit
    `https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view`
    plus display/API name.
    - **Create / update / status (Recipe B / U / S):** the segment you just created, updated, or
      read — never finish without this URL.
    - **Count (Recipe A):** look up a matching existing MarketSegment in the same dataspace
      (`d360_segment_list` / `d360_segment_get`, plus known catalog e.g. `DEMO_D2C_Premarin_Opted_In`).
      If one matches the population, use its Lightning URL. If none matches, still emit
      `Data 360 segment link: N/A — no MarketSegment for this count yet` **and** the org segment
      list `https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/o/MarketSegment/list`
      so the user can open Data 360. Never drop the segment-link line from a count answer.
- **Segment create naming + lookback (required):** On every **new** segment create (Recipe B):
  - **Name must end with `test`:** `displayName` ends with ` test` (space + test); `developerName`
    / API name ends with `_test`. If the proposed name already ends with `test` / `_test`, do not
    double-append. Examples: `DEMO_D2C_Premarin_Opted_In test` /
    `DEMO_D2C_Premarin_Opted_In_test`.
  - **Lookback is always 2 years:** set `lookbackPeriod: "P2Y"` on `d360_segment_create` and
    keep `P2Y` on update. **Every publish (Recipe P) is with a 2-year lookback** — if the
    definition is not `P2Y`, update it to `P2Y` before `d360_segment_publish`. Never publish
    with `P90D`, `P3Y`, or any other window. `d360_segment_publish` has no lookback field, so
    the window must be set at create/update time.
  - Confirm both the `test` suffix and `P2Y` with the user before create.
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
| **`STG_US`** (STG-US — US Customer / HCP) | [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | **Number only** — never PII |
| **`PRD_US`** (PRD-US — US Customer / HCP) | [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | **Number only** — never PII |
| `Development` (DEV-US — US Customer / HCP) | [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | **Number only** — never PII |
| `DTC` (patient / D2C) | [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) | **Number only** — never PII (+ no individual health values) |
| `PRD_PAT` (Patient Production — empty) | [dataModel-prd-pat.yaml](../../reference/dataModel-prd-pat.yaml) | Do not audience-query; offer `DTC` |
| `LAB` | [dataModel-lab.yaml](../../reference/dataModel-lab.yaml) | **Number only** — never PII |

When the user asks to count against **staging** or **production**, route to `STG_US` /
`PRD_US`, load that YAML, pass that dataspace on every query — and still return **only the
count**. Production is not a reason to preview people; staging is not a reason to dump sample
rows. Empty-result SQL under **SQL (for validation)** (allowed for `STG_US` / `Development`)
must remain `COUNT(DISTINCT …)` only — never add PII columns.

### What you may return for a count

- The **integer Data 360 count** (and plain-English restatement).
- The **Snowflake source-table row** for the stream that feeds the DMO (see
  [../../validation/d360-vs-snowflake-stream.md](../../validation/d360-vs-snowflake-stream.md)) —
  always pair them. Do **not** run Snowflake MCP; mark Snowflake **PENDING** (or **N/A**) and
  ship the validation SQL:

  ```text
  **Data 360 count:** <N>
  **Snowflake source count:** PENDING (Source: DATABASE.SCHEMA.TABLE)
  **Snowflake validation SQL:**
    SELECT COUNT(DISTINCT <ID>) FROM DATABASE.SCHEMA.TABLE WHERE <same filters>;
  ```

  > **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete
  > the dual report; the Data 360 count above is live from Data 360.

  If the stream is **not Snowflake-fed** (SFMC / CRM / UploadedFiles), mark **N/A — connector not
  Snowflake** instead of PENDING.

  Always include links:

  ```text
  **Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
  DMO: <label> (<api_name>) · ID: <dmoId>
  **Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view
  Segment: <display name> (<segmentApiName>) · ID: <marketSegmentId>
  ```

  Resolve `<dmoId>` with `d360_dmo_get` (`dataModelObjectName`). **Always emit the segment link
  line** on count and create. On create/update/status, it is the MarketSegment URL. On a Recipe A
  count, look up a matching existing segment first; if none, still print
  `N/A — no MarketSegment for this count yet` plus the org `MarketSegment/list` URL. Never omit
  the line.

- Dataspace name (`STG_US` / `PRD_US` / …), refresh timestamps, and validation deltas.
- Non-PII **aggregate** diagnostics only when needed (fill-rates; `GROUP BY` on `pii:false`
  categorical fields). For empty POC Staging/Development results, the **literal count SQL** under
  **SQL (for validation)** — that SQL must itself be count-only (see below).

### Required dual-report **table** (always render this — HCP and DTC)

Every answer that produces a member count — a **pull** (Recipe A count / Recipe S status read) or a
**push** (the count behind a Recipe B create or Recipe U update) — must present the Data 360 and
Snowflake numbers **side by side in a Markdown table**, not just prose. This is mandatory for both
**HCP** (`Development` / `STG_US` / `PRD_US`) and **DTC / patient** (`DTC`) dataspaces.

Render exactly this shape (fill the values; keep the columns):

```text
| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | <N> | Dataspace <name> · DMO <api_name> · refreshed <ts> |
| Snowflake source | PENDING or N/A | <DATABASE.SCHEMA.TABLE> · stream <stream_name> |

Delta: PENDING / N/A
**Snowflake validation SQL:**
  SELECT COUNT(DISTINCT <ID>) FROM DATABASE.SCHEMA.TABLE WHERE <same filters as the D360 count>;

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
**Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view
```

Rules for the table:

- **Always include both rows.** Never drop the Snowflake row. Do **not** probe Snowflake MCP —
  put **PENDING** (or **N/A — connector not Snowflake**) in the Count cell and always share the
  validation SQL.
- **Always include DMO + segment link lines** under the table — **count and create**. Resolve DMO
  ids with `d360_dmo_get`. Multi-DMO counts list one DMO link per primary fact DMO. Resolve the
  segment URL from create/get, or from a matching existing segment on a count. If a count has no
  MarketSegment yet, keep the line and set it to `N/A — no MarketSegment for this count yet` plus
  `…/lightning/o/MarketSegment/list`. Never omit **Data 360 segment link:**.
- **Counts only — no PII in the table.** The table carries integers and source metadata, never person
  attributes.
- Keep business labels in the surrounding prose (see *Talking to the user*); the table's `Reference`
  column is the one place API names / source tables are always shown, since they are the audit trail.

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
every count** is: (1) decide audience (HCP / US customer vs patient / DTC), (2) **ask which
dataspace** unless already named, (3) load that YAML, (4) announce the choice before querying.

**Fixed audience rule:** US Customer Data (`DEV-US` / `STG-US` / `PRD-US`) = **HCP**. Patient
spaces (`DTC` / `PRD-PAT`) = **patient / D2C**.

### Ask before every HCP or patient count (required)

Unless the user already named a dataspace in the same message (e.g. "in STG-US", "in DTC",
"in DEV-US"), **stop and ask**:

> Which dataspace — **DEV-US**, **STG-US**, or **PRD-US** (HCP / US Customer), or **DTC** (patient)?

Do **not** run the count until they answer. Then map:

| Choice | MCP dataspace | Model |
| --- | --- | --- |
| **DEV-US** / Dev (HCP) | `Development` | [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) |
| **STG-US** / Stage (HCP) | `STG_US` | [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) |
| **PRD-US** / Prod (HCP) | `PRD_US` | [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) |
| **DTC** / patient / D2C | `DTC` | [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) |
| **PRD-PAT** | `PRD_PAT` | Empty — stop; offer `DTC` |

If they also omit the audience noun ("people", "customers"), ask **audience and dataspace**
together before running. "US customers" → HCP; "patients" → DTC.

### Catalog (explicit dataspace → file)

| Org label | MCP API name | Audience | File | Notes |
| --- | --- | --- | --- | --- |
| DEV-US | `Development` | HCP (US Customer Data) | [dataModel-dev.yaml](../../reference/dataModel-dev.yaml) | POC default for HCP |
| STG-US | `STG_US` | HCP (US Customer Data) | [dataModel-stg-us.yaml](../../reference/dataModel-stg-us.yaml) | Staging; identity link = `stg_IndividualIdentityLink__dlm` |
| PRD-US | `PRD_US` | HCP (US Customer Data) | [dataModel-prd-us.yaml](../../reference/dataModel-prd-us.yaml) | Production — governance before writes |
| DTC | `DTC` | PATIENT | [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml) | Default live patient / D2C |
| PRD-PAT | `PRD_PAT` | PATIENT | [dataModel-prd-pat.yaml](../../reference/dataModel-prd-pat.yaml) | **EMPTY** — stop; offer DTC |
| LAB | `LAB` | LAB | [dataModel-lab.yaml](../../reference/dataModel-lab.yaml) | Lab sandbox; no IR |
| default | `default` | — | [dataModel-default.yaml](../../reference/dataModel-default.yaml) | ssot__ inventory; not segmentable |

**Routing rules**

1. **Audience noun decides HCP vs patient.** "How many **HCPs**…" / US customers → HCP US-\* spaces.
   "How many **patients** / consumers…" → `DTC`. Brand names alone do **not** decide it.
2. **Ask which dataspace before every count** unless already named. Never silently default.
3. **An explicit dataspace in the request wins.** Load that space's YAML from the table above and
   restate the choice before running.
4. **Ambiguous audience → ask, don't guess.** "people," "individuals," "audience," or "customers"
   with no audience noun → ask "**HCP (US customer) or patient (DTC)?**" (and dataspace if missing).
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
- **Count source of truth = OCL/Snowflake (+ stream-source parity).** Einstein Segment Creation is
  explicitly ruled out. After every D360 count, also report the count from the **Snowflake
  data-stream source table** mapped in
  [../../reference/snowflake-stream-sources.md](../../reference/snowflake-stream-sources.md) —
  format per [../../validation/d360-vs-snowflake-stream.md](../../validation/d360-vs-snowflake-stream.md).
  A count is not **"validated"** until the formal OCL benchmark also clears
  [../../validation/compare-counts.md](../../validation/compare-counts.md).
- **Dual-report every count.** Never answer with D360 alone when a Snowflake stream source exists.
  Always: **Data 360 count:** N · **Snowflake source count:** M (Source: DB.SCHEMA.TABLE).
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
4. Build a `COUNT(DISTINCT <anchor count_key>)` query using the mapped joins and confirmed filters (DISTINCT on the anchor so 1:N fan-out never inflates the number). **SELECT only that count** — never project `pii:true` columns (or patient health attributes) into the result set. Same rule for HCP and patient/DTC.
5. `execute` with the **user-chosen dataspace** and capture: **the D360 count** and the **Data 360 data-stream last-refresh timestamp** (query it if not returned).
6. **Emit Snowflake validation SQL (required dual report — do not probe Snowflake MCP).** Follow
   [../../validation/d360-vs-snowflake-stream.md](../../validation/d360-vs-snowflake-stream.md):
   1. Map the primary DMO in the count to its Snowflake `database.schema.table` via
      [../../reference/snowflake-stream-sources.md](../../reference/snowflake-stream-sources.md).
   2. Build an equivalent `COUNT(DISTINCT …)` on that source table with the **same filters**.
   3. Do **not** authenticate Snowflake MCP, check connector connectivity, or execute the
      warehouse query. Keep Snowflake **PENDING** (or **N/A — connector not Snowflake**).
   4. **Always present both sides in the required dual-report table** (see *Required dual-report
      table* under PII-safe counts) — never prose-only:

      ```text
      | Source | Count | Reference |
      | --- | --- | --- |
      | Data 360 | <N> | Dataspace <name> · DMO <api_name> · refreshed <ts> |
      | Snowflake source | PENDING or N/A | <DATABASE.SCHEMA.TABLE> · stream <stream_name> |

      Delta: PENDING / N/A
      **Snowflake validation SQL:** <exact SQL>
      > **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.
      ```

   5. Resolve **Data 360 DMO link(s)** with `d360_dmo_get` and emit
      `…/lightning/r/MktDataModelObject/<dmoId>/view`. **Always emit the Data 360 segment link**
      on this count (and on create). Look up a matching MarketSegment (`d360_segment_list` /
      `d360_segment_get` / known catalog). If found, emit
      `…/lightning/r/MarketSegment/<marketSegmentId>/view`. If none, still emit
      `Data 360 segment link: N/A — no MarketSegment for this count yet` plus
      `…/lightning/o/MarketSegment/list`. Never omit the segment-link line.
7. **Record what you observed** in [../../reference/observed-values.md](../../reference/observed-values.md), and **profile on empty / unknown values**:
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
8. **Formal OCL/Snowflake benchmark (Phase 1 validated label).** In addition to stream-source dual
   reporting, run (or instruct) the OCL benchmark per
   [../../validation/run-benchmark.md](../../validation/run-benchmark.md) and compare per
   [../../validation/compare-counts.md](../../validation/compare-counts.md). Report delta % and
   refresh-window alignment. Do **not** call the number **"validated"** until that gate passes.
9. If the stream-source delta or OCL delta exceeds threshold, or windows don't match: say the count
   is **not yet validated**, and recommend investigating or waiting for the next refresh. Still
   show both D360 and Snowflake source numbers — never hide a mismatch.

## Recipe S — Read segment count, publication state, and activation state

**Trigger:** the user asks to list segments, inspect a segment, read its count, or determine
whether it is activated. This is read-only; do not publish, activate, update, or delete anything.

### Identify the segment

1. If the user supplied a segment API name, use it. Otherwise ask for the dataspace when not
   already named, then `search` / `execute` **`d360_segment_list`** with that `dataspace`.
2. Match by API/developer name first. A display-name match is not enough when multiple segments
   match — present the non-PII names and ask which one.
3. `execute` **`d360_segment_get`** with `segmentApiName`. Capture:
   - display name and API/developer name
   - segment / market-segment ID
   - dataspace and SegmentOn DMO
   - segment definition / criteria
   - lifecycle/publication status and publish schedule
   - last published / evaluated timestamp when returned

### Read the member count

4. `execute` **`d360_segment_count`** with:

   ```json
   {
     "segmentApiName": "<api name>",
     "input": { "preferApproxCount": false }
   }
   ```

   This operation may be asynchronous. Follow the returned job handle/status mechanism exactly;
   do not invent a polling operation. If the facade provides no completed result yet, report
   **Segment member count: PENDING** and the returned job/status — never substitute the original
   Recipe A query count as if it were the evaluated segment count.
5. If a published segment response already contains a current member-count field and evaluation
   timestamp, report it, but label whether it is exact or approximate from the response.
6. Never call `d360_segment_member_list` just to prove the count: that can expose membership.
   Counts and aggregate metadata only — no member IDs or PII.

### Determine whether it is activated

7. **Published/ACTIVE is not the same as activated.**
   - *Published* means the segment definition has been evaluated.
   - *Activated* means at least one Activation binding exists for that segment and its activation
     status is active/successful (not merely that a target exists).
8. `search` / `execute` **`d360_activation_list`**. Match activations by the segment's
   `marketSegmentId` / segment ID (or the exact segment reference returned by the API). If the list
   response is insufficient, `execute` **`d360_activation_get`** for each matching activation ID.
9. For every match capture: activation ID/name, target name, activation status, refresh type,
   last run / last successful run, and error message when returned. Do **not** infer activation
   from segment status or from an ACTIVE activation target.
10. Report one of:
    - **Activation status: ACTIVATED** — one or more matching activations are active/successful.
    - **Activation status: CONFIGURED, NOT ACTIVE** — binding exists but is draft/inactive/failed;
      include its returned status.
    - **Activation status: NOT ACTIVATED** — no activation binding references the segment.
    - **Activation status: UNKNOWN** — API/access did not return enough evidence; state why.

### Required status output

After the segment member count, emit Snowflake validation SQL for the segment's primary DMO/filters
(Recipe A step 6 — **do not probe Snowflake MCP**). Then report the counts in the **required
dual-report table** followed by the lifecycle facts:

```text
| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | <N> | Dataspace <name> · SegmentOn <DMO> · evaluated <ts> |
| Snowflake source | PENDING or N/A | <DATABASE.SCHEMA.TABLE> · stream <stream_name> |

Delta: PENDING / N/A
**Snowflake validation SQL:** <exact SQL>
> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
**Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view

Segment: <display name> (<segmentApiName>)
Publication status: <DRAFT|PUBLISHED|ACTIVE|…> (last published <timestamp>)
Activation status: <ACTIVATED|CONFIGURED, NOT ACTIVE|NOT ACTIVATED|UNKNOWN>
  Activation: <name/id/status> → Target: <target name>   # one line per binding
```

Never omit the **Data 360 DMO link** or **Data 360 segment link** on a segment count/status read.
## Recipe B — Push (build a segment → activate)

**Trigger:** the user wants to turn a population into a segment — a **plain-English use case**
("build a segment of patients who have a copay card with a card number"), **"now build that as
a segment"** right after a Recipe A count, or (for Phase-2 validation) **"rebuild this reference
segment."** For natural language, start at **Entry point 0**.

**Mental model:** a segment is the **same population as a count, expressed as membership** (the list
of SegmentOn primary keys) instead of a number. The criteria you mapped for the count *are* the
criteria for the segment — you're changing the **shape of the SQL**, not re-deriving the population.
So don't re-interpret the request; reuse the mapping you already have.

There are three entry points; they converge on the same build-and-status core.

### Entry point 0 — build directly from a natural-language use case

**Trigger:** the user describes a population in plain English and asks to **create / build a
segment** (with or without a prior count). Also use this when they paste a Data 360 segment URL
and ask you to **learn from it** or **rebuild** it.

**Canonical UI references (learn the container shape, then apply Skill deltas):**

| Learn from | URL | What it teaches |
| --- | --- | --- |
| UAT RX Program (multi-DMO) | [1sgWC00000008iLYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008iLYAQ) | Two **AND** containers (Consent Preference + Brand Profile), OR inside Brand Profile |
| Copay Card on Individual (single DMO) | [1sgWC00000009ePYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000009ePYAQ) | One related-DMO container, `count ≥ 1`, AND of “in list” + “has value”; SegmentOn Individual |
| UAT copay + brand + recency | [1sgWC00000008jxYAA](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008jxYAA) | One Copay Card container on Unified; AND of has-value + brand IN list + 36-month acquisition **and** recency. Description “Copay and Voucher” has **no voucher DMO** |
| UAT email OR (two engagement DMOs) | [1sgWC00000008lZYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008lZYAQ) (original) · [1sgWC00000008vFYAQ](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/cmp/runtime_cdp__segmentWizardLanding?runtime_cdp__record_id=1sgWC00000008vFYAQ) (Mariana clone) | Top-level **OR** (union) of SFMC Email Engagement **or** HQ Email Engagement; different action literals and person-link names per DMO. Both have the **same** `includeCriteria` |

Full walkthroughs: [../../reference/creating-segments.md](../../reference/creating-segments.md)
*Worked example — DTC use case → multi-DMO containers*, *Worked example — copay card (natural
language → one container)*, *Worked example — copay + brand + recency (UAT scenario 3)*, and
*Worked example — email engagement OR (two DMOs)*.

**Playbook — natural language → segment (always this order):**

1. **Route.** Audience (HCP vs patient) + dataspace. Patient/D2C → `DTC` +
   [dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml). HCP → the named US space YAML.
2. **Restate the use case as bullets** the user can confirm. Example from the copay-card segment:
   *Patients who have at least one copay card with a card number filled in* (the live UI also
   restricts to a test allowlist of customer keys — do **not** copy those IDs into answers; they
   are customer IDs / PII).
3. **Decompose into DMO containers** (UI = `NumberAggregation` count ≥ 1 on a related DMO;
   DBT = one `SegmentOn.PK IN (SELECT related.FK …)` subquery per container):
   - One **related DMO** per existence check (Copay Card, Brand Profile, Consent, Preference,
     Email Engagement, Headquarter Email Engagement, …).
   - **Between containers:** take the operator from the use case. **AND** = intersection (must
     satisfy every container — UAT RX). **OR** = union (qualify via *either* related DMO — UAT
     email scenario 4). Do not default to AND when the ask is “SFMC **or** HQ email.”
   - **Inside a container:** **AND** for co-required attributes (`Open/Click` AND `Journey name
     has value`); **OR** for alternatives (`Caregiver OR Prospect OR Patient`).
   - **Action literals are DMO-specific.** SFMC `DTC_Email_Engagement__dlm` uses `Open` / `Click`.
     HQ `DTC_HeadquarterEmailEngagement__dlm` uses `Open Email` / `Click Email` / `Send Email` /
     `Email Delivered`. Never copy HCP `OPENED` or mix the two vocabularies.
   - **Person-link names differ:** Email Engagement → `Individual__c`; HQ Email → `IndividualId__c`.
   - Map every field through the routed YAML — never guess join keys.
   - Related DMOs on Unified SegmentOn always traverse the **identity link**
     (Unified → Link → source Individual → related DMO).
   - Trust live `includeCriteria` over description **and** over `lookbackPeriod` when they
     disagree (this UI segment’s lookback is `P90D` but HQ filter is **1 year**).
4. **Patient/D2C — ASK CIA, then apply Skill deltas:**
   - SegmentOn = **`DTC_UnifiedIndividualDtc__dlm`** (not `DTC_Individual__dlm`).
   - **Ask:** *Include CIA Consumer Marketable Email as the first membership filter?* Wait for
     yes or no. **Yes** → Container 0 = CIA membership DMO, then the use-case containers.
     **No** → omit CIA; use-case containers only. Never nest or skip without that answer.
5. **Count first (Recipe A).** Same filters / same CIA nest. Dual-report table + DMO links +
   segment link line. If the count is 0 because a DMO or CIA SM nest is empty, show the SQL and
   do not imply the created segment will have members.
6. **Confirm** display name (must end with ` test`), API name (must end with `_test`),
   `lookbackPeriod: P2Y`, dataspace, SegmentOn, containers, AND/OR, and expected count.
7. **Translate to membership SQL** (SegmentOn PK only — no `COUNT`, no aliases). Create with
   `d360_segment_create` (`segmentType: Dbt`, `lookbackPeriod: "P2Y"`, `publishSchedule: NoRefresh`
   unless asked). Then publish on confirmation (`d360_segment_publish`).
8. **Read back** with Recipe S: member count, dual-report table, **Data 360 segment link**, DMO
   links. Prefer live `includeCriteria` over a marketing description when they diverge.

**UAT RX Program natural-language example (from `1sgWC00000008iLYAQ`) — canonical AND of two DMOs:**

> For patients in DTC, build a D2C segment of consumers who are opted in to Brand or Topic ALL
> communications **and** who are a Caregiver, Prospect, or Patient, or on a prescription program,
> or on medication, or acquired in the last 24 months.

| Step | What you do |
| --- | --- |
| Route | Patient → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then **AND** of: (1) Consent Preference count ≥ 1, `PreferenceName__c = 'ALL'` AND type IN (`Brand`,`Topic`) AND value `IN`; path Unified → Link → Individual → ContactPointConsent → ConsentPreference. (2) Brand Profile count ≥ 1, `CustomerType__c` IN (`Caregiver`,`Prospect`,`Patient`) **OR** `OnPrescriptionDrugProgram__c` **OR** `OnMedication__c` **OR** `AcquisitionDate__c` last 24 months; FK `IndividualId__c` |
| SQL shape | `(optional CIA AND) ConsentPreference AND BrandProfile` |
| Watch | Description says “enrolled in the last **3 years**”; live filter is **24 months**. UI has **no CIA**. Published members are a `NoRefresh` snapshot — re-count with Recipe A before rebuild. Publish lookback is always **`P2Y`**. |

The live UI is already SegmentOn Unified. A Skill rebuild **asks CIA**, keeps **AND between** containers and **OR inside** Brand Profile, and uses 24 months not 3 years.

**Copay-card natural-language example (from `1sgWC00000009ePYAQ`):**

> For patients in DTC, build a D2C segment of consumers who have a copay card with a card number
> on file.

| Step | What you do |
| --- | --- |
| Route | Patient → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then Copay Card (`DTC_CopayCard__dlm`) count ≥ 1, `CardNumber__c` has value. Path: Unified → Link → Individual → Copay Card `IndividualId__c` |
| Do not copy | The UI allowlist of six `MTDB_CUSTOMER_ID-*` keys (customer IDs — PII). Only keep an allowlist if the user explicitly wants a test slice. |
| Count | `COUNT(DISTINCT` Unified `Id__c`) with the same nests (same CIA choice) |
| Create | Membership SQL: optional CIA `IN` subquery AND Copay Card `IN` subquery; SegmentOn Unified Individual; name ends with `test`; `lookbackPeriod: P2Y` before publish |

The live UI segment is SegmentOn **Individual**, 6 members, **no CIA** — a QA named-list. A Skill
rebuild is Unified + **ask CIA** + Copay Card has-value (full population unless the user asks to
keep a test list).

**UAT copay + brand + recency natural-language example (from `1sgWC00000008jxYAA`):**

> For patients in DTC, build a D2C segment of consumers who have a copay card with a card number
> on file for NURTEC, XELJANZ, PAXLOVID, EUCRISA, or LORBRENA, acquired in the last 36 months,
> with activity in the last 36 months.

| Step | What you do |
| --- | --- |
| Route | Patient → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then Copay Card (`DTC_CopayCard__dlm`) count ≥ 1: `CardNumber__c` has value **AND** `Brand__c` IN (`NURTEC`,`XELJANZ`,`PAXLOVID`,`EUCRISA`,`LORBRENA`) **AND** `AcquisitionDate__c` last 36 months **AND** `MostRecentDate__c` last 36 months. Path: Unified → Link → Individual → Copay Card `IndividualId__c` |
| SQL shape | `(optional CIA AND) CopayCard` (one related DMO; AND inside the container) |
| Do not copy | Card numbers (PII). Description “Copay and Voucher” — **no voucher DMO** in `includeCriteria`. |
| Watch | Lookback metadata is `P90D`; live filters are **36 months**. Keep the 36-month SQL filters; **publish lookback is always `P2Y`** (never `P3Y`). Published members are a `NoRefresh` snapshot. |

The live UI is already SegmentOn Unified and has **no CIA**. A Skill rebuild **asks CIA**, keeps the single Copay Card container, keeps 36-month SQL filters (not `P90D`), publishes with **`P2Y`**, and does not invent a voucher object.

**Email-engagement OR natural-language example (from `1sgWC00000008lZYAQ`; Mariana clone `1sgWC00000008vFYAQ` has the same `includeCriteria`):**

> For patients in DTC, build a D2C segment of consumers who opened or clicked an SFMC journey
> email, **or** had a headquarter email send / open / click / delivered in the last year.

| Step | What you do |
| --- | --- |
| Route | Patient → `DTC` |
| Containers | **Ask CIA first.** If yes, Container 0 = CIA. Then **OR** of: (1) `DTC_Email_Engagement__dlm` count ≥ 1, action IN (`Open`,`Click`) AND `MarketJourneyName__c` has value, FK `Individual__c`; (2) `DTC_HeadquarterEmailEngagement__dlm` count ≥ 1, action IN (`Click Email`,`Open Email`,`Send Email`,`Email Delivered`) AND `EngagementDateTime__c` in last 1 year, FK `IndividualId__c` |
| SQL shape | `(optional CIA AND) (SFMC IN-subquery OR HQ IN-subquery)` — not three ANDs |
| Watch | SFMC container is **0** (person link not audience-ready). Published members **39** are `NoRefresh` from 2026-06-03; live Unified HQ path is larger. Description “SFMC currently 0” matches; `P90D` lookback does **not** override the 1-year HQ filter. Publish lookback is always **`P2Y`**. |

The live UI is already SegmentOn Unified and has **no CIA**. A Skill rebuild **asks CIA**, keeps the **OR** of the two engagement containers, and uses each DMO’s own action literals and FK name.

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

### CIA Consumer Marketable Email base (D2C) — ask, then nest if yes

For every **patient / consumer / D2C / DTC** segment create or update:

0. **Ask first (required):** *Include CIA Consumer Marketable Email as the first membership
   filter?* Wait for **yes** or **no**. Do not nest CIA and do not omit it without that answer.
1. **SegmentOn** must be **`DTC_UnifiedIndividualDtc__dlm`**. Do **not** SegmentOn
   `DTC_Individual__dlm` for activatable D2C audiences.
2. **If yes** — nest the **CIA Consumer Marketable Email** segment membership DMO as the first
   filter, then AND every other use-case DMO:
   - Display name: **CIA Consumer Marketable Email**
   - Segment API name: `DTC_CIA_Consumer_Marketable_Email`
   - `marketSegmentId`: `1sgWC00000009cnYAA` (confirm with `d360_segment_get` if stale)
   - Membership Latest DMO: `DTC_UnifiedIndividualDtc_SM_1780343389__dlm`
     (`segmentMembershipDmo.latestTable` on the CIA segment)
   - Confirmed fields (2026-08-12): `Id__c` = Unified Individual PK; `Segment_Id__c` = segment id
     (org stores **15-char** ids in this DMO — use `1sgWC00000009cn` or
     `Segment_Id__c LIKE '1sgWC00000009cn%'`; confirm before publish)
3. **If no** — omit the CIA nest. Build the use-case DMO containers only (still Unified SegmentOn).
4. **Then** add the necessary DMOs for the ask via declared join keys / identity-link paths in
   [../../reference/dataModel-dtc.yaml](../../reference/dataModel-dtc.yaml).
5. **Shape (membership) when CIA = yes:**

```sql
SELECT DTC_UnifiedIndividualDtc__dlm.Id__c
FROM DTC_UnifiedIndividualDtc__dlm
WHERE DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    SELECT DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Id__c
    FROM DTC_UnifiedIndividualDtc_SM_1780343389__dlm
    WHERE DTC_UnifiedIndividualDtc_SM_1780343389__dlm.Segment_Id__c LIKE '1sgWC00000009cn%'
)
  AND DTC_UnifiedIndividualDtc__dlm.Id__c IN (
    /* additional DMO subquery(s) for brand / consent / etc. */
  );
```

6. **Counts (Recipe A)** for the same population must use the same CIA choice so the count matches
   the segment. Prefer `COUNT(DISTINCT DTC_UnifiedIndividualDtc__dlm.Id__c)`.
7. **If the user said yes and CIA membership rows are missing** in the Latest SM DMO (nest returns
   0 while `lastSegmentMemberCount` on CIA is non-zero): **do not silently drop the CIA layer**.
   Tell the user the nest is empty, show the SQL, and only if they explicitly approve a temporary
   fallback, replicate marketable email+consent filters from `reference_segments` /
   `journeys.marketable_patients` — still SegmentOn Unified Individual, still tag **D2C**, and still
   call out that the durable pattern is the CIA membership DMO.

### Then — for any entry point (build → create → publish → validate → optional activate)

3. **Translate the criteria into segment `sql`** per
   [../../reference/creating-segments.md](../../reference/creating-segments.md): `search` for
   create-segment, `payload_examples` for the payload, then build SQL that **returns the membership**
   — project the **SegmentOn PK** *(plus its **key qualifier** if the PK has one — source DMOs like
   `ssot__Individual__dlm` require projecting `KQ_Id__c` alongside `ssot__Id__c`)*. **No
   `DISTINCT`/aggregation**, no `SELECT *`/`CASE`/aliases; fully-qualified columns; joins only on
   declared keys; subqueries only in `WHERE`. Never submit a `COUNT(DISTINCT …)` — Data 360 rejects
   it as a segment. Create/publish in the **routed dataspace** — an **HCP** segment goes to the HCP
   dataspace the user chose (`Development` / `STG_US` / `PRD_US`); a **patient/D2C** segment goes to
   `DTC` — unless the user explicitly chose another. **For patient/D2C, ask whether to include CIA
   Consumer Marketable Email, then apply the CIA base layer above only if they said yes.** For ZIP-radius
   populations, reuse the **same precomputed ZIP5 `IN` list** from the count
   ([../../reference/zip-radius.md](../../reference/zip-radius.md)).
4. Propose deterministic names — **tag the audience** so every segment name states who it targets,
   and **always append `test`**:
   - **Audience tag (required):** a **doctor** segment is tagged **`HCP`**; a **patient/consumer**
     segment is tagged **`D2C`**. Put the tag in both names.
   - `displayName`: human-readable, prefixed `DEMO_` for demo segments, include the audience tag,
     and **end with ` test`** — e.g. `DEMO_HCP_<brand>_Email_Openers_90d test` or
     `DEMO_D2C_<brand>_Brand_Profile test`. Do not double-append if it already ends with `test`.
   - `developerName`: API-safe and stable, also carrying the tag, and **end with `_test`** — e.g.
     `DEMO_HCP_<brand>_email_openers_90d_test`; do not overwrite an existing segment silently.
   - `lookbackPeriod`: always **`P2Y`** (2 years) on create (and when updating before republish).
   - `publishSchedule`: `NoRefresh` unless the user requested and approved another schedule.
5. **Confirm before creating.** Show display/API name (with `test` suffix), `lookbackPeriod: P2Y`,
   dataspace, SegmentOn DMO, **CIA yes/no** (D2C only), plain-English filters, membership SQL,
   expected Recipe A count, and whether empty profile streams will force zero members. Creation is
   a write; wait for explicit confirmation.
6. `search` → `payload_examples` → `execute` **`d360_segment_create`** with the routed
   `dataspace` / `input.dataSpace`, `segmentType: "Dbt"`, `lookbackPeriod: "P2Y"`,
   `segmentOnApiName`, and one DBT model whose SQL is the membership query. Capture the returned
   **`marketSegmentId`**, API/developer name, and dataspace — you will need them for the
   **Data 360 segment link**.
7. **Do not publish automatically just because create succeeded.** Read the created definition
   with `d360_segment_get`, confirm `lookbackPeriod` is `P2Y` and the name ends with `test`,
   show it to the user (including the **Data 360 segment link**), and ask for publish confirmation.
   On confirmation, follow **Recipe P** (`d360_segment_publish` with **`segmentId`** =
   `marketSegmentId`, not the API name). DBT create may already show `ACTIVE` after COUNTING —
   that is evaluation, not a substitute for an on-demand publish when the user asked to publish
   or needs a fresh `NoRefresh` snapshot.
8. **Sanity-check membership against the count + Snowflake SQL.** Follow Recipe S to pull the
   segment's member count and publication status, then confirm it
   matches the Recipe A count for the same criteria — same population, so they should agree. If they
   diverge, **stop and reconcile** before activating (a mismatch usually means the segment SQL and the
   count SQL don't express the same filters). Emit Snowflake validation SQL for the same filters
   (Recipe A step 6 — **do not probe Snowflake MCP**) and present the numbers in the **required
   dual-report table** (D360 row + Snowflake PENDING/N/A + validation SQL + note + DMO link +
   segment link). Never render this push-side validation as prose-only or omit the links.
   - **POC Staging empty-result rule:** when the routed dataspace is **`STG_US`** or **`Development`**
     and membership is **0 / empty** (or the underlying DMOs have no rows so the segment cannot be
     meaningfully validated), **always return the literal segment `sql`** you built/submitted —
     copy-pasteable — under a **SQL (for validation)** heading, so the team can validate the
     definition in lieu of members. Still do not dump PII rows.
9. **Validate against OCL/Snowflake** (Recipe A steps 7–9) if this population isn't already validated.
10. *(Rebuild variant only)* **Confirm segment equivalence** — list the rebuilt filters vs. the
   reference for the user/customer team to confirm they match.
11. **Activation is optional and separately confirmed.** Do not activate merely because the user
   asked to create a segment. If requested, show the existing target and activation configuration,
   require governance/user confirmation, then `search` the Activation family, wire the segment to
   the **existing** SFMC
   activation target (do **not** create a new target), `execute` to trigger, and **confirm SFMC
   receipt**.
12. **Read back lifecycle status.** Follow Recipe S after create/publish/activation and report the
    evaluated member count, publication state, activation state, **Snowflake dual-report** (SQL +
    PENDING + note), the **Data 360 DMO link**, and the **Data 360 segment link**.
13. **Report the success criteria:** for a rebuild — (1) count match, (2) segment equivalence, (3)
   SFMC receipt; for build-from-count — (1) segment membership matches the count, (2) SFMC receipt.
   Always close with the dual-count block + DMO link + segment link.

## Recipe P — Publish a segment (on-demand evaluation)

**Trigger:** the user says **publish**, **republish**, **refresh membership**, or **evaluate** a
segment they already created (or just confirmed after Recipe B). Create, publish, and activate
are **separate writes** — a create does not authorize publish.

**What publish does:** `d360_segment_publish` evaluates the segment **now** and writes a fresh
audience snapshot. It does **not** change filters, lookback, or schedule. It does **not** activate.

**Tool (always `payload_examples` first):** `d360_segment_publish`

| Parameter | Required | Notes |
| --- | --- | --- |
| `segmentId` | **yes** | 18-character **`marketSegmentId`** (starts with `1sg`). **Not** `segmentApiName`. |
| `dataspace` | yes on `execute` | Same dataspace as the segment (`DTC`, `Development`, `STG_US`, `PRD_US`) |

**Exact `execute` shape:**

```text
toolName: d360_segment_publish
paramsJson: {"dataspace":"<dataspace>","segmentId":"<marketSegmentId>"}
```

Example: `{"dataspace":"DTC","segmentId":"1sgWC0000000AfJYAU"}`.

Do **not** pass `lookbackPeriod` on publish — the tool has no lookback field. If the definition is
not `P2Y`, `d360_segment_update` with `lookbackPeriod: "P2Y"` **before** publish. Never publish
with any other window.

### Playbook

1. **Identify.** Recipe S: `d360_segment_get` (or `d360_segment_get_by_id`). Capture
   `marketSegmentId`, `segmentApiName`, dataspace, `lookbackPeriod`, `segmentStatus`,
   `lastSegmentMemberCount`, **Data 360 segment link**.
2. **Pre-checks.** Confirm `lookbackPeriod` is **`P2Y`**. If it is not, update to `P2Y` before
   publish. Confirm D2C CIA choice (asked and recorded). Do not publish
   `PRD_US` / `PRD_PAT` without governance sign-off.
3. **Confirm.** Show display/API name, `marketSegmentId`, dataspace, lookback, current status and
   member count, and the Lightning URL. Wait for an explicit **publish**.
4. **Publish.** `execute` `d360_segment_publish` with `dataspace` + `segmentId` only.
5. **Poll.** `d360_segment_get` until status leaves `PROCESSING` / `COUNTING`:
   - **ACTIVE** → report `lastSegmentMemberCount`.
   - **ERROR** → stop; show the membership SQL; do not retry blindly; do not activate.
6. **Dual-report** Recipe A count vs published members (Snowflake PENDING/N/A + validation SQL +
   note + DMO link + segment link). If they diverge, reconcile before activation.
7. **Do not activate** unless the user separately asked.

**DBT create vs publish:** after `d360_segment_create`, status often moves `PROCESSING` →
`COUNTING` → `ACTIVE` with a first snapshot. Treat that as create-time evaluation. Still run
Recipe P when the user asks to publish, after an update, or when `NoRefresh` membership is stale
vs live Recipe A.

**Not publish:** `d360_segment_count` (async estimate only). `d360_activation_*` (activation).
`d360_segment_update` (definition change).

## Recipe U — Update an existing segment

**Trigger:** the user asks to change an existing segment's criteria (broaden/narrow filters, change
brand, window, threshold), rename it, or change its schedule.

1. **Ask dataspace + audience first** (Dev/Stage/Prod; HCP vs patient) if not already named, then
   load the routed YAML.
2. **Read the current segment** with `d360_segment_get` (Recipe S) and restate its definition in
   plain English so the user confirms what they're changing from.
3. **Re-map the new criteria** through the semantic layer (same rules as Recipe B). Rebuild the
   **membership SQL** (SegmentOn PK only — no `COUNT`, no PII). For patient/D2C updates, **ask CIA**
   (keep, add, or omit the nest per the answer), then apply the changed DMOs.
4. **Count the new population first (Recipe A) and emit Snowflake validation SQL** — query Data 360
   only (do **not** probe Snowflake MCP); report Data 360 + Snowflake PENDING/N/A in the **required
   dual-report table** with validation SQL, note, DMO link(s), and segment link. This shows the
   impact of the change before writing.
5. **Confirm before writing.** Show old vs new definition, dataspace, the new expected count, and
   the existing **Data 360 segment link**. If renaming, keep / append the `test` suffix
   (`displayName` …` test`, API …`_test`). Set / keep `lookbackPeriod: "P2Y"`. For D2C, **ask CIA**
   if the update would add or remove that nest.
6. `search` → `payload_examples` → `execute` **`d360_segment_update`** in the routed dataspace
   (include `lookbackPeriod: "P2Y"`). Do not re-publish or re-activate automatically — publish only
   on confirmation (**Recipe P**), and re-activate only on separate confirmation.
7. **Read back** with Recipe S (member count, Snowflake dual-report, publication status, activation
   status, **Data 360 segment link**) and report the three states separately.

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
- **State counts in the required dual-report table — always both sides.** Lead the numbers with the
  table from *Required dual-report table* (Data 360 row + Snowflake PENDING/N/A, then Delta,
  Snowflake validation SQL, note, DMO link(s), and segment link):

  ```text
  | Source | Count | Reference |
  | --- | --- | --- |
  | Data 360 | 376,055 | Dataspace STG_US · DMO stg_Headquarter_Email_Engagement__dlm · refreshed <ts> |
  | Snowflake source | PENDING | CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL · stream STG_HCP_OCL_HEADQUARTER_EMAIL |
  ```

  You may add a plain-English restatement above the table (e.g. "376,055 HCPs opened an HQ email in
  the last 90 days"). Never show only the D360 number when a Snowflake stream source exists, never
  render the comparison as prose-only, never probe Snowflake MCP, and never accompany counts with
  PII samples. Always put the validation SQL under the table and include:

  > **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

  Always close with **Data 360 DMO link** + **Data 360 segment link**. On a count, look up a
  matching MarketSegment; if none exists yet, keep the line (`N/A — no MarketSegment for this
  count yet` + `MarketSegment/list`). On create, the line is the new segment's Lightning URL.

  When the user **starts a chat** or asks what to run, offer suggestion prompts from
  [../../prompts/chat-starters.md](../../prompts/chat-starters.md) (dataspace + populated DMO named).

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
- **Report segment lifecycle as three separate facts.** Say:

  > **Segment members:** 185,412 HCPs  
  > **Publication:** Published (last evaluated …)  
  > **Activation:** Not activated

  Never say “activated” merely because the segment is published or because an activation target is
  ACTIVE. Activation requires a matching activation binding and its returned status.
- **Friendly phrasing never relaxes the data guardrails.** Still never surface PII, still never dump rows — including when explaining HCP or patient/DTC counts.

---

## Guardrails (always on)

- **Speak marketer, not schema.** User-facing output uses business `label`s and plain-English counts/criteria (see *Talking to the user*), never raw DMO/field API names or SQL by default. Keep the technical form for execution; show it only on request or in a labeled Technical-details aside. **Exception:** in POC Staging (`STG_US`) or Development (`DEV-US`), empty count/segment results **must** include the literal SQL under **SQL (for validation)**.
- **PII never rides with a count.** For every HCP or patient/DTC count — including **`STG_US`
  (staging)** and **`PRD_US` (production)** — answer with the numbers (D360 + Snowflake source)
  and validation metadata only. Count SQL must `SELECT COUNT(DISTINCT …)` only — filters may use
  PII columns; results must not. No sample people, no PII grids, no health-attribute row dumps.
  See *PII-safe counts*.
- **Dual-report D360 + Snowflake SQL in a table — for count (pull), create/update (push), and
  status.** For any operation that yields a member count — HCP **or** DTC — look up the stream source
  in [../../reference/snowflake-stream-sources.md](../../reference/snowflake-stream-sources.md),
  **query Data 360 only**, and render the **required dual-report table** (Data 360 row + Snowflake
  PENDING/N/A + Delta + validation SQL + note + DMO link(s) + segment link) per
  *Required dual-report table* and
  [../../validation/d360-vs-snowflake-stream.md](../../validation/d360-vs-snowflake-stream.md).
  Do **not** check Snowflake MCP connectivity or run the warehouse query from the agent. Mark
  Snowflake **PENDING** / **N/A — connector not Snowflake** and always share the exact validation
  SQL. Do not ship a D360-only answer, and do not render the comparison as prose-only, when a
  Snowflake table feeds the stream.
- **Always include Data 360 DMO + segment links on count and create.** Resolve DMO id via
  `d360_dmo_get` → `/lightning/r/MktDataModelObject/<dmoId>/view`. Resolve segment id via
  create/get/list → `/lightning/r/MarketSegment/<marketSegmentId>/view` (org host). Never omit
  **Data 360 segment link:** from a Recipe A count or a Recipe B/U create/update. If a count has
  no matching MarketSegment yet, still print the line (`N/A — no MarketSegment for this count yet`
  plus `/lightning/o/MarketSegment/list`). Never leave the user without both link lines.
- **Create, publish, and activate are separate writes.** A request to create authorizes create only,
  not publish or activation. Show the definition and dataspace before create; read it back after
  create; obtain separate confirmation before publish (**Recipe P** — `d360_segment_publish` with
  `segmentId` = `marketSegmentId`) and again before activation. **Every create
  must use a name ending in `test` (`displayName` …` test`, API …`_test`) and
  `lookbackPeriod: P2Y`** before publish.
- **Read segment status without reading members.** Use segment get/count plus activation list/get.
  Do not use `d360_segment_member_list` for status/count reporting.
- **POC Staging — return SQL when empty.** For counts (Recipe A) and segments (Recipe B) in **`STG_US`** or **`Development`**: if the result is 0 / empty / underlying DMO unpopulated, return the exact SQL that was run (or the segment `sql` that was built) so the team can validate it in lieu of a result. That SQL stays count-only / membership-PK-only — **still never dump PII rows** (same bar as `PRD_US`).
- **Production counts are not a preview.** In **`PRD_US`**, never return people or PII to "validate"
  a count; use the integer (+ OCL/Snowflake benchmark). Writes still need governance sign-off.
- **Profile unknown / asked-about values — don't guess literals.** When the user asks whether a value exists, or you are unsure what a non-PII field contains, run the value-distribution `GROUP BY` query (Recipe A step 6), then append results to [../../reference/observed-values.md](../../reference/observed-values.md) and, when stable, propose `sampleValues` on the routed dataModel YAML. Never invent filter literals.
- **ZIP-radius = precomputed `IN` list.** For "within N miles of ZIP/landmark," derive ZIP5s outside D360 (GeoNames centroids + Haversine) and filter `SUBSTRING(PostalCodeId__c FROM 1 FOR 5) IN (...)`. Do **not** invent in-SQL distance math or assume a ZIP-centroid DMO unless it is `verified` in the routed model. Same list for count and segment. See [../../reference/zip-radius.md](../../reference/zip-radius.md).
- **Ask dataspace before every HCP or patient count.** US Customer spaces (`DEV-US` /
  `STG-US` / `PRD-US`) are **HCP**; patient spaces (`DTC` / `PRD-PAT`) are **DTC/D2C**. Do not
  silently default. If the dataspace is already named, honor it and restate audience + API name;
  otherwise ask and wait. Then load the matching YAML from [../../reference/dataModel-index.yaml](../../reference/dataModel-index.yaml).
  Ambiguous audience → **ask**. Never mix models. `PRD_PAT` is empty and `default` is not
  segmentable — stop, don't improvise.
- **Use the chosen dataspace on every op.** Pass it on each query and segment build. Do not silently
  query another dataspace.
- **Patient health data is counts-only.** In the DTC model, BrandProfile health attributes (disease
  state, diagnosis date, therapy, medication, pregnancy) may be filtered on but never returned.
- **Einstein is out.** If asked to use Einstein counts for speed, decline and explain it invalidates the POC.
- **Refresh-timing gate.** Always capture and report both timestamps; never compare across different refresh windows.
- **No unbounded reads.** Return counts and definitions, not raw HCP/patient/PII rows. Never `SELECT *` on people tables for a count ask.
- **Segment SQL ≠ count SQL.** A segment's inclusion criteria return the **list of SegmentOn PKs** (the membership), not a number: project the **SegmentOn profile PK** (**plus its key qualifier if the PK has one** — e.g. `ssot__Individual__dlm` requires `KQ_Id__c` alongside `ssot__Id__c`) — no aggregation, no `DISTINCT`, no `SELECT *`, no aliases, no `CASE`; fully-qualified columns; joins only on declared relationship keys; subqueries only in `WHERE` (one column). Never submit a `COUNT(DISTINCT …)` query as a segment. See [../../reference/creating-segments.md](../../reference/creating-segments.md).
- **D2C / patient segments — ask CIA, then nest only if yes.** Before Brand Profile, consent,
  engagement, or any other DMO, ask: *Include CIA Consumer Marketable Email as the first membership
  filter?* If **yes**, nest via Segment Membership Latest DMO
  (`DTC_UnifiedIndividualDtc_SM_1780343389__dlm`). If **no**, omit CIA. Always SegmentOn
  `DTC_UnifiedIndividualDtc__dlm`. See Recipe B *CIA Consumer Marketable Email base*.
- **Every segment publish uses lookback `P2Y`.** Create and update with `lookbackPeriod: "P2Y"`.
  Never publish with `P90D`, `P3Y`, or any other window. Date filters in SQL (e.g. 36 months) stay
  as written; the segment lookback metadata is still `P2Y`.
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
6. Map the DMO to its Snowflake stream table → run (or request) the source count → report in the
   **required dual-report table**:

   ```text
   | Source | Count | Reference |
   | --- | --- | --- |
   | Data 360 | 12,431 | Dataspace Development · DMO <api_name> · refreshed <ts> |
   | Snowflake source | 12,290 | DATABASE.SCHEMA.TABLE · stream <stream_name> |

   Delta: 141 (1.1%)
   ```

7. Prompt/run the formal OCL/Snowflake benchmark if required for the **"validated"** label → delta
   within 2–5%, same refresh window → **validated**.

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
