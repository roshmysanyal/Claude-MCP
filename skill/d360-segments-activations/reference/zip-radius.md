# ZIP-radius geographic filters

Use this when a count or segment asks for people **within N miles of a ZIP code** (or a landmark
resolved to a ZIP — e.g. MetLife Stadium → `07073`). Data 360 typically has **no** ZIP→lat/long
reference DMO and **cannot** compute Haversine distance in segment SQL, so derive the ZIP list
**outside** D360 and bake it into an `IN (...)` filter.

Worked example artifacts (MetLife / `07073` / 100 mi):
[metlife-100mi-zips.txt](metlife-100mi-zips.txt),
[metlife-100mi-count.sql](metlife-100mi-count.sql),
[metlife-100mi-segment.sql](metlife-100mi-segment.sql).

---

## Method (required)

1. **Resolve the origin.** Prefer an explicit ZIP. If the user names a landmark, map it to a ZIP
   and confirm. Use known landmark coordinates when available (stadium/venue lat/lon); otherwise use
   that ZIP’s centroid as the origin.
2. **Load US ZIP centroids** from a public postal-code dataset with lat/lon — default:
   [GeoNames US.zip](https://download.geonames.org/export/zip/US.zip) (CC BY 4.0; credit GeoNames).
   Fields used: 5-digit postal code, latitude, longitude.
3. **Haversine filter.** Keep every ZIP whose **centroid** is ≤ the requested radius (miles) from
   the origin. Earth radius ≈ `3958.7613` miles. Deduplicate ZIP5; keep the minimum distance when a
   ZIP appears more than once.
4. **Filter in D360** on address postal code (first 5 characters), via the routed model’s address
   path (HCP Development: `ContactPointAddress.PostalCodeId__c` → Individual → IdentityLink →
   UnifiedIndividual):

   ```sql
   SUBSTRING("<address_dmo>"."PostalCodeId__c" FROM 1 FOR 5) IN (
     'nnnnn', 'nnnnn', ...
   )
   ```

5. **Document the derivation** in comments above the SQL (and optionally refresh the worked-example
   files under `reference/`): source + license, origin lat/lon, radius, inclusion rule, ZIP count,
   and that the boundary is **centroid-approximate** (not residence coordinates).

---

## Do / don’t

| Do | Don’t |
| --- | --- |
| Precompute the ZIP list, then use `IN (...)` | Assume a `US_Zip_Centroid__dlm` (or similar) exists unless the routed YAML has it `verified` |
| Use ZIP5 only (`SUBSTRING … FROM 1 FOR 5`) | Put lat/lon math or Haversine inside segment SQL |
| Reuse the same list for count SQL and segment SQL | Guess nearby ZIPs by state/prefix without a distance calc |
| Note Address DMO emptiness when counts are 0 | Treat a 0 count as “no one lives there” when Address is unpopulated |

---

## Count vs segment

Same ZIP `IN` list for both. Count uses `COUNT(DISTINCT` UnifiedIndividual PK`)` with joins (or
equivalent). Segment uses the Recipe B nested-`IN` shape that projects only the SegmentOn PK — see
[creating-segments.md](creating-segments.md) and the MetLife segment SQL example above.
