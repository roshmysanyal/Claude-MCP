# Setup 01 — Enable the Hosted Data 360 MCP Server

This POC uses the **Salesforce-hosted Data 360 MCP Server** (`data/data-360-mcp`) — a
Salesforce-managed endpoint, GA since April 2026. There is **nothing to install or run locally**: no
JAR, no Java, no local process. You *activate* the server in Setup and connect your client to its URL.

> **Why hosted (not the self-hosted JAR):** Salesforce hosts and scales it, and — critically — it
> enforces **per-user** OAuth 2.0 + PKCE with native field-level security, object permissions, and
> sharing on every call. That's the per-user identity + audit model this POC wants. The self-hosted
> `forcedotcom/d360-mcp-server` preview (single-principal, local JAR) is the same facade but without
> per-user identity; we've moved past it.

It exposes the **same three facade tools** — `search`, `payload_examples`, `execute` — over the full
Data 360 Connect API (Query, Segment, Activation, DLO/DMO, Data Streams, Transforms, Calculated
Insights, Dataspaces, and more), so the governed Skill's tool protocol is unchanged.

## Prerequisites

- A **Data 360 license** enabled in the org (Staging Sandbox for this POC).
- **Enterprise Edition or above** (hosted MCP servers requirement).
- Per-user **Data 360 permissions** for each person who will use it (see
  [00-salesforce-provisioning.md](00-salesforce-provisioning.md)) — "View Data 360" for queries;
  segment/activation permissions for Push.
- An MCP client that supports OAuth 2.0 Authorization Code + PKCE (Cursor, Claude, Postman).

---

## Activate the server in Setup

1. In **Setup**, search **MCP Servers**.
2. Open the **Salesforce Servers** tab.
3. Click **Data 360** (the full Connect API server — *not* "Data 360 Legacy", which is query-only).
4. Click **Activate**. Standard servers are inactive by default.
5. **Copy the Server URL** and the **API Name** (without the `platform.` prefix) — you'll need the URL
   when connecting the client.

**Server URL** (confirm the exact value from Setup — it should match):

- **Sandbox / scratch (this POC):** `https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp`
- **Production:** `https://api.salesforce.com/platform/mcp/v1/data/data-360-mcp`

> **Data 360 Legacy vs. Data 360.** Setup also lists a **Data 360 Legacy** server
> (`data/data-cloud-queries`) that is **query-only** (`post_dc_query_sql`). This POC needs Pull **and**
> Push (segments + activation), so we use the full **Data 360** server. Its own docs confirm: *"for
> full Connect API access (segments, activations, data streams, transforms), use the Data 360 MCP
> Server."*

---

## Next

- **Authentication (External Client App + OAuth):** [02-auth-setup.md](02-auth-setup.md)
- **Connect your client (Cursor / Claude):** [03-connect-claude.md](03-connect-claude.md)
