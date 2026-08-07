# POC Readout — Claude + Data 360 Segment Use Case (One-Pager)

**Date:** `__________`  ·  **Environment:** ☐ Salesforce-managed sandbox ☐ Customer production D360
**Presenter:** `__________`  ·  **Governance owner:** `__________`

---

## What we proved

_A marketer typed a plain-English question into Claude and received a verified HCP segment count
from Data 360 — no Salesforce login, no SQL, no analyst — then rebuilt and activated an equivalent
segment to SFMC._

- **Pull:** ☐ proved  — Claude returned a Data 360 count from the prompt below.
- **Push:** ☐ proved  — Claude rebuilt the reference segment from plain English and activated it.
- **Validation:** ☐ counts matched OCL/Snowflake within threshold.

---

## Success criteria (all three required)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | **Count match** — D360 vs OCL/Snowflake within agreed threshold (____%) | ☐ Pass ☐ Fail | compare-counts record |
| 2 | **Segment equivalence** — rebuilt filters match reference (customer team validated) | ☐ Pass ☐ Fail | filter side-by-side |
| 3 | **SFMC activation receipt** — activation trigger delivered to SFMC | ☐ Pass ☐ Fail | SFMC confirmation |

**Overall verdict:** ☐ Successful POC (all three) ☐ Partial ☐ Not met

---

## Numbers

| Metric | Value |
|---|---|
| Pull prompt used | *"How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60 days?"* |
| D360 count (Pull) | |
| OCL/Snowflake benchmark count | |
| Delta % | |
| D360 refresh timestamp | |
| OCL/Snowflake snapshot timestamp | |
| Rebuilt segment count | |
| Rebuilt vs OCL/Snowflake delta % | |

---

## Prompt-built vs. manually-built segment

| Aspect | Reference (manual) | Rebuilt (from prompt) | Match? | Notes |
|---|---|---|---|---|
| Filter 1 | | | ☐ | |
| Filter 2 | | | ☐ | |
| Filter 3 | | | ☐ | |
| Count | | | ☐ | |

_Explain any differences and why (e.g. filter semantics, refresh timing)._

---

## Evidence / screenshot checklist

- [ ] Claude connected to `data360` MCP server (`/mcp` or tools panel)
- [ ] Pull prompt + returned count (Claude UI)
- [ ] OCL/Snowflake benchmark query result + snapshot timestamp
- [ ] Compare-counts record (delta within threshold, same refresh window)
- [ ] Claude's plain-English description of the reference segment
- [ ] Rebuilt segment definition in Data 360
- [ ] Rebuilt segment count
- [ ] Activation wired to the SFMC target + trigger
- [ ] SFMC receipt confirmation
- [ ] Screen-share walkthrough recording (link: `__________`)

---

## Blockers encountered & resolutions

| Blocker | Impact | Resolution |
|---|---|---|
| | | |

---

## What comes next

The Claude ↔ MCP ↔ Data 360 pattern proven here is the same one that underpins future use cases —
paid-media optimization, agentic journey decisioning, next-best-action, automated suppression.
Recommended next steps:

1. `__________`
2. `__________`
3. `__________`
