# Chat starters — suggestion prompts

Paste one of these when **starting a new Cursor chat** with the `d360-segments-activations`
Skill. Each prompt names **dataspace + populated DMO(s)** so the agent can run without
re-asking routing questions.

> **Note:** Query Data 360 only. The agent answers in everyday English, then puts the Query.
> Do not include a Snowflake count, matching table, PENDING, or Delta. Full prompt bank:
> [example-prompts.md](example-prompts.md).
>
> **Everyday language:** *doctors* → HCP (ask Dev / Stage / Prod if missing). *patients* /
> *consumers* → DTC. You do not need to say HCP or DTC.
>
> **Patient segment create:** the agent must ask whether to include CIA Consumer Marketable
> Email, and every segment is published with lookback **P2Y** (2 years).

---

## Recommended first prompts

### 1 — HCP Stage · HQ email opens

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### 2 — HCP Stage · Eliquis IQVIA NRx

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### 3 — DTC · Premarin brand profile

```text
In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### 4 — DTC · Premarin opted in (multi-DMO)

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### 5 — HCP Dev · CRM email opens

```text
In dataspace DEV-US (MCP: Development), HCP: count distinct HCPs who opened an email on populated DMO dev_EmailEngagement__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

---

## Meta prompts (ask the agent for help)

```text
Show me the suggested starter prompts for doctors (Stage) and patients (DTC). Include dataspace and populated DMOs. Answers should be everyday English plus the Query — no Snowflake count.
```

```text
Which pullable FAQs can I run today by dataspace? Use prompts/example-prompts.md and only DMOs that have data. Prefer copy-paste ready prompts that avoid clarifying questions.
```
