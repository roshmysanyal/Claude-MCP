# Creating Activations — reference (segment → activation target)

**Activation is the final push step**: it takes a *published* segment and sends its membership to an
**activation target** (SFMC, Data Cloud, S3, SFTP, …). This is the "wire the segment to the target"
half of the Skill's Recipe B (build → publish → validate → **activate**). It shares the semantic
layer ([dataModel-dev.yaml](dataModel-dev.yaml)) only for the *activate-on* entity's API name; everything
else is activation-specific config.

> **Governance:** activation is a **production write**. Confirm the definition with the user and get
> governance sign-off before `execute`. Reuse an **existing** activation target — do **not** create a
> new target as a side effect of activating (target creation is its own, separately-approved step).

---

## The two objects: Activation Target vs. Activation

| | Activation **Target** | **Activation** |
|---|---|---|
| **What it is** | A reusable *destination* (a platform + connection) | A *binding* of one segment → one target |
| **Facade family** | `ActivationTarget` | `Activation` |
| **Create op** | `d360_activation_target_create` | `d360_activation_create` |
| **List / get** | `d360_activation_target_list` / `d360_activation_target_get` | `d360_activation_list` / `d360_activation_get` |
| **Prerequisite** | An existing **data connection** for its platform | A **published** segment **and** an existing target |
| **Cardinality** | One target, many activations | One per (segment, target) pair |

A **target is created once** (often outside this POC, by an admin) and reused. An **activation is
created per segment** you want to push to that target.

---

## Facade-tool protocol (same as everywhere)

`search` → `payload_examples` → `execute`. Never guess an operation name or payload.

1. `search "activation target activate segment"` → surfaces the `ActivationTarget` and `Activation`
   families.
2. `payload_examples` for the exact op (`d360_activation_create`, etc.) before any write — the
   examples carry critical `_note` warnings (see the same-DMO rule below). Adapt them; don't invent
   fields.
3. `execute` by exact op name.

---

## Step 1 — Find the target (read-only)

List the targets that already exist and pick the one to reuse:

```text
execute d360_activation_target_list  {}
execute d360_activation_target_get   { "activationTargetId": "<id from the list>" }
```

Capture the target's **`name`** (this is what the activation references as
`activationTargetName`), its `platformType`, and `status` (must be `ACTIVE`).

### Read whether a segment is activated

Activation status must be derived from an **Activation binding**, not from the segment's publish
status and not from an ACTIVE target:

1. Read the segment (`d360_segment_get`) and capture its `marketSegmentId` / segment ID.
2. List activations (`d360_activation_list`) and match records that reference that exact segment.
3. Fetch every match (`d360_activation_get`) and report activation ID/name, target, returned status,
   refresh type, last run/success timestamp, and returned error when present.
4. Classify:
   - **ACTIVATED** — at least one matching binding is active/successful.
   - **CONFIGURED, NOT ACTIVE** — binding exists but is draft/inactive/failed.
   - **NOT ACTIVATED** — no binding references the segment.
   - **UNKNOWN** — insufficient API evidence; state the access/API reason.

Never infer **ACTIVATED** merely because the segment itself is `ACTIVE`/published.

**If the list is empty, stop.** There is no target to activate to — ask a human to create one (or, if
approved, see Step 0). Do not silently create a target to unblock yourself.

### Worked lookup (this POC, 2026-07-22)

The org had **zero** targets until one was created for the POC:

```json
{ "id": "85UgL000005TL4bUAG", "name": "D360", "platformType": "DataCloud",
  "platformName": "DataCloud", "dataSpaceName": "default", "status": "ACTIVE" }
```

So `activationTargetName = "D360"`.

---

## Step 0 (only if approved) — create a target

`d360_activation_target_create` **must reference an existing data connection**, and its `connector`
block is **polymorphic on `platformType`**:

- **`DataCloud`** — self-contained; the connector takes **no fields**: pass `connector: {}`. No
  external connection required. *This is the POC-friendly target* used above.
- **`SalesforceMarketingCloud`** — requires a **configured SFMC connection**:
  `connector.name` = the existing MC connection's developer name, `connector.targetSubType` = `DE`
  (Data Extension) or `MCMA`, and `connector.businessUnitConfig.businessUnits` = export-enabled BU
  external IDs. **Check first** with `d360_connection_list { "connectorType": "SalesforceMarketingCloud" }`;
  if it returns `[]`, there is no SFMC connection to build on — that must be set up before an SFMC
  target can exist. (As of 2026-07-22 this org has **no** SFMC connection, which is why the POC uses
  a `DataCloud` target.)

Example (Data Cloud, POC):

```json
{ "input": {
    "name": "D360",
    "description": "Data Cloud activation target (POC)",
    "platformType": "DataCloud",
    "dataSpaceName": "default",
    "isCappingEnabled": false,
    "connector": {}
} }
```

---

## Step 2 — Create the activation (segment → target)

Op: **`d360_activation_create`**. Required fields: `name`, `refreshType`, `dataSpaceName`,
`activationType`, plus the segment (`marketSegmentId`), the target (`activationTargetName`), and the
activate-on entity (`activationTargetSubjectConfig.developerName`).

