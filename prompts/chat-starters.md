# Chat starters — suggestion prompts

Paste one of these when **starting a new Cursor chat** with the `d360-segments-activations`
Skill. Each prompt names **dataspace + populated DMO(s)** so the agent can run without
re-asking routing questions, and requests the required **Data 360 count + Snowflake SQL**
dual report (no Snowflake MCP probe).

> **Note:** Snowflake is not queried via MCP. The agent returns the live Data 360 count plus
> Snowflake validation SQL (PENDING) for you to run in Snowflake. Full prompt bank:
> [example-prompts.md](example-prompts.md).

---

## Recommended first prompts

### 1 — HCP Stage · HQ email opens (best dual-demo)

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Do not check Snowflake MCP. Return the dual-report table: live Data 360 count + Snowflake validation SQL for stream STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL (Snowflake count PENDING) + the note + Data 360 DMO link and segment link (or N/A if no MarketSegment).
```

### 2 — HCP Stage · Eliquis IQVIA NRx

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 count + Snowflake validation SQL for stream STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING (PENDING) + note + DMO link and segment link (or N/A).
```

### 3 — DTC · Premarin brand profile

```text
In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 count + Snowflake validation SQL for stream DTC_BRAND_PROFILE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES (BRAND_NAME), PENDING + note + DMO link and segment link (or N/A).
```

### 4 — DTC · Premarin opted in (multi-DMO)

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL against DTC_BRAND_PROFILES joined to DTC_OT_EMAIL_CONSENTS in CDP_US_DTC_STG_DB.DTC_DC_IN (PENDING) + note + DMO links for both DMOs and segment link (or N/A).
```

### 5 — HCP Dev · CRM email opens (Snowflake N/A)

```text
In dataspace DEV-US (MCP: Development), HCP: count distinct HCPs who opened an email on populated DMO dev_EmailEngagement__dlm. No clarifying questions. Dual-report table: Data 360 count + Snowflake source as N/A (CRM-fed, not Snowflake). Include Data 360 DMO link and segment link (or N/A). Name the DMO in the Reference column.
```

---

## Meta prompts (ask the agent for help)

```text
Show me the suggested starter prompts for HCP (STG-US) and patient (DTC) dual D360 + Snowflake-SQL counts. Include dataspace, populated DMOs, and the note that Snowflake is not queried via MCP.
```

```text
Which pullable FAQs can I run today by dataspace? Use prompts/example-prompts.md and only DMOs that have data. Prefer copy-paste ready prompts that avoid clarifying questions.
```
