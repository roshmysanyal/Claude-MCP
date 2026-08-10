# Creating Segments — reference (distinct from querying / counting)

**Segment creation is not the same operation as a count.** They share the semantic layer
([dataModel.yaml](dataModel.yaml)) for DMOs/fields/joins, but the SQL they emit is fundamentally
different in *shape*, *rules*, and *result*. This file is the authoritative reference for the
**create/build-segment** path (Skill Recipe B). For counts, see the query path (Skill Recipe A).

---

## The core distinction

| | Query / count (Recipe A) | Segment inclusion criteria (Recipe B) |
|---|---|---|
| **Result** | a single number | the **membership**: a list of SegmentOn primary keys |
| **Top-level select** | `COUNT(DISTINCT anchor.count_key)` | **only** the SegmentOn profile PK (the rows themselves) |
| **Aggregation** | required (`COUNT`) | **forbidden** |
| **Purpose** | "how many?" | "which entities are in the segment?" |
| **API** | Query family (SQL / QueryV2) | `POST /ssot/segments`, `PATCH /ssot/segments/{segmentApiName}` |

**Key mental model:** a segment's inclusion criteria must **return the list of SegmentOn entities**.
If `SegmentOn = UnifiedIndividual` (`dev_UnifiedIndividualRs1__dlm`), the SQL returns a list of
**`Id__c`** values — the people who qualify — **not** a count of them. You never submit a
`COUNT(DISTINCT …)` query as a segment definition; it will be rejected.

---

## Data 360 segment SQL validation rules

The segment `sql` is validated by Data 360
([Salesforce docs](https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html)).
Build to these rules:

- **First table = a profile table**, and it is the **SegmentOn** table. The top-level `select` may
  project **only that table's primary key** — a single column. Not multiple columns, even if one is
  the PK.
- **No aggregation** (`min`/`max`/`avg`/`count`) at the top level.
- **No `SELECT *`** at the top level.
- **No `CASE`** in the primary select. **No aliases** anywhere.
- **Only `SELECT`** — no other statement types.
- **Fully qualify every column** by table name, in the main query and in subqueries.
- **Subqueries only in `WHERE`**, and each must emit **exactly one column**.
- **Joins require a declared relationship** between the DMOs and use one of their **related join
  keys**; the join-on may contain **only an equality** between the joining keys (plus an optional
  extra condition on FQK fields). Same discipline as the semantic layer — never invent a join.
- **Type-match comparisons** (cast operands to the same type when needed).
- `limit` / `offset` are allowed.
- **Key qualifiers:** if the SegmentOn PK has key qualifiers, project them too (PK first, then
  qualifier) and include them in any `group by`.

---

## Recommended shape: profile PK in `FROM` + single-column `WHERE` subqueries

Because you can project **only the SegmentOn PK** and **no aggregation/`DISTINCT`** is available to
collapse fan-out, the cleanest pattern is: select the profile PK from the SegmentOn table, and push
every multi-hop condition into **`WHERE`-clause subqueries that each emit one column** (the join key
back toward the profile). This:

- emits each qualifying entity **once** (no 1:N fan-out duplicating membership),
- satisfies "subqueries only in `WHERE`, one column each," and
- routes unified ↔ source through the **identity-link DMO**, per the semantic layer's identity rule.

Avoid the wide `JOIN` form for segments: joining a 1:N child (web events, addresses) fans out the
profile PK, and without `DISTINCT` you'd emit duplicate members. Subquery containment sidesteps it.

---

## Worked example — "opted-in `<brand>` HCPs in NY who visited the website in the last 60 days"

**SegmentOn:** `UnifiedIndividual` (`dev_UnifiedIndividualRs1__dlm`) → the segment returns a list of
`Id__c`. Dataspace: **Development**.

