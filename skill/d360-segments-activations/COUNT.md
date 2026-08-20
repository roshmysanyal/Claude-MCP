# Short count path (Recipe A only)

Use this file for **how many** doctors or patients. Do **not** open [SKILL.md](SKILL.md),
[CREATE.md](CREATE.md), [STATUS.md](STATUS.md), or [PUBLISH.md](PUBLISH.md) unless the
user asks to **build, update, publish, activate**, or **status** an audience, or the ask is blocked
below.

**Goal:** one progress line → map from the count YAML slice → one SQL count → English + Query.

---

## Stop — leave this path

Open the named recipe instead when:

- **Create / update** → [CREATE.md](CREATE.md)
- **Status** of a MarketSegment → [STATUS.md](STATUS.md)
- **Publish / activate** → [PUBLISH.md](PUBLISH.md)
- Patient **ZIP / miles** → [reference/zip-radius.md](reference/zip-radius.md)
- Patient **email opens/clicks** → say the engagement source is not usable; do not count it.
- **`PRD_PAT`** → empty; offer patient counts in the connected patient space.
- A concept is **not** in the count slice or the routed YAML (`strict`) → stop; do not invent joins.

CIA Consumer Marketable Email is **not** part of a count. Ask it only when they later say to build.

---

## 1. Route (do not ask which space)

| They say | Dataspace | Read this slice only |
| --- | --- | --- |
| doctors / physicians / HCPs | `STG_US` | [reference/slices/stg-us-count.yaml](reference/slices/stg-us-count.yaml) |
| patients / consumers | `DTC` | [reference/slices/dtc-count.yaml](reference/slices/dtc-count.yaml) |
| people / customers (no noun) | Ask **Doctors or patients?** then this table | — |
| they name Prod / Dev | that named space | full YAML via [reference/dataModel-index.yaml](reference/dataModel-index.yaml) |

Restate the ask in their words. One progress line, then work silently.

**YAML budget:** read the slice above. Map aliases (e.g. Pax → `PAXLOVID`) from the slice.
Grep the full `dataModel-*.yaml` **only** if the filter is not in the slice. Never guess DMO or join names.

---

## 2. Count contract

- Anchor: Unified Individual. `COUNT(DISTINCT` that Id`)`. Never count a related-object Id as people.
- Joins: Unified → IdentityLink → Individual → related DMO. Keys only from the slice / YAML `paths`.
- `SELECT` the count only. No names, emails, phones, NPIs, card numbers, or health values.
- Query **Data 360 only**. No Snowflake, PENDING, Delta, or matching table.
- If Unified Individual or IdentityLink is empty → **0 people** and the data gap. Do not fall back
  to activity grain.

**Known SQL tool:** `d360_query_sql` with `dataspace` + `input.sql`.

On a **count**, skip `search` and `payload_examples` unless `execute` fails. Then search
`"query sql"` → `payload_examples` for `d360_query_sql` → retry `execute`.

Keep create/update/publish on [CREATE.md](CREATE.md) / [PUBLISH.md](PUBLISH.md)
(`search` → `payload_examples` → `execute`).

---

## 3. Identity + common filters

**Patients (`DTC`)** — from the DTC slice:

- Unified `DTC_UnifiedIndividualDtc__dlm.Id__c`
- Link `DTC_UnifiedLinkIndividualDtc__dlm` (`UnifiedRecordId__c` / `SourceRecordId__c`)
- Individual `DTC_Individual__dlm.Id__c`
- Brand → `DTC_BrandProfile__dlm.IndividualId__c` (`Brand__c`, e.g. `PAXLOVID`)
- Opted in → `DTC_ContactPointConsent__dlm.PartyId__c` (`ConsentStatusId__c = 'IN'`)
- Copay → `DTC_CopayCard__dlm.IndividualId__c` (card number has a value; never return the number)
- Dates on the field the YAML names (consent captured, copay acquisition/recency, etc.)

**Doctors (`STG_US`)** — from the STG slice:

- Unified `stg_UnifiedIndividual__dlm.Id__c`
- Link `stg_IndividualIdentityLink__dlm`
- Headquarter email → `stg_Headquarter_Email_Engagement__dlm` (opens/clicks/sends as asked)
- Do **not** use empty Stage profile/consent as if they were populated.

Shape each filter as `Id__c IN (link… IN (related DMO…))` so 1:N rows do not inflate people.

---

## 4. Answer

**Stage / Dev / DTC** — English, then this exact line, then the SQL you ran:

> Since the counts are getting pulled from Stage, here is the reference query

**Prod** — English only; no Query.

No Salesforce audience link on a count.

Then ask: *Would you like to build this as a segment?* and *Is it for Email or SMS?*
Skip “build?” only if they already asked to create this audience. Skip channel only if they named it.

If the count is 0, say so in English and keep the Query (Stage). Profile only non-PII fields if you
need to explain empty vs unpopulated — still no PII literals.

---

## 5. Same chat

If this file and the routed **count slice** are already in the thread, **do not re-read them**. Map and
`execute`.
