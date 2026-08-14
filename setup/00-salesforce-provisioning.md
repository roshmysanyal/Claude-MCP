# Setup 00 — Salesforce Provisioning (what to create in the org)

The single, consolidated list of **everything that must exist in Salesforce** before the POC can
run. It pulls together items that are otherwise scattered across [02-auth-setup.md](02-auth-setup.md),
the [README prerequisites](../README.md#prerequisites-checklist-salesforce-team--before-day-1), and
the [kickoff notes](../kickoff-call-notes.md), and adds the create-steps that weren't written down
anywhere.

> **Owners:** Salesforce **Data Cloud Architect** (Data 360 objects, users, permissions, data space)
> + Customer **IT/Admin** (org config) + the named **governance owner** (sign-off). Nothing here runs
> against production data until the governance owner confirms.
>
> **Org-specifics stay `<fill-in>` / `VERIFY`.** Exact DMO/field API names, permission-set contents,
> and data-space membership depend on the live customer org and are confirmed via the semantic-layer
> verification loop ([before-using-and-on-data-model-changes.md](../skill/d360-segments-activations/reference/before-using-and-on-data-model-changes.md)).

---

## Create in this order

We use the **Salesforce-hosted Data 360 MCP server** with **per-user OAuth** — so there is **no
service account**. The principal is each end user's own identity, and their permission set is the
access boundary. Provision top-to-bottom:

```
1. Activate the hosted Data 360 MCP server (Setup)
2. External Client App (OAuth 2.0 + PKCE)  → the OAuth bridge for all users
3. Per-user access: Data 360 license + permission set  → for each authorized user
4. Confirm existing inputs (segment, SFMC target, DMOs, OCL/Snowflake)

Optional / future hardening (NOT required to run the POC):
   • Data Space          — scope which data is in play
   • FLS + data masking  — PII posture (per-user FLS already applies natively)
```

---

## 1. Activate the hosted Data 360 MCP server

- **What:** turn on the Salesforce-managed **Data 360** MCP server (the full Connect API server, not
  "Data 360 Legacy"). No JAR, no local process.
- **Steps:** Setup → **MCP Servers** → **Salesforce Servers** → **Data 360** → **Activate**; copy the
  **Server URL** + API Name. Full detail in [01-activate-mcp-server.md](01-activate-mcp-server.md).
- **Owner:** Salesforce Data Cloud Architect / Customer IT
- **Done when:** the Data 360 server shows **Active** and you've recorded its Server URL.

## 2. External Client App (OAuth 2.0 + PKCE)

- **What:** the ECA that brokers **per-user** OAuth for every MCP client (Connected Apps are **not**
  supported). One ECA serves all users; identity still flows per user.
- **Why / detail:** full step-by-step in
  **[02-auth-setup.md → Create the External Client App](02-auth-setup.md#1-create-the-external-client-app)**.
  Summary:
  1. **Setup → External Client App Manager → New** — enable OAuth.
  2. **Callback URL(s):** per client (Cursor `http://localhost:8787/callback`, Claude
     `https://claude.ai/api/mcp/auth_callback`, etc. — see the auth doc's callback table).
  3. **OAuth scopes:** **Access MCP servers** (`mcp_api`) + **Perform requests at any time**
     (`refresh_token`).
  4. **Security:** **require PKCE**; for public clients you may drop the client secret.
  5. Copy the **Consumer Key** (the `CLIENT_ID` clients need) — it goes in the client's MCP config,
     which for the hosted server holds **no secret** (PKCE handles it).
- **Owner:** Salesforce Data Cloud Architect / Customer IT
- **Done when:** a client can complete the OAuth login and the MCP `search` tool returns Data 360
  operations.

## 3. Per-user access: license + permission set (for each authorized user)

- **What:** because identity flows per user, **each person** who uses the POC needs their own Data 360
  access. There is no shared run-as user.
- **Why:** the connecting user's **own** permissions are the enforced boundary — the server applies
  their FLS, object perms, and sharing on every call. The Skill's declared scope
  ([SKILL.md](../skill/d360-segments-activations/SKILL.md)) is behavioral; this is the platform-enforced one.
- **Steps:**
  1. Give each authorized user a **Data 360 license** (confirm the exact license with the architect —
     `<fill-in>`).
  2. Create a **permission set** (e.g. `D360 POC HCP Segment Access`) granting the Data 360 **system
     permissions** for query (Pull) and, for Push, segment create/publish + activation (`<fill-in>`),
     plus **object + field access** to only the authorized DMOs/fields mapped in
     [dataModel-dev.yaml](../skill/d360-segments-activations/reference/dataModel-dev.yaml). Leave PII fields off unless a count genuinely needs
     them (finer PII handling is the optional hardening below).
  3. **Assign** the permission set to each authorized user.
- **Owner:** Salesforce Data Cloud Architect (+ governance owner sign-off)
- **Done when:** each authorized user can run a count and (for Phase 2) create/publish a segment, and
  cannot see objects/fields outside the authorized scope. *("Insufficient access" = fix the user's
  permission set, not the server.)*

## 4. Confirm existing inputs (identify, don't create)

These should already exist in the org — the POC **references** them, it does not create them. Track
them down and record the identifiers:

| Input | What to confirm | Owner |
|---|---|---|
| **Reference segment** | The segment ID/API name to rebuild in Phase 2 (`<REFERENCE_SEGMENT_ID>`) | Customer team |
| **SFMC activation target** | The **existing** activation target to wire the rebuilt segment to (do **not** create a new one) | Customer marketing ops |
| **DMOs / data model** | The HCP DMOs exist and are mapped in [dataModel-dev.yaml](../skill/d360-segments-activations/reference/dataModel-dev.yaml); verify + flip `VERIFY → verified` | Data Cloud Architect |
| **OCL / Snowflake benchmark** | The view/columns for the source-of-truth count ([validation/](../skill/d360-segments-activations/validation/)) | Data Cloud Architect |

---

## Optional / future hardening (not required to run the POC)

The POC is secured by **per-user identity + permission sets** above, and the hosted server already
enforces each user's **FLS and sharing** natively. These layers tighten data governance further and
are the recommended production posture, but the POC can run without them. Treat as roadmap.

### Data Space (optional)

- **What:** a Data 360 **Data Space** scoping *which data* is in play.
- **Why (future):** a hard, per-brand / per-scope data boundary on top of per-user permissions —
  useful once scope grows beyond the POC's authorized set.
- **If adopted:** confirm/scope a Data Space containing the authorized HCP DMOs (`<fill-in>`), grant
  users access to it, and target it via the `dataspace` parameter on `execute`.
- **Owner:** Salesforce Data Cloud Architect

### Field-Level Security + Data Masking (optional)

- **What:** FLS + masking policies for PII/sensitive fields on the authorized DMOs.
- **Why (future):** the tiered sensitivity model from the [kickoff notes](../kickoff-call-notes.md)
  (Q3). FLS hides fields *silently*; masking keeps a sensitive field **countable** without exposing
  its value.
- **If adopted:** hide PII the POC never needs; for sensitive fields that must stay
  **countable/joinable**, use **deterministic/consistent** or **partial** masking (birth *year*, zip
  *prefix*, email *domain*) — **avoid random/dynamic** masking on anything aggregated/joined (it
  silently corrupts counts). Reflect hidden/masked fields in `dataModel-dev.yaml` (`pii:` flags + notes).
- **Owner:** Salesforce Data Cloud Architect (+ Customer Compliance for the PII list)

> For the POC, the simplest safe posture is to **not grant** unneeded PII fields on the permission
> set at all — that removes them without any FLS/masking configuration.

---

## Provisioning checklist (fill owners + status before Phase 1)

**Required:**

- [ ] **Hosted Data 360 MCP server activated** in Setup; Server URL recorded — URL: `__________`
- [ ] **External Client App** created (scopes `mcp_api` + `refresh_token`, **PKCE required**, callback URL(s) per client); Consumer Key recorded — key: `__________`
- [ ] **Data 360 license** granted to each authorized user
- [ ] **Permission set** created + assigned to each user; scoped to authorized HCP DMOs/fields — name: `__________`
- [ ] **Authorized users** documented — users: `__________`
- [ ] **Reference segment** identified — ID: `__________`
- [ ] **SFMC activation target** identified (existing) — name: `__________`
- [ ] **DMOs verified** in `dataModel-dev.yaml` (every query-touched `VERIFY` → `verified`)
- [ ] **OCL/Snowflake benchmark** view/columns confirmed
- [ ] **Governance owner** signed off on scope — name: `__________`

**Optional / future hardening:**

- [ ] **Data Space** scoped + granted — name: `__________`
- [ ] **FLS / masking** applied for PII posture (or: unneeded PII simply left off the permission set)

> **Phase-0 exit gate:** every **required** box checked (or explicitly deferred with a reason) and
> the governance owner's sign-off recorded. Optional hardening is not gating. Track this in
> [milestones.md](../milestones.md).

---

**Next:** [01-activate-mcp-server.md](01-activate-mcp-server.md)
