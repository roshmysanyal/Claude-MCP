# Setup 05 — Share this repo with other users (Cursor vs Claude)

Hand this document to anyone who needs to run the Data 360 segments / activations
workflow. It covers **org prerequisites (once)**, then **Cursor** and **Claude**
configuration separately.

Related:

- [00-salesforce-provisioning.md](00-salesforce-provisioning.md) — licenses, permission sets
- [01-activate-mcp-server.md](01-activate-mcp-server.md) — activate hosted Data 360 MCP
- [02-auth-setup.md](02-auth-setup.md) — External Client App + OAuth callbacks
- [03-connect-claude.md](03-connect-claude.md) — client connect + Skill install
- [mcp-config.example.json](mcp-config.example.json) — Cursor MCP template
- [06-cursor-cli.md](06-cursor-cli.md) — Cursor Agent CLI (`agent`) on this repo
- [../scaling-via-repo.md](../scaling-via-repo.md) — how skill/semantic layer stays in sync

---

## What you are sharing

| Shared (repo / admin) | Local / per-user (never commit) |
| --- | --- |
| This git repo (`skill/`, `.cursor/rules/`, prompts) | OAuth tokens / refresh tokens |
| Hosted MCP **Server URL** | Real ECA Consumer Key preferably in **user** MCP config |
| Example MCP JSON (`mcp-config.example.json`) | Consumer Secret (only if ECA requires it) |
| Setup docs under `setup/` | Salesforce password |
| Governed Skill + semantic layer | Personal Data 360 license + permission set |

Everyone reads the **same rules** from the repo. Each person still authenticates as
**themselves** (per-user OAuth + native FLS / sharing / audit).

---

## A. Shared once (Salesforce admin)

Complete before any laptop is configured.

### 1. Activate the hosted Data 360 MCP server

1. Setup → **MCP Servers** → **Salesforce Servers**.
2. Open **Data 360** (full Connect API — **not** “Data 360 Legacy”).
3. Click **Activate**.
4. Copy the **Server URL**.

| Org | Server URL |
| --- | --- |
| Sandbox / this POC | `https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp` |
| Production | `https://api.salesforce.com/platform/mcp/v1/data/data-360-mcp` |

### 2. Create one External Client App (ECA)

1. Setup → **External Client App Manager** → **New External Client App**.
2. Enable OAuth.
3. Scopes (both required):
   - **Access MCP servers** (`mcp_api`)
   - **Perform requests at any time** (`refresh_token` / `offline_access`)
4. Security: **Require PKCE**. For Cursor / Claude public clients, do **not** require
   client secret for web / refresh flows (unless you intentionally use a confidential client).
5. Register **every** callback you will use:

| Client | Callback URL |
| --- | --- |
| Cursor (recent) | `http://localhost:8787/callback` |
| Cursor (older) | `cursor://anysphere.cursor-mcp/oauth/callback` |
| Claude Desktop / Web | `https://claude.ai/api/mcp/auth_callback` |
| Claude Code | `http://localhost:38000/callback` |
| Postman (optional test) | `https://oauth.pstmn.io/v1/callback` |

6. Copy the **Consumer Key** (`CLIENT_ID`). Share it out-of-band to authorized users.
   Do **not** commit a live key into the repo.

### 3. Provision each authorized user

For every person who will run counts / segments:

- Data 360 **license**
- Permission set for query (Pull) and, if needed, segment create/publish + activation (Push)
- Object / field access aligned to the semantic layer

See [00-salesforce-provisioning.md](00-salesforce-provisioning.md).

### 4. Give them the handoff package

Send:

1. Repo clone URL (this project)
2. MCP Server URL
3. ECA Consumer Key (`CLIENT_ID`)
4. Confirmation that their Salesforce user is licensed + permissioned
5. Link to this document

---

## B. Cursor — steps for each user

### 1. Clone and open the workspace

```bash
git clone <repo-url>
cd d360-mcp-segments-activations-main
```

Open that folder as the **Cursor workspace root** so project rules under `.cursor/rules/`
apply automatically.

### 2. Configure the Data 360 MCP server

1. **Cursor Settings → MCP → New MCP Server** (opens `mcp.json`).
2. Prefer **user / global** MCP config for credentials so secrets stay out of git.
3. Paste (template also in [mcp-config.example.json](mcp-config.example.json)):

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

4. Save. Cursor shows the server as needing authentication — click **Authenticate**,
   complete Salesforce login / consent in the browser, wait until status is **connected**.
5. Confirm the ECA includes Cursor’s callback (`http://localhost:8787/callback` and/or
   the older `cursor://…` URL).

> No client secret belongs in `mcp.json` for the public-client PKCE setup.

### 3. Other Cursor settings for this repo

| Item | What to do |
| --- | --- |
| Workspace | Open the cloned repo root |
| Project rules | Already in `.cursor/rules/` (dual-report, DTC CIA / lookback, everyday language) — no manual copy if the workspace is the repo |
| Governed Skill | Use `skill/d360-segments-activations/` from the repo (Agent Skills / project skill path your team uses) |
| Model | Use whatever your org allows; MCP auth is independent of the model |
| Snowflake MCP | **Not required** for counts — query Data 360 only; leave Snowflake as validation SQL **PENDING** |
| Starter prompts | [../prompts/chat-starters.md](../prompts/chat-starters.md) |
| Cursor CLI | Same repo: [06-cursor-cli.md](06-cursor-cli.md) (`.\scripts\d360-agent.ps1`) |

### 4. Verify

