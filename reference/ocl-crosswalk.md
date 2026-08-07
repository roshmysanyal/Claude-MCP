# OCL / Snowflake ↔ Data 360 Crosswalk

**Purpose.** The OCL/Snowflake benchmark and the Data 360 query describe the *same business
population* through two different physical schemas. They are **not 1:1**. This file maps each
business **concept** to its counterpart on both sides so the two counts are provably measuring the
same thing — and so any residual delta is *explainable* rather than a surprise.

This is the OCL/Snowflake half of the semantic layer. The D360 half lives in
[dataModel-dev.yaml](dataModel-dev.yaml); keep the two in sync.

> **Status:** DRAFT / iterating. The **D360 side** below is seeded from the live Development
> (DEV-US) dataspace via MCP (2026-08-06) — see [dataModel-dev.yaml](dataModel-dev.yaml). The
> **OCL/Snowflake side is `<PLACEHOLDER>`** until the Salesforce Data Cloud Architect confirms the
> real Snowflake view/column names. Nothing here is a benchmark until the count spine and the
> concept rows below are signed off.

---

## Authoring-time vs. runtime (how this stays governed)

Discovery and constraint are **not** in conflict — they happen at different times, with a human at
the boundary.

- **Authoring time (Phase 0) — pre-populate.** D360 lineage (data streams → DLO → DMO field
  mappings) can be pulled straight from the org (`/ssot/data-streams`,
  `/ssot/data-model-object-mappings`, `/ssot/data-model-objects`) to *draft* the structural rows
  below. This is an accelerator, not an authority.
- **Human override + lock (still Phase 0).** The Data Cloud Architect + governance owner review the
  draft, trim it to the authorized HCP scope, correct it, and lock it — *"THESE are the objects/
  fields you may use."* Only the human-approved file is trusted. (Mirrors the `VERIFY → verified`
  flip in [dataModel-dev.yaml](dataModel-dev.yaml).)
- **Runtime — constrained.** Claude reads only the locked semantic layer; it does not go exploring
  the org. How much latitude it has is set by the **discovery-mode toggle** in
  [../skill/d360-segments-activations/SKILL.md](../skill/d360-segments-activations/SKILL.md) (`strict` = locked model
  only; `propose` = may draft `VERIFY` proposals for a human to confirm).

So: the tool proposes, the human disposes, and runtime stays inside the human-locked boundary.

---

## The count spine: NPI

The reconciliation key is the **HCP NPI**. Data 360 identity resolution collapses source rows that
share an NPI into one golden `UnifiedIndividual`, so:

```
COUNT(DISTINCT UnifiedIndividual.Id__c)   ≈   COUNT(DISTINCT NPI)
```

and the flat Snowflake `COUNT(DISTINCT NPI) FROM <RxTable>` counts that same unit. The D360 query
just pays the traversal tax (UI → UL → I → child) to arrive at the same set of NPIs.

**Design decision (proposed):** count `DISTINCT NPI` on **both** sides for the benchmark. This
removes identity resolution as a variable and makes the comparison apples-to-apples. Separately
report `COUNT(DISTINCT Id__c)` on the unified profile alongside it to show what resolution actually
did (the gap between the two *is* a useful finding, not an error).

| | Count expression | Notes |
|---|---|---|
| **D360 (benchmark-comparable)** | `COUNT(DISTINCT PartyIdentification.IdentificationNumber__c)` filtered to NPI type | On `dev_PartyIdentification__dlm` via `Individual.Id__c = PartyId__c`. Type literal VERIFY — seed only has `Name__c = 'MC Subscriber Key'`. NPI is PII (`pii:true`); counts OK, never return values. |
| **D360 (product-truth, report alongside)** | `COUNT(DISTINCT UnifiedIndividual.Id__c)` | resolved golden person (`dev_UnifiedIndividualRs1__dlm`) |
| **OCL / Snowflake** | `COUNT(DISTINCT <OCL/Snowflake NPI column>)` | `<PLACEHOLDER>` |

---

## Concept crosswalk

