# Observed Values (query-time profiling cache)

A **field notebook** the agent appends to as it runs queries: the real literal values it has
*seen* in a field, and the concepts it was *asked* to pull. It turns one-off query knowledge into
reusable context so the next request doesn't re-discover the same ground.

This is **not** a system of record and **not** the governed schema. It complements the two other
artifacts:

| Artifact | Role |
|---|---|
| [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues` | *Guidebook* — curated, illustrative values in the governed schema contract (architect-owned). |
| **this file** | *Field notebook* — raw values actually observed in results + asks that came up empty. A hint cache that can **promote up** into `sampleValues` once confirmed. |
| [before-using-and-on-data-model-changes.md](before-using-and-on-data-model-changes.md) | The verification/seeding loop that moves notebook → guidebook → `verified`. |

---

## Rules for appending (read before writing here)

1. **No PII values, ever.** Only non-PII categorical/coded fields (see each field's `pii` flag in
   [dataModel-dev.yaml](dataModel-dev.yaml)). Names, emails, birth dates, addresses, phone → record only
   *fill rate* (how many populated), never the literals.
2. **Stamp org + date.** Values are org-specific and refresh-specific. An entry without
   `org:` + `seen:` is worthless — someone will trust a stale literal from the wrong org.
3. **Everything here is `VERIFY`-grade.** Observations, not confirmed schema. Promotion to
   `dataModel-dev.yaml` sampleValues (and then to `verified`) happens only via the architect loop.
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
   ```

   **Canonical value-distribution query** (use when the user asks about a specific value, or you
   are unsure what values a non-PII field holds):
   ```sql
   SELECT
       t."<group_field>"                    AS group_value,
       COUNT(DISTINCT t."<count_key>")      AS n
   FROM "<object>" t
   WHERE t."<filter_field>" = '<value>'     -- optional; drop if no filter
   GROUP BY t."<group_field>"
   ORDER BY n DESC                          -- order by the alias, not COUNT() again
   LIMIT 20;                                -- top-N; drop for the full distribution
   ```
   Prefer `COUNT(DISTINCT <count_key>)` at the right grain (person / event PK). Drop `WHERE` for
   the full vocabulary. Never `GROUP BY` a `pii:true` column.

5. **Where to store results.** Always append here (dataspace + `seen:` date + counts). When the
   vocabulary is stable and useful for future filters, also propose `sampleValues` on the field in
   the routed dataModel YAML (`dataModel-dev.yaml`, `dataModel-dtc.yaml`, …) as `VERIFY` until the
   architect promotes it.

6. **Record the misses too.** If a filter came back empty because the field is blank/absent, log it
   under *Asked but unavailable* — that saves the next person from chasing the same dead end.

---

## Observed fields

<!-- Append entries as: DMO . field | org | seen | values (with counts) | notes -->

### Development dataspace (DEV-US) — primary POC org

Seeded via MCP `d360_query_sql` · seen `2026-08-06`.

#### Row counts (snapshot)

| DMO | Rows |
|---|---|
| `dev_Individual__dlm` | ~1,510,888 |
| `dev_UnifiedIndividualRs1__dlm` | ~1,091,081 |
| `dev_UnifiedLinkIndividualRs1__dlm` | ~1,510,888 |
| `dev_ContactPointEmail__dlm` | ~999,600 |
| `dev_EmailEngagement__dlm` | ~7,570,496 |
| `dev_ContactPointAddress__dlm` | **0** |
| `dev_WebsiteEngagement__dlm` | **0** |
| `dev_NBRxAggregated__dlm` | **0** |
| `dev_ContactPointConsent__dlm` | **0** |
| `dev_ConsentPreference__dlm` | **0** |
| `dev_HcpSegmentation__dlm` | **0** |

#### `dev_EmailEngagement__dlm`

- **`EngagementChannelActionId__c`** — dataspace `Development` · seen `2026-08-07`
  (distinct HCP counts):
  | Value | Distinct HCPs |
  |---|---|
  | `Send` | 530,367 |
  | `Open` | 255,261 |
  | `Click` | 56,256 |
  | `Bounce` | 49,693 |
  | `Opt Out` | 12,781 |
  | `Complaint` | 550 |
  In [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues`.

- **`EngagementChannelId__c`** — dataspace `Development` · seen `2026-08-07`
  | Value | Distinct HCPs |
  |---|---|
  | `Email` | 530,380 |
  In [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues`.

#### `dev_ContactPointEmail__dlm`

- **`PrimaryFlag__c`** — dataspace `Development` · seen `2026-08-07`
  | Value | Count |
  |---|---|
  | `1` | 999,700 |
  In [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues` (canonical observed = `1`).

- **`IsActive__c`** — dataspace `Development` · seen `2026-08-07` · **all NULL**
  (~999K). Architect expects Yes/True — not observed live yet.

- **`EmailDomain__c`** — dataspace `Development` · seen `2026-08-07` · top domains
  (case-insensitive fold recommended; source stores mixed case):
  `gmail.com`, `yahoo.com`, `hotmail.com`, `aol.com`, `hcahealthcare.com`,
  `msn.com`, `comcast.net`, `sbcglobal.net`, `nyp.org`, `upmc.edu`.
  In [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues`.

#### `dev_PartyIdentification__dlm`

- **`Name__c` / `PartyIdentificationTypeId__c`** — dataspace `Development` · seen `2026-08-07`
  | Name | Type | Distinct parties |
  |---|---|---|
  | `MC Subscriber Key` | `Person Identifier` | 1,093,338 |
  No NPI-labeled rows yet. In [dataModel-dev.yaml](dataModel-dev.yaml) `sampleValues`.

#### `dev_Individual__dlm` / `dev_UnifiedIndividualRs1__dlm`

- **`Salutation__c` / `Profession__c` / `HcpType__c` / `HcpStatusCode__c` /
  `ValidationStatus__c` / boolean flags (`RegisteredUser__c`, `TestUser__c`,
  `PfizerEmployee__c`, `HcpSuppression__c`)** — dataspace `Development` · seen
  `2026-08-07` · **unpopulated** (null / `''`). No live `sampleValues`.

#### Empty DMOs (no value vocabulary)

`ContactPointAddress`, `WebsiteEngagement`, `NBRxAggregated`, `ContactPointConsent`,
`ConsentPreference`, `HcpSegmentation` — still **0 rows** as of `2026-08-07`.
Consent `sampleValues` (`IN`, `UNKNOWN`) remain from CIA reference segments only.

---

### DTC dataspace — patient / consumer

Seeded via MCP `d360_query_sql` · seen `2026-08-07`.

#### `DTC_ContactPointConsent__dlm`.`ConsentStatusId__c`

| Value | Count |
|---|---|
| `IN` | 172,322 |
| `UNKNOWN` | 95,878 |
| `OUT` | 5,825 |
| `Yes` | 45 |
In [dataModel-dtc.yaml](dataModel-dtc.yaml) `sampleValues`.

#### `DTC_ConsentPreference__dlm`

- **`PreferenceType__c`:** `Brand`, `Topic`
- **`PreferenceValue__c`:** `IN`, `OUT`, `UNKNOWN`
- **`PreferenceName__c` (top):** `ALL`, `PFIZERFORALL`, `PREMARIN`, `COMIRNATY`,
  `ESTRING`, `LITFULO`, `LIVING_WITH_CANCER`, `DUAVEE`, `GENOTROPIN`, `XELJANZ`
In [dataModel-dtc.yaml](dataModel-dtc.yaml) `sampleValues`.

#### `DTC_BrandProfile__dlm`

- **`Brand__c` (top by distinct patient):** `PREMARIN`, `COMIRNATY`, `ESTRING`,
  `LITFULO`, `GENOTROPIN`, `XELJANZ`, `PAXLOVID`, `DUAVEE`, `CIBINQO`, `NURTEC`, …
  (~83K null Brand rows).
- **`CustomerType__c` (clean set):** `Patient`, `Caregiver`, `Prospect`, `Other`, `HCP`
  (many nulls; some dirty concatenated strings).
In [dataModel-dtc.yaml](dataModel-dtc.yaml) `sampleValues`.

---

### Historical — `trialsignup-d6178fbc40eb88` (pre-customer sandbox)

Kept for audit; **not** the POC org. Do not use these literals against Development.

#### `ssot__Individual__dlm`

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

### Development (2026-08-06)

- **state / region** → `dev_ContactPointAddress__dlm.StateProvinceId__c`. Table has **0 rows**.
  State filters return 0 until the address stream loads.
- **website visit** → `dev_WebsiteEngagement__dlm`. Table has **0 rows**.
- **NBRx / wrote an Rx** → `dev_NBRxAggregated__dlm`. Table has **0 rows**.
- **opt-in consent** → `dev_ContactPointConsent__dlm` / `dev_ConsentPreference__dlm`. Both **0 rows**.
  Interim opt-out signal only: `EmailEngagement.EngagementChannelActionId__c = 'Opt Out'`.
- **primary specialty** → `dev_Individual__dlm.PrimarySpecialty__c`. Field exists; **all-null** at seed.
- **brand affiliation on Individual** → **no such field**. Use `NBRxAggregated.Brand__c` or
  `HcpSegmentation.Brand__c` (both empty at seed).

### Historical — trialsignup

- **"male" / gender** → mapped to `ssot__Individual__dlm.ssot__GenderIdentity__c` (and
  `ssot__GenderId__c`). org `trialsignup-d6178fbc40eb88` · `2026-07-14`. **0/7 populated**.
- **birth date / age** → `ssot__Individual__dlm.ssot__BirthDate__c`. org
  `trialsignup-d6178fbc40eb88` · `2026-07-14`. **0/7 populated** (all NULL).

---

## Standing observation about Development (DEV-US)

Identity resolution, Individuals, emails, and email engagement are live and queryable. Address,
website, NBRx, consent, and HCP segmentation are **schema-mapped but empty** — demo counts that
depend on those streams will be 0 until data lands. Best demo path today:
`email_openers_last_90_days` (Open/Click on `dev_EmailEngagement__dlm`).
