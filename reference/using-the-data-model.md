# Using the Data Model

The **semantic layer** turns a plain-English request ("HCPs who wrote an Rx for `<brand>` in Utah")
into a correct Data 360 query. It holds both halves of what the raw schema can't tell you in one
place: *which DMOs/fields do I use* (field metadata) and *how do I join them* (relationships).

Without it, the agent would guess field and join names — and in the Data 360 SSOT model an
`...Id` suffix does **not** imply a foreign key, and real relationships often live on fields with no
`Id` in the name at all. Guessing produces confident-but-wrong joins and silent double-counting.
**Build every query from these files, never from field-name inference.**

### Routing — one model per dataspace (decide this first)

Full catalog: [dataModel-index.yaml](dataModel-index.yaml).

| Default audience | Load | Dataspace |
|---|---|---|
| **HCPs** | [dataModel-dev.yaml](dataModel-dev.yaml) | `Development` / DEV-US |
| **Patients** | [dataModel-dtc.yaml](dataModel-dtc.yaml) | `DTC` |

| Explicit dataspace | File |
|---|---|
| `Development` | [dataModel-dev.yaml](dataModel-dev.yaml) |
| `DTC` | [dataModel-dtc.yaml](dataModel-dtc.yaml) |
| `PRD_US` | [dataModel-prd-us.yaml](dataModel-prd-us.yaml) |
| `STG_US` | [dataModel-stg-us.yaml](dataModel-stg-us.yaml) |
| `DEV_PAT` | [dataModel-dev-pat.yaml](dataModel-dev-pat.yaml) |
| `PRD_PAT` | [dataModel-prd-pat.yaml](dataModel-prd-pat.yaml) (empty — stop) |
| `LAB` | [dataModel-lab.yaml](dataModel-lab.yaml) |
| `default` | [dataModel-default.yaml](dataModel-default.yaml) (inventory only) |

- **Decide the audience (or honor an explicit dataspace) before mapping**, and state the routing.
- **Ambiguous audience → ask.** Don't guess.
- **Never mix models / dataspaces.** No cross joins; no borrowed field names or literals.
- **`PRD_PAT` is empty** of profile DMOs; **`default`** Individual is not segmentable — stop rather
  than improvising.

### Dataspace (confirm before every query / segment)

- Read `defaults.dataspace` / `defaults.dataspace_label` and each entity's `dataspace` /
  `dataspace_label` in the **routed** file.
- Pass that dataspace on Query SQL (`d360_query_sql`) and on segment create/publish/activate.
- When confirming filters with the user, also confirm the routed model and dataspace.

---

## What the file gives you

| Block | What it is | Why it matters |
|---|---|---|
| `defaults` | Dialect, **dataspace**, dataspace_label, default anchor | Which Data 360 dataspace to pass on every query/segment op |
| `entities` | Each DMO + its fields: business `label`, real `api_name`, `type`, `pii` flag, `desc`, `sampleValues`, `grain`, `count_key`/`primary_key`, **`dataspace` / `dataspace_label`** | The object/field to filter on, its **marketer-facing name** (`label`), its data type, whether it's PII, example stored values, what one row means, and **which dataspace hosts the DMO** |
| `relationships` | Directional edges with `from_key`/`to_key` and `cardinality` | The **only** sanctioned join keys; cardinality drives fan-out handling |
| `paths` | Named multi-hop join chains (with `dedupe_on`) | Reusable traversals so you don't re-derive joins |
| `journeys` | Worked NL→SQL examples | Copy-adaptable templates for the common asks |
| `reference_segments` | Live CIA segment patterns (opt-in + brand includeCriteria) | Real literals and join shapes harvested from the org |

