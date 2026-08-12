# AGENTS.md

## Cursor Cloud specific instructions

This repo is primarily a **documentation / runbook** for the Claude + Salesforce Data 360
segment POC. The only runnable "application" is the **`demo-ui/` static site (CoCo)**.

### What runs
- **CoCo demo UI** (`demo-ui/`): plain static HTML/CSS/JS — no framework, no build step,
  no bundler. Serve the folder over HTTP and open it in a browser. Standard serve commands are
  in [`demo-ui/README.md`](demo-ui/README.md) (e.g. `python3 -m http.server 3000` from
  `demo-ui/`, then open `http://localhost:3000/`).

### Non-obvious caveats
- **Serve over HTTP; do not open `index.html` via `file://`.** Over `file://` the
  `counts.json` fetch is blocked and the page silently falls back to the `DEFAULT_COUNTS`
  copies embedded in `demo-ui/app.js`, so you may not notice you are seeing stale numbers.
- **No dependencies to install, no build, no automated tests, and no lint config** exist in
  this repo. Python 3 and Node are both preinstalled and either can serve the static site;
  there is nothing to `npm install` / `pip install`. The startup update script is intentionally
  a no-op.
- **The counts are a static snapshot.** `demo-ui/counts.json` holds a Data 360 count snapshot
  (`refreshedAt` + per-use-case counts). The browser does **not** query Data 360 or Snowflake;
  the Snowflake side shows PENDING/N/A. To refresh, an agent re-runs counts via the `data360`
  MCP and rewrites `counts.json`.
- **The MCP servers referenced here (Data 360, Snowflake, Atlassian) are external hosted
  services** requiring per-user OAuth / PAT auth (see `setup/` and `.mcp.json`). They are not
  local processes and cannot be reached from the demo UI browser.