> **Data note (2026-08-06):** Address + WebsiteEngagement are schema-mapped but **0 rows** in
> Development today — this segment will be empty until those streams load. Brand is **not** on
> Individual; use `WebsiteEngagement.Indication__c` / `TherapeuticArea__c` or `HcpSegmentation.Brand__c`
> once populated.

```sql
SELECT ui."Id__c"
FROM "dev_UnifiedIndividualRs1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "dev_UnifiedLinkIndividualRs1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT i."Id__c"
        FROM "dev_Individual__dlm" i
        WHERE i."Id__c" IN (
              SELECT addr."PartyId__c"
              FROM "dev_ContactPointAddress__dlm" addr
              WHERE addr."StateProvinceId__c" = 'NY'
          )
          AND i."Id__c" IN (
              SELECT web."IndividualId__c"
              FROM "dev_WebsiteEngagement__dlm" web
              WHERE web."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '60 days'
          )
    )
);
```

**Why this passes validation:** top-level select projects only the SegmentOn PK (`ui."Id__c"`);
no aggregation, no `SELECT *`, no `CASE`, no aliases; every column is fully qualified; each subquery
is in a `WHERE` and emits exactly one column; every containment uses a **declared join key** from
[dataModel.yaml](dataModel.yaml) (`Id__c` ↔ `UnifiedRecordId__c` / `SourceRecordId__c` /
`PartyId__c` / `IndividualId__c`), routed through the identity link.

**Contrast with the count** (Recipe A) for the same population:

```sql
SELECT COUNT(DISTINCT ui."Id__c") AS person_count
FROM "dev_UnifiedIndividualRs1__dlm" ui
JOIN "dev_UnifiedLinkIndividualRs1__dlm" link ON link."UnifiedRecordId__c" = ui."Id__c"
JOIN "dev_Individual__dlm" i ON i."Id__c" = link."SourceRecordId__c"
JOIN "dev_ContactPointAddress__dlm" addr ON addr."PartyId__c" = i."Id__c"
JOIN "dev_WebsiteEngagement__dlm" web ON web."IndividualId__c" = i."Id__c"
WHERE addr."StateProvinceId__c" = 'NY'
  AND web."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '60 days';
```

Same population, same join keys — but the count aggregates (and would be **rejected** as a segment),
while the segment projects the member PKs (and would be **wrong** as a count if fan-out weren't
contained). Build each to its own rules; don't reuse one for the other.

**Demo-ready alternative (populated today):** email openers — swap WebsiteEngagement for
`dev_EmailEngagement__dlm` with `EngagementChannelActionId__c = 'Open'`.

---

## Before you submit a segment — checklist

- [ ] `SegmentOn` chosen and it's a **profile table**; top-level select projects **only its PK**.
- [ ] No aggregation, no `SELECT *`, no `CASE`, no aliases.
- [ ] Every column fully qualified; every subquery in `WHERE` and single-column.
- [ ] Every join/containment uses a **declared relationship + join key** from
      [dataModel.yaml](dataModel.yaml) (unified ↔ source routed via the identity-link DMO).
- [ ] Key qualifiers projected + grouped if the PK has them.
- [ ] Filters translated **from the plain-English description** (Recipe B), not copied from the
      reference segment's raw JSON.
- [ ] Membership sanity-checked against the **count** for the same criteria (Recipe A) before publish.

---

## Read segment count and lifecycle status

1. `d360_segment_list` in the routed dataspace to resolve API name when needed.
2. `d360_segment_get` for definition, SegmentOn, ID, publication state, and schedule.
3. `d360_segment_count` with `preferApproxCount: false`; follow its async job/status and report
   **PENDING** until complete.
4. `d360_activation_list`, matched by exact segment/market-segment ID, then
   `d360_activation_get` for each match.

Report **created/draft**, **published**, and **activated** separately. An ACTIVE activation target
does not mean that the segment is activated. Never call `d360_segment_member_list` merely to prove
the count; return count and aggregate lifecycle metadata only.
