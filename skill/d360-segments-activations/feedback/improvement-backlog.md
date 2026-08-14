# Improvement Backlog (skill owner's triage surface)

Where the **skill owner** turns noisy [session-log.md](session-log.md) entries into concrete,
*decided* changes to the one canonical skill. The log is the notebook; this is the triage surface;
`SKILL.md` / `dataModel-dev.yaml` are the governed artifacts that actually change agent behavior.

> **Owner:** the named skill/governance owner. Only the owner promotes items here into a merged edit
> of the governed skill — the same review bar as every other governance artifact in this repo
> ([before-using-and-on-data-model-changes.md](../reference/before-using-and-on-data-model-changes.md),
> [scaling-via-repo.md](../../scaling-via-repo.md)). Users log; the owner decides and ships.

---

## Review loop

Run on a cadence (weekly during the POC; adjust for production volume):

1. **Collect.** Read new entries in [session-log.md](session-log.md) (and any per-user logs, if the
   log has been split — see the scaling note there).
2. **Cluster.** Group by category + topic. One-off ≠ signal; a repeat across sessions/users is.
3. **Decide.** For each cluster, choose: **ship a skill change**, **wontfix** (with a reason), or
   **needs-info** (watch for more signal). Record it in the backlog table below.
4. **Ship one canonical edit.** Make the change in `SKILL.md` / `dataModel-dev.yaml` via a PR (audit
   trail). Merge → everyone pulls it next session. No per-machine edits, ever.
5. **Close the loop.** Set the source log entry's **Status** to `fixed in <PR>`, and add a row to
   **Shipped changes** below so the skill's evolution stays auditable.

> This mirrors the notebook → guidebook → `verified` promotion the schema already uses; here it's
> notebook (`session-log.md`) → decided change (this file) → merged skill edit.

---

## Backlog

| # | Signal (from log) | Category | Frequency | Proposed change | Target file | Owner decision | Status |
|---|---|---|---|---|---|---|---|
| 1 | Zero-count on an unpopulated field reads like "no such population" (gender example) | confusing | seed | Make the user-facing empty-result message explicitly distinguish "no matches" vs "field not populated" | `SKILL.md` (Recipe A / *Talking to the user*) | _pending owner review_ | open |
| | | | | | | | |

**Status values:** `open` · `in-progress` · `shipped` · `wontfix` · `needs-info`

---

## Shipped changes (audit trail)

What actually changed in the governed skill as a result of session feedback, so we can see it
improving over time.

| Date | Change | Files | PR / commit | From log entry |
|---|---|---|---|---|
| | | | | |
