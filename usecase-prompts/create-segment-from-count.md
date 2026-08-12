# Create a segment from a count (demo)

**Count ≠ segment.** A count returns a number; a segment returns **membership**
(SegmentOn primary keys only — never PII). See
[../reference/creating-segments.md](../reference/creating-segments.md).

---

## When create-segment works today

| Dataspace | Count works? | Segment create works? | Why |
| --- | --- | --- | --- |
| **Development** — CRM email Open/Click/Send | Yes | **Yes** | UnifiedIndividual + IdentityLink + EmailEngagement populated |
| **DTC** — brand + consent (+ email) | Yes | **Yes** | Individual / UnifiedIndividual / BrandProfile / Consent populated; streams ACTIVE for dual-report |
| **Stage** — HQ email / IQVIA (**D360 and Snowflake count**) | Yes | **Draft only** | Counts use engagement/IQVIA DMOs; SegmentOn `stg_UnifiedIndividual__dlm` / Individual is **empty (0)** — published segment has **0 members** until profile streams load |
| **Prod** — CRM email | Yes | Likely yes (same pattern as Dev) | Confirm UnifiedIndividual + EmailEngagement join before publish |

---

## Demo UI

1. Select a use case → **Show outcome** (count).
2. Click **Create segment** — see SegmentOn, membership SQL, and Skill prompt.
3. **Copy Skill prompt** → paste into Cursor with the governed Skill + `data360` MCP.
4. Or **Copy membership SQL** to review before create.

The browser does **not** call Data 360 create APIs directly (OAuth is on the MCP server).

---

## Skill prompt shape (Recipe B)

```text
In <Dev|Stage|Prod>, build a Data 360 segment from this population (do not re-interpret filters).

Display name: <DEMO_…>
Dataspace: <Development|STG_US|PRD_US>
SegmentOn: <…UnifiedIndividual… or …Individual…>

Filters:
- <same filters as the count>

Use DBT segment SQL that projects ONLY the SegmentOn primary key (no COUNT, no PII).
Show the SQL before create. Then create with publishSchedule NoRefresh and confirm.
After create, pull the segment count and compare to the Recipe A count for the same filters.
```

---

## Membership SQL examples

### Dev — email openers last 90 days (creatable)

SegmentOn: `dev_UnifiedIndividualRs1__dlm`

```sql
SELECT ui."Id__c"
FROM "dev_UnifiedIndividualRs1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "dev_UnifiedLinkIndividualRs1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "dev_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Open'
          AND ee."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '90' DAY
    )
);
```

### Stage — HQ openers last 90 days (draft — profile empty)

SegmentOn intended: `stg_UnifiedIndividual__dlm` (preferred) or `stg_Individual__dlm`.
Until those DMOs load, membership is **0** even though the HQ engagement **count** is ~376K.

```sql
SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);
```

---

## Guardrails

- Never submit `COUNT(DISTINCT …)` as segment SQL.
- Never project emails, names, or other PII in segment SQL.
- Confirm dataspace before create (never silent `default`).
- Stage **D360 and Snowflake count** demos: lead with count dual-report; treat create as “SQL ready / members pending profile.”
