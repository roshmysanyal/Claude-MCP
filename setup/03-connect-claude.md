# Setup 03 — Connect Your Client to the Hosted Server

Connect Cursor or Claude to the hosted **Data 360 MCP Server** URL from
[01](01-activate-mcp-server.md), authenticating with the External Client App from
[02](02-auth-setup.md). Connection is over **HTTP with per-user OAuth 2.0 + PKCE** — the client walks
you through a browser login the first time, then reuses the refresh token.

> **Policy:** use the **AWS Bedrock-hosted** Claude, not claude.ai directly — set the
> Bedrock backend in your Claude client's model settings. The MCP connection below is independent of
> the model backend.

You'll need:
- the **Server URL** (sandbox: `https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp`)
- the ECA **Consumer Key** (`CLIENT_ID`)
- the matching **callback URL** registered on the ECA ([02](02-auth-setup.md#callback-urls-by-client))

---

## Cursor

1. **Settings → MCP → New MCP Server** (this opens `mcp.json`).
2. Paste (a ready copy is at [mcp-config.example.json](mcp-config.example.json)):

```json
{
  "mcpServers": {
    "data360": {
      "url": "https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp",
      "auth": {
        "CLIENT_ID": "REPLACE_WITH_ECA_CONSUMER_KEY"
      }
    }
  }
}
```

3. Save. Cursor shows the server as needing authentication — click to **authenticate**, complete the
   Salesforce login/consent in the browser, and it flips to **connected**.
4. Ensure the ECA has Cursor's callback URL (`http://localhost:8787/callback`, and/or
   `cursor://anysphere.cursor-mcp/oauth/callback` for older versions).

> Drop `sandbox/` from the URL for a production org. No secret goes in `mcp.json` — PKCE handles it.

---

## Claude Code

```bash
claude mcp add --transport http salesforce-data-360 \
  https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp \
  --callback-port 38000 \
  --client-id "REPLACE_WITH_ECA_CONSUMER_KEY" \
  --client-secret
```

Paste the ECA Consumer Secret when prompted (only if your ECA requires a secret). Then launch
`claude`, run `/mcp`, select **salesforce-data-360** (marked "needs authentication"), choose
**Authenticate**, and allow access. Claude Code's callback is `http://localhost:38000/callback` —
register it on the ECA.

## Claude Desktop

Add the same server as a **connector** using the Server URL + Consumer Key; its callback URL is
`https://claude.ai/api/mcp/auth_callback`. Restart Claude Desktop after adding.

---

## Verify the connection

1. Confirm `data360` shows **connected** (Cursor: MCP settings/tools icon; Claude Code: `/mcp`). You
   should see exactly three tools: **`search`**, **`payload_examples`**, **`execute`**.
2. Ask:
   > *Use the data360 `search` tool for "query sql" and for "segment", and show me the operation names it returns.*
3. Exercise the pipe end-to-end via the facade: *`search "query sql count"` → `payload_examples` →
   `execute`* for a small `COUNT(DISTINCT …)` against a profile DMO. This confirms per-user auth + the
   facade end-to-end. An **"insufficient access"** error means the *connecting user* needs a
   permission — fix the permission set ([02](02-auth-setup.md#2-per-user-permissions-the-real-access-boundary)),
   not the server.

The server exposes only the **three facade tools** — `search` → `payload_examples` → `execute` — over
the full Data 360 Connect API. The families this POC uses:

- **Query** — `d360_query_sql` for counts **and** empty-result profiling (fill-rate / `GROUP BY` SQL),
  plus metadata/`profile`-query ops to list/describe DMOs. The `profile` ops are the **Profile query
  API** (query the unified profile DMOs), **not** a column data-profiler — profiling is aggregation
  SQL via `d360_query_sql`.
- **Segment** (count / create / publish / list / get / member_list) — Recipe B.
- **Activation** (create / get / list / target) — the SFMC activation step.
- **Dataspace** — optional data-space scoping.

If tools don't appear or auth fails: the usual cause is a **callback-URL mismatch** between the client
and the ECA, a missing **`mcp_api`** or **`refresh_token`** scope, or **PKCE not enabled** on the ECA
(see [02](02-auth-setup.md#1-create-the-external-client-app)). Confirm the **Server URL** matches
Setup (and the `sandbox/` segment is correct for the org).

---

## Install the governed Skill

Copy [../skill/d360-segments-activations/](../skill/d360-segments-activations/) into your client's skills directory so it
follows the POC's authorized scope, semantic-layer mapping, and OCL/Snowflake-validation gate:

- **Claude Code:** `.claude/skills/d360-segments-activations/` (project) or `~/.claude/skills/d360-segments-activations/` (user)
- **Claude Desktop:** the skills location for your install

Have the **governance owner review and approve** `SKILL.md` before use — it is the version-controlled
data-access contract.

---

**Next:** back to the [runbook](../README.md#phase-0--pre-poc-setup-days-15), Phase 0.
