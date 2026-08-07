# POC — Salesforce Org Setup (today)

A shareable, do-today checklist for the Salesforce / Data Cloud Architect team to stand up the org
for the POC. This is the **consolidated, POC-simplified** version of
[00-salesforce-provisioning.md](00-salesforce-provisioning.md) — same steps, two deliberate POC
shortcuts called out below.

> **POC shortcuts (decided 2026-07-22 — POC only, not the production posture):**
> - **One shared *named* user**, not per-user provisioning. Everyone logs in with the same
>   credentials via the normal OAuth browser flow. This is a shared *named user*, **not** a
>   client-credentials service account — the human still logs in, so the architecture (ECA + OAuth
>   Authorization Code + PKCE) is unchanged. Trade-off: all activity is attributed to this one user
>   (no per-person audit).
> - **Standard permission set "Data Cloud Marketing Manager"**, not a scoped custom set. Covers
>   Pull + Push out of the box. Trade-off: broader than least-privilege (grants Data Cloud access
>   generally, no field-level scoping).
>
> **Production posture stays per-user + scoped custom permission set** — see
> [02-auth-setup.md](02-auth-setup.md) and [00-salesforce-provisioning.md](00-salesforce-provisioning.md).

---

## Prereqs

- [ ] Org is **Enterprise Edition or above**, with **Data Cloud / Data 360 provisioned** at the org
      level (Staging Sandbox for the POC). *(Org-level provisioning — individual POC users just need
      a standard Salesforce license + the permission set in step 3.)*

## 1. Activate the hosted Data 360 MCP server

- [ ] Setup → **MCP Servers** → **Salesforce Servers** → **Data 360** (the full Connect API server,
      **not** "Data 360 Legacy") → **Activate**.
- [ ] **Send back:** the **Server URL** + API Name.

## 2. Create the External Client App (OAuth bridge — one ECA serves everyone)

- [ ] Setup → **External Client App Manager** → **New**; enable OAuth.
- [ ] **Callback URLs** (add all you'll use):
  - Cursor: `http://localhost:8787/callback`
  - Claude Desktop: `https://claude.ai/api/mcp/auth_callback`
  - Claude Code: `http://localhost:38000/callback`
- [ ] **OAuth scopes:** "Access MCP servers" (`mcp_api`) + "Perform requests at any time"
      (`refresh_token`).
- [ ] **Security:** **require PKCE**. Public client — **no secret** needed.
- [ ] **Send back:** the **Consumer Key** (this is the `CLIENT_ID` the client config needs).

## 3. Provision ONE shared POC user  (shared named user for now)

- [ ] Use a **standard Salesforce user** (a plain named user — **no special Data 360 license
      needed**).
- [ ] Assign the **standard permission set: "Data Cloud Marketing Manager"** (this carries the Data
      Cloud access and covers query for Pull + segment create/publish + activation for Push — no
      custom perm set needed for the POC).
- [ ] **Share the login credentials** with the POC team securely.
- [ ] *Note:* shared *named* user via the normal per-user OAuth login (not a service account).
      Production would be per-user with a scoped, least-privilege permission set.

## 4. Confirm existing inputs (identify, don't create — send back the identifiers)

- [ ] **Reference segment** ID/API name (to rebuild in Phase 2)
- [ ] **Existing SFMC activation target** (do **not** create a new one)
- [ ] The **HCP DMOs** exist in Data 360
- [ ] **OCL/Snowflake benchmark** view/columns (source-of-truth count)

---

## Not needed today

- Data Space, FLS / data masking (optional/future hardening — see
  [00-salesforce-provisioning.md](00-salesforce-provisioning.md#optional--future-hardening-not-required-to-run-the-poc)).
- Per-user provisioning and a scoped custom permission set (production posture, deferred for the POC).

> **Governance:** governance owner sign-off is required before running against **production** data.

---

**What you'll get back to us:** Server URL · ECA Consumer Key · shared-user credentials · the four
existing-input identifiers. With those, we connect the client ([03-connect-claude.md](03-connect-claude.md))
and run the connectivity test.
