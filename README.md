# Customer POC — Claude + Data 360 Segment Use Case (Runbook)

**Version 1.0 · Runbook for the Claude + Data 360 Segment Use Case POC.**

This folder is a self-contained, top-to-bottom guide to execute the POC live. It uses the
**Salesforce-hosted [Data 360 MCP Server](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/data360-mcp.html)**
(per-user OAuth, fully managed) as the primary integration path (with the `sf` CLI as a start-now
fallback) and a Snowflake harness to validate counts against OCL/Snowflake.

---

## The POC in three sentences

1. A customer marketer types a plain-English question into Claude and gets a **verified HCP segment count** from Salesforce **Data 360** — no Salesforce login, no SQL, no analyst in the loop.
2. Claude then reads an existing reference segment, describes it in plain English, and **rebuilds an equivalent segment** from that description alone, then **activates it to SFMC**.
3. Every count is validated against **OCL/Snowflake** — the customer's source of truth.

---

## Hard constraints (do not violate)

These are non-negotiable:

| Constraint | Why |
|---|---|
| **OCL/Snowflake is the count source of truth — not Einstein.** Einstein Segment Creation counts do not match OCL/Snowflake and are ruled out. | Validity of the entire proof. Any Einstein count invalidates the POC. |
| **Claude runs on AWS Bedrock**, per Salesforce policy — not claude.ai directly. | Enterprise/compliance policy. |
| **A named governance owner must be confirmed before Phase 1.** No POC against production data until governance is signed off. | Customer HCP/PII compliance. |
| **Count match = exact, or within an agreed 2–5% delta** accounting for refresh timing. Threshold locked before Day 1. | Prevents refresh-timing mismatches being misread as failures. |
| **Success = all three:** (1) count match, (2) segment equivalence, (3) SFMC activation receipt. | The definition of a passing POC. |
| **Skill `.md` files + the semantic layer are the governance surface** — version-controlled, scope-limited to the authorized HCP objects/fields, reviewed before deployment. Any brand may be queried within that entity model. | Auditable, bounded data access. |

---

## Prerequisites checklist (Salesforce team — before Day 1)

Pre-development checklist. Fill in owners/values before kickoff.

- [ ] `sf` CLI access to the customer production D360 org **or** a Salesforce-managed sandbox — org ID: `__________` (owner: Salesforce Data Cloud Architect, confirm 5 business days before Day 1)
- [ ] Hosted **Data 360 MCP server activated** in Setup + **External Client App** created (or interim `sf` CLI path chosen) — see [setup/](setup/)
- [ ] Claude environment = **AWS Bedrock-hosted** confirmed (not claude.ai)
- [ ] Reference segment identified — segment ID/name: `__________` (owner: Customer team)
- [ ] OCL/Snowflake benchmark query locked — see [validation/ocl-benchmark.sql](skill/d360-segments-activations/validation/ocl-benchmark.sql) (owner: Data Cloud Architect)
- [ ] Success-criteria threshold agreed — exact match or `__%` delta (target 2–5%)
- [ ] Named **governance owner** confirmed: `__________` (owner: Customer IT)
- [ ] HCP/PII compliance posture for MCP data transit confirmed (owner: Customer Compliance)
- [ ] Authorized Claude users documented: `__________`

---

## Phase 0 — Pre-POC Setup (Days 1–5)

1. **Provision the Salesforce org** → [setup/00-salesforce-provisioning.md](setup/00-salesforce-provisioning.md) — the consolidated "what to create in Salesforce" checklist (activate the hosted Data 360 server, External Client App for per-user OAuth, per-user Data 360 license + permission set) + the existing inputs to confirm.
2. **Activate the hosted Data 360 MCP server** → [setup/01-activate-mcp-server.md](setup/01-activate-mcp-server.md)
3. **Set up authentication (External Client App + per-user OAuth)** → [setup/02-auth-setup.md](setup/02-auth-setup.md)
4. **Connect your client (Cursor / Claude on Bedrock)** → [setup/03-connect-claude.md](setup/03-connect-claude.md)
5. **Install the governed Skill** → copy [skill/d360-segments-activations/](skill/d360-segments-activations/) into your Claude skills directory; have the governance owner review it.
6. **Confirm connectivity:** in Claude, ask it to run the MCP `search` tool for `"segment"` and `"query"` — you should get back Data 360 operation names. This proves the server is wired up.
7. **Verify the semantic layer** → confirm the DMO/field/join model [reference/dataModel.yaml](skill/d360-segments-activations/reference/dataModel.yaml) against the live org and flip every `VERIFY` to `verified`, per [reference/before-using-and-on-data-model-changes.md](skill/d360-segments-activations/reference/before-using-and-on-data-model-changes.md) (owner: Data Cloud Architect). This is how Claude knows which objects/fields/joins to use.
8. **Lock the reference segment, the OCL/Snowflake query, the success threshold, and the governance owner** (checklist above).

> **Track progress** against these phases in [milestones.md](milestones.md).

