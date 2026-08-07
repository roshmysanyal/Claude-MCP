# Setup 02 — Authentication (per-user OAuth via External Client App)

The hosted **Data 360 MCP Server** authenticates each user with **OAuth 2.0 Authorization Code +
PKCE** through an **External Client App (ECA)**. There is no shared service account and no secret on
anyone's laptop — every call runs as the **connecting user's own Salesforce identity**, and the
server enforces that user's field-level security, object permissions, and sharing rules natively.

> **Connected Apps are not supported** for MCP auth — you must use an **External Client App**.

> **This aligns with Salesforce's own guidance.** Salesforce's
> [How to Secure Salesforce-Hosted MCP Servers](https://developer.salesforce.com/blogs/2026/06/how-to-secure-salesforce-hosted-mcp-servers)
> recommends *"authorization code flow… avoid service accounts… the human remains in the loop."* The
> hosted server is authorization-code + per-user **by design**, so the earlier POC's
> client-credentials service-user deviation is gone — we now follow the recommended model.

> **Trade-off to know:** per-user identity means **every end user must be a provisioned Salesforce /
> Data 360 user** with a license and the right permission set (see
> [00-salesforce-provisioning.md](00-salesforce-provisioning.md)). That's the cost of native per-user
> security + audit, versus a single shared principal.

---

## 1. Create the External Client App

1. **Setup → External Client App Manager → New External Client App.**
2. **Basic Information:** name it recognizably (e.g. `Data360 MCP Client`), add a contact email.
3. Expand **API (Enable OAuth Settings)** → check **Enable OAuth**.
4. **Callback URL(s):** add the callback(s) for the client(s) you'll connect (one per line). See the
   [callback table](#callback-urls-by-client) below.
5. **OAuth scopes — add both:**
   - **Access MCP servers** (`mcp_api`)
   - **Perform requests at any time** (`refresh_token`, `offline_access`)
6. **Security settings:**
   - **Check** *Require Proof Key for Code Exchange (PKCE) extension for Supported Authorization Flows* — **mandatory** for hosted MCP.
   - For public clients (Cursor's native OAuth, Claude direct connector): you may **uncheck** *Require
     secret for Web Server Flow* and *Require secret for Refresh Token Flow*. Keep the secret only if
     your client is configured as a confidential client (e.g. Claude Code with `--client-secret`).
   - *(Optional)* **Issue JWT-based access tokens for named users.**
7. Click **Create**.
8. **Settings → OAuth Settings → Consumer Key and Secret:** copy the **Consumer Key** (this is the
   `CLIENT_ID` your client needs). Copy the **Consumer Secret** only if you're using a confidential
   client.

### Verified working configuration (Staging Sandbox · confirmed 2026-07-22)

The exact ECA toggles from a **known-good** POC app — use this as the reference if a connection
misbehaves:

**Flow Enablement**

| Setting | State |
|---|---|
| Enable Authorization Code and Credentials Flow | ✅ on |
| Require user credentials in the POST body | ☐ off |
| Enable Client Credentials Flow | ☐ off |
| Enable Device Flow | ☐ off |
| Enable JWT Bearer Flow | ☐ off |
| Enable Token Exchange Flow | ☐ off |

**Security**

| Setting | State |
|---|---|
| Require secret for Web Server Flow | ☐ off |
| Require secret for Refresh Token Flow | ☐ off |
| Require Proof Key for Code Exchange (PKCE) | ✅ on |
| Enable Refresh Token Rotation | ✅ on *(Salesforce-required default)* |
| Issue JWT-based access tokens for named users | ✅ on |
| Limit Idle Refresh Token TTL to 30 Days | ✅ on *(Salesforce-required default)* |
| Enforce Refresh Token IP Allowlist | ☐ off |

This is the Authorization Code + **PKCE**, **no-secret** (public client) setup described above — the
only "extra" toggles (refresh-token rotation, idle-TTL, JWT for named users) are Salesforce-managed
defaults and are fine to leave on.

### Callback URLs by client

| Client | Callback URL |
|---|---|
| **Cursor** (recent) | `http://localhost:8787/callback` |
| **Cursor** (older versions) | `cursor://anysphere.cursor-mcp/oauth/callback` |
| **Claude Desktop / Web** | `https://claude.ai/api/mcp/auth_callback` |
| **Claude Code** (direct) | `http://localhost:38000/callback` |
| **Postman** (for testing) | `https://oauth.pstmn.io/v1/callback` |

> Add **every** callback you plan to use. If authorization fails, the #1 cause is a callback-URL
> mismatch between the client and the ECA.

---

## 2. Per-user permissions (the real access boundary)

Because identity flows through per user, **what each user can see/do is their own Salesforce
permissions** — not a shared service user's. Grant each authorized user:

- A **Data 360 license**.
- A **permission set** scoped to the authorized HCP DMOs/fields and the needed Data 360 system
  permissions (query for Pull; segment create/publish + activation for Push). See
  [00-salesforce-provisioning.md](00-salesforce-provisioning.md).

An **"insufficient access"** error from the server is expected and correct — it means the *connecting
user* lacks a permission. Fix it on the **user's permission set**, not on the server.

---

## 3. Connectivity test (optional, recommended)

Before wiring a full LLM client, you can validate auth with **Postman** (native OAuth 2.0 + PKCE):
point it at the server URL from [01](01-activate-mcp-server.md), authenticate with the ECA Consumer
Key, and call a tool — it returns raw JSON with no model in the loop, so it isolates auth/connection
issues from the client.

---

## Audit logging & monitoring

The hosted server runs under Salesforce's own infrastructure, so MCP traffic is natively attributable:

- Enable **Event Monitoring**; use the **Event Log File Browser**.
- Filter API events by **`API_CLIENT_CATEGORY = SALESFORCE_HOSTED_MCP`** — this marker applies here
  because we're on a **Salesforce-hosted** server, and it's attributed to the **individual connecting
  user** (the whole point of per-user auth).
- Watch `STATUS_CODE` for errors and `USER_NAME` / `CLIENT_IP` for anomalies.
- Revoke a user's access via **OAuth Usage** / the ECA, or by adjusting their permission set.

---

## Optional / future data-governance hardening

Per-user FLS and sharing already apply automatically. Beyond that, the tiered sensitivity model from
the [kickoff notes](../kickoff-call-notes.md) (Q3) is available but **not required** for the POC:

- **Data Space** — scope which data is in play.
- **Field-Level Security** — hide PII the POC doesn't need (silently omitted from results).
- **Data masking** — keep a sensitive field **countable** without exposing its value
  (deterministic/partial masking only; avoid random/dynamic on anything aggregated or joined).

See [00-salesforce-provisioning.md](00-salesforce-provisioning.md#optional--future-hardening-not-required-to-run-the-poc).

---

**Next:** [03-connect-claude.md](03-connect-claude.md)
