# Customer POC — Kickoff Call Notes

**POC:** Claude + Data 360 Segment Use Case
**Prepared for:** kickoff / architecture alignment
**Role note:** I'm presenting as the architect — the "Open Questions for the Architect" are positions to state, not questions to ask.

---

## 1. Introductions & POC Vision (5 min)

**What we're proving:** a marketer types a plain-English prompt into Claude, gets a **verified HCP segment count** back from Data 360, and can **rebuild that segment** — no Salesforce login, no SQL, no analyst in the loop. Counts are validated against **OCL/Snowflake** as the source of truth.

**How the three "no ___" claims hold up:**

- **No SQL** — the marketer types English; the governed Skill maps it deterministically through a version-controlled semantic layer and builds the SQL. Solid.
- **No analyst in the loop** — the Skill does the mapping, join selection, and `COUNT(DISTINCT)` logic an analyst would do. Solid.
- **No Salesforce login** — this one needs an honest reframe now that we've chosen the **hosted, per-user** server (below).

**"No Salesforce login" — the honest, defensible framing:**
- **Architecture decision:** we use the **Salesforce-hosted Data 360 MCP server** with **per-user OAuth 2.0 + PKCE** — *not* a shared service account. Each marketer connects with **their own Salesforce identity** (a one-time OAuth consent, ideally behind **SSO**), and the platform enforces *their* FLS/object perms/sharing on every call.
- **So the precise claim is "no Salesforce *UI* login" — not "no Salesforce identity."** The marketer never opens Lightning, writes SQL, or waits on an analyst; they work entirely in Claude. But they **do** authenticate to Salesforce once via OAuth/SSO, and they **must be a provisioned Data 360 user** (license + permission set).
- **Why we chose this over the headless service account:** native **per-user security and audit** — every action is attributable to the real person, and each user sees only what their permissions allow. That's the enterprise-grade posture, and it aligns with Salesforce's own MCP security guidance (authorization-code, human in the loop).
- **Trade-off consciously accepted:** every end user needs a Data 360 seat + permission set (a provisioning + licensing cost), in exchange for real per-user identity, FLS, and audit. The alternative — one shared service user, no per-user identity — is documented in Q2 as the lighter-weight option we did **not** pick.

---

## 2. Walkthrough of Sample Use Cases

> **Reality to set up front:** we are **not connected to the org yet**, so the semantic layer (`reference/dataModel-dev.yaml`) is intentionally **unpopulated / all `VERIFY` placeholders**. The *method* is built end-to-end; the *data* gets filled in during Phase 0. This call is what unlocks that. Until we connect, we can't promise any specific use case is demoable — we won't know which fields exist until the model is populated from the live org.

**Use-case → data-model readiness map:**

| # | Use case | Needs | Status | Gap |
|---|---|---|---|---|
| 1 | Above-brand (corporate site): NY HCPs who visited the corporate site, last 3 mo | web visit + timestamp + state | Mostly ready | **Site identity** — no field distinguishes "the corporate site" from other sites (only `event_type`) |
| 2 | Above-brand: visited the corporate site AND opened a customer email, last 90 days | web visit + **email-open** event | Partial | **No email-engagement DMO** (consent/opt-out ≠ opens) + site identity |
| 3 | CRM – `<brand>`: HCPs who recently wrote a `<brand>` Rx | Rx product + written-date | Placeholder | `Prescription` is an explicit placeholder — need the **real Rx/claims DMO** + brand values |
| 4 | CRM – `<brand>` (stadium venue): HCPs within 100 mi of zip 07073 | **geospatial radius** | Not supported | No zip/postal, no lat/long, no distance function — biggest lift |
| 5 | Media – Oncology: Oncology HCPs w/ CRM email engagement AND Oncology-site activity, last year | **specialty** + email engagement + site-specific web | Multiple gaps | No HCP **specialty** field; no email-engagement event; no site identifier |

**The pattern:** counts, time windows, state, opt-in, and identity-resolution joins are well-modeled. Gaps cluster around **(a) event granularity** (site identity, email opens), **(b) HCP attributes** (specialty), **(c) geospatial** (zip/radius). All fields are still `VERIFY` pending org connection.

