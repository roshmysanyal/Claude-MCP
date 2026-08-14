# Pre-built marketable / consent base segments (contactability layer)

**Status:** Email rows harvested live from the stage org (`pfizer-cdp-us--cfcstage`) on
**2026-08-14** via `d360_segment_list` / `d360_segment_get`. SMS rows are still **not found**.
Do **not** invent IDs; reconfirm with those ops if a row looks stale.

---

## What this is (and why it is mandatory for email / SMS)

A **marketable (base) segment** is a pre-built, published audience that already encodes
**contactability** for a given **audience type** (HCP vs DTC) and **channel** (email vs SMS) —
for example “CIA HCP Marketable Email.”

When a count (Recipe A) or segment build (Recipe B) targets a **channel** (email or SMS), the
population **must** be intersected with the matching base segment’s **current membership**. This
is a governed **contactability layer**:

- It sits **on top of** (AND with) the usual consent / preference filters — it does **not**
  replace them.
- The same intersection must appear in **both** the Recipe A count SQL and the Recipe B
  membership SQL so the number and the segment stay consistent.
- Marketer-facing answers still say *doctors* / *patients* and the channel in plain English; the
  DMO / segment IDs below are for execution only.

You cannot “reference a segment” abstractly in SQL. You intersect on its **materialized members**.

---

## How membership is joined (read before writing SQL)

In this org, CIA / consent base segments materialize members on the **Segment Membership Latest**
DMO returned as `segmentMembershipDmo.latestTable` (not a Data Cloud activation audience DMO).

1. Filter that latest table with `Segment_Id__c LIKE '<15-char marketSegmentId>%'` from the
   registry row for that **dataspace**.
2. The member key is `Id__c` — the SegmentOn profile PK (Unified Individual in every live email
   row below).
3. Include the base segment with a **containment subquery**: your SegmentOn PK must be `IN` that
   filtered membership set.
4. **Grain / identity:** join member key to SegmentOn PK **directly only if both segments share
   the same SegmentOn entity/grain**. If the base segment is keyed on a different grain, route
   through the **IdentityLink** DMO per the semantic layer — never join a unified profile straight
   to a source record.
5. **Data space:** pick the registry row whose `dataspace` matches the routed model. Never cross
   dataspaces. Stage HCP uses `STG_US`; patients use `DTC`; Dev HCP uses `Development`.

If the base segment is not published, or `segmentMembershipDmo.latestTable` is missing, **stop
and flag it** — do not invent an alternate DMO or silently drop the contactability layer.

---

## Registry (dataspace × audience × channel)

Harvested **2026-08-14** from the stage Salesforce org. **Always use the row for the routed
dataspace** — Stage HCP is not the same segment as Dev HCP or DTC.

| dataspace | audience | channel | display name | API name | marketSegmentId | SegmentOn | membership latest DMO | `Segment_Id__c` filter | member key | status | members |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| `STG_US` | HCP | Email | CIA_HCP_Test_Consent test | `stg_CIA_HCP_Test_Consent_test` | `1sgWC0000000AnNYAU` | `stg_UnifiedIndividual__dlm` | `stg_UnifiedIndividual_SM_1738191994403__dlm` | `LIKE '1sgWC0000000AnN%'` | `Id__c` | ACTIVE | 0 |
| `DTC` | DTC | Email | CIA Consumer Marketable Email | `DTC_CIA_Consumer_Marketable_Email` | `1sgWC00000009cnYAA` | `DTC_UnifiedIndividualDtc__dlm` | `DTC_UnifiedIndividualDtc_SM_1780343389__dlm` | `LIKE '1sgWC00000009cn%'` | `Id__c` | ACTIVE | 190,926 |
| `Development` | HCP | Email | DEV CIA HCP Marketable Email | `DEV_CIA_HCP_Marketable_Email` | `1sgVt00000009PtIAI` | `dev_UnifiedIndividualRs1__dlm` | `dev_UnifiedIndividualRs1_SM_1731527015__dlm` | `LIKE '1sgVt00000009Pt%'` | `Id__c` | ERROR | 0 |
| `STG_US` | HCP | SMS | — | — | — | — | — | — | — | not found | — |
| `DTC` | DTC | SMS | — | — | — | — | — | — | — | not found | — |
| `Development` | HCP | SMS | — | — | — | — | — | — | — | not found | — |

**Open this audience**

| dataspace | Lightning |
| --- | --- |
| `STG_US` | https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/1sgWC0000000AnNYAU/view |
| `DTC` | https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/1sgWC00000009cnYAA/view |
| `Development` | https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/1sgVt00000009PtIAI/view |

**Stage HCP email (`STG_US`) — live definition**

`CIA_HCP_Test_Consent test` is the consent / marketable base in Stage. SegmentOn Unified Individual.
Lookback `P2Y`. Criteria (DBT): CDW current, not deleted, HCP status `A`, primary unified email,
and consent status `IN` or `UNKNOWN` (via IdentityLink → Contact Point Consent). **Members = 0**
because Stage profile / email / consent streams are still empty — the segment is ACTIVE; do not
treat 0 as “the filter is wrong.”

