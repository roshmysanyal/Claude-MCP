# OCL / Snowflake ↔ Data 360 Crosswalk

**Purpose.** The OCL/Snowflake benchmark and the Data 360 query describe the *same business
population* through two different physical schemas. They are **not 1:1**. This file maps each
business **concept** to its counterpart on both sides so the two counts are provably measuring the
same thing — and so any residual delta is *explainable* rather than a surprise.

This is the OCL/Snowflake half of the semantic layer. The D360 half lives in
[dataModel.yaml](dataModel.yaml); keep the two in sync.

> **Status:** DRAFT / iterating. The D360 side is pre-filled from `dataModel.yaml` (still mostly
> `VERIFY`). The **OCL/Snowflake side is `<PLACEHOLDER>` until the Salesforce Data Cloud Architect confirms the
> real Snowflake view/column names** (Phase 0, Step 3). Nothing here is a benchmark until the count
> spine and the concept rows below are signed off.

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
  flip in [dataModel.yaml](dataModel.yaml).)
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
COUNT(DISTINCT UnifiedIndividual.UnifiedRecordId__c)   ≈   COUNT(DISTINCT NPI)
```

and the flat Snowflake `COUNT(DISTINCT NPI) FROM <RxTable>` counts that same unit. The D360 query
just pays the traversal tax (UI → UL → I → child) to arrive at the same set of NPIs.

**Design decision (proposed):** count `DISTINCT NPI` on **both** sides for the benchmark. This
removes identity resolution as a variable and makes the comparison apples-to-apples. Separately
report `COUNT(DISTINCT UnifiedRecordId__c)` alongside it to show what resolution actually did (the
gap between the two *is* a useful finding, not an error).

| | Count expression | Notes |
|---|---|---|
| **D360 (benchmark-comparable)** | `COUNT(DISTINCT <Individual.NPI field>)` | `<VERIFY: NPI field on Individual>` |
| **D360 (product-truth, report alongside)** | `COUNT(DISTINCT UnifiedIndividual.UnifiedRecordId__c)` | resolved golden person |
| **OCL / Snowflake** | `COUNT(DISTINCT <OCL/Snowflake NPI column>)` | `<PLACEHOLDER>` |

---

## Concept crosswalk

For each business concept: the D360 mapping (from `dataModel.yaml`) and the OCL/Snowflake mapping
(architect to fill). "Polarity" and "value map" columns exist because these are the silent
count-breakers.

| Concept | D360 side (from dataModel.yaml) | OCL / Snowflake side | Watch-outs |
|---|---|---|---|
| **Person / count unit** | NPI → `UnifiedIndividual.UnifiedRecordId__c` (via identity resolution) | `<OCL/Snowflake NPI column>` in `<OCL/Snowflake HCP/Rx table>` | NULL NPIs dropped by `COUNT(DISTINCT)`; see divergence #1 |
| **Brand** | `Individual.BrandAffiliation__c` (or `Prescription.DrugName__c` for Rx) | `<OCL/Snowflake brand column>` | value map: D360 literal vs OCL/Snowflake literal |
| **State / region** | `ContactPointAddress.ssot__StateProvince__c` (via `PartyId`) | `<OCL/Snowflake state column>` | D360: state is on the *address*, not the person. Map `'Utah' → 'UT'` on both |
| **Opted-in / emailable** | `ContactPointEmail.ssot__IsEmailOptOut__c = false` | `<OCL/Snowflake consent column> = <?>` | **polarity**: D360 is opt-*out* = false; OCL/Snowflake is likely opt-*in* = true. Easy to invert |
| **Website visit ≤ N days** | `WebEngagement.VisitTimestamp__c >= now - N days` | `<OCL/Snowflake web events table>.<ts column>` | visit definition (any event vs page view), timezone, inclusive/exclusive boundary |
| **Wrote an Rx** | `Individual → Prescription` (`individual_wrote_prescription`) | `<OCL/Snowflake Rx table>` rows | is `Rx__dlm` sourced from the *same* `<RxTable>`? see divergence #3 |

---

## Worked example A — Rx count (the clean, near-1:1 case)

**Ask:** "How many HCPs wrote an Rx for `<brand>` in `<state>`?"

**D360** (identity-resolution path; from the `hcp_wrote_rx_by_state` journey):

```sql
SELECT COUNT(DISTINCT ui."UnifiedRecordId__c") AS hcp_count   -- or DISTINCT NPI (see spine)
FROM "UnifiedssotIndividual__dlm" ui
JOIN "UnifiedIndividualIdentityLink__dlm" link
  ON link."UnifiedRecordId__c" = ui."UnifiedRecordId__c"
