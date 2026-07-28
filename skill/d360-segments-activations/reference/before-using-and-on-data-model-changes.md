# Before Using / On Data Model Changes

[dataModel.yaml](dataModel.yaml) is only as trustworthy as its `status:` flags. It ships with
`VERIFY` placeholders that are **best guesses at the schema**, not confirmed facts. This doc is the
procedure to (1) verify the model against the live customer org before Phase 1, and (2) keep it in sync
when the Data 360 data model changes.

> **Owner:** Salesforce Data Cloud Architect confirms every DMO, field, type, join key, and
> cardinality. The data model is a governance artifact — the same review bar as
> [SKILL.md](../SKILL.md) and [ocl-benchmark.sql](../validation/ocl-benchmark.sql).
>
> **Split of labor:** field-level facts (`dmo`, `api_name`, `type`, `primary_key`) can be
> **seeded and confirmed from the org** via the MCP Query family's metadata query. Relationships,
> cardinality, identity-resolution routing, `pii` flags, and `desc` are **human-curated** — the
> metadata API does not reliably emit them, so they need SME sign-off.

---

## Before using (one-time, before Phase 1)

Do this before any count built on the map is treated as real. Nothing with an outstanding `VERIFY`
that a query depends on is eligible for the "validated" label.

For **each** entity, relationship, and field marked `status: VERIFY`:

1. **Confirm the DMO exists and its API name.** `search` the MCP for a metadata op
   (e.g. `"list data model objects"`), `execute`, and match the real `__dlm` API name. Fix the
   `dmo:` value if it differs.
2. **Confirm field API names and types.** Describe the DMO (`search "describe data model object"` →
   `execute`) and confirm every field's `api_name` and `type` in that entity's `fields:` block. The
   business→field mapping is what the agent filters on — a wrong name is a silently wrong query. Set
   the `pii` flag, `desc`, and (for non-PII categorical fields only) `sampleValues` by hand — the
   describe won't tell you these; real literals can come from a segment's `includeCriteria` (below).
3. **Confirm join keys and direction.** For each relationship, verify `from_key`/`to_key` are the
   real join columns (remember: an `...Id` name is **not** proof of a foreign key). Confirm with the
   architect or by sampling rows that the join returns sane matches.
4. **Confirm cardinality.** Verify `one_to_one` vs `one_to_many`. This drives `fan_out` and the
   `COUNT(DISTINCT ...)` rule — get it wrong and counts inflate silently.
5. **Sanity-check a journey end-to-end.** Run at least one `journeys` example against the org and
   compare to the OCL/Snowflake benchmark. It should clear the agreed 2–5% threshold in the same refresh window.
6. **Flip `VERIFY` → `verified`.** Only after the above. Leave anything you couldn't confirm as
   `VERIFY` and note why.

**Identity resolution is mandatory, not optional.** Confirm the `IdentityLink` DMO and both hops
(`unified_to_identitylink`, `identitylink_to_individual`). Unified↔source joins must route through
it — never join a unified profile directly to a source record.

---

## Hydrating the model (when a request hits a gap)

When someone asks for a count that needs a DMO/field/join the model doesn't cover, the agent should
**discover-and-propose, not guess-and-proceed**:

1. **Discover from the org, don't invent.** Run the MCP metadata query to find the candidate DMO and
   fields; read the real `api_name` and `type`.
2. **Add it as `VERIFY`.** Append the new entity/field/relationship to `dataModel.yaml` with
   `status: VERIFY` and a `desc`. This captures the person's context in the shared model instead of
   in one chat.
3. **Answer, with a note.** The requester gets their number — a `VERIFY` mapping does not block the
   answer. Attach a one-line caveat that the schema mapping is unverified pending architect
   confirmation. (It is not eligible for the formal **"validated"** label until the new elements are
   verified and the count clears the OCL/Snowflake benchmark.)
4. **Flag for verification.** The new `VERIFY` elements go to the Data Cloud Architect via the
   contribution loop below.

The person running the count is usually a marketer, not the architect — they can confirm *intent*
(brand, state, window) but not *schema* (join keys, cardinality). So a marketer's session may
**propose** a `VERIFY` entry; only the architect flips it to `verified`.

### Opportunistic seeding from an existing segment

Two ways to discover schema, used for different things:

- **Metadata query** → *breadth.* Lists DMOs and describes their fields (`api_name`, `type`). This
  is the primary discovery tool.