For each business concept: the D360 mapping (from `dataModel-dev.yaml`) and the OCL/Snowflake mapping
(architect to fill). "Polarity" and "value map" columns exist because these are the silent
count-breakers.

| Concept | D360 side (from dataModel-dev.yaml) | OCL / Snowflake side | Watch-outs |
|---|---|---|---|
| **Person / count unit** | NPI → `UnifiedIndividual.Id__c` (via identity resolution) | `<OCL/Snowflake NPI column>` in `<OCL/Snowflake HCP/Rx table>` | NULL NPIs dropped by `COUNT(DISTINCT)`; see divergence #1 |
| **Brand** | `NBRxAggregated.Brand__c` or `HcpSegmentation.Brand__c` (not on Individual) | `<OCL/Snowflake brand column>` | value map: D360 literal vs OCL/Snowflake literal; both brand DMOs empty at seed |
| **State / region** | `ContactPointAddress.StateProvinceId__c` (via `PartyId`) | `<OCL/Snowflake state column>` | D360: state is on the *address*, not the person. Address table empty at seed (2026-08-06) |
| **Opted-in / emailable** | `ContactPointConsent.ConsentStatusId__c` (preferred; empty at seed). Interim: EmailEngagement `EngagementChannelActionId__c <> 'Opt Out'` | `<OCL/Snowflake consent column> = <?>` | **polarity**: confirm OptIn vs OptOut literal once consent data lands |
| **Website visit ≤ N days** | `WebsiteEngagement.EngagementDateTm__c >= now - N days` | `<OCL/Snowflake web events table>.<ts column>` | WebsiteEngagement empty at seed; site identity via `PageURL__c` / `TherapeuticArea__c` / `Indication__c` |
| **Wrote an Rx / NBRx** | `Individual → NBRxAggregated` (`individual_has_nbrx`) | `<OCL/Snowflake Rx table>` rows | `dev_NBRxAggregated__dlm` empty at seed; confirm same source feed |
| **Email open / click** | `EmailEngagement.EngagementChannelActionId__c` in (`Open`,`Click`) | `<OCL/Snowflake email eng table>` | Observed actions: Send, Open, Click, Bounce, Opt Out, Complaint |

---

## Worked example A — NBRx count

**Ask:** "How many HCPs have NBRx for `<brand>` in `<state>`?"

**D360** (identity-resolution path; from the `hcp_wrote_nbrx_by_brand` journey):

```sql
SELECT COUNT(DISTINCT ui."Id__c") AS hcp_count   -- or DISTINCT NPI (see spine)
FROM "dev_UnifiedIndividualRs1__dlm" ui
JOIN "dev_UnifiedLinkIndividualRs1__dlm" link
  ON link."UnifiedRecordId__c" = ui."Id__c"
JOIN "dev_Individual__dlm" i
  ON i."Id__c" = link."SourceRecordId__c"
JOIN "dev_ContactPointAddress__dlm" addr
  ON addr."PartyId__c" = i."Id__c"
JOIN "dev_NBRxAggregated__dlm" rx
  ON rx."IndividualId__c" = i."Id__c"
WHERE rx."Brand__c" = '<brand>'
  AND rx."NBRxCount__c" > 0
  AND addr."StateProvinceId__c" = '<state code>';
```

**OCL / Snowflake** (flat — matches *only* because this ask reduces to prescriber NPI):

```sql
SELECT COUNT(DISTINCT <NPI_COL>) AS hcp_count
FROM <OCL/Snowflake_RX_TABLE> rx
[JOIN <OCL/Snowflake_HCP_DIM> h ON h.<NPI_COL> = rx.<NPI_COL>]   -- needed once a state/attribute filter is added
WHERE rx.<BRAND_COL> = '<brand>'
  AND <STATE_COL> = '<state code>';
```

> The Snowflake side is only "one table" for filterless asks. As soon as a **person-attribute**
> filter (state, opt-in) is added, it must join to the HCP/consent/address dimension too — mirroring
> the D360 joins.

