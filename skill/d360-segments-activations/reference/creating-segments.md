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
If `SegmentOn = UnifiedIndividual`, the SQL returns a list of **`UnifiedRecordId__c`** values — the
people who qualify — **not** a count of them. You never submit a `COUNT(DISTINCT …)` query as a
segment definition; it will be rejected.

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

**SegmentOn:** `UnifiedIndividual` → the segment returns a list of `UnifiedRecordId__c`.

```sql
SELECT ui."UnifiedRecordId__c"
FROM "UnifiedssotIndividual__dlm" ui
WHERE ui."UnifiedRecordId__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "UnifiedIndividualIdentityLink__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT i."ssot__Id__c"
        FROM "ssot__Individual__dlm" i
        WHERE i."BrandAffiliation__c" = '<brand>'
          AND i."ssot__Id__c" IN (
              SELECT addr."ssot__PartyId__c"
              FROM "ssot__ContactPointAddress__dlm" addr
              WHERE addr."ssot__StateProvince__c" = 'NY'
          )
          AND i."ssot__Id__c" IN (
              SELECT web."PartyId__c"
              FROM "WebEngagement__dlm" web
              WHERE web."VisitTimestamp__c" >= CURRENT_DATE - INTERVAL '60 days'
          )
    )
);
```

**Why this passes validation:** top-level select projects only the SegmentOn PK
(`ui."UnifiedRecordId__c"`); no aggregation, no `SELECT *`, no `CASE`, no aliases; every column is
fully qualified; each subquery is in a `WHERE` and emits exactly one column; every containment uses a
**declared join key** from [dataModel.yaml](dataModel.yaml) (`UnifiedRecordId__c`,
`SourceRecordId__c` → `ssot__Id__c`, `ssot__PartyId__c`, `PartyId__c`), routed through the identity
link. Fields are still `VERIFY` until the org is connected.

**Contrast with the count** (Recipe A) for the same population:

```sql
SELECT COUNT(DISTINCT ui."UnifiedRecordId__c") AS person_count
FROM "UnifiedssotIndividual__dlm" ui
JOIN "UnifiedIndividualIdentityLink__dlm" link ON link."UnifiedRecordId__c" = ui."UnifiedRecordId__c"
JOIN "ssot__Individual__dlm" i ON i."ssot__Id__c" = link."SourceRecordId__c"
JOIN "ssot__ContactPointAddress__dlm" addr ON addr."ssot__PartyId__c" = i."ssot__Id__c"
JOIN "WebEngagement__dlm" web ON web."PartyId__c" = i."ssot__Id__c"
WHERE i."BrandAffiliation__c" = '<brand>'
  AND addr."ssot__StateProvince__c" = 'NY'
  AND web."VisitTimestamp__c" >= CURRENT_DATE - INTERVAL '60 days';
```

Same population, same join keys — but the count aggregates (and would be **rejected** as a segment),
while the segment projects the member PKs (and would be **wrong** as a count if fan-out weren't
contained). Build each to its own rules; don't reuse one for the other.

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