Get `marketSegmentId` from the segment you published (`d360_segment_list` / `d360_segment_get` →
`marketSegmentId`). The segment **must be published/`ACTIVE`** first.

### The same-DMO rule (the one that bites)

`activationTargetSubjectConfig` names the **activate-on** entity — the DMO whose records get pushed.

- When activate-on is the **same DMO the segment is built on** (`segmentOnApiName`), pass **only**
  `developerName` and **OMIT `queryPathConfig`**. The API rejects even an *empty* query path with:
  *"QueryPath for ActivateOn and SegmentOn should be empty for same DMO."*
- Provide a `queryPathConfig` join path **only** when activating on a **different, related** DMO
  (e.g. segment on `UnifiedIndividual`, activate on a related contact-point DMO). The path uses the
  same declared relationships as [dataModel-dev.yaml](dataModel-dev.yaml) — never invent a join.

### `refreshType` / `activationType` enums

- `refreshType`: **`FULL_REFRESH`** or **`INCREMENTAL`** (not `"Full"`).
- `activationType`: `SEGMENT` (this case), `DMO`, or `API_TRIGGERED`.

### Worked example — the Salutation = Mr segment → D360 (this POC)

Segment `Individuals_Salutation_Mr` (SegmentOn `ssot__Individual__dlm`) → target `D360`. Because
activate-on == SegmentOn, we send `developerName` only:

```json
{ "input": {
    "name": "Individuals Salutation Mr to D360",
    "description": "Activation of the Salutation=Mr segment to the D360 Data Cloud target (POC).",
    "dataSpaceName": "default",
    "refreshType": "FULL_REFRESH",
    "activationType": "SEGMENT",
    "marketSegmentId": "1sggL000000CXppQAG",
    "activationTargetName": "D360",
    "activationTargetSubjectConfig": { "developerName": "ssot__Individual__dlm" }
} }
```

---

## Step 3 — Confirm receipt

`d360_activation_create` returns the created activation. Capture and report:

- **`id`** / **`developerName`** — the activation handle (e.g. `85RgL0000002r3RUAQ` /
  `Individuals_Salutation_Mr_to_D360<...>`).
- **`status`** — starts at **`PROCESSING`** on first publish; re-check with `d360_activation_get`
  (or `d360_activation_list`) until it settles.
- **`enabled: true`** — the activation is live.
- **Result audience DMOs** (for a Data Cloud target) — the membership lands here:
  - `latestAudienceDmoApiName` — e.g. `AAL_DataCloud_<targetId>__dlm` (current members)
  - `historyAudienceDmoApiName` — e.g. `AA_DataCloud_<targetId>__dlm` (history)

**Receipt for a Data Cloud target** = the audience DMOs are created and the activation reaches a
non-error status. You can sanity-check membership by counting the latest-audience DMO and comparing
to the segment's member count (they should agree — same population):

```sql
SELECT COUNT(*) FROM "AAL_DataCloud_85UgL000005TL4bUAG__dlm"
```

For an **SFMC** target, receipt instead means the data extension / MCMA push landed in the target BU.

---

## Activation options — full config reference (contact points, attributes, filtering)

