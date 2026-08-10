# Demo UI — use case → count outcome

Lightweight browser UI for POC demos. Pick a Stage preset (or type a prompt) and
see the **dual-report** outcome shape:

- **Data 360 count**
- **Snowflake source count** (table + stream)

## Open it

From this folder:

```bash
# any static server, e.g.
npx --yes serve .
# or open index.html directly in a browser
```

Then open the URL shown (or `index.html`).

## Create segment (Recipe B)

After a count, the demo UI can prepare a **membership** segment definition
(SegmentOn PK SQL + Skill create prompt). See
[create-segment-from-count.md](../usecase-prompts/create-segment-from-count.md).

- **Dev / Prod email** prompts: **creatable** (UnifiedIndividual path populated).
- **Stage D360 and Snowflake count** (HQ / IQVIA): **draft only** until profile DMOs load
  (counts still work; published members = 0 today).

Paste the Skill create prompt into Cursor with the governed Skill + `data360` MCP to create
in Data 360 — the browser does not call create APIs directly.

## Read segment count and activation status

Use **Existing segment — count & activation status**:

1. Select dataspace.
2. Enter the exact segment API/developer name.
3. Copy the generated agent prompt into Cursor.

The governed Skill reads the segment definition, evaluated member count, publication status, and
activation bindings. **Published** and **activated** are reported separately; an ACTIVE target does
not prove that the segment is activated. The read flow never returns member IDs or PII.

## Where the numbers come from

`counts.json` holds a **live Data 360 snapshot** (COUNT(DISTINCT IndividualId__c), no PII) pulled
through the `data360` MCP server. The page loads it on start and shows the refresh timestamp.
To update, ask the agent to re-run the counts and rewrite `counts.json`.

Opened over `file://`, the fetch is blocked and the page falls back to the same numbers embedded
in `app.js`.

## What it does / does not

| Does | Does not |
| --- | --- |
| Show live D360 counts per prompt (Dev / Stage / Prod) | Query Data 360 from the browser |
| FAQ prompts tagged Dev / Stage / Prod (count-ready only) | Run Snowflake SQL |
| Map each DMO to its Snowflake stream source | Replace the governed Skill |
| Copy / load prompt for Cursor | |

For live counts: **Copy prompt** → paste into Cursor with the Skill + `data360` MCP.
Snowflake parity steps: [../validation/d360-vs-snowflake-stream.md](../validation/d360-vs-snowflake-stream.md).
