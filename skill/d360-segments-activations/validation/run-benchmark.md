# Run the OCL/Snowflake Benchmark

This produces the **formal OCL source-of-truth count** for the Phase 1 **"validated"** label.
Run it independently of Claude/D360, in the **same refresh window** as the D360 count.

For the **required dual report on every count** (D360 DMO vs the immediate Snowflake
data-stream table), see [d360-vs-snowflake-stream.md](d360-vs-snowflake-stream.md) first —
that parity step is separate from this OCL benchmark.

> **Owner:** the Salesforce Data Cloud Architect confirms the exact OCL/Snowflake view/column names in
> [ocl-benchmark.sql](ocl-benchmark.sql) before Phase 1. If the OCL/Snowflake stream is unavailable or not
> returning a count for the HCP segment, **pause the POC** until an alternate benchmark is
> established — do not fall back to Einstein.

---

## Option 1 — snowsql (CLI)

```bash
# One-time: configure connection (~/.snowsql/config) or pass flags inline
snowsql \
  -a <ACCOUNT> \
  -u <USER> \
  --warehouse <WAREHOUSE> \
  --dbname <DATABASE> \
  --schemaname <SCHEMA> \
  -f validation/ocl-benchmark.sql \
  -o output_format=csv \
  -o timing=true
```

Record two things from the output:
1. `opted_in_brand_hcp_web_visitors` — the benchmark **count**.
2. `snapshot_ts` — the **Snowflake snapshot timestamp**.

## Option 2 — Python connector

```python
import snowflake.connector

conn = snowflake.connector.connect(
    account="<ACCOUNT>", user="<USER>", password="<PASSWORD>",  # or key-pair / SSO
    warehouse="<WAREHOUSE>", database="<DATABASE>", schema="<SCHEMA>",
)
with conn.cursor() as cur, open("validation/ocl-benchmark.sql") as f:
    for stmt in [s for s in f.read().split(";") if s.strip()]:
        cur.execute(stmt)
    count, snapshot_ts = cur.fetchone()
    print(f"OCL/Snowflake benchmark count = {count}  (snapshot {snapshot_ts})")
```

---

## Capture both refresh timestamps

Before comparing, record **both** timestamps so the compare step can confirm the same refresh window:

| What | Where to get it | Value |
|---|---|---|
| **D360 data-stream last refresh** | From Claude's Pull result, or query the org's data-stream refresh status | `__________` |
| **OCL/Snowflake snapshot** | `snapshot_ts` from this query | `__________` |

Then proceed to [compare-counts.md](compare-counts.md).
