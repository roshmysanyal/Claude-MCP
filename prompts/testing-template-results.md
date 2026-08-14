# Testing template — live run results

**Date:** 2026-08-14  
**Source:** [testing-template.csv](testing-template.csv)  
**Answer shape:** English sentence with *doctors*/*patients* + number · then **Query** · no Snowflake / dual-report  
**Env note:** Prompts do not name an environment. For this run: **headquarter / Eliquis** → Stage data; **doctor profile / CRM email** → Dev data; **patients** → DTC.

| # | C | S | Expected English lead (number) | Next agent step |
| ---: | --- | --- | --- | --- |
| 1 | T | F | There are **6** patients who have at least one copay card with a card number filled in (six test customers on the allowlist). | stop |
| 2 | T | F | There are **35,640** patients who are opted in to Brand or Topic ALL and are Caregiver/Prospect/Patient or on a prescription program or on medication or acquired in the last 24 months. | stop |
| 3 | T | F | There are **313** patients who have a copay card with a card number on file for Nurtec, Xeljanz, Paxlovid, Eucrisa, or Lorbrena, acquired and active in the last 36 months. | stop |
| 4 | T | F | There are **2,986** patients who opened or clicked a journey email, or had a headquarter email sent/opened/clicked/delivered in the last year. | stop |
| 5 | T | F | There are **368,622** doctors who opened a headquarter email in the last 90 days. | stop · *(ran on Stage)* |
| 6 | T | F | There are **44,026** doctors who clicked a headquarter email in the last 90 days. | stop · *(Stage)* |
| 7 | T | F | There are **1,663,037** doctors who were sent a headquarter email. | stop · *(Stage)* |
| 8 | T | F | There are **134,774** doctors who opened a Paxlovid headquarter email in the last 90 days. | stop · *(Stage)* |
| 9 | T | F | There are **16,878** doctors who clicked a Paxlovid headquarter email in the last 90 days. | stop · *(Stage)* |
| 10 | T | F | There are **91,481** doctors who opened an Abrysvo headquarter email in the last 90 days. | stop · *(Stage)* |
| 11 | T | F | There are **14,532** doctors who opened a Nurtec headquarter email in the last 90 days. | stop · *(Stage)* |
| 12 | T | F | There are **93,614** doctors who opened a Comirnaty headquarter email in the last 90 days. | stop · *(Stage)* |
| 13 | T | F | There are **606,740** doctors who have Eliquis prescribing volume greater than zero. | stop · *(Stage)* |
| 14 | T | F | There are **2,142** doctors who have Eliquis prescribing volume greater than 10. | stop · *(Stage)* |
| 15 | T | F | There are **1,107,981** doctors in the profile. | stop · *(Dev)* |
| 16 | T | F | There are **1,107,981** resolved doctor profiles. | stop · *(Dev)* |
| 17 | T | F | There are **1,000,733** doctors who have an email on file. | stop · *(Dev)* |
| 18 | T | F | There are **1,107,981** doctors who have a party identification record. | stop · *(Dev)* |
| 19 | T | F | There are **260,122** doctors who opened an email. | stop · *(Dev)* |
| 20 | T | F | There are **58,018** doctors who clicked an email. | stop · *(Dev)* |
| 21 | T | F | There are **531,034** doctors who were sent an email. | stop · *(Dev)* |
| 22 | T | F | There are **35** doctors on the header-unsubscribe brand list. | stop · *(Dev · row count on list)* |
| 23 | T | F | There are **37,463** patients on the Premarin brand profile. | stop |
| 24 | T | F | There are **23,990** patients on the Comirnaty brand profile. | stop |
| 25 | T | F | There are **8,425** patients on the Litfulo brand profile. | stop |
| 26 | T | F | There are **3,904** patients on the Paxlovid brand profile. | stop |
| 27 | T | F | There are **1,903** patients on the Nurtec brand profile. | stop |
| 28 | T | F | There are **193,610** patients who have any brand profile. | stop |
| 29 | T | F | There are **170,919** patients who are opted in. | stop |
| 30 | T | F | There are **352,794** consent preference rows on file *(or rephrase as patients with a preference — confirm grain)*. | stop |
| 31 | T | F | There are **193,610** patients in the profile. | stop |
| 32 | T | F | There are **192,079** resolved patient profiles. | stop |
| 33 | T | F | There are **177,412** patients who have an email on file. | stop |
| 34 | T | F | There are **26,531** Premarin patients who are opted in. | stop |
| 35 | T | F | There are **22,733** Comirnaty patients who are opted in. | stop |
| 36 | T | F | There are **8,334** Litfulo patients who are opted in. | stop |
| 37 | T | F | There are **2,618** Paxlovid patients who are opted in. | stop |
| 38 | T | F | There are **1,497** Nurtec patients who are opted in. | stop · *(unified)* |
| 39 | T | F | There are **8,413** Litfulo patients who have an email on file. | stop |
| 40 | T | F | There are **170,611** opted-in patients who have an email on file. | stop |
| 41 | T | F | There are **26,529** Premarin patients who are opted in and have an email on file. | stop |
| 42 | T | F | There are **27,286** patients with Premarin consent preference set to opted in. | stop |
| 43 | T | T | Count first: **26,531** Premarin patients opted in. Then ask CIA → create with name ending in `test`, lookback **P2Y**. | CIA ask · create |
| 44 | T | T | Count first: **170,611** opted-in patients with email. Then ask CIA → create. | CIA ask · create |
| 45 | T | T | Count first: **26,529** Premarin opted in + email. Then ask CIA → create. | CIA ask · create |
| 46 | T | T | Count first: **22,733** Comirnaty opted in. Then ask CIA → create. | CIA ask · create |
| 47 | T | T | Count first: **27,286** Premarin preference opted in. Then ask CIA → create. | CIA ask · create |

## Response template to score against

**Count only (`Segment: FALSE`):**

```text
There are <N> <doctors|patients> who <plain-English criteria>.

**Query**
<select count sql>
```

Then ask: build as a segment? · Email or SMS?  
Do **not** include a Salesforce segment link on a count.

**After create / status (`Segment: TRUE`):** English member count + **Open this audience** link is OK.

No Snowflake · no dual-report · no PENDING/Delta table.

## Open iteration questions

1. Doctor prompts without env: should the agent **always ask** Dev/Stage/Prod, or is a default OK for this CSV?
2. Row 30 “consent preference on file” — people count vs preference-row count?
3. Row 22 header-unsubscribe — distinct doctors vs list rows (35)?
4. Segment rows 43–47 — create in this batch, or stop after count + CIA question?