History DMO (Stage): `stg_UnifiedIndividual_SMH_173819199597__dlm` — use **latest**, not history.

**How to refresh a row:**

1. `d360_segment_list` / `d360_segment_get` in that dataspace → display name, `marketSegmentId`,
   `segmentOnApiName`, `segmentMembershipDmo.latestTable`, status, member count.
2. Nest with `Segment_Id__c LIKE '<15-char id>%'` on that latest table. Member key is `Id__c`.
3. Edit **this file only** — **do not** copy org IDs into `SKILL.md` or other recipe prose.

---

## How to include one (containment subquery)

### Same grain (base SegmentOn PK = your SegmentOn PK)

```sql
-- Recipe B membership shape (project SegmentOn PK only — no COUNT/DISTINCT/aliases)
SELECT <SegmentOnDmo>.Id__c
FROM <SegmentOnDmo>
WHERE <SegmentOnDmo>.Id__c IN (
    SELECT <LatestAudienceDmo>.<MemberKeyColumn>
    FROM <LatestAudienceDmo>
)
  AND <SegmentOnDmo>.Id__c IN (
    /* existing consent / preference / use-case subqueries — unchanged */
  );
```

Count (Recipe A) uses the **same** `IN` nests with
`SELECT COUNT(DISTINCT <SegmentOnDmo>.Id__c)`.

Replace `<SegmentOnDmo>`, `<LatestAudienceDmo>`, and `<MemberKeyColumn>` from the registry row
for **dataspace × audience × channel** (never hardcode IDs outside this file).

**Stage HCP email example** (`STG_US` — `CIA_HCP_Test_Consent test`):

```sql
SELECT stg_UnifiedIndividual__dlm.Id__c
FROM stg_UnifiedIndividual__dlm
WHERE stg_UnifiedIndividual__dlm.Id__c IN (
    SELECT stg_UnifiedIndividual_SM_1738191994403__dlm.Id__c
    FROM stg_UnifiedIndividual_SM_1738191994403__dlm
    WHERE stg_UnifiedIndividual_SM_1738191994403__dlm.Segment_Id__c LIKE '1sgWC0000000AnN%'
)
  AND stg_UnifiedIndividual__dlm.Id__c IN (
    /* existing consent / preference / use-case subqueries — unchanged */
  );
```

### Different grain — route through IdentityLink

When the audience DMO’s member key is **source Individual** (or another grain) and your
SegmentOn is **Unified Individual** (or the reverse), bridge with the declared identity-link
path — do not join unified ↔ source directly:

```sql
SELECT <UnifiedSegmentOnDmo>.Id__c
FROM <UnifiedSegmentOnDmo>
WHERE <UnifiedSegmentOnDmo>.Id__c IN (
    SELECT <IdentityLinkDmo>.UnifiedRecordId__c
    FROM <IdentityLinkDmo>
    WHERE <IdentityLinkDmo>.SourceRecordId__c IN (
        SELECT <LatestAudienceDmo>.<MemberKeyColumn>
        FROM <LatestAudienceDmo>
    )
)
  AND <UnifiedSegmentOnDmo>.Id__c IN (
    /* consent / preference / use-case subqueries */
  );
```

Use the IdentityLink DMO and key names from the **routed** semantic layer for that dataspace.
If the grain relationship is unclear, stop and ask the architect — never guess.

### Publish + activate prerequisite

| Check | If missing |
| --- | --- |
| Base segment **published** / evaluable | Stop; ask to publish the marketable base segment first |
| `segmentMembershipDmo.latestTable` present | Stop; flag that the membership DMO does not exist yet |
| Membership DMO queryable in the **same dataspace** | Stop; do not cross dataspaces |

---

## Checklist (email / SMS asks)

- [ ] **Audience type** confirmed: HCP (*doctors*) vs DTC (*patients*) — ask if unclear; do not guess
- [ ] **Channel** confirmed: email or SMS (or neither — then this layer does not apply)
- [ ] Matching row from the registry above selected (**dataspace** × audience × channel)
- [ ] `marketSegmentId` / SegmentOn / membership latest DMO / `Segment_Id__c` filter confirmed
- [ ] Base segment published (membership latest DMO exists)
- [ ] **email/SMS → matching base segment intersected on its membership latest DMO**
- [ ] Consent / preference filters still present (contactability layer does not replace them)
- [ ] Same intersection in Recipe A count **and** Recipe B membership SQL
- [ ] Same dataspace for query, segment, base segment, and audience DMO
- [ ] Grain matched or IdentityLink-routed per the semantic layer

---

## Related

- Skill Recipes A / B and Guardrails: [../skill/d360-segments-activations/SKILL.md](../SKILL.md)
- Segment SQL rules and worked examples: [creating-segments.md](creating-segments.md)
- Activation / audience DMO receipt: [creating-activations.md](creating-activations.md)
