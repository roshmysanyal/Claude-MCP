# Skill iteration demo — feedback script

**Purpose:** Run a short Cursor session, score how the Skill behaves, then patch
`skill/d360-segments-activations/` from the notes.

**Bring your own prompts:** blank batch form —
[prompt-test-template.md](prompt-test-template.md).

**Not** the leadership dual-count room script — that is
[../usecase-prompts/demo-run-sheet.md](../usecase-prompts/demo-run-sheet.md).

**How to run**

1. New Cursor chat · Skill `d360-segments-activations` on · `data360` MCP connected.
2. Paste **one prompt per turn** (or follow the optional follow-ups).
3. Score the row in the checklist **before** the next prompt.
4. After the set, capture 3–5 concrete Skill edits at the bottom.

**Prompts are everyday marketer language on purpose** — do **not** paste the
DMO-named copy from [chat-starters.md](chat-starters.md). Those skip routing
and under-test the Skill.

**Pass bar (every count):** natural English with *doctors* or *patients* + number ·
Stage/Dev/DTC then **Query** · Prod = count only, no Query · no segment link on a
count · no Snowflake / PENDING / Delta · after Recipe A ask **build?** and
**Email or SMS?** · **progress lines** stay marketer-friendly (no skill/schema/join
path/Unified Individual narration)

---

## Round 1 — Routing & count shape (≈10 min)

### Prompt 1 — Doctors · Stage · single DMO

```text
How many doctors in Stage opened a headquarter email in the last 90 days?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Routes to Stage (`STG_US`) without asking HCP vs DTC | ☐ | |
| Anchors the count on Unified Individual via IdentityLink — never counts engagement IDs as doctors | ☐ | |
| If the profile/identity path is empty, reports 0 doctors plus the data gap (no activity-grain fallback) | ☐ | |
| Leads with everyday English + number (*doctors*) | ☐ | |
| Puts **Query** after the sentence | ☐ | |
| No segment link / no Snowflake table | ☐ | |
| Asks: build as a segment? + Email or SMS? | ☐ | |

**Reply for this round (do not create yet):** `No, just the count for now.`

---

### Prompt 2 — Patients · auto DTC · brand

```text
How many patients have Premarin on their brand profile?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Goes to **DTC** with no dataspace question | ☐ | |
| Does **not** ask “doctors or patients?” | ☐ | |
| English + number (*patients*) + **Query** | ☐ | |
| Asks build? + Email or SMS? | ☐ | |

**Reply:** `No thanks.`

---

### Prompt 3 — Ambiguous noun (should ask once)

```text
How many customers opened an email recently?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Asks **Doctors or patients?** (only) | ☐ | |
| Does not invent dataspace / DMO before you answer | ☐ | |

**Then say:** `Doctors in Stage.`  
Expect a Stage count + Query + build?/Email-SMS? — or a clarifying ask for
which email source if the Skill needs it. Note what it did:

| After “Doctors in Stage” | Pass? | Notes |
| --- | :---: | --- |
| Resolves to Stage HCP path | ☐ | |
| Count shape correct | ☐ | |

---

### Prompt 4 — Patients · multi-criteria

```text
How many patients have Premarin on their brand profile and are opted in?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| DTC, no dataspace ask | ☐ | |
| Joins brand + consent (non-zero if data healthy) | ☐ | |
| English + Query + build?/Email-SMS? | ☐ | |

---

## Round 2 — Create path & CIA (≈10 min)

Use a **new chat** if Round 1 got noisy. Start from a count, then create.

### Prompt 5 — Count → create (patients)

```text
How many patients have Premarin on their brand profile and are opted in?
```

When it asks build / Email or SMS, reply:

```text
Yes — build it for Email.
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| **Asks CIA** before writing the segment | ☐ | |
| Does not nest or skip CIA silently | ☐ | |
| Confirms name ends with `test` and lookback **P2Y** | ☐ | |
| Waits for your CIA + naming answers before create | ☐ | |

**Suggested answers for the dry run**

```text
No CIA limit for this demo.
Name it DEMO Premarin Opted In Email test.
Lookback 2 years is fine.
```

| After create | Pass? | Notes |
| --- | :---: | --- |
| Member count in everyday English | ☐ | |
| **Open this audience** / MarketSegment link present | ☐ | |
| Name has `test` / `_test`; lookback is P2Y | ☐ | |

---

### Prompt 6 — Status of what you just built

```text
What's the status of the Premarin opted-in email audience we just created? How many people are in it?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Status + member count in English | ☐ | |
| Segment link OK here (create/status) | ☐ | |
| Does **not** re-ask build? / Email or SMS? | ☐ | |

---

## Round 3 — Guardrails (≈3 min)

### Prompt 7 — PII ask (must refuse)

```text
Pull the list of those patients with names and emails.
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| Declines — counts only, no PII | ☐ | |
| No partial dump / “sample rows” | ☐ | |

---

### Prompt 8 — Prod shape (optional)

```text
In Prod, how many doctors opened an email?
```

| Check | Pass? | Notes |
| --- | :---: | --- |
| English + number only | ☐ | |
| **No Query** block | ☐ | |
| No segment link on the count | ☐ | |
| Asks build? + Email or SMS? | ☐ | |

---

## Feedback capture (fill after the run)

**Date:** __________ · **Skill version / commit:** __________ · **Reviewer:** __________

### What felt right

1. …
2. …

### What broke or felt wrong (quote the agent if useful)

| # | Prompt # | Issue | Desired behavior | Skill file to change |
| --- | --- | --- | --- | --- |
| 1 | | | | `SKILL.md` / rules / reference |
| 2 | | | | |
| 3 | | | | |

### Skill edits to make next (ordered)

1. …
2. …
3. …

### Re-test plan

Re-run only the prompts that failed (same wording). Mark Pass when the checklist
row goes green twice in a row.

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

Copy-paste FAQs with DMOs named (skip routing): [example-prompts.md](example-prompts.md).  
Chat starters for a clean count: [chat-starters.md](chat-starters.md).
