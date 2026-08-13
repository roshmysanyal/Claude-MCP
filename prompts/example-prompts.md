# Example Prompts — pullable use cases only (count > 0)

Natural-language prompts that return a **non-zero** Data 360 count today.
Paste as-is with the `d360-segments-activations` Skill and `data360` MCP connected.

**Inventory date:** 2026-08-12 · Full DMO matrix: [../reference/dmos-with-data-stage-org.md](../reference/dmos-with-data-stage-org.md)  
**Chat starters (paste first):** [chat-starters.md](chat-starters.md)

> **Note — Snowflake:** Do not check Snowflake MCP. Every dual-report returns the live Data 360
> count, Snowflake validation SQL (PENDING), the note, and Data 360 DMO + segment links.

---

## How the agent runs every prompt

1. **Dataspace first** (unless already named):
   - **HCP (US Customer Data):** `DEV-US` → `Development`, `STG-US` → `STG_US`, `PRD-US` → `PRD_US`
   - **Patient / D2C:** `DTC` (live). `PRD-PAT` is empty — use `DTC`.
2. **Audience:** US customer → HCP model; patient/consumer → DTC.
3. **D2C create/update:** **ask** whether to include **CIA Consumer Marketable Email**; nest it first only if yes. Every publish uses **`lookbackPeriod: P2Y`**.
4. **Dual-report:** live Data 360 count + Snowflake validation SQL (PENDING / N/A) — do **not** probe Snowflake MCP — plus DMO and segment links.
5. **Low-friction prompts:** name dataspace + populated DMO(s) so the agent does **not** re-ask
   routing questions. Prefer the **copy-paste ready** block below.

| Tag | Meaning |
| --- | --- |
| **D360 + Snowflake** | ACTIVE Snowflake stream — D360 live + Snowflake SQL PENDING |
| **HCP · Dev / Prod** | Live D360; Snowflake **N/A** (CRM-loaded) |
| **D2C** | Patient / DTC |

**Expected dual-report shape**

```text
| Source | Count | Reference |
| --- | --- | --- |
| Data 360 | <N> | Dataspace <name> · DMO <api_name> |
| Snowflake source | PENDING or N/A | <DATABASE.SCHEMA.TABLE> · stream <stream> |

Delta: PENDING / N/A
**Snowflake validation SQL:** <exact SQL>
> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.
**Data 360 DMO link:** https://pfizer-cdp-us--cfcstage.sandbox.lightning.force.com/lightning/r/MktDataModelObject/<dmoId>/view
**Data 360 segment link:** <MarketSegment URL or N/A — DMO count only (no MarketSegment)>
```

---

## Starting a chat — suggestion prompts

When opening a new Cursor chat with this Skill, paste one of these (or ask the agent for
“starter prompts”). Full set: [chat-starters.md](chat-starters.md).

| # | Audience | Suggestion (short) |
| --- | --- | --- |
| 1 | HCP · STG-US | HQ email opens last 90d — dual D360 + Snowflake |
| 2 | HCP · STG-US | Eliquis IQVIA NRx > 0 — dual D360 + Snowflake |
| 3 | Patient · DTC | Premarin brand profile — dual D360 + Snowflake |
| 4 | Patient · DTC | Premarin brand + opted in — dual D360 + Snowflake |
| 5 | HCP · DEV-US | Email openers — D360 live, Snowflake N/A (CRM) |

---

## Copy-paste ready (dataspace + DMO named — minimal clarifying steps)

Use these when you want a **clear dual report** without the agent asking dataspace / audience
again. Each prompt already names the populated DMO and the Snowflake stream table.
Do **not** check Snowflake MCP — expect live D360 count + Snowflake SQL (PENDING) + note + DMO/segment links.

### HCP — STG-US (Snowflake streams ACTIVE)

