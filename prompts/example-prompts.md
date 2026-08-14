# Example Prompts — pullable use cases only (count > 0)

Natural-language prompts that return a **non-zero** Data 360 count today.
Paste as-is with the `d360-segments-activations` Skill and `data360` MCP connected.

**Inventory date:** 2026-08-12 · Full DMO matrix: [../reference/dmos-with-data-stage-org.md](../reference/dmos-with-data-stage-org.md)  
**Chat starters (paste first):** [chat-starters.md](chat-starters.md)

> **Note:** Query Data 360 only. Answer in everyday English, then put the Query. Do not include a Snowflake count, matching table, PENDING, or Delta.

---

## How the agent runs every prompt

1. **Dataspace first** (unless already named):
   - **Doctors / HCPs / US customers:** `DEV-US` → `Development`, `STG-US` → `STG_US`, `PRD-US` → `PRD_US`
   - **Patients / consumers:** `DTC` (live). `PRD-PAT` is empty — use `DTC`.
2. **Audience from everyday words:** doctors → HCP model; patients/consumers → DTC. Do not require
   the user to say “HCP” or “DTC”.
3. **D2C create/update:** **ask** *Should this patient audience also be limited to CIA Consumer
   Marketable Email?*; nest it first only if yes. Every publish uses **`lookbackPeriod: P2Y`**.
4. **Answer shape:** natural English (doctors / patients + the number), then the **Query** (Data 360 SQL). No Snowflake count or matching table.
5. **Low-friction prompts:** name dataspace + populated DMO(s) so the agent does **not** re-ask
   routing questions. Prefer the **copy-paste ready** block below.

| Tag | Meaning |
| --- | --- |
| **Stage / DTC** | Live Data 360 count in everyday English + Query |
| **HCP · Dev / Prod** | Live Data 360 count in everyday English + Query |
| **D2C** | Patient / DTC |

**Expected answer shape**

```text
There are <N> <doctors|patients> in <Dev|Stage|Prod|DTC> who <plain-English criteria>.

**Query**
<the Data 360 SQL you ran>
```

---

## Starting a chat — suggestion prompts

When opening a new Cursor chat with this Skill, paste one of these (or ask the agent for
“starter prompts”). Full set: [chat-starters.md](chat-starters.md).

| # | Audience | Suggestion (short) |
| --- | --- | --- |
| 1 | HCP · STG-US | HQ email opens last 90d — Data 360 count |
| 2 | HCP · STG-US | Eliquis IQVIA NRx > 0 — Data 360 count |
| 3 | Patient · DTC | Premarin brand profile — Data 360 count |
| 4 | Patient · DTC | Premarin brand + opted in — Data 360 count |
| 5 | HCP · DEV-US | Email openers — Data 360 count |

---

## Copy-paste ready (dataspace + DMO named — minimal clarifying steps)

Use these when you want a count without the agent asking dataspace / audience again.
Each prompt already names the populated DMO. Expect everyday English + the Query.

### HCP — STG-US

