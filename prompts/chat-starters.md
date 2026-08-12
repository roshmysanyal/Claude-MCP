# Chat starters — suggestion prompts

Paste one of these when **starting a new Cursor chat** with the `d360-segments-activations`
Skill. Each prompt names **dataspace + populated DMO(s)** so the agent can run without
re-asking routing questions, and requests the required **Data 360 + Snowflake** dual report.

> **Note:** Authenticate the Snowflake MCP once so the agent can fill the Snowflake count
> instead of PENDING. Full prompt bank: [example-prompts.md](example-prompts.md).

---

## Recommended first prompts

### 1 — HCP Stage · HQ email opens (best dual-demo)

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Return the dual-report table: Data 360 count + Snowflake source count for stream STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL. If Snowflake cannot be tallied, still show the Snowflake validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.
```

### 2 — HCP Stage · Eliquis IQVIA NRx

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Dual-report Data 360 vs Snowflake stream STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING (include SQL if PENDING). Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.
```

### 3 — DTC · Premarin brand profile

```text
In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Dual-report Data 360 count + Snowflake source for stream DTC_BRAND_PROFILE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES (BRAND_NAME). If Snowflake cannot run, show validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.
```

### 4 — DTC · Premarin opted in (multi-DMO)

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Dual-report Data 360 + Snowflake validation against DTC_BRAND_PROFILES joined to DTC_OT_EMAIL_CONSENTS in CDP_US_DTC_STG_DB.DTC_DC_IN. If Snowflake is unreachable, return the exact validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.
```

### 5 — HCP Dev · CRM email opens (Snowflake N/A)

```text
In dataspace DEV-US (MCP: Development), HCP: count distinct HCPs who opened an email on populated DMO dev_EmailEngagement__dlm. No clarifying questions. Dual-report table: Data 360 count + Snowflake source as N/A (CRM-fed, not Snowflake). Name the DMO in the Reference column.
```

---

## Meta prompts (ask the agent for help)

```text
Show me the suggested starter prompts for HCP (STG-US) and patient (DTC) dual D360 + Snowflake counts. Include dataspace, populated DMOs, and the Snowflake MCP auth note.
```

```text
Which pullable FAQs can I run today by dataspace? Use prompts/example-prompts.md and only DMOs that have data. Prefer copy-paste ready prompts that avoid clarifying questions.
```
