# Setup 06 — Cursor CLI on this repo (same context as the editor)

Use the **Cursor Agent CLI** (`agent`) from a terminal with the **same** governed skill,
project rules, and Data 360 connection you already use in Cursor chat.

This is **not** the Salesforce `sf` CLI fallback ([04-connect-cli-fallback.md](04-connect-cli-fallback.md)).

## What you get

| Same as the editor | How the CLI picks it up |
| --- | --- |
| Governed skill | `.cursor/skills/d360-segments-activations/` → canonical [../skill/d360-segments-activations/SKILL.md](../skill/d360-segments-activations/SKILL.md) |
| Marketer rules | `.cursor/rules/` plus [../AGENTS.md](../AGENTS.md) |
| Data 360 MCP | Project `.mcp.json` / `.cursor/mcp.json` (CLI reads `mcp.json` the same way the editor does) |
| Prompts | [../prompts/chat-starters.md](../prompts/chat-starters.md) |

Always run from the **repo root** (or pass `--workspace` pointing at it).

---

## 1. Install Cursor CLI (once)

**Windows PowerShell**

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent --version
```

If `agent` is not found, add `%USERPROFILE%\.local\bin` to PATH, then open a new terminal.

**macOS / Linux / WSL**

```bash
curl https://cursor.com/install -fsS | bash
agent --version
```

Sign in if prompted (`agent login`, or set `CURSOR_API_KEY` for scripts). Docs: [Installation](https://cursor.com/docs/cli/installation.md).

---

## 2. Point MCP at Data 360 (same as editor)

Prefer **user** MCP config for the Consumer Key so it is not committed.

1. Copy [mcp-config.example.json](mcp-config.example.json) into Cursor MCP settings (or your user `mcp.json`).
2. Replace `CLIENT_ID` with the External Client App Consumer Key.
3. Authenticate once (browser Salesforce login).

CLI loads the same MCP servers. If tools do not appear in the terminal:

```powershell
agent mcp list
```

If the server needs login in CLI, complete that flow (`agent mcp login` when available), or authenticate in the editor first so tokens are reused.

Headless / scripts that must call MCP: add `--approve-mcps` (see [Using Agent in CLI](https://cursor.com/docs/cli/using.md)).

---

## 3. Launch from this repo

**Interactive (recommended)** — same chat loop as Cursor Agent, in the terminal:

```powershell
cd "C:\Users\sanyar03\OneDrive - Pfizer\Documents\d360-mcp-segments-activations-main"
agent
```

Or use the launcher (installs `agent` if missing, then starts in this repo):

```powershell
.\scripts\d360-agent.ps1
```

In the session, type `/` and pick **d360-segments-activations**, or just ask in everyday language (*How many patients have Premarin on their brand profile?*).

**One-shot (print mode)**

```powershell
.\scripts\d360-agent.ps1 -p "How many patients have Premarin on their brand profile?"
```

For unattended MCP use:

```powershell
.\scripts\d360-agent.ps1 -p --approve-mcps "How many doctors opened a headquarter email in the last 90 days?"
```

`--mode=ask` explores without editing files.

---

## 4. Verify

1. `agent --version` works.
2. From repo root: `agent` starts.
3. Ask: *How many patients are on the Premarin brand profile?*
4. Expect everyday English + a number, then the Query — no environment question, no Snowflake table.

Starter prompts: [../prompts/chat-starters.md](../prompts/chat-starters.md).

---

## Everyday prompts (paste after `agent`)

```text
How many patients have Premarin on their brand profile?
```

```text
How many doctors opened a headquarter email in the last 90 days?
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `agent` not found | Re-run the install command; add `~/.local/bin` (or `%USERPROFILE%\.local\bin`) to PATH |
| Skill not applied | Confirm you launched with `--workspace` = this repo; `/` → `d360-segments-activations` |
| No Data 360 tools | Fill `CLIENT_ID` in MCP config; authenticate; try `--approve-mcps` in print mode |
| Agent asks Dev / Stage / Prod | Pull latest rules; doctors always use the connected Stage space unless you name another |
| Auth redirect error | ECA callback must include Cursor’s URL ([02-auth-setup.md](02-auth-setup.md)) |

**Next:** [05-share-with-users-cursor-claude.md](05-share-with-users-cursor-claude.md) or a chat starter.
