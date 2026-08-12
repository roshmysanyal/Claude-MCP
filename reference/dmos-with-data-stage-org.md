# DMOs with data — Stage Salesforce org

Live inventory of Data 360 DMOs that currently have rows, by dataspace, in the
**Stage Salesforce / Data 360 org** used for this POC.

- **Source:** MCP `d360_query_sql` (`COUNT(*)`, no PII)
- **Seen:** `2026-08-11`
- **Scope:** governed model DMOs in [dataModel-index.yaml](dataModel-index.yaml)
- **Companion:** field-level notes stay in [observed-values.md](observed-values.md)

Use this list to pick **demoable** use cases. Empty DMOs are listed so the team
does not chase zero-row streams during demos.

---

## Summary (has data today)

| Dataspace | Audience | DMOs with data |
| --- | --- | --- |
| **`STG_US`** (Stage) | HCP | HQ email engagement, IQVIA competitive prescribing |
| **`Development`** (Dev) | HCP | Individuals, unified identity, contact email, party ID, CRM email engagement, header unsubscribe |
| **`PRD_US`** (Prod) | HCP | Same identity + CRM email pattern as Dev (larger email volume; header unsubscribe populated) |
| **`DTC`** | Patient / D2C | Brand profile, consent, consent preference, individuals, unified identity, contact email, email engagement\* |

\*`DTC_Email_Engagement__dlm` has rows but **person linkage is test/partial** — do not use for audience demos yet.

---

## `STG_US` — Stage (HCP)

### Has data

| DMO | Rows | Notes |
| --- | ---: | --- |
| `stg_IQVIACompetitorSalesFact__dlm` | 408,369,248 | Snowflake stream ACTIVE — dual-validate |
| `stg_Headquarter_Email_Engagement__dlm` | 126,839,462 | Snowflake stream ACTIVE — dual-validate |

### Empty (0 rows)

`stg_Individual__dlm`, `stg_UnifiedIndividual__dlm`, `stg_IndividualIdentityLink__dlm`,
`stg_ContactPointEmail__dlm`, `stg_ContactPointAddress__dlm`, `stg_ContactPointConsent__dlm`,
`stg_ConsentPreference__dlm`, `stg_HcpSegmentation__dlm`, `stg_LegalExclusion__dlm`,
`stg_PartyIdentification__dlm`

> Stage demos that need an HCP *person* identity join will return 0 until profile streams load.
> Lead with HQ email and IQVIA fact counts (those DMOs carry their own person/engagement keys).

---

## `Development` — Dev (HCP)

### Has data

| DMO | Rows | Notes |
| --- | ---: | --- |
| `dev_EmailEngagement__dlm` | 7,688,075 | CRM-loaded — Snowflake N/A; still return validation SQL |
| `dev_Individual__dlm` | 1,518,555 | Profile universe |
| `dev_UnifiedLinkIndividualRs1__dlm` | 1,518,555 | Identity resolution link |
| `dev_PartyIdentification__dlm` | 1,518,555 | Party / subscriber keys |
| `dev_UnifiedIndividualRs1__dlm` | 1,098,700 | Unified HCP profiles |
| `dev_ContactPointEmail__dlm` | 1,000,065 | Contact-point emails |
| `dev_HeaderUnsubscribeBrand__dlm` | 35 | Small but populated |

### Empty (0 rows)

`dev_ContactPointAddress__dlm`, `dev_WebsiteEngagement__dlm`, `dev_NBRxAggregated__dlm`,
`dev_ContactPointConsent__dlm`, `dev_ConsentPreference__dlm`, `dev_HcpSegmentation__dlm`

---

## `PRD_US` — Prod (HCP)

### Has data

| DMO | Rows | Notes |
| --- | ---: | --- |
| `prd_EmailEngagement__dlm` | 14,373,560 | CRM-loaded — Snowflake N/A; still return validation SQL |
| `prd_Individual__dlm` | 1,518,555 | Profile universe |
| `prd_UnifiedLinkIndividualPrd1__dlm` | 1,518,555 | Identity resolution link |
| `prd_PartyIdentification__dlm` | 1,518,555 | Party / subscriber keys |
| `prd_UnifiedIndividualPrd1__dlm` | 1,098,700 | Unified HCP profiles |
| `prd_ContactPointEmail__dlm` | 1,000,065 | Contact-point emails |
| `prd_HeaderUnsubscribeBrand__dlm` | 18,860 | Populated in Prod |

### Empty (0 rows)

`prd_ContactPointAddress__dlm`, `prd_WebsiteEngagement__dlm`, `prd_NBRxAggregated__dlm`,
`prd_ContactPointConsent__dlm`, `prd_ConsentPreference__dlm`, `prd_HcpSegmentation__dlm`,
`prd_LegalExclusion__dlm`

---

## `DTC` — patient / D2C

### Has data

| DMO | Rows | Notes |
| --- | ---: | --- |
| `DTC_ConsentPreference__dlm` | 341,751 | Snowflake stream ACTIVE — dual-validate |
| `DTC_ContactPointConsent__dlm` | 274,582 | Snowflake stream ACTIVE — dual-validate |
| `DTC_BrandProfile__dlm` | 194,559 | Snowflake stream ACTIVE — dual-validate |
| `DTC_Individual__dlm` | 193,163 | Patient profile universe |
| `DTC_UnifiedLinkIndividualDtc__dlm` | 193,163 | Identity resolution link |
| `DTC_UnifiedIndividualDtc__dlm` | 191,635 | Unified consumer profiles |
| `DTC_ContactPointEmail__dlm` | 177,033 | Contact-point emails |
| `DTC_Email_Engagement__dlm` | 36,208 | **Not demo-ready** — person linkage test/partial |

---

## Demo guidance

| Goal | Use these DMOs |
| --- | --- |
| Dual D360 + Snowflake demo (HCP) | `STG_US` HQ email + IQVIA |
| Dual D360 + Snowflake demo (patient) | `DTC` BrandProfile / Consent / ConsentPreference |
| HCP identity + CRM email | `Development` or `PRD_US` Individuals + EmailEngagement |
| Skip for live demos | Address, Website, NBRx, HCP consent (Dev/Prod), Stage profile DMOs, DTC email engagement audiences |

Sample prompts for the populated set: [../prompts/example-prompts.md](../prompts/example-prompts.md) (*Sample use cases*).

---

## How to refresh

```sql
-- Example: Stage HQ email
SELECT COUNT(*) FROM stg_Headquarter_Email_Engagement__dlm;

-- Example: Dev individuals
SELECT COUNT(*) FROM dev_Individual__dlm;

-- Example: DTC brand profiles
SELECT COUNT(*) FROM DTC_BrandProfile__dlm;
```

Re-run via the `data360` MCP (`d360_query_sql`) with the matching `dataspace`, then update the
tables above and bump the **Seen** date. Never select PII columns when refreshing.
