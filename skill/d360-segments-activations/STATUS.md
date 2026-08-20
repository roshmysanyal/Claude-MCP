# Read segment status (Recipe S)

**Do not read this file for a count-only ask.** Counts: [COUNT.md](COUNT.md).
Create/update: [CREATE.md](CREATE.md). Publish: [PUBLISH.md](PUBLISH.md).
Do **not** load [SKILL.md](SKILL.md) in full for status.

**MCP:** `search` → `payload_examples` → `execute`.
Include **Open this audience** on a named MarketSegment. Do not use `d360_segment_member_list`.

---
## Recipe S — Read segment count, publication state, and activation state

**Trigger:** the user asks to list segments, inspect a segment, read its count, or determine
whether it is activated. This is read-only; do not publish, activate, update, or delete anything.

### Identify the segment

1. If the user supplied a segment API name, use it. Otherwise ask for the dataspace when not
   already named, then `search` / `execute` **`d360_segment_list`** with that `dataspace`.
2. Match by API/developer name first. A display-name match is not enough when multiple segments
   match — present the non-PII names and ask which one.
3. `execute` **`d360_segment_get`** with `segmentApiName`. Capture:
   - display name and API/developer name
   - segment / market-segment ID
   - dataspace and SegmentOn DMO
   - segment definition / criteria
   - lifecycle/publication status and publish schedule
   - last published / evaluated timestamp when returned

### Read the member count

4. `execute` **`d360_segment_count`** with:

   ```json
   {
     "segmentApiName": "<api name>",
     "input": { "preferApproxCount": false }
   }
   ```

   This operation may be asynchronous. Follow the returned job handle/status mechanism exactly;
   do not invent a polling operation. If the facade provides no completed result yet, report
   **Segment member count: PENDING** and the returned job/status — never substitute the original
   Recipe A query count as if it were the evaluated segment count.
5. If a published segment response already contains a current member-count field and evaluation
   timestamp, report it, but label whether it is exact or approximate from the response.
6. Never call `d360_segment_member_list` just to prove the count: that can expose membership.
   Counts and aggregate metadata only — no member IDs or PII.

### Determine whether it is activated

7. **Published/ACTIVE is not the same as activated.**
   - *Published* means the segment definition has been evaluated.
   - *Activated* means at least one Activation binding exists for that segment and its activation
     status is active/successful (not merely that a target exists).
8. `search` / `execute` **`d360_activation_list`**. Match activations by the segment's
   `marketSegmentId` / segment ID (or the exact segment reference returned by the API). If the list
   response is insufficient, `execute` **`d360_activation_get`** for each matching activation ID.
9. For every match capture: activation ID/name, target name, activation status, refresh type,
   last run / last successful run, and error message when returned. Do **not** infer activation
   from segment status or from an ACTIVE activation target.
10. Report one of:
    - **Activation status: ACTIVATED** — one or more matching activations are active/successful.
    - **Activation status: CONFIGURED, NOT ACTIVE** — binding exists but is draft/inactive/failed;
      include its returned status.
    - **Activation status: NOT ACTIVATED** — no activation binding references the segment.
    - **Activation status: UNKNOWN** — API/access did not return enough evidence; state why.

### Required status output

Lead with natural English (Recipe A step 6). **Stage:** then the Query. **Prod:** skip the Query.
Then the lifecycle facts. Do **not** show a Snowflake count, matching table, PENDING, or Delta.

**Stage:**

```text
This audience currently has <N> <doctors|patients>.

**Query**
<the Data 360 SQL or the membership SQL for this segment>

**Data 360 segment link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/<marketSegmentId>/view

Publication: <DRAFT|PUBLISHED|ACTIVE|…> (last published <timestamp>)
Activation: <ACTIVATED|CONFIGURED, NOT ACTIVE|NOT ACTIVATED|UNKNOWN>
```

**Prod:** same lifecycle facts, but **no Query** — count sentence + **Open this audience** only.

Include the Salesforce **Data 360 segment link** on status of a named MarketSegment (Recipe S) and
after create / update. **Do not** include a segment link when the user only asked for a count.