**HQ email opens (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**HQ email clicks (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who clicked a headquarter email in the last 90 days on DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'CLICKED'). No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Paxlovid HQ opens (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who opened a Paxlovid headquarter email in the last 90 days on populated DMO stg_Headquarter_Email_Engagement__dlm (Brand__c = 'PAXLOVID', EngagementChannelAction__c = 'OPENED'). No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Eliquis IQVIA NRx > 0**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### Patient / D2C — DTC

**Premarin brand profile**

```text
In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Opted-in consent**

```text
In dataspace DTC (patient/D2C), count distinct consumers with ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Premarin + opted in (multi-DMO)**

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Premarin preference IN**

```text
In dataspace DTC (patient/D2C), count consumers with PreferenceName__c = 'PREMARIN' and PreferenceValue__c = 'IN' on populated DMO DTC_ConsentPreference__dlm (with DTC_ContactPointConsent__dlm as needed). No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Premarin opted-in + email**

```text
In dataspace DTC (patient/D2C), count distinct consumers with PREMARIN on DTC_BrandProfile__dlm, ConsentStatusId__c = 'IN' on DTC_ContactPointConsent__dlm, and a row on populated DMO DTC_ContactPointEmail__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

### HCP — DEV-US / PRD-US

**Dev email opens**

```text
In dataspace DEV-US (MCP: Development), HCP: count distinct HCPs who opened an email on populated DMO dev_EmailEngagement__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

**Prod email opens**

```text
In dataspace PRD-US (MCP: PRD_US), HCP: count distinct HCPs who opened an email on populated DMO prd_EmailEngagement__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

---

## FAQs — Sample use cases by dataspace

Short FAQ wording (demo UI / CoCo). Prefer the **copy-paste ready**
block above (dataspace + DMO named).

### STG-US (HCP) — Data 360 count

| Natural-language use case | Populated DMO | ~Count |
| --- | --- | ---: |
| In Stage, how many HCPs opened a headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 376,660 |
| In Stage, how many HCPs clicked a headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 46,472 |
| In Stage, how many HCPs were sent a headquarter email? | `stg_Headquarter_Email_Engagement__dlm` | 1,663,037 |
| In Stage, how many HCPs opened a Paxlovid headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 134,790 |
| In Stage, how many HCPs clicked a Paxlovid headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 16,879 |
| In Stage, how many HCPs opened an Abrysvo headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 92,016 |
| In Stage, how many HCPs opened a Nurtec headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 14,556 |
| In Stage, how many HCPs opened a Comirnaty headquarter email in the last 90 days? | `stg_Headquarter_Email_Engagement__dlm` | 98,423 |
| In Stage, how many HCPs have Eliquis NRx volume greater than zero in IQVIA competitive prescribing? | `stg_IQVIACompetitorSalesFact__dlm` | 606,740 |
| In Stage, how many HCPs have Eliquis NRx volume greater than 10 in IQVIA competitive prescribing? | `stg_IQVIACompetitorSalesFact__dlm` | 2,142 |


### DEV-US (HCP) — identity & CRM email

| Natural-language use case | Populated DMO | ~Count |
| --- | --- | ---: |
| In Dev, how many HCP individuals are in the profile? | `dev_Individual__dlm` | 1,517,180 |
| In Dev, how many unified HCP profiles are there? | `dev_UnifiedIndividualRs1__dlm` | 1,097,325 |
| In Dev, how many HCPs have a contact-point email on file? | `dev_ContactPointEmail__dlm` | 999,918 |
| In Dev, how many HCPs have a party-identification record? | `dev_PartyIdentification__dlm` | 1,517,180 |
| In Dev, how many HCPs opened an email? | `dev_EmailEngagement__dlm` | 257,704 |
| In Dev, how many HCPs clicked an email? | `dev_EmailEngagement__dlm` | 56,412 |
| In Dev, how many HCPs were sent an email? | `dev_EmailEngagement__dlm` | 530,607 |
| In Dev, how many HCPs appear on the header-unsubscribe brand list? | `dev_HeaderUnsubscribeBrand__dlm` | 35 |

### PRD-US (HCP) — identity & CRM email

| Natural-language use case | Populated DMO | ~Count |
| --- | --- | ---: |
| In Prod, how many HCP individuals are in the profile? | `prd_Individual__dlm` | 1,517,180 |
| In Prod, how many HCPs have a contact-point email on file? | `prd_ContactPointEmail__dlm` | 999,918 |
| In Prod, how many HCPs opened an email? | `prd_EmailEngagement__dlm` | 422,129 |
| In Prod, how many HCPs clicked an email? | `prd_EmailEngagement__dlm` | 138,623 |
| In Prod, how many HCPs were sent an email? | `prd_EmailEngagement__dlm` | 867,353 |

### DTC (Patient / D2C) — brand, consent, identity

| Natural-language use case | Populated DMO | ~Count |
| --- | --- | ---: |
| For patients, how many consumers are in the Premarin brand profile? | `DTC_BrandProfile__dlm` | 37,463 |
| For patients, how many consumers are in the Comirnaty brand profile? | `DTC_BrandProfile__dlm` | 23,751 |
| For patients, how many consumers are in the Litfulo brand profile? | `DTC_BrandProfile__dlm` | 8,425 |
| For patients, how many consumers are in the Paxlovid brand profile? | `DTC_BrandProfile__dlm` | 3,760 |
| For patients, how many consumers are in the Nurtec brand profile? | `DTC_BrandProfile__dlm` | 1,901 |
| For patients, how many consumers have any brand profile? | `DTC_BrandProfile__dlm` | 194,447 |
| For patients, how many consumers are opted in (consent status IN)? | `DTC_ContactPointConsent__dlm` | 170,719 |
| For patients, how many consumers have a consent preference recorded? | `DTC_ConsentPreference__dlm` | 341,661 |
| For patients, how many consumer individuals are in the DTC profile? | `DTC_Individual__dlm` | 193,061 |
| For patients, how many unified consumer profiles are there? | `DTC_UnifiedIndividualDtc__dlm` | 191,534 |
| For patients, how many consumers have a contact-point email on file? | `DTC_ContactPointEmail__dlm` | 176,989 |


### DTC (Patient / D2C) — combined (multi-DMO)

| Natural-language use case | Populated DMOs | ~Count |
| --- | --- | ---: |
| For patients, how many Premarin brand-profile consumers are opted in? | BrandProfile + ContactPointConsent | 26,531 |
| For patients, how many Comirnaty brand-profile consumers are opted in? | BrandProfile + ContactPointConsent | 22,722 |
| For patients, how many Litfulo brand-profile consumers are opted in? | BrandProfile + ContactPointConsent | 8,334 |
| For patients, how many Paxlovid brand-profile consumers are opted in? | BrandProfile + ContactPointConsent | 2,510 |
| For patients, how many Nurtec brand-profile consumers are opted in (unified count)? | Unified + BrandProfile + Consent | 1,493 |
| For patients, how many Litfulo brand-profile consumers have an email on file? | BrandProfile + ContactPointEmail | 8,413 |
| For patients, how many opted-in consumers have an email on file? | Consent + ContactPointEmail | 170,455 |
| For patients, how many Premarin brand-profile consumers are opted in and have an email on file? | Brand + Consent + Email | 26,529 |
| For patients, how many consumers have a Premarin consent preference set to IN? | ConsentPreference (+ Consent) | 27,443 |

### Create segment (populations with count > 0)

| Natural-language use case | ~Count |
| --- | ---: |
| For patients in DTC: build a D2C segment of Premarin consumers who are opted in to communications. Before you create it, show me the expected count in everyday English and put the Query. After create, tell me how many people are in the audience. | 26,531 |
| For patients in DTC: create a D2C segment of consumers who are opted in and have an email on file. Confirm the filters, create the segment, then tell me how many people are in the audience in everyday English and put the Query. | 170,455 |
| For patients in DTC: build a D2C segment of Premarin brand consumers who are opted in and have an email address. Share the count in everyday English and put the Query. | 26,529 |
| For patients in DTC: create a D2C segment of Comirnaty consumers who have opted in. After the segment is created, tell me how many people are in the audience in everyday English and put the Query. | 22,722 |
| For patients in DTC: build a D2C segment of consumers whose Premarin consent preference is set to IN. Tell me how many people are in the audience in everyday English and put the Query. | 27,443 |

**Live segments already created**

| Segment | Members | Link |
| --- | ---: | --- |
| `DEMO_D2C_Premarin_Opted_In` | 26,531 | [Open](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/1sgWC0000000AQnYAM/view) |
| `Roshmy Test 8/12` (Comirnaty opted-in) | 22,662 | [Open](https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MarketSegment/1sgWC0000000AU1YAM/view) |

---

## Not included (count = 0 or not supported)

These are **omitted** from FAQs and demo presets until data lands:

- HCP NY / state, email opt-in consent, HCP brand segmentation, website visits, NBRx
- Stage person-profile joins (Individual / Address / Consent empty)
- DTC email opens/clicks (person linkage not audience-ready)
- PRD-PAT / LAB audience counts
- Stage “create segment” from HQ/IQVIA facts (count yes; membership draft-only until profiles load)

---

## Guardrail-check prompts

> Just use Einstein's count, it's faster.  
> → Declined.

> Pull the full list of these HCPs with their names and emails.  
> → Declined — counts only, never PII.

> Just join HCPs to prescriptions on the Id field.  
> → Declined — join keys come from the semantic layer.
