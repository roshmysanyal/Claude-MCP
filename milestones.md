# Project Milestones & Progress Tracker

Single place to track POC progress against the phases in the [README](README.md). Update the
**status** and **date** columns as work lands. This is the running record for standups and the
Phase-3 readout.

**Status legend:** ☐ not started · ◐ in progress · ☑ done · ⊘ blocked · — n/a

> **Environment:** this POC runs against the **Customer Staging Sandbox** org. Nothing is "done" until
> it's proven against that org — we are starting from scratch.

---

## Current status snapshot (as of `2026-07-22`)

| Area | Where | Status |
|---|---|---|
| Salesforce provisioning (Staging Sandbox) | [setup/00](setup/00-salesforce-provisioning.md) | ☐ not started |
| Hosted Data 360 server activated + client connected (per-user OAuth) | [setup/01](setup/01-activate-mcp-server.md), [setup/03](setup/03-connect-claude.md) | ☐ not started |
| Connectivity proven (facade `search → payload_examples → execute`, live count) | Staging Sandbox | ☐ not started |
| Semantic layer verified against the sandbox (`VERIFY → verified`) | [dataModel.yaml](reference/dataModel.yaml) | ☐ not started |
| OCL/Snowflake benchmark locked | [validation/](validation/) | ☐ not started |
| Pull validated vs OCL/Snowflake | Phase 1 | ☐ not started |
| Push (rebuild + activate) validated | Phase 2 | ☐ not started |

---

## Connectivity (Phase 0)

**Goal:** org provisioned and tooling connected — ready to run.

- Provision the Staging Sandbox and activate the hosted Data 360 MCP server (per-user OAuth)
- Connect Claude/Cursor and install the governed Skill
- Prove connectivity against the sandbox

**Exit gate:** connected to the sandbox with connectivity proven. → ☐

---

## D360 Queries (Phase 1)

**Goal:** Claude returns a Data 360 count from plain English.

- Run the Pull prompt via the Skill
- Capture the D360 count and data-stream refresh timestamp

**Exit gate:** D360 count returned from plain English. → ☐

---

## OCL/Snowflake Queries (Phase 1)

**Goal:** benchmark the D360 count against OCL/Snowflake within threshold.

- Run the OCL/Snowflake benchmark and capture the count
- Compare (refresh window first, then delta) and iterate until within threshold, or document why not

**Exit gate:** D360 count within threshold of OCL/Snowflake, documented. → ☐

---

## Push Validation (Phase 2)

**Goal:** rebuild the reference segment from plain English and activate it to SFMC.

- Read the reference segment, then rebuild an equivalent one from the description alone
- Recount and confirm equivalence vs OCL/Snowflake
- Activate to the existing SFMC target and confirm receipt

**Exit gate:** count match · segment equivalence · SFMC receipt. → ☐

---

## Readout (Phase 3)

**Goal:** package the proof for leadership.

- Document the end-to-end workflow with screenshots and a screen-share walkthrough
- Log blockers and resolutions
- Produce the one-pager (proved / next steps)

**Exit gate:** readout one-pager complete + walkthrough recorded. → ☐

---

## Blockers / risks log

| Date | Blocker / risk | Impact | Owner | Resolution / status |
|---|---|---|---|---|
| 2026-07-22 | Staging Sandbox access + provisioning not yet in place | Blocks all Phase 0 work until the org is provisioned | DC Architect | Pending — Phase 0.1 |
| | | | | |

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-22 | Use the Data 360 MCP facade (`search`/`payload_examples`/`execute`), not a custom query server | Supported three-tool facade over the full Data 360 Connect API; same facade whether self-hosted or hosted |
| 2026-07-22 | Use the **hosted** Data 360 MCP server with **per-user** OAuth 2.0 + PKCE (superseded earlier client-credentials service-user plan) | Native per-user identity + FLS/sharing + audit; fully managed; aligns with Salesforce MCP security guidance. Trade-off: each user needs a Data 360 license + permission set |
| 2026-07-22 | Data Space + FLS/masking = optional/future, not required for the POC | Per-user FLS/sharing apply natively; unneeded PII simply left off the permission set |
| 2026-07-22 | POC runs from a **local copy** of the governed skill + semantic layer; recommend the customer host it in **their own repo** for operational rollout (see [scaling-via-repo.md](scaling-via-repo.md)) | A local copy is enough to prove the end-to-end workflow with a small team; git-based distribution is how one update reaches every user without drift once it scales, and it keeps the contract tool-agnostic (Cursor/Claude/Gemini/next) |
| 2026-07-22 | POC uses **one shared *named* user** (not per-user) + the **standard "Data Cloud Marketing Manager"** permission set (not a scoped custom set). Production posture stays **per-user + scoped least-privilege**. See [setup/poc-org-setup-today.md](setup/poc-org-setup-today.md) | Speed/ease for a short POC: a shared named user still uses the normal OAuth Auth-Code + PKCE login (not a client-credentials service account), so no architecture change; the standard perm set covers Pull + Push with no custom build. Trade-offs accepted for POC: audit attributes all activity to one user; broader-than-least-privilege access |
| 2026-07-27 | Add a **self-improvement session log** ([feedback/](feedback/)): the agent captures friction (repeated clarifications, failures, gaps, workarounds) to a notebook; the **skill owner** reviews and makes the one canonical skill edit. Toggle in `SKILL.md`: **`self-tune`** during Phase 0 build (agent may propose edits via PR), **`log-only`** default in production (log only). | Lets the skill self-improve during the POC and keep improving in users' hands, **without** each machine drifting to a different skill version — improvements ship through the same one-canonical-copy repo loop as `dataModel.yaml` ([scaling-via-repo.md](scaling-via-repo.md)) |
| | | |
