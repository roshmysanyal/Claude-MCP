# CoCo — demo UI

Lightweight browser UI for POC demos. Two things only:

- **Dataspace** filter — DEV-US (HCP), STG-US (HCP), PRD-US (HCP), DTC (Patient), or All.
- **FAQs** — pullable use cases, i.e. natural-language questions whose live Data 360
  count is greater than zero. Each one expands to show the count, the backing DMO and the
  filters, with **Run use case** and **Copy prompt** buttons.

**Run use case** renders the dual report inline: the Data 360 count from the latest
agent-refreshed snapshot, plus the Snowflake source table and stream for that DMO marked
**PENDING** (the browser cannot reach the warehouse) or **N/A** for CRM-sourced DMOs. To tally
the Snowflake side, or to re-query Data 360 live, copy the prompt into Cursor and run it with
the governed Skill.

> **Note:** Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.  
> Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md). Copied FAQ prompts name **dataspace + populated DMO** so Cursor skips clarifying questions.

## Open it

Serve the folder (do not open `index.html` over `file://`, or the `counts.json` fetch is
blocked and the page silently falls back to the copies embedded in `app.js`):

```bash
py -m http.server 3000
# or, with Node installed
npx --yes serve .
```

Then open <http://localhost:3000/>.

## Where the numbers come from

`counts.json` holds a **live Data 360 snapshot** (`COUNT(DISTINCT …)`, no PII) pulled through
the `data360` MCP server. The page loads it on start and shows the refresh timestamp. To update,
ask the agent to re-run the counts and rewrite `counts.json`. Prompts whose count is zero are
filtered out of the FAQ list automatically.

## What it does / does not

| Does | Does not |
| --- | --- |
| Show live D360 counts per pullable use case | Query Data 360 or Snowflake from the browser |
| Group FAQs by dataspace and filter them | Create or activate segments |
| Map each use case to its backing DMO | Replace the governed Skill |
| Copy a prompt for Cursor | |

For live counts and segment creation: **Copy prompt** → paste into Cursor with the governed
Skill + `data360` MCP. D2C create prompts nest **CIA Consumer Marketable Email** first, then the
brand / consent DMOs.

Related references:

- Segment SQL and create flow: [../usecase-prompts/create-segment-from-count.md](../usecase-prompts/create-segment-from-count.md)
- Stage dual-validation segments: [../usecase-prompts/demo-segments-d360-snowflake.md](../usecase-prompts/demo-segments-d360-snowflake.md)
- Snowflake parity steps: [../validation/d360-vs-snowflake-stream.md](../validation/d360-vs-snowflake-stream.md)
- Prompt catalog: [../prompts/example-prompts.md](../prompts/example-prompts.md)
- Chat starters: [../prompts/chat-starters.md](../prompts/chat-starters.md)
