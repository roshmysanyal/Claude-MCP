# Session Log (self-improvement notebook)

A **field notebook the agent appends to as it runs sessions** — where the user had to clarify
repeatedly, where a step failed, what was missing from the skill, what was confusing, what
workaround the user reached for. It turns one-off session friction into a reviewable signal so the
**skill owner** can improve the *one* canonical skill.

This is **notes, not edits.** Nothing written here changes agent behavior. It complements the other
self-improvement artifacts, exactly like [observed-values.md](../reference/observed-values.md) does
for the schema:

| Artifact | Role |
|---|---|
| **this file** (`feedback/session-log.md`) | *Notebook* — raw, per-session friction captured as it happens. Noisy on purpose. |
| [feedback/improvement-backlog.md](improvement-backlog.md) | *Triage surface* — the owner clusters recurring signals into concrete, decided skill changes. |
| [skill/…/SKILL.md](../SKILL.md) + [reference/dataModel-dev.yaml](../reference/dataModel-dev.yaml) | *The governed skill* — the only thing that changes agent behavior. Changed **only** by the owner, via the git loop. |

---

## The boundary that matters (why this exists)

The whole point of [scaling-via-repo.md](../../scaling-via-repo.md) is **one canonical skill, no
per-machine forks.** Session logging must not undermine that:

| Capture surface (may be local / per-user, then collected) | The governed skill (one canonical copy, owner-only) |
|---|---|
| This log — friction notes from a session | `SKILL.md`, recipes, guardrails |
| The improvement backlog (until a change is decided) | `dataModel-dev.yaml` semantic layer |

**Logs flow to the owner; only the owner edits the skill.** A user's session never rewrites the
skill on their own machine or stashes lessons in per-tool "memory" — that is exactly the drift
`scaling-via-repo.md` forbids. Improvements reach everyone the same way a verified field does: author
→ PR → owner review → merge → everyone pulls.

---

## Self-improvement mode (governance toggle)

Set by the **skill owner**, mirroring the Discovery-mode toggle in `SKILL.md`. This is the same
two-phase behavior the POC calls for:

- **`self-tune`** — *Phase 0 build / POC hardening only.* The agent both logs here **and** may
  propose concrete edits to the governed files (`SKILL.md`, `dataModel-dev.yaml`) — but only through the
  **author → PR → owner-review → merge** loop into the shared repo, tracked in
  [improvement-backlog.md](improvement-backlog.md). Never as silent local memory or a per-machine
  copy. This is the "self-learn and adjust while we build" phase.
- **`log-only`** — *default once the skill is in users' hands (production).* The agent **only**
  appends to this notebook. It does **not** edit `SKILL.md` or `dataModel-dev.yaml`. The skill owner
  reviews the logs and makes the single canonical adjustment. This is what prevents "a different
  version of the skill on everyone's machine."

> The toggle lives in `SKILL.md` (**Self-improvement logging** section). Keep the value here in sync
> for reference. **Current mode:** `<log-only | self-tune>` — set by the skill owner.

---

## Rules for appending (read before writing here)

1. **No PII, no raw data values, no secrets.** Same guardrail as everywhere in this repo. Describe
   the *friction*, never paste HCP rows, PII literals, OAuth tokens, `CLIENT_ID`, or `.env`
   contents. If volume matters, describe it in fill-rate terms ("field was empty for the whole
   sample"), not literals.
2. **Stamp every entry.** Date, `mode:` (`self-tune`/`log-only`), org (only if relevant to the
   friction), and skill version/commit if known. An unstamped entry is worthless — the owner can't
   tell if it's already fixed.
3. **One entry per distinct friction.** Record what happened and the signal, not an essay.
4. **Categorize** with a tag from the taxonomy below so the owner can cluster and triage. A category
   + topic that repeats across sessions is the strongest "improve the skill" signal.
5. **Log the misses and workarounds too.** "User had to rephrase the brand filter 3×," "the recipe
   said `search \"create segment\"` but the real op was named `…`," "user gave up on gender filters."
   These are the highest-value entries.
6. **This is not the skill.** In `log-only` you stop at logging. In `self-tune` you may *also* open a
   backlog item / PR — but the log entry comes first, and the guardrails in `SKILL.md` still bind.

### Category taxonomy

| Tag | Use when… |
|---|---|
| `clarify` | The user had to clarify, rephrase, or correct your interpretation (note how many rounds). |
| `failed` | A step didn't work — tool error, wrong operation name, rejected segment SQL, bad join, timeout. |
| `missing` | The user needed a concept/field/recipe step that isn't in the skill or semantic layer. |
| `confusing` | A skill instruction was ambiguous or misleading and sent you the wrong way. |
| `workaround` | The user/agent got it done off the documented recipe — a candidate to make on-recipe. |
| `friction` | It eventually worked, but the flow was clunky/slow/awkward. |
| `win` | Something worked notably well — worth protecting so a future edit doesn't regress it. |

### Entry schema

```
### <YYYY-MM-DD> · <short title> · [category] · mode:<self-tune|log-only>
- **Session/org:** <session id or user handle> · org <id, if relevant> · skill <version/commit>
- **What happened:** <plain English, no PII / no data literals>
- **Signal:** <clarify rounds, repeat count, sanitized error text, "user abandoned", …>
- **Hypothesis / proposed fix:** <optional — the skill change that might prevent it>
- **Status:** logged | promoted→backlog#<id> | fixed in <PR/commit>
```

---

## Session log (append-only — newest at the bottom)

<!-- Append entries using the schema above. Do not delete history; set Status instead. -->

### 2026-07-22 · Example — gender filter returns 0 but field is empty · [confusing] · mode:self-tune
- **Session/org:** seed example · org `trialsignup-d6178fbc40eb88` · skill (pre-v1)
- **What happened:** User asked for "male HCPs." The agent filtered on gender and returned 0, which
  reads like "no males exist." The field is actually unpopulated (see
  [observed-values.md](../reference/observed-values.md) → *Asked but unavailable*), so 0 means
  "not recorded," not "none."
- **Signal:** Recurring risk — any filter on an unpopulated field looks like a real zero.
- **Hypothesis / proposed fix:** Recipe A already says "profile on empty" — consider making the
  *user-facing* zero-result message explicitly distinguish "no matches" from "field not populated,"
  so a marketer never misreads an empty field as an empty population.
- **Status:** promoted→backlog#1

---

## How the skill owner uses this

1. On a cadence (weekly during the POC), read new entries here.
2. Cluster by category + topic. Repeats = signal.
3. Promote the real ones into [improvement-backlog.md](improvement-backlog.md) as decided changes.
4. Make the **one canonical edit** to `SKILL.md` / `dataModel-dev.yaml` via a PR (audit trail), then set
   the entry's **Status** to `fixed in <PR>`. Everyone picks it up on their next `git pull` — one
   change, every user, no drift.

> Scaling note (mirrors the propagation ladder in `scaling-via-repo.md`): a single shared append-only
> log is fine for the POC. As the user base grows and this file gets noisy or conflict-prone, split
> to per-user log files (or a small collector) that the owner aggregates — the invariant is
> unchanged: **logs are captured widely, the skill is edited in one place.**