JOIN "ssot__Individual__dlm" i
  ON i."ssot__Id__c" = link."SourceRecordId__c"
JOIN "ssot__ContactPointAddress__dlm" addr
  ON addr."ssot__PartyId__c" = i."ssot__Id__c"
JOIN "Rx__dlm" rx
  ON rx."PrescriberId__c" = i."ssot__Id__c"        -- VERIFY: should this be on NPI? (divergence #4)
WHERE rx."DrugName__c" = '<brand>'
  AND addr."ssot__StateProvince__c" = '<state code>';
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

D360 side traverses `unified_individual_to_web_engagement` + `unified_individual_to_address`
(+ email/consent path). Fill the OCL/Snowflake counterparts before benchmarking this prompt.

`<PLACEHOLDER — architect to map the OCL/Snowflake web-engagement + consent tables>`

---

## Sources of expected delta (document these; the threshold absorbs them)

These are why the counts are *similar*, not identical. Each is a legitimate, explainable delta — not
a defect.

1. **NULL / missing NPI.** `COUNT(DISTINCT NPI)` silently drops NULLs on the Snowflake side. D360
   may still unify those HCPs via other match rules (name + address), so they can appear on the D360
   side. Asymmetric. → Quantify how many Rx/web rows have NULL NPI.
2. **Resolution not strictly 1:1 on NPI.** If match rules merge two NPIs into one golden record, or
   split one NPI across two unified records, `DISTINCT UnifiedRecordId ≠ DISTINCT NPI`. Counting
   `DISTINCT NPI` on both sides sidesteps this; report the unified count to expose it.
3. **Different source feeds.** The clean match assumes `Rx__dlm` (and the web DMO) ingest from the
   *same* Snowflake tables. Different feeds or cadences add coverage/timing drift on top of the
   refresh-window gap.
4. **Join-key correctness (D360).** `dataModel.yaml` joins `individual_wrote_prescription` on
   `Individual.ssot__Id__c = Prescription.PrescriberId__c`. If the true prescriber key is **NPI**,
   this join should be on the NPI field, not the source PK. VERIFY with the architect — a wrong join
   key produces a confidently-wrong count.
5. **Population / universe.** Active vs. all HCPs, test/internal record exclusion, dedup rules must
   match on both sides.
6. **Filter parity.** Brand/state literals, `'Utah' → 'UT'`, opt-in polarity, and the 60-day boundary
   (inclusive/exclusive, timezone) must be identical.
7. **Refresh window.** Always gate on this first (see
   [../validation/compare-counts.md](../validation/compare-counts.md)) — never compare across windows.

---

## Open items for the Data Cloud Architect

- [ ] Confirm NPI is the identity-resolution key, and give its **field name on `Individual`** (for the D360 `DISTINCT NPI` count) and its **column name in OCL/Snowflake**.
- [ ] Confirm the Rx→Individual join key (NPI vs source PK) — divergence #4.
- [ ] Provide OCL/Snowflake table/column names for: HCP dimension, Rx, web-engagement events, consent.
- [ ] Confirm opt-in **polarity** and the exact consent column/value.
- [ ] Confirm brand + state value domains on the OCL/Snowflake side (for the value maps).
- [ ] Confirm whether `Rx__dlm` / web DMO share the same source feed as their OCL/Snowflake tables.