Field metadata (`api_name`, `type`, `primary_key`) is verifiable from the org via the MCP metadata
query; relationships, cardinality, `pii` flags, `desc`, and `sampleValues` are human-curated (real
literals for `sampleValues` can be harvested from a segment's `includeCriteria`). Both are marked
with `status:` — see below.

**Observed values are logged separately.** As the agent runs queries it records the real non-PII
values it *sees* (and the concepts it was asked for but found empty) in
[observed-values.md](observed-values.md) — a query-time notebook, stamped with org + date. That's a
hint cache, not the governed schema: confirmed observations can be promoted up into this file's
`sampleValues` via the architect loop. When a filter returns 0, profile the field
(`COUNT(*)` + `GROUP BY`) to show what values *are* present rather than reporting a bare zero.

---

## How the agent uses it (map an NL request → query)

0. **Route, then confirm the dataspace.** Pick the model for the audience (HCP → `dataModel-dev.yaml`,
0. **Ask dataspace first for counts.** Before any HCP or patient count, if Dev / Stage / Prod
   (or an explicit dataspace name) was not given, ask and wait — then load that model's YAML
   (patient → `dataModel-dtc.yaml` / HCP Dev → `dataModel-dev.yaml` / Stage → `dataModel-stg-us.yaml`
   / Prod → `dataModel-prd-us.yaml`). Pass the chosen dataspace on every MCP query/segment call.
1. **Pick the anchor.** People counts anchor on `UnifiedIndividual`; the answer is
   `COUNT(DISTINCT <anchor count_key>)`.
2. **Map each concept to an entity/field.** Look up the business concept ("wrote an Rx", "in Utah",
   "opted-in", "website visit") in the `entities` block, read the field's `api_name` and `type`, and
   respect its `pii` flag (PII fields are for filtering only — never returned). Translate the user's
   phrasing to the real stored literal using the field's `sampleValues` where present (e.g. *Utah* →
   `'UT'`). `sampleValues` are illustrative examples, not the full domain — if the user's value
   isn't among them, don't assume it's invalid.
3. **Choose the path.** Find (or assemble from `relationships`) the named `path` that connects the
   anchor to the data being filtered — e.g. `unified_individual_to_nbrx`.
4. **Honor identity resolution.** You **cannot** join the unified profile straight to a source
   record. Every unified↔source traversal routes through the `IdentityLink` DMO
   (`unified_to_identitylink` → `identitylink_to_individual`). The paths already encode this.
5. **Count DISTINCT on the anchor.** Any path with `fan_out: true` has a 1:N hop, so an HCP with 20
   scripts must count **once**. Always `COUNT(DISTINCT UnifiedIndividual.count_key)`.
6. **Apply filters** from the mapped fields and `execute` with the **routed** dataspace.
7. **Return the count only — never PII.** The SQL must project only `COUNT(DISTINCT …)`. Do not
   `SELECT` name, email, phone, address, NPI, DOB, customer ID, or patient health attributes.
   User-facing answers for HCP **and** patient/DTC counts are the number (+ validation metadata),
   not sample people. See the Skill *PII-safe counts* section.
8. **Present in business language.** When you report back to the user, use each entity/field's
   `label` (e.g. *HCP*, *Patient*, *Salutation*) and plain-English counts/criteria — never the raw
   `dmo`/`api_name` or SQL. Keep the technical form for execution and show it only on request. See
   the *Talking to the user* section of the Skill.

### Worked example — "HCPs who have NBRx for `<brand>` in Utah"

- Anchor → `UnifiedIndividual` (`dev_UnifiedIndividualRs1__dlm`)
- "have NBRx" → `NBRxAggregated` via path `unified_individual_to_nbrx`
- "for `<brand>`" → `NBRxAggregated.brand = '<brand>'`
- "in Utah" → `ContactPointAddress.state = 'UT'` — **state lives on the address, not on Individual**
  (confirmed: `dev_Individual__dlm` has no state column). Join the address via
  `unified_individual_to_address` in addition to the NBRx path.
- Count → `COUNT(DISTINCT UnifiedIndividual.count_key)` (`Id__c`)

See the `hcp_wrote_nbrx_by_brand` journey in [dataModel-dev.yaml](dataModel-dev.yaml) for the fully
assembled SQL. **Note:** NBRx + Address have 0 rows in Development at seed (2026-08-06); for a
populated demo use `email_openers_last_90_days`.

### Geographic radius — "HCPs within 100 miles of ZIP 07073"

- **Not** a live lat/long join in D360. Map through `unified_individual_to_address`, then filter
  `PostalCodeId__c` (ZIP5) with a **precomputed** `IN (...)` list of centroids within the radius.
- Method + MetLife worked example: [zip-radius.md](zip-radius.md).

---

## The `status:` field — do not skip it

Every entity, field, and relationship carries a status:

- **`verified`** — confirmed against the live org (metadata query and/or SME). Safe to use.
- **`VERIFY`** — a placeholder. The DMO/field/type/cardinality is a best guess not yet confirmed
  against the org.

A `VERIFY` element does **not** block a count. Still answer the question — just **attach a one-line
note** that the schema mapping is unverified (e.g. *"Note: the WebsiteEngagement stream has 0 rows
in Development, so treat this number as indicative until data lands."*). What a `VERIFY`
element does block is the formal **"validated"** label, which additionally requires the count to
clear the OCL/Snowflake benchmark. So: unverified mapping → answer with a caveat; verified mapping + OCL/Snowflake match
→ validated. See [before-using-and-on-data-model-changes.md](before-using-and-on-data-model-changes.md).

> As of 2026-08-06, Development DMO/field/join keys in [dataModel-dev.yaml](dataModel-dev.yaml) are
> `verified`. Remaining caveats are **empty data streams** (Address, Website, NBRx, Consent) and
> OCL/Snowflake column mapping — not unresolved schema.

---

## When the model doesn't cover the request

If a concept has no entry (a new object, an unmapped field, a join with no declared relationship):

- **Do not invent** a DMO, field, or join key.
- Use the MCP metadata operations to discover the real schema (`search` for
  `"list data model objects"` / `"describe"`), confirm the API names, types, and the join key, then
  **add the entity/field/relationship to `dataModel-dev.yaml`** (as `VERIFY`) so it's governed and
  reusable.
- If it can't be resolved, **stop and tell the user** the concept isn't in the data model rather
  than guessing.

---

## Relationship to the OCL/Snowflake benchmark

The join graph here and the joins in
[../validation/ocl-benchmark.sql](../validation/ocl-benchmark.sql) describe the **same population**
from two sides (Data 360 vs. OCL/Snowflake). Keep them consistent: if you change a join or filter
here, mirror it in the benchmark, or the two counts will diverge for reasons that have nothing to do
with refresh timing.