**HQ email opens (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Do not check Snowflake MCP. Return the dual-report table: live Data 360 count + Snowflake validation SQL for stream STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL (PENDING) + note + Data 360 DMO link and segment link (or N/A).
```

**HQ email clicks (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who clicked a headquarter email in the last 90 days on DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'CLICKED'). No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for STG_HCP_OCL_HEADQUARTER_EMAIL (CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL) PENDING + note + DMO and segment links (or N/A).
```

**Paxlovid HQ opens (90d)**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who opened a Paxlovid headquarter email in the last 90 days on populated DMO stg_Headquarter_Email_Engagement__dlm (Brand__c = 'PAXLOVID', EngagementChannelAction__c = 'OPENED'). No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL (PENDING) + note + DMO and segment links (or N/A).
```

**Eliquis IQVIA NRx > 0**

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING (PENDING) + note + DMO and segment links (or N/A).
```

### Patient / D2C — DTC (Snowflake streams ACTIVE)

**Premarin brand profile**

```text
In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for DTC_BRAND_PROFILE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES (BRAND_NAME) PENDING + note + DMO and segment links (or N/A).
```

**Opted-in consent**

```text
In dataspace DTC (patient/D2C), count distinct consumers with ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm. No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for DTC_OT_EMAIL_CONSENT → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_EMAIL_CONSENTS (CONSENT_VALUE) PENDING + note + DMO and segment links (or N/A).
```

**Premarin + opted in (multi-DMO)**

```text
In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL against DTC_BRAND_PROFILES joined to DTC_OT_EMAIL_CONSENTS in CDP_US_DTC_STG_DB.DTC_DC_IN (PENDING) + note + DMO links for both DMOs and segment link (or N/A).
```

**Premarin preference IN**

```text
In dataspace DTC (patient/D2C), count consumers with PreferenceName__c = 'PREMARIN' and PreferenceValue__c = 'IN' on populated DMO DTC_ConsentPreference__dlm (with DTC_ContactPointConsent__dlm as needed). No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for DTC_OT_CONSENT_PREFERENCE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_CONSENT_PREFERENCES (PENDING) + note + DMO and segment links (or N/A).
```

**Premarin opted-in + email**

```text
In dataspace DTC (patient/D2C), count distinct consumers with PREMARIN on DTC_BrandProfile__dlm, ConsentStatusId__c = 'IN' on DTC_ContactPointConsent__dlm, and a row on populated DMO DTC_ContactPointEmail__dlm. No clarifying questions. Do not check Snowflake MCP. Dual-report live Data 360 + Snowflake validation SQL for brand/consent streams in CDP_US_DTC_STG_DB.DTC_DC_IN (PENDING) + note + DMO and segment links (or N/A).
```

### HCP — DEV-US / PRD-US (D360 live; Snowflake N/A — CRM)

**Dev email opens**

```text
In dataspace DEV-US (MCP: Development), HCP: count distinct HCPs who opened an email on populated DMO dev_EmailEngagement__dlm. No clarifying questions. Dual-report table: Data 360 count + Snowflake source as N/A (CRM-fed, not Snowflake). Name the DMO in the Reference column.
```

**Prod email opens**

```text
In dataspace PRD-US (MCP: PRD_US), HCP: count distinct HCPs who opened an email on populated DMO prd_EmailEngagement__dlm. No clarifying questions. Dual-report: Data 360 count + Snowflake N/A (CRM connector).
```

---

## FAQs — Sample use cases by dataspace

Short FAQ wording (demo UI / CoCo). For dual Snowflake demos, prefer the **copy-paste ready**
block above (dataspace + DMO named).

### STG-US (HCP) — dual D360 + Snowflake

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

**Snowflake sources (STG-US):**  
`CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL` · stream `STG_HCP_OCL_HEADQUARTER_EMAIL`  
`CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING` · stream `STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING`

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

Snowflake: **N/A** (CRM connector) for email engagement.

### PRD-US (HCP) — identity & CRM email

| Natural-language use case | Populated DMO | ~Count |
| --- | --- | ---: |
| In Prod, how many HCP individuals are in the profile? | `prd_Individual__dlm` | 1,517,180 |
| In Prod, how many HCPs have a contact-point email on file? | `prd_ContactPointEmail__dlm` | 999,918 |
| In Prod, how many HCPs opened an email? | `prd_EmailEngagement__dlm` | 422,129 |
| In Prod, how many HCPs clicked an email? | `prd_EmailEngagement__dlm` | 138,623 |
| In Prod, how many HCPs were sent an email? | `prd_EmailEngagement__dlm` | 867,353 |

Snowflake: **N/A** (CRM connector) for email engagement.

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

**Snowflake sources (DTC):**  
`CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES` · `DTC_BRAND_PROFILE`  
`CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_EMAIL_CONSENTS` · `DTC_OT_EMAIL_CONSENT`  
`CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_CONSENT_PREFERENCES` · `DTC_OT_CONSENT_PREFERENCE`

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

### Create segment + dual count (populations with count > 0)

| Natural-language use case | ~Count |
| --- | ---: |
| For patients in DTC: build a D2C segment of Premarin consumers who are opted in to communications. Before you create it, show me the expected count. After create, give me the Data 360 segment count and the Snowflake source count for validation. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A). | 26,531 |
| For patients in DTC: create a D2C segment of consumers who are opted in and have an email on file. Confirm the filters, create the segment, then compare the Data 360 count to the Snowflake source count. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A). | 170,455 |
| For patients in DTC: build a D2C segment of Premarin brand consumers who are opted in and have an email address. Share the Data 360 count and the matching Snowflake validation count. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A). | 26,529 |
| For patients in DTC: create a D2C segment of Comirnaty consumers who have opted in. Report Data 360 vs Snowflake counts after the segment is created. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A). | 22,722 |
| For patients in DTC: build a D2C segment of consumers whose Premarin consent preference is set to IN. Validate the member count in Data 360 against Snowflake. Do not check Snowflake MCP. Return live Data 360 count + Snowflake validation SQL (PENDING) + note + Data 360 DMO link and segment link (or N/A). | 27,443 |

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
