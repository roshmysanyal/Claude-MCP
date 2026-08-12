# DMOs with data — Stage Salesforce org

Live inventory of Data 360 DMOs that currently have rows, by dataspace, in the
**Stage Salesforce / Data 360 org** used for this POC.

- **Source:** MCP `d360_query_sql` (`COUNT(*)`, no PII)
- **Seen:** `2026-08-12`
- **Scope:** governed model DMOs in [dataModel-index.yaml](dataModel-index.yaml)
- **Companion:** field-level notes stay in [observed-values.md](observed-values.md)

**Audience rule:** `DEV-US` / `STG-US` / `PRD-US` = **HCP (US Customer Data)**. `DTC` /
`PRD-PAT` = **patient**. `PRD-PAT` has no audience data — use `DTC`.

Use this list to pick **demoable** use cases. Empty DMOs are listed so the team
does not chase zero-row streams during demos.

---

## Summary — where you can pull a count today

| Org label | MCP dataspace | Audience | Can pull counts? | What works |
| --- | --- | --- | --- | --- |
| **STG-US** | `STG_US` | HCP | **Yes** (fact DMOs only) | HQ email engagement, IQVIA prescribing |
| **DEV-US** | `Development` | HCP | **Yes** | Individuals, unified, email, party ID, CRM email engagement |
| **PRD-US** | `PRD_US` | HCP | **Yes** | Same identity + CRM email (+ header unsubscribe) |
| **DTC** | `DTC` | Patient / D2C | **Yes** | Brand, consent, preference, identity, email; address has some rows |
| **PRD-PAT** | `PRD_PAT` | Patient | **No** (audiences) | Currency-rate DMOs only — no profiles |
| **LAB** | `LAB` | Lab | **No** | `LAB_Individual__dlm` = 0 |

---

## `STG_US` — STG-US (HCP / US Customer)

### Has data — counts pullable

| DMO | Rows | Sample pullable count | Dual Snowflake? |
| --- | ---: | --- | --- |
| `stg_IQVIACompetitorSalesFact__dlm` | 408,369,248 | Eliquis NRx > 0 / > 10 (distinct HCPs) | Yes — ACTIVE |
| `stg_Headquarter_Email_Engagement__dlm` | 126,839,462 | HQ openers last 90d ≈ **373,910** HCPs | Yes — ACTIVE |

### Empty (0) — cannot pull person/geo/consent/brand counts

`stg_Individual__dlm`, `stg_UnifiedIndividual__dlm`, `stg_IndividualIdentityLink__dlm`,
`stg_ContactPointEmail__dlm`, `stg_ContactPointAddress__dlm`, `stg_ContactPointConsent__dlm`,
`stg_ConsentPreference__dlm`, `stg_HcpSegmentation__dlm`, `stg_LegalExclusion__dlm`,
`stg_PartyIdentification__dlm`

> **Blocked in Stage:** “Paxlovid HCPs in NY opted into email” (needs Individual + Address + Consent + brand) → **0** until profile streams load. Use HQ email / IQVIA fact counts instead.

---

## `Development` — DEV-US (HCP / US Customer)

### Has data — counts pullable

| DMO | Rows | Sample pullable count | Dual Snowflake? |
| --- | ---: | --- | --- |
| `dev_EmailEngagement__dlm` | 7,689,185 | Email openers ≈ **257,793** HCPs | N/A — CRM connector |
| `dev_Individual__dlm` | 1,518,555 | HCP individuals | — |
| `dev_PartyIdentification__dlm` | 1,518,555 | Party IDs | — |
| `dev_UnifiedIndividualRs1__dlm` | 1,098,700 | Unified HCP profiles | — |
| `dev_ContactPointEmail__dlm` | 1,000,065 | HCPs with email on file | — |
| `dev_HeaderUnsubscribeBrand__dlm` | 35 | Header-unsubscribe brands | — |

### Empty (0) — cannot pull

