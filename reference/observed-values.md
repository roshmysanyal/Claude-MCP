# Observed Values (query-time profiling cache)

A **field notebook** the agent appends to as it runs queries: the real literal values it has
*seen* in a field, and the concepts it was *asked* to pull. It turns one-off query knowledge into
reusable context so the next request doesn't re-discover the same ground.

This is **not** a system of record and **not** the governed schema. It complements the two other
artifacts:

| Artifact | Role |
|---|---|
| [dataModel.yaml](dataModel.yaml) `sampleValues` | *Guidebook* — curated, illustrative values in the governed schema contract (architect-owned, `VERIFY`). |
| **this file** | *Field notebook* — raw values actually observed in results + asks that came up empty. A hint cache that can **promote up** into `sampleValues` once confirmed. |
| [before-using-and-on-data-model-changes.md](before-using-and-on-data-model-changes.md) | The verification/seeding loop that moves notebook → guidebook → `verified`. |

---

## Rules for appending (read before writing here)

1. **No PII values, ever.** Only non-PII categorical/coded fields (see each field's `pii` flag in
   [dataModel.yaml](dataModel.yaml)). Names, emails, birth dates, addresses, phone → record only
   *fill rate* (how many populated), never the literals.
2. **Stamp org + date.** Values are org-specific and refresh-specific. An entry without
   `org:` + `seen:` is worthless — someone will trust a stale literal from the wrong org.
3. **Everything here is `VERIFY`-grade.** Observations, not confirmed schema. Promotion to
   `dataModel.yaml sampleValues` (and then to `verified`) happens only via the architect loop.
4. **Profile with aggregation SQL — there's no profiler tool.** The GA `data360` facade has **no
   dedicated data-profiler**. `d360_profile_query` / `d360_profile_metadata` are the *Profile query
   API* (they query and describe the unified profile-category DMOs), **not** column statistics. To
   profile a field, write aggregation SQL through the Query SQL op (`d360_query_sql`): populated
   count/percent (fill-rate), cardinality (`COUNT(DISTINCT …)`), and — for non-PII, low-cardinality
   categorical fields — a value breakdown (`GROUP BY`). **PII-safety is your responsibility:** for
   `pii:true` fields record **fill-rate only, never the literals**. Null-and-empty-safe SQL
   (unpopulated text in Data Cloud is often `''`, not NULL — so `IS NOT NULL` over-reports):
   ```sql
   -- fill rate (any type): CAST makes the empty test valid for timestamps/numerics too
   SUM(CASE WHEN "fld" IS NOT NULL AND CAST("fld" AS VARCHAR) <> '' THEN 1 ELSE 0 END) AS filled
   -- category breakdown (non-PII fields only):
   SELECT "fld", COUNT(*) FROM "dmo" GROUP BY "fld" ORDER BY 2 DESC
   ```
5. **Record the misses too.** If a filter came back empty because the field is blank/absent, log it
   under *Asked but unavailable* — that saves the next person from chasing the same dead end.

---

## Observed fields

<!-- Append entries as: DMO . field | org | seen | values (with counts) | notes -->

### `ssot__Individual__dlm`

- **`ssot__TitleName__c`** — org `trialsignup-d6178fbc40eb88` · seen `2026-07-14` · 7/7 populated
  Distinct values (1 each): `VP Sales`, `Executive Officer`, `Buyer`, `President`,
  `President and CEO`, `Sales Manager`, `VP Customer Support`.
  *Note:* these are generic **business/CRM job titles**, not clinical HCP specialties.
- **`ssot__Salutation__c`** — org `trialsignup-d6178fbc40eb88` · seen `2026-07-14`, re-confirmed `2026-07-22` · 1/7 populated
  `Mr.` (1); the other 6 rows blank (`''`). Note the trailing period in the literal (`Mr.`, not `Mr`).
  Used as the filter for the `Individuals_Salutation_Mr` segment (built 2026-07-22).
- **`ssot__DataSourceId__c`** — org `trialsignup-d6178fbc40eb88` · seen `2026-07-14` · 7/7 populated
  Single value: `Salesforce_Home` (7). All rows come from one CRM source.

---

## Asked but unavailable

Concepts a request tried to filter on where the backing field turned out empty or absent.

- **"male" / gender** → mapped to `ssot__Individual__dlm.ssot__GenderIdentity__c` (and
  `ssot__GenderId__c`). org `trialsignup-d6178fbc40eb88` · `2026-07-14`. **0/7 populated** — every
  row is an empty string. A gender filter returns 0 not because there are no males, but because
  **no gender is recorded**. The real "male" literal (`Male`? `M`? a coded id?) is unknown until
  populated data exists.
- **birth date / age** → `ssot__Individual__dlm.ssot__BirthDate__c`. org
  `trialsignup-d6178fbc40eb88` · `2026-07-14`. **0/7 populated** (all NULL). No age filters possible.

---

## Standing observation about this org

The 7 `ssot__Individual__dlm` rows in `trialsignup-d6178fbc40eb88` look like standard Salesforce
**CRM Contacts** (business job titles, single `Salesforce_Home` data source, no gender/DOB) — **not
HCP data**. Good enough to prove the query pipe; it has none of the HCP attributes the POC's
segments actually filter on. Real validation needs the customer Data Cloud org.
