# Prompt test template — iterate any set

**Purpose:** Drop in N everyday-language prompts, score each turn, then turn failures into
concrete Skill edits. Re-run only the failures until they pass twice.

**Companion:** Fixed walkthrough with starter prompts —
[skill-iteration-demo.md](skill-iteration-demo.md).  
**Quick CSV batch (Count / Segment flags):** [testing-template.csv](testing-template.csv) ·
paste blocks: [testing-prompts.md](testing-prompts.md).  
**Pre-filled 8-prompt mixed run:** [prompt-test-run-2026-08-14.md](prompt-test-run-2026-08-14.md).  
**Not** the leadership dual-count room script —
[../usecase-prompts/demo-run-sheet.md](../usecase-prompts/demo-run-sheet.md).

---

## Quick CSV mode (fast iterate)

Use [testing-template.csv](testing-template.csv) when you only need to say “count” vs “count + segment”
per prompt:

| Column | Meaning |
| --- | --- |
| **Prompt** | Exact paste text |
| **Count** | `TRUE` = expect a Recipe A count (English + Query) |
| **Segment** | `TRUE` = also build a segment after the count; `FALSE` = count only |

Example row intent:

```text
Prompt: Patients who have a Nurtec copay card…
Count: TRUE
Segment: FALSE
```

Paste **one Prompt per turn**. Honor **Count** / **Segment** — do not invent a create when
`Segment: FALSE`. Expect everyday English + the **Query** (Data 360 only). No Snowflake count,
matching table, PENDING, Delta, or dual-report. Score in the cards below (or just mark Pass/Fail
on the CSV Notes column).

---

## How to run a batch

1. Duplicate this file (or copy the **Session header** + **Prompt cards** into a dated note).
2. Fill the header. List prompts in the **Prompt bank** (everyday marketer language — do **not**
   paste DMO-named copy from [chat-starters.md](chat-starters.md) unless you are intentionally
   skipping routing).
3. New Cursor chat · Skill `d360-segments-activations` on · `data360` MCP connected.
4. Paste **one prompt per turn**. Score the card **before** the next prompt.
5. Optional follow-up replies go in the card (e.g. `No, just the count` / `Yes — Email` / CIA answer).
6. After the set, fill **Feedback capture** and promote lasting fixes via
   [../skill/d360-segments-activations/feedback/improvement-backlog.md](../skill/d360-segments-activations/feedback/improvement-backlog.md).

**Pass bar (every count):** natural English with *doctors* or *patients* + number · Stage/Dev/DTC
then **Query** · Prod = count only, no Query · no segment link on a count · no Snowflake /
PENDING / Delta · after Recipe A ask **build?** and **Email or SMS?** · **progress lines** stay
marketer-friendly (no skill/schema/join path/Unified Individual narration)

---

## Session header

| Field | Value |
| --- | --- |
| **Date** | |
| **Reviewer** | |
| **Skill commit / version** | |
| **Focus this run** | e.g. routing · count shape · CIA · Prod · progress lines |
| **Env notes** | MCP connected? new chat per round? |

**Hypothesis / what you are trying to prove**

> …

---

## Prompt bank (fill before the run)

Paste the exact wording you will send. Keep everyday language so routing is under test.

| # | Audience | Intent (1 line) | Prompt (exact paste) | Follow-up if any |
| --- | --- | --- | --- | --- |
| 1 | doctors / patients / ambiguous | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |

Add rows as needed. Prefer **one concern per prompt** so a Fail points at one Skill edit.

---

## Score grid (fill during the run)

| # | Pass? | Count shape OK? | Routing OK? | Progress voice OK? | Build?/channel? | Notes (quote agent if useful) |
| --- | :---: | :---: | :---: | :---: | :---: | --- |
| 1 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 2 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 3 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 4 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 5 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 6 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 7 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |
| 8 | ☐ | ☐ | ☐ | ☐ | ☐ / n/a | |

**Legend:** Pass = whole turn meets the pass bar for that prompt type. Use **n/a** for Build?/channel
when the turn is status-only, refuse, or you already said “count only.”

---

## Prompt cards (copy one block per prompt)

Duplicate this section for each bank row. Score immediately after the agent replies.

### Prompt __ — <short label>

**Intent:** <what Skill behavior you are testing>

```text
<exact prompt>
```

**Planned reply(s) this turn (if any):**

```text
<e.g. No, just the count for now. / Yes — build it for Email. / No CIA. / Doctors in Stage.>
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Routes correctly (Stage/Dev/Prod or auto-DTC; asks only when ambiguous) | ☐ | |
| Restates ask in everyday language before / while working | ☐ | |
| Progress lines stay marketer-friendly (no schema/DMO/SQL narration) | ☐ | |
| People count anchors on Unified Individual (not related-DMO IDs) | ☐ | |
| Empty path → 0 people + gap (no activity-grain fallback) | ☐ | |
| Leads with English + number (*doctors* / *patients*) | ☐ | |
| Stage/Dev/DTC: **Query** after the sentence · Prod: **no** Query | ☐ | |
| No segment link on a count · no Snowflake / PENDING / Delta | ☐ | |
| After Recipe A count: asks build? + Email or SMS? (unless already answered) | ☐ | |
| Patient create/update: asks CIA before writing (does not nest/skip silently) | ☐ | n/a |
| Create: name ends with `test` / `_test` · lookback **P2Y** | ☐ | n/a |
| Status of existing MarketSegment: link OK · does **not** re-ask build?/channel | ☐ | n/a |
| PII / list ask: refuses (no sample rows) | ☐ | n/a |

**Observed reply (short):**

> …

**Verdict:** Pass · Fail · Partial  
**If Fail — desired behavior in one sentence:**

> …

**Likely Skill file to change:** `SKILL.md` / `.cursor/rules/…` / `reference/…`

---

## Feedback capture (fill after the run)

### What felt right

1. …
2. …

### What broke or felt wrong

| # | Prompt # | Issue | Desired behavior | Skill file to change |
| --- | --- | --- | --- | --- |
| 1 | | | | `SKILL.md` / rules / reference |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

### Skill edits to make next (ordered)

1. …
2. …
3. …

### Re-test plan

- Re-run **only** failed prompt #s: ________
- Same wording. Mark Pass when that checklist row is green **twice in a row**.
- Optionally append a friction note to
  [../skill/d360-segments-activations/feedback/session-log.md](../skill/d360-segments-activations/feedback/session-log.md)
  and a triage row in
  [../skill/d360-segments-activations/feedback/improvement-backlog.md](../skill/d360-segments-activations/feedback/improvement-backlog.md).

---

## Quick reference — expected behaviors

| You say | Skill should |
| --- | --- |
| *doctors* + Stage/Dev/Prod | HCP space; ask env only if missing |
| *patients* / *consumers* | **DTC** immediately |
| *customers* / *people* / *audience* | Ask doctors or patients? |
| Recipe A count | English → Query (not Prod) → build? + Email/SMS? |
| Patient create / update | Ask CIA first; name `… test`; lookback **P2Y** |
| Status of a MarketSegment | Count + link; no build?/channel questions |
| Names / emails / NPI list | Refuse |

**Seed prompts (fixed script):** [skill-iteration-demo.md](skill-iteration-demo.md)  
**DMO-named FAQs (skip routing):** [example-prompts.md](example-prompts.md)  
**Clean count starters:** [chat-starters.md](chat-starters.md)