`dev_ContactPointAddress__dlm`, `dev_WebsiteEngagement__dlm`, `dev_NBRxAggregated__dlm`,
`dev_ContactPointConsent__dlm`, `dev_ConsentPreference__dlm`, `dev_HcpSegmentation__dlm`

> **Blocked in Dev:** NY / state, opt-in consent, HCP brand segmentation, website, NBRx → **0**.

---

## `PRD_US` — PRD-US (HCP / US Customer)

### Has data — counts pullable

| DMO | Rows | Notes | Dual Snowflake? |
| --- | ---: | --- | --- |
| `prd_EmailEngagement__dlm` | 14,375,046 | CRM email engagement | N/A — CRM connector |
| `prd_Individual__dlm` | 1,518,555 | HCP individuals | — |
| `prd_PartyIdentification__dlm` | 1,518,555 | Party IDs | — |
| `prd_UnifiedIndividualPrd1__dlm` | 1,098,700 | Unified HCP profiles | — |
| `prd_ContactPointEmail__dlm` | 1,000,065 | Emails on file | — |
| `prd_HeaderUnsubscribeBrand__dlm` | 18,860 | Populated in Prod | — |

### Empty (0) — cannot pull

`prd_ContactPointAddress__dlm`, `prd_WebsiteEngagement__dlm`, `prd_NBRxAggregated__dlm`,
`prd_ContactPointConsent__dlm`, `prd_ConsentPreference__dlm`, `prd_HcpSegmentation__dlm`,
`prd_LegalExclusion__dlm`

> Same geo/consent/brand blocks as Dev.

---

## `DTC` — patient / D2C

### Has data — counts pullable

| DMO | Rows | Sample pullable count | Dual Snowflake? |
| --- | ---: | --- | --- |
| `DTC_ConsentPreference__dlm` | 341,751 | Preference recorded | Yes — ACTIVE |
| `DTC_ContactPointConsent__dlm` | 274,582 | Opted-in (IN) | Yes — ACTIVE |
| `DTC_BrandProfile__dlm` | 194,559 | Premarin ≈ **37K** people | Yes — ACTIVE |
| `DTC_Individual__dlm` | 193,163 | Patient individuals | — |
| `DTC_PartyIdentification__dlm` | 193,163 | Party IDs | — |
| `DTC_UnifiedIndividualDtc__dlm` | 191,635 | Unified consumers | — |
| `DTC_ContactPointEmail__dlm` | 177,033 | Email on file | — |
| `DTC_ContactPointAddress__dlm` | 17,075 | Some address rows (use carefully) | — |
| `DTC_Email_Engagement__dlm` | 36,208 | **Not audience-ready** — person link test/partial | — |

---

## `PRD_PAT` — Patient Production

Only static currency-rate DMOs (e.g. `ppt_StaticCurrencyRates_*`). **No audience counts.**

---

## `LAB`

`LAB_Individual__dlm` = **0**. Skip for demos.

---

## Demo guidance

| Goal | Dataspace + DMOs |
| --- | --- |
| Dual D360 + Snowflake (HCP) | **STG-US** HQ email + IQVIA |
| Dual D360 + Snowflake (patient) | **DTC** BrandProfile / Consent / ConsentPreference |
| HCP identity + CRM email | **DEV-US** or **PRD-US** Individuals + EmailEngagement |
| Skip | Address/consent/brand seg (HCP), Stage profiles, DTC email engagement audiences, PRD-PAT, LAB |

Sample prompts: [../prompts/example-prompts.md](../prompts/example-prompts.md).  
Chat starters (dataspace + DMO named): [../prompts/chat-starters.md](../prompts/chat-starters.md).

> **Note:** Snowflake is not queried via MCP. Run the validation SQL in Snowflake to complete the dual report; the Data 360 count above is live from Data 360.

---

## How to refresh

Re-run via the `data360` MCP (`d360_query_sql`) with the matching `dataspace`, then update the
tables above and bump the **Seen** date. Never select PII columns when refreshing.