**Suggested demo scoping:** lead with the closest-to-ready cases (**#1, #3**) as the live proof; treat **#4 (geo)** and **#5 (stacked)** as roadmap/stretch pending data-model work.

---

## 3. Open Questions for the Architect — *positions to state*

### Q1. How does natural language map to Data Cloud queries — preview/approval or direct?

**Position:** Deterministic mapping through a **version-controlled semantic layer**, not free-form text-to-SQL.
- **Reads (counts):** direct execution — but a count is **not called "validated"** until it clears the **OCL/Snowflake benchmark** within the agreed **2–5% delta** and same refresh window. Einstein counts are banned as a source of truth.
- **Writes (create/publish/activate):** **hard confirm-before-execute gate** + named governance-owner sign-off.
- **Trust ceiling = the semantic layer.** The mapping is only as good as the DMOs/fields/joins verified against the org (Phase 0). Facade-tool order is enforced: `search` → `payload_examples` → `execute`; no invented operations or fields.

### Q2. What access/permission model would this require?

**Position (POC decision):** use the **Salesforce-hosted Data 360 MCP server** with **per-user identity** — OAuth 2.0 Authorization Code + PKCE via an **External Client App**. Each user acts as **themselves**; Data 360 enforces their own object perms, FLS, and sharing on every call. No shared service account.

- **Why we chose this:** native per-user security + audit (every action attributable to the real person), it's the Salesforce-recommended model (authorization-code, human in the loop), and it's **fully managed** — no server to host, patch, or scale. One External Client App brokers OAuth for everyone (`mcp_api` + `refresh_token` scopes, PKCE required); it is **not** a shared identity — identity still flows per user.
- **What it requires:** every authorized user must be a **provisioned Data 360 user** — a license + a permission set scoped to the authorized HCP DMOs/fields (query for Pull; segment create/publish + activation for Push). "Insufficient access" errors are corrected on the **user's permission set**, not the server.
- **Data governance still layers on** (Q3): per-user FLS/sharing apply automatically; Data Space + optional masking tighten *what data is in play* further.

**The decision driver:** *per-user identity vs. a single shared principal.* We took per-user. The alternative we did **not** pick:

| Model | Where it runs | Identity | Fit |
|---|---|---|---|
| **Per-user identity** (each user's own permissions) | **hosted Data 360 MCP server** (`data-360-mcp`) | Per user (OAuth + PKCE) | **POC choice ✅** |
| Single use-case service user (client-credentials) | self-hosted `d360-mcp-server` JAR | One shared principal | Lighter, no per-user identity/audit; not chosen |

**Cost of the choice (own it):** per-user means **provisioning + licensing each marketer** as a Data 360 user. That's the trade for real per-user security/audit. If broad, low-touch access to *many* users mattered more than per-user identity, the shared service user would be lighter — but it gives up per-user visibility and attribution.

**Build vs. query split (worth noting):** segment *build/activate* is a **system action** on shared org assets; per-user identity matters most on the *query/visibility* path.

**Principle to state:** the agent is **never** the access-control boundary. Enforcement lives below it — in the **connecting user's** identity and Data 360's governance — so even a hijacked prompt can't exceed that user's permitted scope.

### Q3. Any data sensitivity flag? — *tiered, platform-enforced model*

Turn sensitivity from an application-layer *promise* into a platform-enforced *control*. Four concentric rings:

1. **Data Space + object/DMO permissions → hard boundary.** Controls which data/DMOs exist at all for the running user. Also the clean mechanism for **per-brand segregation** (brand-per-data-space).
2. **Field-Level Security → no-cost PII confidentiality.** In Data Cloud, FLS is a **silent, schema-shaping filter**: restricted fields are elided from the principal's view (so `SELECT *` returns a different column set per policy). It's a **confidentiality** control, not an alerting one.
   - Explicitly referencing a hidden field **errors loudly** (unknown column) — the *good* failure mode. Only wildcard `SELECT *` is silent, and the design never uses it.
   - **PII fields don't drive segment counts.** Count logic runs entirely on **non-PII filter/join fields** (`brand_affiliation`, `state`, `is_email_opt_out`, `visit_ts`, `product_name`, join keys). The `pii:true` fields (`first_name`, `last_name`, `birth_date`, `email_address`) are output-only attributes never filtered/joined — so FLS on them is **pure upside, zero count impact**.
3. **Masking → keep a sensitive field *countable* without exposing its value.** Middle tier between hide and expose.
   - **Deterministic/consistent** masking preserves `COUNT(DISTINCT)` and joins (equal values → equal tokens) — and keeps counts reconciling against OCL/Snowflake (same cardinality). **Required** for any masked field used in a distinct/join.
   - **Partial** masking (birth *year*, zip *prefix*, email domain) preserves **banded** aggregates while dropping identifying precision.
   - **Avoid random/dynamic** masking on anything aggregated/joined — silently corrupts counts.
   - Resolves the "has a deliverable email" presence check without exposing addresses.
4. **Skill guardrails → belt-and-suspenders.** Count-only / no raw PII rows; profiling is aggregation SQL via `d360_query_sql` (no profiler tool on the GA facade) and reports **fill-rate only for PII** by Skill discipline; confirm-before-write; Einstein banned.

**Key design rule surfaced:** because FLS filters *silently* and masking can change cardinality, **verify/generate the semantic layer as the exact runtime principal** (the authorized user's permission set + any data space + FLS/masking policy) so the locked model never references a field that principal can't see or that's masked in a count-breaking way. OCL/Snowflake validation is the backstop that catches any residual divergence.

**Geo exception:** the 100-mile-radius case needs *precision*; partial-masking a zip degrades the radius. Protect geo precision via **data space / FLS scoping of who can run it**, not by masking the field.

**One-liner for the room:** *"Sensitivity is enforced in the platform on the running principal — Data Spaces and object permissions as the hard boundary, FLS shaping fields within it, deterministic/partial masking where a value must stay countable but hidden — and we author the semantic layer as that exact principal so the model never references a field it can't see. Counts run only on non-PII fields; PII is output-only and suppressed by design. OCL/Snowflake validation catches any residual divergence."*

---

## 4. Next Steps — Development Work (Phase 0 sequence)

1. **Org access + activate the server** — Staging Sandbox access; activate the **hosted Data 360 MCP server** in Setup and record its Server URL ([setup/00](../setup/00-salesforce-provisioning.md), [setup/01](../setup/01-activate-mcp-server.md)).
2. **Create the External Client App** — OAuth + PKCE, scopes `mcp_api` + `refresh_token`, callback URL per client ([setup/02](../setup/02-auth-setup.md)).
3. **Provision users** — a Data 360 license + a scoped permission set for each authorized user; document the user list.
4. **Prove connectivity** — a working facade round-trip **as a real user**: `search "list DMOs" / "describe DMO"` → `execute` (the server exposes only `search` / `payload_examples` / `execute`).
5. **Populate & verify the semantic layer** — fill `dataModel-dev.yaml` from the **live org, as the runtime principal (a user's permission set)**; flip every `VERIFY` → `verified`. Align `pii:` flags to the org's data classification.
6. **Confirm the five model additions** the demo use cases imply: site identifier, email-engagement event, real Rx DMO, zip/geospatial, HCP specialty.
7. **Scope the demo honestly** — pick the ready use cases (#1, #3) for live proof; roadmap #4/#5.
8. **Lock the fixtures** — OCL/Snowflake benchmark query, delta threshold (2–5%), reference segment ID, SFMC activation target, named governance owner + authorized users.

**Phase 0 exit gate:** server activated + ECA created + users provisioned + connectivity proven + semantic layer verified (as runtime principal) + governance owner confirmed + success criteria documented.

---

### Parking lot / decisions to record
- **Access (decided):** hosted Data 360 MCP server with **per-user identity** (OAuth + PKCE). Trade-off accepted: each user must be a provisioned Data 360 user (license + permission set). The shared service-user alternative was considered and not chosen (see Q2).
- Permission-set scope: exact Data 360 system perms + DMO/field grants for the authorized HCP set.
- Data-space model: one shared space vs. brand-per-space (optional hardening).
- Which sensitive fields (if any) get masking, and the scheme (deterministic vs. partial) — confirm it reconciles with OCL/Snowflake.
- Licensing: confirm Data 360 license type + seat count for the authorized user list.
