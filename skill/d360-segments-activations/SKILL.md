---
name: d360-segments-activations
role: Marketer
description: >-
  Query and build Salesforce Data 360 doctor (HCP) and patient/consumer segments
  from everyday language. Count asks use COUNT.md only. Create/update uses
  CREATE.md; status uses STATUS.md; publish/activate uses PUBLISH.md. Patients
  auto-route to DTC; doctors to STG_US unless they name another space. Always ask
  CIA before nesting on patient creates; every publish uses lookbackPeriod P2Y.
---

# Data 360 Segment POC (recipe index)

**Do not read this whole file to run a task.** Open one recipe:

| Ask | File |
| --- | --- |
| How many doctors / patients | **[COUNT.md](COUNT.md)** only — plus the YAML slice it names |
| Build / update a segment | **[CREATE.md](CREATE.md)** |
| List / read / member count / published / activated | **[STATUS.md](STATUS.md)** |
| Publish / republish / activate | **[PUBLISH.md](PUBLISH.md)** |
| ZIP / miles | [reference/zip-radius.md](reference/zip-radius.md) |

Persona: **Marketer**. Everyday language (*doctors*, *patients*). Query **Data 360 only**.
Doctors → `STG_US`. Patients → `DTC`. Another space only if they name it (*in Prod*).
Names on create end with `test`. Lookback **P2Y**. No PII in answers.

Full DMO catalogs (not for first-ask counts): [reference/dataModel-index.yaml](reference/dataModel-index.yaml).

---

## Discovery mode (governance toggle)

- **`strict`** (default): use only `verified` DMOs/fields/joins in the routed model. Do not run metadata discovery. Missing concept → stop and ask a human.
- **`propose`** (authoring only): read-only metadata may add a `VERIFY` proposal to the routed YAML.

**Current mode:** `<strict | propose>` — set by the governance owner before deployment.

---

## Self-improvement logging (governance toggle)

Capture friction to [feedback/session-log.md](feedback/session-log.md) (no PII). Never fork the skill locally.

- **`log-only`** (default): append to the session log only. Do not edit this skill or the data models.
- **`self-tune`** (Phase 0 only): propose edits via PR into the shared repo.

**Current mode:** `<log-only | self-tune>` — set by the skill owner before deployment.

---

## Facade-tool protocol

**Counts:** `execute` `d360_query_sql` per [COUNT.md](COUNT.md). Skip `search` / `payload_examples` unless execute fails.

**Create / update / publish / activate / status:** `search` → `payload_examples` → `execute`. Never guess an operation name or payload.

---

## Guardrails (pointer)

PII-safe counts, English-then-Query on Stage, no Snowflake in the answer, no segment link on a count,
Email/SMS after a count, CIA ask on patient create, P2Y publish, confirm before writes — live in
[COUNT.md](COUNT.md), [CREATE.md](CREATE.md), [STATUS.md](STATUS.md), and [PUBLISH.md](PUBLISH.md).
Do not load those files unless the current ask needs that recipe.
