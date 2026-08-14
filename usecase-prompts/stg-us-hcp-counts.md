# Use-case prompts — STG_US (Stage) HCP counts

Natural-language prompts that return **real HCP counts** in dataspace **`STG_US`**
(label STG-US / Stage), based on live MCP row checks on **2026-08-07**.

This folder is a **separate node** from [../prompts/](../prompts/) (POC example prompts).
Add more dataspace-specific use-case prompt files here as they are validated.

Semantic layer: [../reference/dataModel-stg-us.yaml](../reference/dataModel-stg-us.yaml).  
Always say **Stage** (or `STG_US`) when the Skill asks Dev / Stage / Prod.  
Counts return **numbers only** — no PII (see Skill *PII-safe counts*) — in **everyday English**,
then the **Query**. Do **not** include a Snowflake count or matching table.

**Tag in demo UI / example prompts:** these Stage HQ + IQVIA prompts are labeled
**Stage count**.

---

## Data reality (Stage)

| Area | Status | Notes |
| --- | --- | --- |
| UnifiedIndividual / Individual / IdentityLink | **Empty (0)** | Classic IR-path “resolved HCP” counts return **0** until profile streams land |
| ContactPointEmail / Address / Consent | **Empty (0)** | No state, opt-in, or email-contact filters |
| HcpSegmentation / PartyIdentification / LegalExclusion | **Empty (0)** | |
| **HeadquarterEmailEngagement** | **Populated (~126M events)** | Primary demo source for Stage HCP engagement counts |
| **IQVIACompetitorSalesFact** | **Populated (~408M facts)** | Competitive prescribing / NRx-style counts |

**Count grain today:** `COUNT(DISTINCT IndividualId__c)` on the populated engagement / IQVIA
DMOs (IDs look like `PFZ_CUST_ID-…`). Do **not** require a join to UnifiedIndividual until
profile data loads — that path yields 0.

**Literals differ from Development email engagement:** Stage HQ actions use `OPENED` / `CLICKED`
/ `SENT` / `DELIVERED` / `OPTED-OUT` (not Dev’s `Open` / `Click`).

---

## Demo-ready prompts (copy/paste)

> Prefer prompts that name **STG-US + populated DMO** so the agent skips clarifying steps.  
> Full bank: [../prompts/example-prompts.md](../prompts/example-prompts.md) · starters: [../prompts/chat-starters.md](../prompts/chat-starters.md).
> Answers: everyday English + the Query. No Snowflake count or matching table.

### Headquarter email engagement (populated DMO: `stg_Headquarter_Email_Engagement__dlm`)

**Low-friction count (recommended):**

```text
In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

| # | Short FAQ / prompt | Maps to | Ballpark (2026-08-07) |
| --- | --- | --- | ---: |
| 1 | In Stage, how many HCPs opened a headquarter email in the last 90 days? | `EngagementChannelAction__c = 'OPENED'` + last 90 days | ~376,055 |
| 2 | In Stage, how many HCPs clicked a headquarter email in the last 90 days? | `EngagementChannelAction__c = 'CLICKED'` + last 90 days | ~44,850 |
| 3 | In Stage, how many HCPs opened a Nurtec headquarter email in the last 90 days? | Brand `NURTEC` + `OPENED` + last 90 days | ~14,574 |
| 4 | In Stage, how many HCPs were sent a headquarter email? | `EngagementChannelAction__c = 'SENT'` | ~1.66M distinct IDs (all-time in table) |
| 5 | In Stage, how many HCPs opened a Comirnaty headquarter email in the last 90 days? | Brand `COMIRNATY` + `OPENED` + last 90 days | (re-run to confirm) |
| 6 | In Stage, how many HCPs opened a Paxlovid headquarter email in the last 90 days? | Brand `PAXLOVID` + `OPENED` + last 90 days | (re-run to confirm) |

**Observed HQ action vocabulary:** `SENT`, `DELIVERED`, `OPENED`, `CLICKED`, `SOFT BOUNCE`,
`BLOCK BOUNCE`, `HARD BOUNCE`, `OPTED-OUT`.

**Top brands by distinct people (HQ email, all-time sample):** `UNBRANDED`, `COMIRNATY`,
`PAXLOVID`, `PREVNAR 20`, `ABRYSVO`, `ETRASIMOD`, `NURTEC`, `ELIQUIS`, …

### IQVIA competitive prescribing (populated DMO: `stg_IQVIACompetitorSalesFact__dlm`)

```text
In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Answer in everyday English for a non-technical reader. Then put the Query (the Data 360 SQL you ran). Do not include a Snowflake count, matching table, PENDING, Delta, or dual-report.
```

| # | Short FAQ / prompt | Maps to | Ballpark (2026-08-07) |
| --- | --- | --- | ---: |
| 7 | In Stage, how many HCPs have Eliquis NRx volume greater than zero in IQVIA competitive prescribing? | `BrandName__c = 'ELIQUIS'` and `NRXVolume__c > 0` | ~606,740 |

Variations (same pattern):

> In Stage, how many HCPs have NRx volume greater than zero for `<brand>` in IQVIA competitive prescribing?

Use a `BrandName__c` value present in IQVIA (e.g. `ELIQUIS`). Re-profile brands before demos if needed.

---

## Do not use for Stage demos (expect 0)

These need empty profile / address / consent / website / standard EmailEngagement DMOs:

> How many HCPs in New York visited the website in the last 60 days?

> How many opted-in `<brand>` HCPs opened a CRM email?

> How many HCPs are within 100 miles of ZIP 07073?

> How many Oncology HCPs engaged with email and the Oncology website?

Use **Development** for standard `EmailEngagement` (`Open` / `Click`) demos, or wait until STG
profile + address streams are activated.

---

## Expected Skill behavior

1. Ask **Dev / Stage / Prod** if not named → user chooses **Stage** → load
   [dataModel-stg-us.yaml](../reference/dataModel-stg-us.yaml), dataspace `STG_US`.
2. Map HQ email asks to `HeadquarterEmailEngagement` (not `EmailEngagement` — that DMO is absent
   in STG).
3. Return **COUNT(DISTINCT …) only** — never PII (no emails, names, or sample people).
4. **Answer in everyday English, then put the Query.** Do **not** show a Snowflake count or
   matching table.
5. If the path incorrectly goes through empty UnifiedIndividual and returns 0, fall back to
   counting distinct `IndividualId__c` on the HQ / IQVIA DMO and note the profile gap.
6. Empty Staging results: still return literal SQL under **Query** when applicable.