Beyond the minimal "membership only" activation above, `d360_activation_create` accepts several
optional config blocks. Shapes below are confirmed against the Salesforce
[Data 360 Connect API spec](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Activations)
and the [Create activation](https://www.postman.com/salesforce-developers/salesforce-developers/request/jbsg30c/create-activation)
worked example. **All the interesting options need *related* DMOs** (contact points, accounts, …)
reached via **declared join paths** — which this single-DMO POC org (`ssot__Individual__dlm` only)
does **not** have yet, so they're documented here but not exercisable until those DMOs exist.

### Attributes — extra payload columns (`attributesConfig.attributes[]`)

Each attribute is either **`Direct`** (a field on the SegmentOn DMO, empty `queryPathConfig`) or
**`Related`** (`source: RELATED`, `type: MODELRELATED`, with a `queryPathConfig` join path). Use
`preferredName` to rename the exported column.

```json
{ "attributesConfig": { "attributes": [
    { "entityName": "ssot__Individual__dlm", "name": "ssot__FirstName__c",
      "label": "First Name", "preferredName": "attribute first name",
      "referenceAttributeName": "FirstName", "dataSourceType": "Text",
      "source": "DIRECT", "type": "MODEL", "queryPathConfig": { "configs": [] } },
    { "entityName": "ssot__Account__dlm", "name": "ssot__Name__c",
      "label": "Account Name", "referenceAttributeName": "Name", "dataSourceType": "Text",
      "source": "RELATED", "type": "MODELRELATED",
      "queryPathConfig": { "configs": [ { "queryPaths": { "queryPath": [
        { "fieldName": "ssot__Id__c",      "objectName": "ssot__Individual__dlm" },
        { "fieldName": "ssot__PartyId__c", "objectName": "ssot__Account__dlm" }
      ] } } ] } }
] } }
```

### Contact points — channel identifiers (`contactPointsConfig.contactPoints[]`)

Per contact point: `type` (`Email`/`Phone`/`Push`/`SubscriberKeyEmail`/`SubscriberKeyPhone`/`Ott`/
`Maid`/`WhatsApp`), the `entityName` it comes from, the `queryPathConfig` join back to the profile,
`sourcesConfig.contactPointSources[]` (with `dataSourcePreference` `ANY`/`PRIMARY`/`BUSINESS`/
`PERSONAL` + `dataSourcePriority`), the `attributesConfig` carried on it, and an optional
`filterExpression.contactPointDmoFilters[]` with a `filterLimit` (max N per person).

```json
{ "contactPointsConfig": { "contactPoints": [ {
    "type": "EMAIL",
    "entityName": "ssot__ContactPointEmail__dlm",
    "attributesConfig": { "attributes": [ { "label": "Email Address", "name": "ssot__EmailAddress__c" } ] },
    "sourcesConfig": { "contactPointSources": [ { "dataSourcePreference": "ANY", "dataSourcePriority": 1, "name": "Any" } ] },
    "queryPathConfig": { "configs": [ { "queryPaths": { "queryPath": [
      { "fieldName": "ssot__Id__c",      "objectName": "ssot__Individual__dlm" },
      { "fieldName": "ssot__PartyId__c", "objectName": "ssot__ContactPointEmail__dlm" }
    ] } } ] },
    "filterExpression": { "contactPointDmoFilters": [ {
      "entityName": "ssot__ContactPointEmail__dlm", "entityFilterType": "EntityScopedGroup",
      "filterLimit": { "attributeName": "ssot__Id__c", "maxNumberOfValues": 1, "order": "ASC" },
      "entityFilter": { "attributeSource": "DIRECT", "type": "TextComparison",
        "objectName": "ssot__ContactPointEmail__dlm",
        "condition": { "operator": "not contains", "selfReference": false,
          "subject": { "fieldName": "ssot__EmailAddress__c", "objectName": "ssot__ContactPointEmail__dlm" },
          "filterConfig": { "values": [ "gmail" ] } } },
      "queryPathConfigForActivateOnToContainer": { "configs": [ { "queryPaths": { "queryPath": [
        { "fieldName": "ssot__Id__c",      "objectName": "ssot__Individual__dlm" },
        { "fieldName": "ssot__PartyId__c", "objectName": "ssot__ContactPointEmail__dlm" }
      ] } } ] }
    } ] }
} ] } }
```

### Filtering — narrow the membership at activation time

- **`directDmoFiltersConfig.filters[]`** — conditions on the SegmentOn DMO itself. Each filter's
  `entityFilter.condition` carries `operator` (`equal`, `contains`, `not contains`, …), a `subject`
  (`fieldName`/`objectName`), and `filterConfig.values`; `type` is `TextComparison` for text.
- **`relatedDmoFiltersConfig.filters[]`** — conditions on a related DMO, each with a
  `queryPathConfigForActivateOnToContainer` join path and an optional `filterLimit`
  (`maxNumberOfValues` + `order` `ASC`/`DESC`) to keep only top-N related rows.

```json
{ "directDmoFiltersConfig": { "filters": [ {
    "entityName": "ssot__Individual__dlm", "entityFilterType": "EntityScopedGroup",
    "entityFilter": { "attributeSource": "DIRECT", "type": "TextComparison",
      "objectName": "ssot__Individual__dlm",
      "condition": { "operator": "equal", "selfReference": false,
        "subject": { "fieldName": "ssot__GenderId__c", "objectName": "ssot__Individual__dlm" },
        "filterConfig": { "values": [ "Male" ] } } }
} ] } }
```

### Static data & incremental behavior

- **`staticDataConfig.staticData[]`** — constant `name`/`value` pairs stamped on every record
  (e.g. a campaign tag): `[{ "name": "Test", "value": "TestValue" }]`.
- **`shouldExcludeDeletes` / `shouldExcludeUpdates`** — with `refreshType: INCREMENTAL`, skip
  removed / changed records since the last run.

### On-demand publish

Creating the activation kicks off the first publish. To re-publish on demand, the REST endpoint is
`POST /ssot/activations/{activationId}/actions/publish` with body `{ "fullRefresh": true | false }`
(via `sf api request rest` if there's no dedicated facade op).

---

## Guardrails (activation-specific)

- **Reuse the target; don't create one to unblock.** Target creation is a separate, approved step
  (Step 0) — never a silent side effect of activating.
- **Segment must be published first.** No activation without an `ACTIVE` segment.
- **Same-DMO → `developerName` only.** Omit `queryPathConfig` when activate-on == SegmentOn.
- **Enums are strict.** `refreshType` ∈ {`FULL_REFRESH`, `INCREMENTAL`}; `activationType` ∈
  {`SEGMENT`, `DMO`, `API_TRIGGERED`}.
- **Confirm + governance sign-off before `execute`.** Activation is a production write.
- **Report both the count and the activation receipt** — membership pushed should match the
  validated segment population.