**Exit gate:** governance owner confirmed + connectivity proven + semantic layer verified + success criteria documented. Do not proceed otherwise.

---

## Phase 1 — Pull Validation (Days 6–10)

Goal: prove Claude can return a Data 360 count from plain English, and that it matches OCL/Snowflake.

1. Open Claude (Bedrock) with the Skill enabled and the `data360` MCP server connected.
2. Run the Pull prompt from [prompts/example-prompts.md](prompts/example-prompts.md):
   > *"How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60 days?"*
3. The Skill drives the facade tools: `search` → `payload_examples` → `execute` (Query family, SQL/QueryV2) and returns **the count only**.
4. **Capture the D360 data-stream last-refresh timestamp** (the Skill will report it; if not, pull from the org).
5. Independently run the OCL/Snowflake benchmark → [validation/run-benchmark.md](skill/d360-segments-activations/validation/run-benchmark.md) using [validation/ocl-benchmark.sql](skill/d360-segments-activations/validation/ocl-benchmark.sql). Capture the Snowflake snapshot timestamp.
6. **Compare** → [validation/compare-counts.md](skill/d360-segments-activations/validation/compare-counts.md). Both timestamps must be in the same refresh window. If the delta exceeds the agreed threshold, **do not present the number** — investigate or wait for the next refresh.
7. Iterate the query logic until counts match (or document why they can't).

**Exit gate:** Pull count within threshold of OCL/Snowflake, with matched refresh windows, documented.

---

## Phase 2 — Push Validation (Days 11–18)

Goal: rebuild the reference segment from plain English and activate it to SFMC.

1. Point Claude at the **reference segment**. Ask it to read the segment and **describe its logic in plain English** (Skill's Push recipe, step 1).
2. Using **only that plain-English description** as input, prompt Claude to **rebuild an equivalent segment** via the Segment family (`payload_examples` → `execute`, create + publish). Do not paste the original filters back in — the rebuild must come from the description.
3. Run the rebuilt segment and **pull its count**.
4. **Validate the rebuilt count against the OCL/Snowflake benchmark** (same procedure as Phase 1).
5. Confirm **segment equivalence** — the rebuilt segment includes the same filters as the reference (validated by the customer team).
6. Wire the rebuilt segment to the **live SFMC activation target** and **trigger activation** via the Activation family (`execute`).
7. **Confirm SFMC receipt** of the activation.

**Exit gate:** all three success criteria met — count match, segment equivalence, SFMC activation receipt.

---

## Phase 3 — Readout & Documentation (Days 19–21)

Use [readout/readout-template.md](readout/readout-template.md):

1. Document the full workflow end-to-end with screenshots.
2. Record a screen-share walkthrough for the leadership presentation.
3. Capture the delta between prompt-built vs. manually-built segment (differences + why).
4. Note blockers and resolutions.
5. Produce the one-pager: what was proved, what comes next.

---

## Fallback: `sf` CLI interim path (start today, no MCP server needed)

The POC can begin now via `sf` CLI wrapped in a Claude Skill, before/without the
MCP server. If the hosted Data 360 MCP server isn't yet enabled, the same phases hold — only the tool changes:

- Replace the `search` → `payload_examples` → `execute` facade calls with `sf data ...` / `sf api request rest ...` commands against the D360 Connect API (add `--allow-non-ga-tools` for any Developer Preview commands).
- The Skill in [skill/d360-segments-activations/](skill/d360-segments-activations/) documents both tool surfaces; keep the recipes and guardrails identical.
- OCL/Snowflake validation, thresholds, and success criteria are **unchanged**.

The MCP server is the preferred path (built-in compliance controls, audit trails, governance hooks). Lead with it; fall back only if blocked.

---

## Folder map

```
customer-d360-poc/
├── README.md                    ← you are here
├── milestones.md                ← progress tracker (phases, status, blockers, decisions)
├── scaling-via-repo.md          ← PROPOSED: how one skill/semantic-layer update reaches every user (tool-agnostic)
├── setup/                       ← 00 provision Salesforce · 01 install · 02 auth · 03 connect Claude
├── skill/d360-segments-activations/  ← the governed Claude Skill (SKILL.md)
├── reference/                   ← semantic layer: DMO/field/join model (dataModel.yaml) + how-to-use / verify docs
├── prompts/                     ← example marketer prompts
├── validation/                  ← OCL/Snowflake benchmark + compare procedure
├── feedback/                    ← self-improvement: session friction log → owner-reviewed skill changes (no per-machine forks)
└── readout/                     ← Phase 3 one-pager template
```

### Open items to fill before running against production
- Exact OCL/Snowflake view / Snowflake query name → **Salesforce Data Cloud Architect**
- Semantic-layer verification: confirm every `VERIFY` DMO/field/join in [reference/dataModel.yaml](skill/d360-segments-activations/reference/dataModel.yaml) → **Salesforce Data Cloud Architect**
- Reference segment ID → **Customer team**
- Named governance owner + authorized users → **Customer IT**