---

## Worked example B — Web visitors (the primary POC prompt; NOT one table)

**Ask:** "How many opted-in `<brand>` HCPs in New York visited the customer website in the last 60
days?"

This is the primary POC prompt and it is **not** the Rx table. It needs its own OCL/Snowflake mapping:
- an OCL/Snowflake **web-engagement events** table (`<OCL/Snowflake_WEB_TABLE>`, `<visit ts col>`),
- joined to the OCL/Snowflake **HCP dimension** for brand + state,
- joined to the OCL/Snowflake **consent** table for opt-in.

D360 side traverses `unified_individual_to_website_engagement` + `unified_individual_to_address`
(+ consent path when populated). Fill the OCL/Snowflake counterparts before benchmarking this prompt.

`<PLACEHOLDER — architect to map the OCL/Snowflake web-engagement + consent tables>`

**D360 readiness note (2026-08-06):** `dev_WebsiteEngagement__dlm` and
`dev_ContactPointAddress__dlm` both have **0 rows** in Development — the journey is schema-ready
but will count 0 until those streams load. Email engagement is populated (~7.57M) and can demo
open/click counts today.

---

## Sources of expected delta (document these; the threshold absorbs them)

These are why the counts are *similar*, not identical. Each is a legitimate, explainable delta — not
a defect.

1. **NULL / missing NPI.** `COUNT(DISTINCT NPI)` silently drops NULLs on the Snowflake side. D360
   may still unify those HCPs via other match rules (name + address), so they can appear on the D360
   side. Asymmetric. → Quantify how many Rx/web rows have NULL NPI.
2. **Resolution not strictly 1:1 on NPI.** If match rules merge two NPIs into one golden record, or
   split one NPI across two unified records, `DISTINCT Unified Id ≠ DISTINCT NPI`. Counting
   `DISTINCT NPI` on both sides sidesteps this; report the unified count to expose it.
3. **Different source feeds.** The clean match assumes `dev_NBRxAggregated__dlm` (and the website
   DMO) ingest from the *same* Snowflake tables. Different feeds or cadences add coverage/timing
   drift on top of the refresh-window gap.
4. **Join-key correctness (D360).** `dataModel-dev.yaml` joins `individual_has_nbrx` on
   `Individual.Id__c = NBRxAggregated.IndividualId__c`. If the true prescriber key is **NPI**,
   this join should be on the NPI field, not the source PK. VERIFY with the architect — a wrong join
   key produces a confidently-wrong count.
5. **Population / universe.** Active vs. all HCPs, test/internal record exclusion (`TestUser__c`,
   `HcpSuppression__c`), dedup rules must match on both sides.
6. **Filter parity.** Brand/state literals, `'Utah' → 'UT'`, opt-in polarity, and the 60-day boundary
   (inclusive/exclusive, timezone) must be identical.
7. **Refresh window.** Always gate on this first (see
   [../validation/compare-counts.md](../validation/compare-counts.md)) — never compare across windows.

---

## Open items for the Data Cloud Architect

- [ ] Confirm NPI lives on `PartyIdentification.IdentificationNumber__c` and give the
      exact `Name__c` / `PartyIdentificationTypeId__c` literals that mean NPI (seed only
      has `MC Subscriber Key` / `Person Identifier`). Also give the OCL/Snowflake NPI column.
- [ ] Confirm the NBRx→Individual join key (NPI vs source PK) — divergence #4.
- [ ] Provide OCL/Snowflake table/column names for: HCP dimension, Rx/NBRx, web-engagement events, consent.
- [ ] Confirm opt-in **polarity** and the exact `ContactPointConsent.ConsentStatusId__c` literals.
- [ ] Confirm brand + state value domains on the OCL/Snowflake side (for the value maps).
- [ ] Confirm whether `dev_NBRxAggregated__dlm` / `dev_WebsiteEngagement__dlm` share the same source feed as their OCL/Snowflake tables.
- [ ] Confirm when Address / Website / NBRx / Consent streams will load into Development (currently 0 rows).
