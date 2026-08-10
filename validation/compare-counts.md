# Compare Counts — D360 vs. OCL/Snowflake

The gate that turns a Data 360 number into a **validated** POC result. Both success and failure
must be documented clearly so a refresh-timing gap is never misread as a system failure.

---

## Inputs

| Input | Source | Value |
|---|---|---|
| D360 count | Claude Pull result (Query family via MCP) | `__________` |
| D360 data-stream last refresh | org / Claude result | `__________` |
| OCL/Snowflake benchmark count | [run-benchmark.md](run-benchmark.md) | `__________` |
| OCL/Snowflake snapshot timestamp | `snapshot_ts` | `__________` |
| Agreed threshold | locked before Day 1 (target **2–5%**) | `____%` |

---

## Step 1 — Refresh-window gate (do this FIRST)

Confirm the D360 refresh timestamp and the OCL/Snowflake snapshot timestamp fall in the **same refresh
window**.

- If they **do not** align: **stop.** Do not compare or present numbers. Re-pull both within the
  same window, or wait for the next refresh cycle. A mismatch here is expected data latency, not a
  defect — but comparing across windows produces a misleading delta.

## Step 2 — Compute the delta

```
delta_% = abs(D360_count - OCL/Snowflake_count) / OCL/Snowflake_count * 100
```

- **delta_% ≤ threshold** → **VALIDATED.** Counts match within the agreed tolerance.
- **delta_% > threshold** → **NOT validated.** Investigate before presenting (see below).

## Step 3 — Record the result

| Field | Value |
|---|---|
| D360 count | |
| OCL/Snowflake count | |
| Delta % | |
| Threshold | |
| Same refresh window? (Y/N) | |
| **Verdict** (VALIDATED / NOT VALIDATED / DEFERRED — window mismatch) | |
| Notes (refresh times, investigation) | |

---

## If the delta exceeds threshold — investigate before presenting

Do **not** present a mismatched count to leadership as a result. Check, in order:

1. **Refresh timing** — most common cause. Re-confirm the window gate (Step 1).
2. **Filter parity** — do the D360 query filters exactly match `ocl-benchmark.sql`? (brand, state, opt-in flag, 60-day window boundary, DISTINCT on the same HCP id).
3. **Join fan-out** — is the OCL/Snowflake query double-counting HCPs with multiple web visits? Confirm `COUNT(DISTINCT hcp_id)`.
4. **Time-boundary semantics** — inclusive/exclusive on "last 60 days"; timezone of the event timestamp.
5. **Population definition** — same HCP universe (e.g. active vs. all) on both sides.

Iterate the D360 query (Phase 1) until the delta is within threshold, **or** document precisely why
it cannot be — that documentation is itself a valid POC finding.

---

## Reminder

- **Always dual-report** D360 vs the Snowflake **data-stream source table** first — see
  [d360-vs-snowflake-stream.md](d360-vs-snowflake-stream.md).
- **Einstein counts are never the benchmark.** Only OCL/Snowflake.
- A **VALIDATED** verdict on the Pull count is the exit gate for Phase 1. In Phase 2, the rebuilt
  segment's count must also reach **VALIDATED** before activation counts toward success.

### Required presentation (stream-source parity)

```text
**Data 360 count:** <N>
**Snowflake source count:** <M>
  Source: <DATABASE>.<SCHEMA>.<TABLE>
```