- **A published segment's `includeCriteria`** → *real usage of specific fields.* This is not SQL —
  it's structured **JSON**: a tree of `TextComparison` / `LogicalComparison` nodes. Each leaf
  carries `subject.objectApiName`, `subject.fieldApiName`, `subjectFieldDataType`, and the actual
  `values` filtered on. That's a validated, architect-approved sample of which fields carry the
  business meaning (brand, opt-in, edition, …) **and their real literal values** — exactly the
  `desc`/allowed-values context the metadata describe won't give you.

**What it maps to in `dataModel.yaml`:**

| `includeCriteria` JSON | `dataModel.yaml` |
|---|---|
| `subject.objectApiName` | entity `dmo:` |
| `subject.fieldApiName` | field `api_name` |
| `subjectFieldDataType` | field `type` |
| `values` | field `sampleValues` (real literals — only for non-PII categorical fields) |
| `joinPath` (when present) | a **hint** at a relationship to add — verify separately |

It's a **"while you're there, might as well grab it"** source, not a system of record:

- **Strong for fields + values; weak for joins.** A single-DMO filter has `joinPath: null` (see the
  common case) and reveals no relationship at all. Joins only surface when `joinPath` is populated,
  and even then it's a path to confirm — it does **not** prove cardinality. Relationships stay
  human-curated; use `joinPath` as a lead, not an answer.
- It only covers what that one segment touches — not all-inclusive. Metadata query stays the tool for
  breadth; segment criteria just confirms the fields/values a real segment actually uses.
- Whatever you extract still lands as `VERIFY`. Architect still signs off.
- **No extra API cost:** Recipe B already reads the reference segment ("describe → rebuild"), so the
  same output can double as a seeding pass — harvest the object/field API names, types, and values
  into `dataModel.yaml` (as `VERIFY`) while you're in there.

## Sharing the model across users (single canonical copy)

`dataModel.yaml` is a **single version-controlled artifact**, not a per-user file. One person
verifies or proposes an entry once and everyone benefits — no one should re-populate their own copy.

**Recommended loop (git-based — adopt unless a different distribution is chosen):**

1. A user's session (or the architect) adds/edits an entry — `VERIFY` for proposals, `verified` only
   by the architect.
2. The change is committed to the shared repo (a PR/commit gives the audit trail this governance
   artifact needs — same review bar as `SKILL.md`).
3. The Data Cloud Architect reviews, verifies against the org, and flips `VERIFY` → `verified`.
4. Other users **pull** the updated `dataModel.yaml`. Their agent immediately uses the newly
   verified elements.

> Avoid per-user local copies or storing this context in an individual's Claude/Cursor memory — it
> won't reach the next person and the model drifts. Keep one canonical copy; branch/merge, don't fork.
> If a non-git distribution is used (shared drive, etc.), keep the same principle: **one canonical
> copy, one owner who verifies, everyone reads from it.**

---

## On data model changes (ongoing)

Re-verify the affected part of the model whenever the Data 360 model shifts. Common triggers:

| Change in Data 360 | What to update in `dataModel.yaml` |
|---|---|
| New DMO / data stream mapped | Add an `entity`; add `relationships` + a `path`; mark `VERIFY` until confirmed |
| DMO or field renamed / removed | Update the `dmo:`/field API name; fix any journey referencing it |
| Identity resolution ruleset changed | Re-confirm `IdentityLink` keys and both identity-resolution hops |
| Relationship / join key changed | Update `from_key`/`to_key`; re-confirm cardinality and `fan_out` |
| New brand or attribute in scope | Add the field to the relevant entity; add a `journey` if it's a common ask |

After any change:

1. Set the touched elements back to `status: VERIFY`.
2. Run the **Before using** steps above on just those elements.
3. **Mirror it in the OCL/Snowflake benchmark.** If a join or filter changed here, update
   [ocl-benchmark.sql](../validation/ocl-benchmark.sql) to match — otherwise D360 and OCL/Snowflake counts
   diverge for reasons unrelated to refresh timing.
4. Note the change (and who verified it) so the map stays auditable.

---

## Quick verification checklist

- [ ] Every `VERIFY` a live query touches has been confirmed and flipped to `verified`
- [ ] All DMO API names match `list data model objects`
- [ ] All field API names and types match the DMO describe; `pii`/`desc` set by hand
- [ ] All join keys + cardinalities confirmed (not inferred from names)
- [ ] `IdentityLink` DMO and both identity-resolution hops confirmed
- [ ] At least one journey run end-to-end and matched OCL/Snowflake within threshold
- [ ] `ocl-benchmark.sql` mirrors the map's joins/filters
- [ ] Changes noted with verifier + date

> If you cannot verify a required element, **do not guess the schema** — leave it `VERIFY` and
> escalate to the Data Cloud Architect. You may still answer the question; just note that the count
> rests on an unverified mapping.