1. MCP tools icon / settings: `data360` **connected**.
2. You should see exactly three tools: **`search`**, **`payload_examples`**, **`execute`**.
3. Ask:

   > Use the data360 `search` tool for "query sql" and for "segment", and show me the operation names it returns.

4. Run a starter from [../prompts/chat-starters.md](../prompts/chat-starters.md).

---

## C. Claude — steps for each user

> **Policy:** prefer **AWS Bedrock-hosted** Claude, not claude.ai directly. Set the Bedrock
> backend in the Claude client’s model settings. The MCP connection below is independent of
> the model backend.

Claude does **not** load `.cursor/rules/`. Behavior comes from the **governed Skill** plus
files in the repo checkout.

### Claude Code

1. Clone the same repo and `cd` into it.
2. Add the MCP server:

```bash
claude mcp add --transport http salesforce-data-360 \
  https://api.salesforce.com/platform/mcp/v1/sandbox/data/data-360-mcp \
  --callback-port 38000 \
  --client-id "REPLACE_WITH_ECA_CONSUMER_KEY"
```

Use `--client-secret` only if your ECA requires a secret (paste when prompted).

3. Launch `claude` → run `/mcp` → select **salesforce-data-360** (needs authentication) →
   **Authenticate** → allow access.
4. Ensure the ECA has callback `http://localhost:38000/callback`.
5. **Install the governed Skill** (copy or symlink from the repo):

   | Scope | Path |
   | --- | --- |
   | Project | `.claude/skills/d360-segments-activations/` |
   | User | `~/.claude/skills/d360-segments-activations/` |

   Source folder: [../skill/d360-segments-activations/](../skill/d360-segments-activations/).

6. Keep the semantic layer in sync: work from the repo checkout and `git pull` regularly
   (see [../scaling-via-repo.md](../scaling-via-repo.md)).

### Claude Desktop

1. Add the server as a **connector** using Server URL + Consumer Key.
2. Callback on the ECA must be `https://claude.ai/api/mcp/auth_callback`.
3. Restart Claude Desktop after adding.
4. Copy `skill/d360-segments-activations/` into Desktop’s skills location for your install.
5. Keep a current checkout of this repo (or an updated skill folder) so the nested
   `reference/` models and recipes stay aligned.

### Claude settings checklist

| Item | Action |
| --- | --- |
| Model backend | AWS Bedrock (repo policy) |
| MCP | HTTP + OAuth; three facade tools only |
| Skill | Must load `SKILL.md` (governance contract) |
| Cursor rules | Do **not** apply — use Skill + repo files |
| Auth | Each user logs in as themselves |

### Verify (Claude)

1. `/mcp` (Code) or connector status (Desktop): connected.
2. Tools: `search`, `payload_examples`, `execute`.
3. Same smoke prompt as Cursor (search for query / segment).
4. Exercise a small count via the Skill.

---

## D. Cursor vs Claude — quick comparison

| Topic | Cursor | Claude |
| --- | --- | --- |
| MCP config | Settings → MCP → `mcp.json` (`url` + `auth.CLIENT_ID`) | Code: `claude mcp add --transport http …` · Desktop: connector |
| OAuth callback | `http://localhost:8787/callback` (or older `cursor://…`) | Code: `http://localhost:38000/callback` · Desktop/Web: `https://claude.ai/api/mcp/auth_callback` |
| Governance rules | `.cursor/rules/` auto-apply when repo is workspace | Skill under `.claude/skills/` (or Desktop skills path) |
| Skill install | Point Agent Skills at `skill/d360-segments-activations/` | Copy/symlink that folder into Claude skills |
| Model policy | Org choice | Prefer Bedrock-hosted Claude |
| Starter prompts | Same — `prompts/chat-starters.md` | Same |

---

## E. Minimal message you can forward

**Cursor**

> Clone the repo → open it in Cursor → Settings → MCP → paste the example JSON with the
> Consumer Key → Authenticate → start from `prompts/chat-starters.md`.

**Claude Code**

> Clone the repo → run `claude mcp add …` with the Server URL + Consumer Key → `/mcp`
> Authenticate → copy `skill/d360-segments-activations/` into `.claude/skills/` → run from
> the repo root.

**Admin must already have**

> Hosted Data 360 MCP **Active**, ECA with the right callbacks, and this user’s Data 360
> license + permission set.

---

## F. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Auth fails / redirect error | Callback URL mismatch | Add the exact client callback to the ECA ([02](02-auth-setup.md)) |
| Tools missing | Wrong server (Legacy) or inactive | Activate full **Data 360** server ([01](01-activate-mcp-server.md)) |
| `insufficient access` | User permission set | Fix the **user’s** permission set — not the MCP server |
| Agent ignores DTC CIA / dual-report rules | Claude without Skill, or Cursor not opened on repo root | Install Skill / open correct workspace |
| Stale segment logic | Local skill copy drift | `git pull` the repo; re-copy Skill if using a separate skills folder |

---

## G. After connect — first useful prompts

Use [../prompts/chat-starters.md](../prompts/chat-starters.md). Recommended first offers:

1. **HCP Stage** — HQ email opens 90d on `stg_Headquarter_Email_Engagement__dlm` (dataspace `STG_US`)
2. **DTC** — Premarin brand + opt-in on `DTC_BrandProfile__dlm` + `DTC_ContactPointConsent__dlm` (dataspace `DTC`)

---

**Next:** [../README.md#phase-0--pre-poc-setup-days-15](../README.md#phase-0--pre-poc-setup-days-15) (Phase 0 exit gate) or start Phase 1 Pull with a chat starter.
