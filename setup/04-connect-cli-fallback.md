# Setup 04 — Connect via the `sf` CLI (Fallback Path)

Use this path if the hosted Data 360 MCP server isn't yet activated, or the client you're running
from can't complete an interactive browser login (e.g. a headless/remote Claude Code session). Same
phases, same guardrails as the MCP path — only the tool surface changes: `sf` CLI commands instead of
the MCP facade (`search` / `payload_examples` / `execute`), per the [README fallback
section](../README.md#fallback-sf-cli-interim-path-start-today-no-mcp-server-needed).

There are two ways to authenticate the CLI. Pick based on where you're running it:

- **Interactive machine (has a browser)** → web server flow, same per-user OAuth model as the MCP path.
- **Headless / remote environment (no browser)** → JWT bearer flow, certificate-based, no interactive
  consent required at runtime.

---

## Option A — Web server flow (interactive machine)

```bash
npm install --global @salesforce/cli
sf --version

sf org login web --alias d360-poc --instance-url https://test.salesforce.com   # sandbox
# or, for production:
sf org login web --alias d360-poc
```

Opens a browser for the normal user login + consent — same per-user identity as the MCP OAuth path,
no client-credentials service account. Verify with:

```bash
sf org display --target-org d360-poc
```

This won't work from a container/session with no browser or no route from a local callback port back
to your actual browser — use Option B instead.

---

## Option B — JWT bearer flow (headless, certificate-based)

This is a server-to-server auth pattern: the CLI signs a JWT with a private key and exchanges it
directly for an access token at Salesforce's OAuth token endpoint — no browser, no redirect, no
interactive consent at runtime.

### 1. Generate a key pair and self-signed certificate

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=d360-poc-jwt"
openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
```

`server.crt` is the public certificate — upload it to Salesforce. `server.key` is the private key —
**never commit it, never share it outside the person authenticating.** Keep it out of the git repo
entirely (e.g. in a local scratch directory, `.gitignore`d).

### 2. Create the Connected App (or ECA) with digital signatures

1. **Setup → App Manager → New Connected App** (or External Client App Manager).
2. Enable OAuth Settings.
3. **Callback URL:** any placeholder works for JWT flow — `sf://Salesforce.CLI` is the conventional one.
4. **OAuth Scopes:** at minimum `api` (Manage user data via API) and `refresh_token, offline_access`
   (Perform requests at any time).
5. Check **"Use digital signatures"** and upload `server.crt`.
6. Save, then copy the **Consumer Key** (Client ID) from the app's settings.
7. **Edit Policies → Permitted Users:** set to **"Admin approved users are pre-authorized"**, then
   create/assign a **Permission Set** that includes this Connected App to the user who'll authenticate.
   Without this, JWT login fails with a consent/authorization error — pre-authorization is what lets
   JWT skip interactive consent.

### 3. Log in

```bash
sf org login jwt \
  --client-id <consumer-key> \
  --jwt-key-file server.key \
  --username <username> \
  --instance-url <org-instance-url> \
  --alias d360-poc
```

Verify:

```bash
sf org display --target-org d360-poc
```

### 4. Exercise the D360 Connect API

```bash
# Ad-hoc SOQL / Data 360 query
sf data query --query "SELECT ... FROM ..." --target-org d360-poc

# Direct REST call against the D360 Connect API (Developer Preview ops need the flag)
sf api request rest /services/data/v62.0/ssot/query \
  --body '{"sql": "SELECT COUNT(DISTINCT ...) FROM ..."}' \
  --target-org d360-poc \
  --allow-non-ga-tools
```

These replace the MCP facade's `search` → `payload_examples` → `execute` calls; the Skill's recipes,
scope, and OCL/Snowflake validation gate are unchanged — see
[SKILL.md](../skill/d360-segments-activations/SKILL.md), which already documents that it prefers MCP
and falls back to `sf` CLI when MCP is unavailable.

---

## Network prerequisite (both options)

Either flow needs outbound HTTPS from wherever the CLI runs to:

- `login.salesforce.com` (production) or `test.salesforce.com` (sandbox) — the OAuth token endpoint.
- The org's own instance host (e.g. `<mydomain>--<sandbox>.sandbox.my.salesforce.com`).

If the CLI reports a connection/fetch failure with no Salesforce-side error at all (i.e. it never gets
as far as rejecting bad credentials), suspect network egress before suspecting the auth setup — a
sandboxed/remote session's firewall or proxy policy blocking these hosts will produce exactly that
symptom, and no credential is capable of working around it. Confirm with a direct request to the
instance host; a blocked egress policy typically surfaces as an immediate 403 at the connection layer
rather than a Salesforce authentication error.

---

**Next:** back to the [runbook](../README.md#fallback-sf-cli-interim-path-start-today-no-mcp-server-needed).
