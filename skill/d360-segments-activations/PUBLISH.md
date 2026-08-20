# Publish / activate (Recipe P)

**Do not read this file for a count-only ask.** Counts: [COUNT.md](COUNT.md).
Create/update: [CREATE.md](CREATE.md). Status: [STATUS.md](STATUS.md).
Do **not** load [SKILL.md](SKILL.md) in full for publish.

**MCP:** `payload_examples` then `execute`. Every publish lookback is `P2Y` (update first if needed).
Activate only on a separate confirmation. Wire to an **existing** SFMC target — do not create a new target.

---
## Recipe P — Publish a segment (on-demand evaluation)

**Trigger:** the user says **publish**, **republish**, **refresh membership**, or **evaluate** a
segment they already created (or just confirmed after Recipe B). Create, publish, and activate
are **separate writes** — a create does not authorize publish.

**What publish does:** `d360_segment_publish` evaluates the segment **now** and writes a fresh
audience snapshot. It does **not** change filters, lookback, or schedule. It does **not** activate.

**Tool (always `payload_examples` first):** `d360_segment_publish`

| Parameter | Required | Notes |
| --- | --- | --- |
| `segmentId` | **yes** | 18-character **`marketSegmentId`** (starts with `1sg`). **Not** `segmentApiName`. |
| `dataspace` | yes on `execute` | Same dataspace as the segment (`DTC`, `Development`, `STG_US`, `PRD_US`) |

**Exact `execute` shape:**

```text
toolName: d360_segment_publish
paramsJson: {"dataspace":"<dataspace>","segmentId":"<marketSegmentId>"}
```

Example: `{"dataspace":"DTC","segmentId":"1sgWC0000000AfJYAU"}`.

Do **not** pass `lookbackPeriod` on publish — the tool has no lookback field. If the definition is
not `P2Y`, `d360_segment_update` with `lookbackPeriod: "P2Y"` **before** publish. Never publish
with any other window.

### Playbook

1. **Identify.** Recipe S: `d360_segment_get` (or `d360_segment_get_by_id`). Capture
   `marketSegmentId`, `segmentApiName`, dataspace, `lookbackPeriod`, `segmentStatus`,
   `lastSegmentMemberCount`, **Open this audience** URL.
2. **Pre-checks.** Confirm `lookbackPeriod` is **`P2Y`**. If it is not, update to `P2Y` before
   publish. Confirm D2C CIA choice (asked and recorded). Do not publish
   `PRD_US` / `PRD_PAT` without governance sign-off.
3. **Confirm.** Show display/API name, `marketSegmentId`, dataspace, lookback, current status and
   member count, and the Lightning URL. Wait for an explicit **publish**.
4. **Publish.** `execute` `d360_segment_publish` with `dataspace` + `segmentId` only.
5. **Poll.** `d360_segment_get` until status leaves `PROCESSING` / `COUNTING`:
   - **ACTIVE** → report `lastSegmentMemberCount`.
   - **ERROR** → stop; show the membership SQL; do not retry blindly; do not activate.
6. **Compare** the Recipe A count vs published members in natural English. If they diverge,
   reconcile before activation. Put the Query. Do **not** show a Snowflake count or matching table.
7. **Do not activate** unless the user separately asked.

**DBT create vs publish:** after `d360_segment_create`, status often moves `PROCESSING` →
`COUNTING` → `ACTIVE` with a first snapshot. Treat that as create-time evaluation. Still run
Recipe P when the user asks to publish, after an update, or when `NoRefresh` membership is stale
vs live Recipe A.

**Not publish:** `d360_segment_count` (async estimate only). `d360_activation_*` (activation).
`d360_segment_update` (definition change).

## Activate (optional, separate write)

Do not activate merely because the user asked to create or publish. If they request activation, show the existing target, require confirmation, then `search` the Activation family, bind the segment to the **existing** SFMC activation target, `execute`, and confirm SFMC receipt. Then read back with [STATUS.md](STATUS.md).

