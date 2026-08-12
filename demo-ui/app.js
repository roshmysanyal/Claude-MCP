/**
 * Demo UI — use case → dual-report count outcome.
 * D360 numbers come from counts.json (refreshed by the agent via the data360 MCP).
 * DEFAULT_COUNTS keeps the page working when opened over file:// where fetch fails.
 */

const HQ_SOURCE = {
  database: "CDP_US_HCP_STG_DB",
  schema: "HCP_DC_IN",
  table: "HCP_OCL_HEADQUARTER_EMAIL",
  stream: "STG_HCP_OCL_HEADQUARTER_EMAIL",
  dmo: "stg_Headquarter_Email_Engagement__dlm",
};

const IQVIA_SOURCE = {
  database: "CDP_US_HCP_STG_DB",
  schema: "HCP_DC_IN",
  table: "HCP_IQVIA_COMPETITIVE_PRESCRIBING",
  stream: "STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING",
  dmo: "stg_IQVIACompetitorSalesFact__dlm",
};

const DEV_EMAIL_SOURCE = { dmo: "dev_EmailEngagement__dlm", snowflake: null };
const PRD_EMAIL_SOURCE = { dmo: "prd_EmailEngagement__dlm", snowflake: null };
const DEV_WEB_SOURCE = { dmo: "dev_WebsiteEngagement__dlm", snowflake: null };
const DEV_NBRX_SOURCE = { dmo: "dev_NBRxAggregated__dlm", snowflake: null };
const DEV_CONSENT_SOURCE = { dmo: "dev_ContactPointConsent__dlm", snowflake: null };
const DEV_INDIVIDUAL_SOURCE = { dmo: "dev_Individual__dlm", snowflake: null };
const DEV_UNIFIED_SOURCE = { dmo: "dev_UnifiedIndividualRs1__dlm", snowflake: null };
const DEV_PARTY_SOURCE = { dmo: "dev_PartyIdentification__dlm", snowflake: null };
const DEV_CPE_SOURCE = { dmo: "dev_ContactPointEmail__dlm", snowflake: null };
const DEV_HEADER_UNSUB_SOURCE = { dmo: "dev_HeaderUnsubscribeBrand__dlm", snowflake: null };
const DEV_ADDRESS_SOURCE = { dmo: "dev_ContactPointAddress__dlm", snowflake: null };
const PRD_WEB_SOURCE = { dmo: "prd_WebsiteEngagement__dlm", snowflake: null };
const PRD_NBRX_SOURCE = { dmo: "prd_NBRxAggregated__dlm", snowflake: null };
const PRD_INDIVIDUAL_SOURCE = { dmo: "prd_Individual__dlm", snowflake: null };
const PRD_CPE_SOURCE = { dmo: "prd_ContactPointEmail__dlm", snowflake: null };

const DTC_BRAND_SOURCE = {
  database: "CDP_US_DTC_STG_DB",
  schema: "DTC_DC_IN",
  table: "DTC_BRAND_PROFILES",
  stream: "DTC_BRAND_PROFILE",
  dmo: "DTC_BrandProfile__dlm",
};
const DTC_CONSENT_SOURCE = {
  database: "CDP_US_DTC_STG_DB",
  schema: "DTC_DC_IN",
  table: "DTC_OT_EMAIL_CONSENTS",
  stream: "DTC_OT_EMAIL_CONSENT",
  dmo: "DTC_ContactPointConsent__dlm",
};
const DTC_PREF_SOURCE = {
  database: "CDP_US_DTC_STG_DB",
  schema: "DTC_DC_IN",
  table: "DTC_OT_CONSENT_PREFERENCES",
  stream: "DTC_OT_CONSENT_PREFERENCE",
  dmo: "DTC_ConsentPreference__dlm",
};
const DTC_INDIVIDUAL_SOURCE = {
  database: "CDP_US_DTC_STG_DB",
  schema: "DTC_DC_IN",
  table: "DTC_CUSTOMERS",
  stream: "DTC_CUSTOMER",
  dmo: "DTC_Individual__dlm",
};
const DTC_UNIFIED_SOURCE = { dmo: "DTC_UnifiedIndividualDtc__dlm", snowflake: null };
const DTC_CPE_SOURCE = { dmo: "DTC_ContactPointEmail__dlm", snowflake: null };

const DEFAULT_COUNTS = {
  refreshedAt: "2026-08-10T16:30:00Z",
  counts: {
    "dev-individual": { d360: 1517180, status: "live" },
    "dev-unified": { d360: 1097325, status: "live" },
    "dev-cpe": { d360: 999918, status: "live" },
    "dev-party-id": { d360: 1517180, status: "live" },
    "dev-email-open-90d": { d360: 257704, status: "live" },
    "dev-email-click-90d": { d360: 56412, status: "live" },
    "dev-email-send": { d360: 530607, status: "live" },
    "dev-header-unsub": { d360: 35, status: "live" },
    "dev-website-visit-ny-60d": { d360: 0, status: "empty" },
    "dev-optin-email-ny": { d360: 0, status: "empty" },
    "dev-nbrx-utah": { d360: 0, status: "empty" },
    "dev-corp-site-ny-3m": { d360: 0, status: "empty" },
    "dev-corp-site-and-email-90d": { d360: 0, status: "empty" },
    "dev-oncology-email-and-web": { d360: 0, status: "empty" },
    "dev-zip-radius-07073": { d360: 0, status: "unsupported" },
    "stg-hq-opened-90d": { d360: 376660, status: "live" },
    "stg-hq-clicked-90d": { d360: 46472, status: "live" },
    "stg-hq-sent": { d360: 1663037, status: "live" },
    "stg-hq-nurtec-opened-90d": { d360: 14556, status: "live" },
    "stg-hq-comirnaty-opened-90d": { d360: 98423, status: "live" },
    "stg-hq-paxlovid-opened-90d": { d360: 134790, status: "live" },
    "stg-hq-paxlovid-clicked-90d": { d360: 16879, status: "live" },
    "stg-hq-abrysvo-opened-90d": { d360: 92016, status: "live" },
    "stg-iqvia-eliquis-nrx": { d360: 606740, status: "live" },
    "stg-iqvia-eliquis-nrx-gt10": { d360: 2142, status: "live" },
    "prd-individual": { d360: 1517180, status: "live" },
    "prd-cpe": { d360: 999918, status: "live" },
    "prd-email-open-90d": { d360: 422129, status: "live" },
    "prd-email-click-90d": { d360: 138623, status: "live" },
    "prd-email-send": { d360: 867353, status: "live" },
    "prd-website-visit-ny-60d": { d360: 0, status: "empty" },
    "prd-nbrx-brand": { d360: 0, status: "empty" },
    "dtc-brand-premarin": { d360: 37463, status: "live" },
    "dtc-brand-comirnaty": { d360: 23751, status: "live" },
    "dtc-brand-litfulo": { d360: 8425, status: "live" },
    "dtc-brand-paxlovid": { d360: 3760, status: "live" },
    "dtc-brand-nurtec": { d360: 1901, status: "live" },
    "dtc-brand-any": { d360: 194447, status: "live" },
    "dtc-consent-in": { d360: 170719, status: "live" },
    "dtc-consent-pref": { d360: 341661, status: "live" },
    "dtc-individual": { d360: 193061, status: "live" },
    "dtc-unified": { d360: 191534, status: "live" },
    "dtc-cpe": { d360: 176989, status: "live" },
    "dtc-premarin-optin": { d360: 26531, status: "live" },
    "dtc-comirnaty-optin": { d360: 22722, status: "live" },
    "dtc-litfulo-optin": { d360: 8334, status: "live" },
    "dtc-paxlovid-optin": { d360: 2510, status: "live" },
    "dtc-nurtec-optin-unified": { d360: 1493, status: "live" },
    "dtc-litfulo-email": { d360: 8413, status: "live" },
    "dtc-optin-email": { d360: 170455, status: "live" },
    "dtc-premarin-optin-email": { d360: 26529, status: "live" },
    "dtc-premarin-pref-in": { d360: 27443, status: "live" },
  },
};

let liveCounts = DEFAULT_COUNTS;

/** Every entry is a count-returning prompt. `sample: true` = shown in FAQ Sample use cases by dataspace. */
const PROMPTS = [
  {
    id: "dev-individual",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Identity · Individuals",
    question: "HCP individuals in profile",
    prompt: "In Dev, how many HCP individuals are in the profile?",
    filters: "COUNT(DISTINCT Id__c) on Individual",
    source: DEV_INDIVIDUAL_SOURCE,
  },
  {
    id: "dev-unified",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Identity · Unified",
    question: "Unified HCP profiles",
    prompt: "In Dev, how many unified HCP profiles are there?",
    filters: "COUNT(DISTINCT Id__c) on UnifiedIndividual",
    source: DEV_UNIFIED_SOURCE,
  },
  {
    id: "dev-cpe",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Identity · Contact email",
    question: "HCPs with contact-point email",
    prompt: "In Dev, how many HCPs have a contact-point email on file?",
    filters: "COUNT(DISTINCT IndividualId__c) on ContactPointEmail",
    source: DEV_CPE_SOURCE,
  },
  {
    id: "dev-party-id",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Identity · Party ID",
    question: "HCPs with party-identification",
    prompt: "In Dev, how many HCPs have a party-identification record?",
    filters: "COUNT(DISTINCT IndividualId__c) on PartyIdentification",
    source: DEV_PARTY_SOURCE,
  },
  {
    id: "dev-email-open-90d",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Email · Open",
    question: "Email openers",
    prompt: "In Dev, how many HCPs opened an email?",
    filters: "EngagementChannelActionId__c = 'Open'",
    source: DEV_EMAIL_SOURCE,
  },
  {
    id: "dev-email-click-90d",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Email · Click",
    question: "Email clickers",
    prompt: "In Dev, how many HCPs clicked an email?",
    filters: "EngagementChannelActionId__c = 'Click'",
    source: DEV_EMAIL_SOURCE,
  },
  {
    id: "dev-email-send",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Email · Send",
    question: "Emails sent (distinct HCPs)",
    prompt: "In Dev, how many HCPs were sent an email?",
    filters: "EngagementChannelActionId__c = 'Send' (all-time)",
    source: DEV_EMAIL_SOURCE,
  },
  {
    id: "dev-header-unsub",
    tag: "Dev prompt",
    dataspace: "Development",
    sample: true,
    label: "Header unsubscribe",
    question: "Header-unsubscribe brand list",
    prompt: "In Dev, how many HCPs appear on the header-unsubscribe brand list?",
    filters: "COUNT on HeaderUnsubscribeBrand",
    source: DEV_HEADER_UNSUB_SOURCE,
  },
  {
    id: "dev-optin-email-ny",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "Opt-in email · NY",
    question: "Opted-in brand HCPs in NY (email)",
    prompt: "How many <brand> HCPs in NY have opted in to email?",
    filters: "ContactPointConsent 'IN' + ContactPointAddress state = NY",
    source: DEV_CONSENT_SOURCE,
  },
  {
    id: "dev-website-visit-ny-60d",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "Website visit · NY · 60d",
    question: "Opt-in + NY + website visit (primary POC)",
    prompt:
      "How many opted-in <brand> HCPs in New York visited the customer website in the last 60 days?",
    filters: "WebsiteEngagement last 60d + consent 'IN' + state NY",
    source: DEV_WEB_SOURCE,
  },
  {
    id: "dev-nbrx-utah",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "NBRx · Utah",
    question: "Wrote an Rx for brand in Utah",
    prompt: "How many HCPs wrote an Rx for <brand> in Utah?",
    filters: "NBRxAggregated Brand__c = <brand> + address state = UT",
    source: DEV_NBRX_SOURCE,
  },
  {
    id: "dev-corp-site-ny-3m",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "Corporate site · NY · 3m",
    question: "Corporate site visits in New York (3 months)",
    prompt:
      "How many HCPs in New York visited the corporate site in the last 3 months?",
    filters: "WebsiteEngagement last 3 months + state NY",
    source: DEV_WEB_SOURCE,
  },
  {
    id: "dev-corp-site-and-email-90d",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "Corporate site AND email · 90d",
    question: "Corporate site AND email open (90 days)",
    prompt:
      "How many HCPs visited the corporate site AND opened a customer email in the last 90 days?",
    filters: "WebsiteEngagement 90d (empty) INTERSECT EmailEngagement Open 90d",
    source: DEV_WEB_SOURCE,
  },
  {
    id: "dev-oncology-email-and-web",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "Oncology · email AND web",
    question: "Oncology HCPs: CRM email AND Oncology website",
    prompt:
      "How many Oncology HCPs engaged with a CRM email AND had digital activity on the Oncology website in the last year?",
    filters: "Individual specialty Oncology + EmailEngagement + WebsiteEngagement",
    source: DEV_INDIVIDUAL_SOURCE,
  },
  {
    id: "dev-zip-radius-07073",
    tag: "Dev prompt",
    dataspace: "Development",
    label: "ZIP radius · 100mi · 07073",
    question: "Within 100 miles of ZIP 07073",
    prompt:
      "How many HCPs are within a 100-mile radius of zip 07073?",
    filters: "ZIP-radius: precompute ZIP5 IN list, filter ContactPointAddress (address empty)",
    source: DEV_ADDRESS_SOURCE,
  },

  {
    id: "stg-hq-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · OPENED · 90d",
    question: "HQ email opens — last 90 days",
    prompt: "In Stage, how many HCPs opened a headquarter email in the last 90 days?",
    filters: "EngagementChannelAction__c = 'OPENED' AND EngagementDateTime__c >= CURRENT_DATE - 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-clicked-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · CLICKED · 90d",
    question: "HQ email clicks — last 90 days",
    prompt: "In Stage, how many HCPs clicked a headquarter email in the last 90 days?",
    filters: "EngagementChannelAction__c = 'CLICKED' AND EngagementDateTime__c >= CURRENT_DATE - 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-sent",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · SENT",
    question: "HQ emails sent (distinct HCPs)",
    prompt: "In Stage, how many HCPs were sent a headquarter email?",
    filters: "EngagementChannelAction__c = 'SENT' (all-time)",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-nurtec-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · NURTEC · OPENED",
    question: "Nurtec HQ opens — last 90 days",
    prompt: "In Stage, how many HCPs opened a Nurtec headquarter email in the last 90 days?",
    filters: "Brand__c = 'NURTEC' AND EngagementChannelAction__c = 'OPENED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-comirnaty-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · COMIRNATY · OPENED",
    question: "Comirnaty HQ opens — last 90 days",
    prompt: "In Stage, how many HCPs opened a Comirnaty headquarter email in the last 90 days?",
    filters: "Brand__c = 'COMIRNATY' AND EngagementChannelAction__c = 'OPENED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-paxlovid-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · PAXLOVID · OPENED",
    question: "Paxlovid HQ opens — last 90 days",
    prompt: "In Stage, how many HCPs opened a Paxlovid headquarter email in the last 90 days?",
    filters: "Brand__c = 'PAXLOVID' AND EngagementChannelAction__c = 'OPENED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-paxlovid-clicked-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · PAXLOVID · CLICKED",
    question: "Paxlovid HQ clicks — last 90 days",
    prompt: "In Stage, how many HCPs clicked a Paxlovid headquarter email in the last 90 days?",
    filters: "Brand__c = 'PAXLOVID' AND EngagementChannelAction__c = 'CLICKED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-abrysvo-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "HQ email · ABRYSVO · OPENED",
    question: "Abrysvo HQ opens — last 90 days",
    prompt: "In Stage, how many HCPs opened an Abrysvo headquarter email in the last 90 days?",
    filters: "Brand__c = 'ABRYSVO' AND EngagementChannelAction__c = 'OPENED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-iqvia-eliquis-nrx",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "IQVIA · ELIQUIS NRx > 0",
    question: "Eliquis IQVIA NRx > 0",
    prompt:
      "In Stage, how many HCPs have Eliquis NRx volume greater than zero in IQVIA competitive prescribing?",
    filters: "BrandName__c = 'ELIQUIS' AND NRXVolume__c > 0",
    source: IQVIA_SOURCE,
  },
  {
    id: "stg-iqvia-eliquis-nrx-gt10",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    sample: true,
    label: "IQVIA · ELIQUIS NRx > 10",
    question: "Eliquis IQVIA NRx > 10 (high writers)",
    prompt:
      "In Stage, how many HCPs have Eliquis NRx volume greater than 10 in IQVIA competitive prescribing?",
    filters: "BrandName__c = 'ELIQUIS' AND NRXVolume__c > 10",
    source: IQVIA_SOURCE,
  },

  {
    id: "prd-individual",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    sample: true,
    label: "Identity · Individuals",
    question: "HCP individuals in profile",
    prompt: "In Prod, how many HCP individuals are in the profile?",
    filters: "COUNT(DISTINCT Id__c) on Individual",
    source: PRD_INDIVIDUAL_SOURCE,
  },
  {
    id: "prd-cpe",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    sample: true,
    label: "Identity · Contact email",
    question: "HCPs with contact-point email",
    prompt: "In Prod, how many HCPs have a contact-point email on file?",
    filters: "COUNT(DISTINCT IndividualId__c) on ContactPointEmail",
    source: PRD_CPE_SOURCE,
  },
  {
    id: "prd-email-open-90d",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    sample: true,
    label: "Email · Open",
    question: "Email openers",
    prompt: "In Prod, how many HCPs opened an email?",
    filters: "EngagementChannelActionId__c = 'Open'",
    source: PRD_EMAIL_SOURCE,
  },
  {
    id: "prd-email-click-90d",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    sample: true,
    label: "Email · Click",
    question: "Email clickers",
    prompt: "In Prod, how many HCPs clicked an email?",
    filters: "EngagementChannelActionId__c = 'Click'",
    source: PRD_EMAIL_SOURCE,
  },
  {
    id: "prd-email-send",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    sample: true,
    label: "Email · Send",
    question: "Emails sent (distinct HCPs)",
    prompt: "In Prod, how many HCPs were sent an email?",
    filters: "EngagementChannelActionId__c = 'Send' (all-time)",
    source: PRD_EMAIL_SOURCE,
  },
  {
    id: "prd-website-visit-ny-60d",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    label: "Website visit · NY · 60d",
    question: "Website visit + NY (last 60 days)",
    prompt:
      "In Prod, how many HCPs in New York visited the customer website in the last 60 days?",
    filters: "WebsiteEngagement last 60d + state NY",
    source: PRD_WEB_SOURCE,
  },
  {
    id: "prd-nbrx-brand",
    tag: "Prod prompt",
    dataspace: "PRD_US",
    label: "NBRx · brand",
    question: "Wrote an Rx for a brand",
    prompt: "In Prod, how many HCPs wrote an Rx for <brand>?",
    filters: "NBRxAggregated Brand__c = <brand>",
    source: PRD_NBRX_SOURCE,
  },

  {
    id: "dtc-brand-premarin",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · Premarin",
    question: "Premarin brand-profile consumers",
    prompt: "For patients, how many consumers are in the Premarin brand profile?",
    filters: "Brand__c = 'PREMARIN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-comirnaty",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · Comirnaty",
    question: "Comirnaty brand-profile consumers",
    prompt: "For patients, how many consumers are in the Comirnaty brand profile?",
    filters: "Brand__c = 'COMIRNATY'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-litfulo",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · Litfulo",
    question: "Litfulo brand-profile consumers",
    prompt: "For patients, how many consumers are in the Litfulo brand profile?",
    filters: "Brand__c = 'LITFULO'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-paxlovid",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · Paxlovid",
    question: "Paxlovid brand-profile consumers",
    prompt: "For patients, how many consumers are in the Paxlovid brand profile?",
    filters: "Brand__c = 'PAXLOVID'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-nurtec",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · Nurtec",
    question: "Nurtec brand-profile consumers",
    prompt: "For patients, how many consumers are in the Nurtec brand profile?",
    filters: "Brand__c = 'NURTEC'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-any",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Brand · any",
    question: "Any brand-profile consumers",
    prompt: "For patients, how many consumers have any brand profile?",
    filters: "COUNT(DISTINCT Id__c) on BrandProfile",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-consent-in",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Consent · opted in",
    question: "Opted-in consumers (IN)",
    prompt: "For patients, how many consumers are opted in (consent status IN)?",
    filters: "ConsentStatusId__c = 'IN'",
    source: DTC_CONSENT_SOURCE,
  },
  {
    id: "dtc-consent-pref",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Consent · preference",
    question: "Consumers with a consent preference",
    prompt: "For patients, how many consumers have a consent preference recorded?",
    filters: "COUNT on ConsentPreference",
    source: DTC_PREF_SOURCE,
  },
  {
    id: "dtc-individual",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Identity · Individuals",
    question: "Consumer individuals in DTC profile",
    prompt: "For patients, how many consumer individuals are in the DTC profile?",
    filters: "COUNT(DISTINCT Id__c) on Individual",
    source: DTC_INDIVIDUAL_SOURCE,
  },
  {
    id: "dtc-unified",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Identity · Unified",
    question: "Unified consumer profiles",
    prompt: "For patients, how many unified consumer profiles are there?",
    filters: "COUNT(DISTINCT Id__c) on UnifiedIndividual",
    source: DTC_UNIFIED_SOURCE,
  },
  {
    id: "dtc-cpe",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Identity · Contact email",
    question: "Consumers with contact-point email",
    prompt: "For patients, how many consumers have a contact-point email on file?",
    filters: "COUNT(DISTINCT PartyId__c) on ContactPointEmail",
    source: DTC_CPE_SOURCE,
  },
  {
    id: "dtc-premarin-optin",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Premarin + opt-in",
    question: "Premarin brand-profile consumers who are opted in",
    prompt: "For patients, how many Premarin brand-profile consumers are opted in?",
    filters: "BrandProfile Brand__c='PREMARIN' + ContactPointConsent ConsentStatusId__c='IN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-comirnaty-optin",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Comirnaty + opt-in",
    question: "Comirnaty brand-profile consumers who are opted in",
    prompt: "For patients, how many Comirnaty brand-profile consumers are opted in?",
    filters: "BrandProfile Brand__c='COMIRNATY' + ContactPointConsent ConsentStatusId__c='IN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-litfulo-optin",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Litfulo + opt-in",
    question: "Litfulo brand-profile consumers who are opted in",
    prompt: "For patients, how many Litfulo brand-profile consumers are opted in?",
    filters: "BrandProfile Brand__c='LITFULO' + ContactPointConsent ConsentStatusId__c='IN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-paxlovid-optin",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Paxlovid + opt-in",
    question: "Paxlovid brand-profile consumers who are opted in",
    prompt: "For patients, how many Paxlovid brand-profile consumers are opted in?",
    filters: "BrandProfile Brand__c='PAXLOVID' + ContactPointConsent ConsentStatusId__c='IN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-nurtec-optin-unified",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Nurtec opt-in (unified)",
    question: "Nurtec opted-in consumers (unified path)",
    prompt:
      "For patients, how many Nurtec brand-profile consumers are opted in (unified count)?",
    filters:
      "UnifiedIndividual → IdentityLink → Individual → BrandProfile NURTEC + Consent IN",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-litfulo-email",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Litfulo + email",
    question: "Litfulo brand-profile consumers with email",
    prompt: "For patients, how many Litfulo brand-profile consumers have an email on file?",
    filters: "BrandProfile Brand__c='LITFULO' + ContactPointEmail",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-optin-email",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · opt-in + email",
    question: "Opted-in consumers with email on file",
    prompt: "For patients, how many opted-in consumers have an email on file?",
    filters: "ContactPointConsent IN + ContactPointEmail",
    source: DTC_CONSENT_SOURCE,
  },
  {
    id: "dtc-premarin-optin-email",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Premarin + opt-in + email",
    question: "Premarin opted-in consumers with email",
    prompt:
      "For patients, how many Premarin brand-profile consumers are opted in and have an email on file?",
    filters: "BrandProfile PREMARIN + Consent IN + ContactPointEmail",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-premarin-pref-in",
    tag: "D2C prompt",
    dataspace: "DTC",
    sample: true,
    label: "Combined · Premarin preference IN",
    question: "Consumers with Premarin consent preference IN",
    prompt: "For patients, how many consumers have a Premarin consent preference set to IN?",
    filters: "ConsentPreference PreferenceName=PREMARIN PreferenceValue=IN + Consent",
    source: DTC_PREF_SOURCE,
  },

  // Business-language: create segment + dual D360/Snowflake count
  {
    id: "biz-dtc-premarin-optin-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    sample: true,
    createFlow: true,
    countId: "dtc-premarin-optin",
    label: "Create · Premarin opt-in",
    question: "Build D2C Premarin opted-in segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of Premarin consumers who are opted in to communications. Before you create it, show me the expected count. After create, give me the Data 360 segment count and the Snowflake source count for validation.",
    filters: "BrandProfile PREMARIN + ContactPointConsent IN → create DEMO_D2C segment + dual-report",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-optin-email-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    sample: true,
    createFlow: true,
    countId: "dtc-optin-email",
    label: "Create · opt-in + email",
    question: "Build D2C opted-in + email segment + dual-count",
    prompt:
      "For patients in DTC: create a D2C segment of consumers who are opted in and have an email on file. Confirm the filters, create the segment, then compare the Data 360 count to the Snowflake source count.",
    filters: "ContactPointConsent IN + ContactPointEmail → create + dual-report",
    source: DTC_CONSENT_SOURCE,
  },
  {
    id: "biz-dtc-premarin-optin-email-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    sample: true,
    createFlow: true,
    countId: "dtc-premarin-optin-email",
    label: "Create · Premarin opt-in + email",
    question: "Build D2C Premarin marketable segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of Premarin brand consumers who are opted in and have an email address. Share the Data 360 count and the matching Snowflake validation count.",
    filters: "BrandProfile PREMARIN + Consent IN + ContactPointEmail → create + dual-report",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-comirnaty-optin-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    sample: true,
    createFlow: true,
    countId: "dtc-comirnaty-optin",
    label: "Create · Comirnaty opt-in",
    question: "Build D2C Comirnaty opted-in segment + dual-count",
    prompt:
      "For patients in DTC: create a D2C segment of Comirnaty consumers who have opted in. Report Data 360 vs Snowflake counts after the segment is created.",
    filters: "BrandProfile COMIRNATY + Consent IN → create + dual-report",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-premarin-pref-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    sample: true,
    createFlow: true,
    countId: "dtc-premarin-pref-in",
    label: "Create · Premarin preference IN",
    question: "Build D2C Premarin preference-IN segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of consumers whose Premarin consent preference is set to IN. Validate the member count in Data 360 against Snowflake.",
    filters: "ConsentPreference PREMARIN IN → create + dual-report",
    source: DTC_PREF_SOURCE,
  },
  {
    id: "biz-stg-paxlovid-open-create",
    tag: "Create + dual count",
    dataspace: "STG_US",
    sample: true,
    createFlow: true,
    countId: "stg-hq-paxlovid-opened-90d",
    label: "Create · Paxlovid HQ openers",
    question: "Build HCP Paxlovid HQ openers segment + dual-count",
    prompt:
      "In Stage: build an HCP segment of HCPs who opened a Paxlovid headquarter email in the last 90 days. After create, give me the Data 360 count and the Snowflake source-table count side by side.",
    filters: "HQ email PAXLOVID OPENED 90d — count dual-validates; segment draft until Stage profile loads",
    source: HQ_SOURCE,
  },
  {
    id: "biz-stg-hq-click-create",
    tag: "Create + dual count",
    dataspace: "STG_US",
    sample: true,
    createFlow: true,
    countId: "stg-hq-clicked-90d",
    label: "Create · HQ clickers",
    question: "Build HCP HQ clickers segment + dual-count",
    prompt:
      "In Stage: create an HCP segment of HCPs who clicked a headquarter email in the last 90 days. Compare Data 360 to Snowflake.",
    filters: "HQ email CLICKED 90d — count dual-validates; segment draft until Stage profile loads",
    source: HQ_SOURCE,
  },
  {
    id: "biz-stg-eliquis-nrx-create",
    tag: "Create + dual count",
    dataspace: "STG_US",
    sample: true,
    createFlow: true,
    countId: "stg-iqvia-eliquis-nrx-gt10",
    label: "Create · Eliquis NRx > 10",
    question: "Build HCP Eliquis NRx>10 segment + dual-count",
    prompt:
      "In Stage: build an HCP segment of HCPs with Eliquis NRx volume greater than 10 in IQVIA competitive prescribing. Show Data 360 count vs Snowflake source count.",
    filters: "IQVIA ELIQUIS NRx > 10 — count dual-validates; segment draft until Stage profile loads",
    source: IQVIA_SOURCE,
  },
];

/** FAQ Sample use cases — one group per dataspace, plus create+dual business prompts. */
const FAQ_GROUPS = [
  {
    dataspace: "Development",
    label: "Dev",
    tag: "Dev prompt",
    className: "tag-dev",
    note: "HCP · identity & CRM email (Snowflake N/A for CRM)",
  },
  {
    dataspace: "STG_US",
    label: "Stage",
    tag: "D360 and Snowflake count",
    className: "tag-dual",
    note: "HCP · HQ email & IQVIA — ACTIVE Snowflake streams",
    excludeCreateFlow: true,
  },
  {
    dataspace: "PRD_US",
    label: "Prod",
    tag: "Prod prompt",
    className: "tag-prod",
    note: "HCP · identity & CRM email (Snowflake N/A for CRM)",
  },
  {
    dataspace: "DTC",
    label: "DTC (D2C)",
    tag: "D2C prompt",
    className: "tag-dtc",
    note: "Patient · brand, consent, identity & combined multi-DMO segment counts",
    excludeCreateFlow: true,
  },
  {
    label: "Create segment + dual count",
    tag: "Create + dual count",
    className: "tag-dual",
    note: "Business prompts: create HCP/D2C segment, then compare Data 360 vs Snowflake",
    createFlowOnly: true,
  },
];

/**
 * Stage segments that can be dual-validated in Snowflake (ACTIVE streams).
 * Full catalog: usecase-prompts/demo-segments-d360-snowflake.md
 */
const DEMO_SEGMENTS = [
  {
    letter: "A",
    id: "stg-hq-opened-90d",
    title: "HQ email openers — last 90 days",
    recommend: true,
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "B",
    id: "stg-hq-clicked-90d",
    title: "HQ email clickers — last 90 days",
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "EngagementChannelAction__c" = 'CLICKED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE ENGAGEMENT_CHANNEL_ACTION = 'CLICKED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "C",
    id: "stg-hq-paxlovid-opened-90d",
    title: "Paxlovid HQ openers — last 90 days",
    recommend: true,
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'PAXLOVID'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'PAXLOVID'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "D",
    id: "stg-hq-paxlovid-clicked-90d",
    title: "Paxlovid HQ clickers — last 90 days",
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'PAXLOVID'
  AND "EngagementChannelAction__c" = 'CLICKED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'PAXLOVID'
  AND ENGAGEMENT_CHANNEL_ACTION = 'CLICKED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "E",
    id: "stg-hq-abrysvo-opened-90d",
    title: "Abrysvo HQ openers — last 90 days",
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'ABRYSVO'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'ABRYSVO'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "F",
    id: "stg-hq-nurtec-opened-90d",
    title: "Nurtec HQ openers — last 90 days",
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_Headquarter_Email_Engagement__dlm"
WHERE "Brand__c" = 'NURTEC'
  AND "EngagementChannelAction__c" = 'OPENED'
  AND "EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL
WHERE BRAND = 'NURTEC'
  AND ENGAGEMENT_CHANNEL_ACTION = 'OPENED'
  AND ENGAGEMENT_DATE_TIME >= DATEADD(day, -90, CURRENT_DATE());`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL",
  },
  {
    letter: "G",
    id: "stg-iqvia-eliquis-nrx",
    title: "Eliquis writers — IQVIA NRx > 0",
    recommend: true,
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_IQVIACompetitorSalesFact__dlm"
WHERE "BrandName__c" = 'ELIQUIS'
  AND "NRXVolume__c" > 0;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING
WHERE BRAND_NAME = 'ELIQUIS'
  AND NRX_VOLUME > 0;`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING",
  },
  {
    letter: "H",
    id: "stg-iqvia-eliquis-nrx-gt10",
    title: "Eliquis high writers — IQVIA NRx > 10",
    d360Sql: `SELECT COUNT(DISTINCT "IndividualId__c") AS hcp_count
FROM "stg_IQVIACompetitorSalesFact__dlm"
WHERE "BrandName__c" = 'ELIQUIS'
  AND "NRXVolume__c" > 10;`,
    snowSql: `SELECT COUNT(DISTINCT INDIVIDUAL_ID) AS hcp_count
FROM CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING
WHERE BRAND_NAME = 'ELIQUIS'
  AND NRX_VOLUME > 10;`,
    snowTable: "CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING",
  },
];

/** Membership SQL + create metadata for Recipe B (not COUNT). */
const SEGMENT_DEFS = {
  "dev-email-open-90d": {
    displayName: "DEMO_Dev_Email_Openers_90d",
    segmentOn: "dev_UnifiedIndividualRs1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
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
);`,
  },
  "dev-email-click-90d": {
    displayName: "DEMO_Dev_Email_Clickers_90d",
    segmentOn: "dev_UnifiedIndividualRs1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
FROM "dev_UnifiedIndividualRs1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "dev_UnifiedLinkIndividualRs1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "dev_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Click'
          AND ee."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '90' DAY
    )
);`,
  },
  "dev-email-send": {
    displayName: "DEMO_Dev_Email_Sent",
    segmentOn: "dev_UnifiedIndividualRs1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
FROM "dev_UnifiedIndividualRs1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "dev_UnifiedLinkIndividualRs1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "dev_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Send'
    )
);`,
  },
  "stg-hq-opened-90d": {
    displayName: "DEMO_Stg_HQ_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat:
      "Stage profile (Individual / UnifiedIndividual) is empty — create drafts membership SQL only; published members = 0 until profile streams load. Counts still work on HQ email DMO.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-clicked-90d": {
    displayName: "DEMO_Stg_HQ_Clickers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat:
      "Stage profile empty — draft membership SQL only until Individual/UnifiedIndividual load.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."EngagementChannelAction__c" = 'CLICKED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-sent": {
    displayName: "DEMO_Stg_HQ_Sent",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."EngagementChannelAction__c" = 'SENT'
);`,
  },
  "stg-hq-nurtec-opened-90d": {
    displayName: "DEMO_Stg_HQ_Nurtec_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'NURTEC'
      AND hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-comirnaty-opened-90d": {
    displayName: "DEMO_Stg_HQ_Comirnaty_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'COMIRNATY'
      AND hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-paxlovid-opened-90d": {
    displayName: "DEMO_Stg_HQ_Paxlovid_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'PAXLOVID'
      AND hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-paxlovid-clicked-90d": {
    displayName: "DEMO_Stg_HQ_Paxlovid_Clickers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'PAXLOVID'
      AND hq."EngagementChannelAction__c" = 'CLICKED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-hq-abrysvo-opened-90d": {
    displayName: "DEMO_Stg_HQ_Abrysvo_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'ABRYSVO'
      AND hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "stg-iqvia-eliquis-nrx": {
    displayName: "DEMO_Stg_IQVIA_Eliquis_NRx_gt0",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT iq."IndividualId__c"
    FROM "stg_IQVIACompetitorSalesFact__dlm" iq
    WHERE iq."BrandName__c" = 'ELIQUIS'
      AND iq."NRXVolume__c" > 0
);`,
  },
  "stg-iqvia-eliquis-nrx-gt10": {
    displayName: "DEMO_Stg_IQVIA_Eliquis_NRx_gt10",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT iq."IndividualId__c"
    FROM "stg_IQVIACompetitorSalesFact__dlm" iq
    WHERE iq."BrandName__c" = 'ELIQUIS'
      AND iq."NRXVolume__c" > 10
);`,
  },
  "prd-email-open-90d": {
    displayName: "DEMO_Prd_Email_Openers_90d",
    segmentOn: "prd_UnifiedIndividualPrd1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
FROM "prd_UnifiedIndividualPrd1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "prd_UnifiedLinkIndividualPrd1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "prd_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Open'
          AND ee."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '90' DAY
    )
);`,
  },
  "prd-email-click-90d": {
    displayName: "DEMO_Prd_Email_Clickers_90d",
    segmentOn: "prd_UnifiedIndividualPrd1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
FROM "prd_UnifiedIndividualPrd1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "prd_UnifiedLinkIndividualPrd1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "prd_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Click'
          AND ee."EngagementDateTm__c" >= CURRENT_DATE - INTERVAL '90' DAY
    )
);`,
  },
  "prd-email-send": {
    displayName: "DEMO_Prd_Email_Sent",
    segmentOn: "prd_UnifiedIndividualPrd1__dlm",
    creatable: true,
    membershipSql: `SELECT ui."Id__c"
FROM "prd_UnifiedIndividualPrd1__dlm" ui
WHERE ui."Id__c" IN (
    SELECT link."UnifiedRecordId__c"
    FROM "prd_UnifiedLinkIndividualPrd1__dlm" link
    WHERE link."SourceRecordId__c" IN (
        SELECT ee."IndividualId__c"
        FROM "prd_EmailEngagement__dlm" ee
        WHERE ee."EngagementChannelActionId__c" = 'Send'
    )
);`,
  },
  "dtc-premarin-optin": {
    displayName: "DEMO_D2C_Premarin_Opted_In",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'PREMARIN'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
);`,
  },
  "biz-dtc-premarin-optin-create": {
    displayName: "DEMO_D2C_Premarin_Opted_In",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'PREMARIN'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
);`,
  },
  "dtc-optin-email": {
    displayName: "DEMO_D2C_Opted_In_With_Email",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT c."PartyId__c"
    FROM "DTC_ContactPointConsent__dlm" c
    WHERE c."ConsentStatusId__c" = 'IN'
      AND c."PartyId__c" IN (
          SELECT e."PartyId__c"
          FROM "DTC_ContactPointEmail__dlm" e
      )
);`,
  },
  "biz-dtc-optin-email-create": {
    displayName: "DEMO_D2C_Opted_In_With_Email",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT c."PartyId__c"
    FROM "DTC_ContactPointConsent__dlm" c
    WHERE c."ConsentStatusId__c" = 'IN'
      AND c."PartyId__c" IN (
          SELECT e."PartyId__c"
          FROM "DTC_ContactPointEmail__dlm" e
      )
);`,
  },
  "dtc-premarin-optin-email": {
    displayName: "DEMO_D2C_Premarin_Opted_In_With_Email",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'PREMARIN'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
      AND bp."IndividualId__c" IN (
          SELECT e."PartyId__c"
          FROM "DTC_ContactPointEmail__dlm" e
      )
);`,
  },
  "biz-dtc-premarin-optin-email-create": {
    displayName: "DEMO_D2C_Premarin_Opted_In_With_Email",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'PREMARIN'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
      AND bp."IndividualId__c" IN (
          SELECT e."PartyId__c"
          FROM "DTC_ContactPointEmail__dlm" e
      )
);`,
  },
  "dtc-comirnaty-optin": {
    displayName: "DEMO_D2C_Comirnaty_Opted_In",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'COMIRNATY'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
);`,
  },
  "biz-dtc-comirnaty-optin-create": {
    displayName: "DEMO_D2C_Comirnaty_Opted_In",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT bp."IndividualId__c"
    FROM "DTC_BrandProfile__dlm" bp
    WHERE bp."Brand__c" = 'COMIRNATY'
      AND bp."IndividualId__c" IN (
          SELECT c."PartyId__c"
          FROM "DTC_ContactPointConsent__dlm" c
          WHERE c."ConsentStatusId__c" = 'IN'
      )
);`,
  },
  "dtc-premarin-pref-in": {
    displayName: "DEMO_D2C_Premarin_Preference_IN",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT c."PartyId__c"
    FROM "DTC_ContactPointConsent__dlm" c
    WHERE c."Id__c" IN (
        SELECT p."ContactPointConsentId__c"
        FROM "DTC_ConsentPreference__dlm" p
        WHERE UPPER(p."PreferenceName__c") = 'PREMARIN'
          AND p."PreferenceValue__c" = 'IN'
    )
);`,
  },
  "biz-dtc-premarin-pref-create": {
    displayName: "DEMO_D2C_Premarin_Preference_IN",
    segmentOn: "DTC_Individual__dlm",
    creatable: true,
    membershipSql: `SELECT i."Id__c", i."KQ_Id__c"
FROM "DTC_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT c."PartyId__c"
    FROM "DTC_ContactPointConsent__dlm" c
    WHERE c."Id__c" IN (
        SELECT p."ContactPointConsentId__c"
        FROM "DTC_ConsentPreference__dlm" p
        WHERE UPPER(p."PreferenceName__c") = 'PREMARIN'
          AND p."PreferenceValue__c" = 'IN'
    )
);`,
  },
  "biz-stg-paxlovid-open-create": {
    displayName: "DEMO_HCP_Stg_Paxlovid_HQ_Openers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat:
      "Stage profile empty — draft membership SQL only until Individual/UnifiedIndividual load. Dual-count still works on HQ email DMO.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."Brand__c" = 'PAXLOVID'
      AND hq."EngagementChannelAction__c" = 'OPENED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "biz-stg-hq-click-create": {
    displayName: "DEMO_HCP_Stg_HQ_Clickers_90d",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT hq."IndividualId__c"
    FROM "stg_Headquarter_Email_Engagement__dlm" hq
    WHERE hq."EngagementChannelAction__c" = 'CLICKED'
      AND hq."EngagementDateTime__c" >= CURRENT_DATE - INTERVAL '90' DAY
);`,
  },
  "biz-stg-eliquis-nrx-create": {
    displayName: "DEMO_HCP_Stg_IQVIA_Eliquis_NRx_gt10",
    segmentOn: "stg_Individual__dlm",
    creatable: false,
    caveat: "Stage profile empty — draft membership SQL only.",
    membershipSql: `SELECT i."Id__c"
FROM "stg_Individual__dlm" i
WHERE i."Id__c" IN (
    SELECT iq."IndividualId__c"
    FROM "stg_IQVIACompetitorSalesFact__dlm" iq
    WHERE iq."BrandName__c" = 'ELIQUIS'
      AND iq."NRXVolume__c" > 10
);`,
  },
};

const $ = (id) => document.getElementById(id);

let activePromptId = null;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveCountId(idOrEntry) {
  if (typeof idOrEntry === "object" && idOrEntry) {
    return idOrEntry.countId || idOrEntry.id;
  }
  const entry = PROMPTS.find((p) => p.id === idOrEntry);
  return (entry && entry.countId) || idOrEntry;
}

function countFor(id) {
  const key = resolveCountId(id);
  const entry = liveCounts.counts && liveCounts.counts[key];
  return entry && typeof entry.d360 === "number" ? entry.d360 : null;
}

function statusFor(id) {
  const key = resolveCountId(id);
  const entry = liveCounts.counts && liveCounts.counts[key];
  return (entry && entry.status) || "live";
}

function statusNote(id) {
  switch (statusFor(id)) {
    case "empty":
      return "Live query ran — backing DMO/stream is not yet loaded (0 rows).";
    case "unsupported":
      return "Not supported yet — needs ZIP-radius precompute + populated address DMO.";
    default:
      return null;
  }
}

function formatCount(n) {
  return n == null ? "—" : n.toLocaleString("en-US");
}

function countBadge(id) {
  const status = statusFor(id);
  if (status === "empty") return '<span class="badge badge-empty">data not loaded</span>';
  if (status === "unsupported") return '<span class="badge badge-unsupported">not supported</span>';
  const entry = PROMPTS.find((p) => p.id === id);
  if (
    entry &&
    (entry.tag === "D360 and Snowflake count" ||
      (entry.source && entry.source.database && entry.source.stream))
  ) {
    return '<span class="badge badge-dual">D360 + Snowflake</span>';
  }
  return '<span class="badge badge-live">live</span>';
}

function refreshedLabel() {
  if (!liveCounts.refreshedAt) return "";
  const d = new Date(liveCounts.refreshedAt);
  return Number.isNaN(d.getTime()) ? liveCounts.refreshedAt : d.toLocaleString();
}

function selectedDataspace() {
  const el = document.querySelector('input[name="dataspace"]:checked');
  return el ? el.value : "STG_US";
}

function promptsFor(dataspace) {
  return PROMPTS.filter((p) => p.dataspace === dataspace);
}

function loadPrompt(entry) {
  activePromptId = entry.id;
  $("usecase").value = entry.prompt;
  const radio = document.querySelector(
    `input[name="dataspace"][value="${entry.dataspace}"]`
  );
  if (radio) radio.checked = true;
  renderPresets();
  $("status").textContent = `${entry.tag} loaded — click Show outcome.`;
}

function renderPresets() {
  const root = $("presets");
  root.innerHTML = "";
  const list = promptsFor(selectedDataspace());

  list.forEach((entry) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset" + (entry.id === activePromptId ? " active" : "");
    btn.innerHTML =
      `<span class="tag">${escapeHtml(entry.label)} · ${escapeHtml(formatCount(countFor(entry.id)))} ${countBadge(entry.id)}</span>` +
      escapeHtml(entry.prompt);
    btn.addEventListener("click", () => loadPrompt(entry));
    root.appendChild(btn);
  });
}

function renderFaqs() {
  const root = $("faqs");
  if (!root) return;
  root.innerHTML = "";

  FAQ_GROUPS.forEach((group) => {
    const items = PROMPTS.filter((p) => {
      if (!p.sample) return false;
      if (group.createFlowOnly) return !!p.createFlow;
      if (group.excludeCreateFlow && p.createFlow) return false;
      return p.dataspace === group.dataspace;
    });
    if (!items.length) return;

    const section = document.createElement("div");
    section.className = "faq-group";
    section.innerHTML = `<h3 class="faq-group-title"><span class="faq-cat ${group.className}">${escapeHtml(group.label)}</span>${
      group.note ? ` <span class="faq-group-note">${escapeHtml(group.note)}</span>` : ""
    }</h3>`;

    const list = document.createElement("div");
    list.className = "faq-group-list";

    items.forEach((entry) => {
      const countKey = resolveCountId(entry);
      const details = document.createElement("details");
      details.className = "faq";
      details.innerHTML = `
        <summary>
          <span>
            <span class="faq-cat ${group.className}">${escapeHtml(entry.tag)}</span>
            ${escapeHtml(entry.question)} — <strong>${escapeHtml(formatCount(countFor(entry)))}</strong>
          </span>
        </summary>
        <div class="faq-body">
          <p class="faq-prompt">${escapeHtml(entry.prompt)}</p>
          <p class="faq-answer"><strong>Data 360 count:</strong> ${escapeHtml(formatCount(countFor(entry)))}
            ${countBadge(countKey)} · DMO <code>${escapeHtml(entry.source.dmo)}</code></p>
          <p class="faq-answer"><strong>Filters:</strong> ${escapeHtml(entry.filters)}</p>
          ${
            entry.createFlow
              ? `<p class="faq-answer"><strong>Agent flow:</strong> count → confirm → create DEMO_${
                  entry.dataspace === "DTC" ? "D2C" : "HCP"
                } segment → dual-report Data 360 vs Snowflake (SQL if stream inactive).</p>`
              : ""
          }
          ${statusNote(countKey) ? `<p class="faq-answer note-empty">${escapeHtml(statusNote(countKey))}</p>` : ""}
          <button type="button" class="btn ghost faq-use" data-id="${entry.id}">Use this prompt</button>
        </div>
      `;
      list.appendChild(details);
    });

    section.appendChild(list);
    root.appendChild(section);
  });

  root.querySelectorAll(".faq-use").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = PROMPTS.find((p) => p.id === btn.getAttribute("data-id"));
      if (!entry) return;
      loadPrompt(entry);
      $("usecase").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function renderDemoSegments() {
  const root = $("demo-segments");
  if (!root) return;
  root.innerHTML = "";

  DEMO_SEGMENTS.forEach((seg) => {
    const prompt = PROMPTS.find((p) => p.id === seg.id);
    const details = document.createElement("details");
    details.className = "faq demo-seg";
    if (seg.recommend) details.open = false;
    details.innerHTML = `
      <summary>
        <span>
          <span class="faq-cat tag-dual">Segment ${escapeHtml(seg.letter)}</span>
          ${escapeHtml(seg.title)} —
          <strong>${escapeHtml(formatCount(countFor(seg.id)))}</strong>
          ${seg.recommend ? '<span class="badge badge-live">recommended</span>' : ""}
        </span>
      </summary>
      <div class="faq-body">
        <p class="faq-answer">
          <strong>Data 360 count:</strong> ${escapeHtml(formatCount(countFor(seg.id)))} HCPs
          · <span class="faq-cat tag-dual">D360 and Snowflake count</span>
          · Snowflake: run SQL below against <code>${escapeHtml(seg.snowTable)}</code>
        </p>
        <p class="sql-label">Data 360 SQL</p>
        <pre class="sql-block">${escapeHtml(seg.d360Sql)}</pre>
        <p class="sql-label">Snowflake SQL (confirm column names with DESCRIBE TABLE)</p>
        <pre class="sql-block">${escapeHtml(seg.snowSql)}</pre>
        <div class="actions">
          ${prompt ? `<button type="button" class="btn primary seg-use" data-id="${seg.id}">Use this prompt</button>` : ""}
          ${SEGMENT_DEFS[seg.id] ? `<button type="button" class="btn ghost seg-create" data-id="${seg.id}">Create segment</button>` : ""}
          <button type="button" class="btn ghost seg-copy-d360" data-letter="${seg.letter}">Copy D360 SQL</button>
          <button type="button" class="btn ghost seg-copy-snow" data-letter="${seg.letter}">Copy Snowflake SQL</button>
        </div>
      </div>
    `;
    root.appendChild(details);
  });

  root.querySelectorAll(".seg-use").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = PROMPTS.find((p) => p.id === btn.getAttribute("data-id"));
      if (!entry) return;
      loadPrompt(entry);
      onRun();
      $("usecase").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  root.querySelectorAll(".seg-create").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = PROMPTS.find((p) => p.id === btn.getAttribute("data-id"));
      if (!entry) return;
      loadPrompt(entry);
      onCreateSegment();
    });
  });

  root.querySelectorAll(".seg-copy-d360").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const seg = DEMO_SEGMENTS.find((s) => s.letter === btn.getAttribute("data-letter"));
      if (!seg) return;
      try {
        await navigator.clipboard.writeText(seg.d360Sql);
        $("status").textContent = `Segment ${seg.letter} D360 SQL copied.`;
      } catch {
        $("status").textContent = "Could not copy SQL.";
      }
    });
  });

  root.querySelectorAll(".seg-copy-snow").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const seg = DEMO_SEGMENTS.find((s) => s.letter === btn.getAttribute("data-letter"));
      if (!seg) return;
      try {
        await navigator.clipboard.writeText(seg.snowSql);
        $("status").textContent = `Segment ${seg.letter} Snowflake SQL copied — run in warehouse.`;
      } catch {
        $("status").textContent = "Could not copy SQL.";
      }
    });
  });
}

function findEntryByPrompt(prompt) {
  const t = prompt.trim().toLowerCase();
  return PROMPTS.find((p) => p.prompt.toLowerCase() === t) || null;
}

function segmentDefFor(entry) {
  return entry && SEGMENT_DEFS[entry.id] ? SEGMENT_DEFS[entry.id] : null;
}

function buildCreateSkillPrompt(entry, seg) {
  const dataspaceLabel =
    entry.dataspace === "Development"
      ? "Dev"
      : entry.dataspace === "STG_US"
        ? "Stage"
        : entry.dataspace === "PRD_US"
          ? "Prod"
          : entry.dataspace === "DTC"
            ? "DTC (patients)"
            : entry.dataspace;
  return `In ${dataspaceLabel}, build a Data 360 segment from this population (do not re-interpret filters).

Display name: ${seg.displayName}
Dataspace: ${entry.dataspace}
SegmentOn: ${seg.segmentOn}

Plain-English population:
${entry.prompt}

Filters:
- ${entry.filters}

Use DBT segment SQL that projects ONLY the SegmentOn primary key (no COUNT, no aggregation, no PII columns).
Suggested membership SQL:

${seg.membershipSql}

Show the SQL before create. Then create with publishSchedule NoRefresh and confirm.
After create, pull the segment member count and compare to the Recipe A count for the same filters.
Also dual-report **Data 360 count** vs **Snowflake source count** (tally the Snowflake query; if it does not return a count, share the SQL and the Snowflake query output).
Always return the **Data 360 segment link** (Lightning MarketSegment/<id>/view) for the created or compared segment.
${seg.creatable ? "" : "NOTE: Stage profile DMOs are empty today — expect 0 members until Individual/UnifiedIndividual streams load; still create only if the team wants a draft definition."}`.trim();
}

function renderSegmentPanel(entry) {
  const seg = segmentDefFor(entry);
  if (!seg) {
    return `<div class="segment-panel">
      <p class="count-label">Create segment</p>
      <p class="faq-answer">No membership SQL catalogued for this prompt. Copy the count prompt into Cursor and ask the Skill to build a segment (Recipe B).</p>
    </div>`;
  }
  const statusBadge = seg.creatable
    ? '<span class="badge badge-live">creatable</span>'
    : '<span class="badge badge-empty">draft only</span>';
  return `
    <div class="segment-panel">
      <p class="count-label">Create segment ${statusBadge}</p>
      <p class="faq-answer">
        <strong>${escapeHtml(seg.displayName)}</strong><br/>
        SegmentOn: <code>${escapeHtml(seg.segmentOn)}</code> · Dataspace ${escapeHtml(entry.dataspace)}
      </p>
      ${seg.caveat ? `<p class="faq-answer note-empty">${escapeHtml(seg.caveat)}</p>` : ""}
      <p class="sql-label">Membership SQL (SegmentOn PK only — not a count)</p>
      <pre class="sql-block">${escapeHtml(seg.membershipSql)}</pre>
      <div class="actions">
        <button type="button" class="btn primary" id="copyCreatePromptBtn">Copy Skill create prompt</button>
        <button type="button" class="btn ghost" id="copyMembershipSqlBtn">Copy membership SQL</button>
      </div>
    </div>
  `;
}

function wireSegmentPanelButtons(entry) {
  const seg = segmentDefFor(entry);
  if (!seg) return;
  const copyCreate = $("copyCreatePromptBtn");
  const copySql = $("copyMembershipSqlBtn");
  if (copyCreate) {
    copyCreate.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(buildCreateSkillPrompt(entry, seg));
        $("status").textContent =
          "Create-segment Skill prompt copied — paste into Cursor with the Skill + data360 MCP.";
      } catch {
        $("status").textContent = "Could not copy create prompt.";
      }
    });
  }
  if (copySql) {
    copySql.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(seg.membershipSql);
        $("status").textContent = "Membership SQL copied.";
      } catch {
        $("status").textContent = "Could not copy SQL.";
      }
    });
  }
}

function guessSource(prompt, dataspace) {
  const t = prompt.toLowerCase();
  if (t.includes("iqvia") || t.includes("nrx")) return IQVIA_SOURCE;
  if (dataspace === "STG_US") return HQ_SOURCE;
  if (dataspace === "Development") return DEV_EMAIL_SOURCE;
  if (dataspace === "PRD_US") return PRD_EMAIL_SOURCE;
  if (dataspace === "DTC") return DTC_BRAND_SOURCE;
  return null;
}

function renderOutcome(result) {
  const root = $("outcome");
  root.classList.remove("empty");

  const hasSnowflakeTable = Boolean(result.source && result.source.table);
  const snowValue = hasSnowflakeTable ? "PENDING" : "N/A";
  const snowMeta = hasSnowflakeTable
    ? `Source: ${result.source.database}.${result.source.schema}.${result.source.table} · Stream: ${result.source.stream}`
    : "Stream connector is not Snowflake for this DMO — run the OCL benchmark instead.";

  const notes = (result.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  const entry = result.entry || null;
  const segmentHtml = entry ? renderSegmentPanel(entry) : "";

  root.innerHTML = `
    <div class="outcome-card">
      <p class="usecase-echo">${escapeHtml(result.prompt)}</p>
      <div class="count-block d360">
        <p class="count-label">Data 360 count</p>
        <p class="count-value">${escapeHtml(result.d360Label)}</p>
        <p class="count-meta">
          Dataspace ${escapeHtml(result.dataspace)}${
            result.source && result.source.dmo ? ` · DMO ${escapeHtml(result.source.dmo)}` : ""
          }${liveCounts.refreshedAt ? ` · as of ${escapeHtml(refreshedLabel())}` : ""}
        </p>
      </div>
      <div class="count-block snow">
        <p class="count-label">Snowflake source count</p>
        <p class="count-value">${escapeHtml(snowValue)}</p>
        <p class="count-meta">${escapeHtml(snowMeta)}</p>
      </div>
      <p class="delta">${escapeHtml(result.deltaText)}</p>
      ${notes ? `<ul class="notes">${notes}</ul>` : ""}
      ${segmentHtml}
    </div>
  `;

  if (entry) wireSegmentPanelButtons(entry);
}

function buildResult() {
  const prompt = $("usecase").value.trim();
  if (!prompt) {
    $("status").textContent = "Enter or select a use case first.";
    return null;
  }

  const entry = findEntryByPrompt(prompt);
  if (entry) {
    const n = countFor(entry.id);
    const note = statusNote(entry.id);
    const notes = [`Filters: ${entry.filters}`, "Count only — no PII returned."];
    if (note) notes.unshift(note);
    if (entry.tag === "D360 and Snowflake count") {
      notes.unshift(
        "Tag: D360 and Snowflake count — report both Data 360 and Snowflake source counts for this DMO."
      );
    }
    return {
      prompt,
      entry,
      dataspace: entry.dataspace,
      d360Label: n == null ? "Run live in Cursor" : `${formatCount(n)} HCPs`,
      source: entry.source,
      deltaText: entry.source.table
        ? "Delta: PENDING — run the Snowflake stream-source SQL for parity (Copy Snowflake SQL from Demo segments)."
        : "Delta: N/A for stream parity — use the OCL benchmark for the validated label.",
      notes,
    };
  }

  const dataspace = selectedDataspace();
  return {
    prompt,
    entry: null,
    dataspace,
    d360Label: "Run live in Cursor",
    source: guessSource(prompt, dataspace),
    deltaText:
      "Custom prompt — run it in Cursor with the governed Skill for a live Data 360 + Snowflake dual report.",
    notes: [
      "Not in the refreshed snapshot.",
      "Copy the prompt and run it with the Skill + data360 MCP.",
      "Never return PII with counts.",
    ],
  };
}

function onRun() {
  const result = buildResult();
  if (!result) return;
  renderOutcome(result);
  $("status").textContent = `Outcome ready — Data 360 numbers as of ${refreshedLabel()}.`;
}

function onCreateSegment() {
  const prompt = $("usecase").value.trim();
  if (!prompt) {
    $("status").textContent = "Select a use case first, then Create segment.";
    return;
  }
  const result = buildResult();
  if (!result) return;
  renderOutcome(result);
  const panel = document.querySelector(".segment-panel");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  const entry = result.entry;
  const seg = segmentDefFor(entry);
  if (!seg) {
    $("status").textContent =
      "No catalogued membership SQL — use Copy prompt and ask the Skill to create the segment.";
    return;
  }
  $("status").textContent = seg.creatable
    ? `Segment definition ready (${seg.displayName}) — copy the Skill create prompt into Cursor to create in Data 360.`
    : `Draft segment definition ready (${seg.displayName}) — Stage profile empty; members will be 0 until streams load.`;
}

async function onCopy() {
  const prompt = $("usecase").value.trim();
  if (!prompt) {
    $("status").textContent = "Nothing to copy.";
    return;
  }
  try {
    await navigator.clipboard.writeText(prompt);
    $("status").textContent = "Prompt copied — paste into Cursor with the Skill.";
  } catch {
    $("status").textContent = "Could not copy — select the prompt manually.";
  }
}

function onClear() {
  activePromptId = null;
  $("usecase").value = "";
  $("outcome").classList.add("empty");
  $("outcome").innerHTML =
    '<p class="muted">Select a preset or enter a use case, then show outcome.</p>';
  $("status").textContent = "";
  renderPresets();
}

async function copySegmentStatusPrompt() {
  const dataspace = $("segmentStatusDataspace").value;
  const apiName = $("segmentApiName").value.trim();
  if (!apiName) {
    $("lifecycleStatus").textContent = "Enter a segment API/developer name first.";
    return;
  }
  const prompt = `In dataspace ${dataspace}, inspect the existing Data 360 segment with API name "${apiName}".

Read-only:
1. Get the segment definition and metadata.
2. Run/read its evaluated member count (exact count; if async, poll/follow the returned job status).
3. Report publication/lifecycle status and last published/evaluated timestamp.
4. List activation bindings that reference this exact segment ID and get their statuses and targets.
5. Report ACTIVATED, CONFIGURED NOT ACTIVE, NOT ACTIVATED, or UNKNOWN based on activation records.

Return counts and aggregate metadata only — do not list segment members or PII.
Use this output:
Segment: <display name> (<API name>)
Dataspace / SegmentOn: <dataspace> / <DMO>
Segment member count: <N | PENDING> (<exact|approx>, evaluated <timestamp>)
Publication status: <status>
Activation status: <classification>
  Activation: <name/id/status> → Target: <target>`;
  try {
    await navigator.clipboard.writeText(prompt);
    $("lifecycleStatus").textContent =
      "Agent status prompt copied — paste into Cursor with the governed Skill.";
  } catch {
    $("lifecycleStatus").textContent = "Could not copy prompt.";
  }
}

async function copyListSegmentsPrompt() {
  const dataspace = $("segmentStatusDataspace").value;
  const prompt = `In dataspace ${dataspace}, list existing Data 360 segments read-only.
For each segment return: display name, API/developer name, SegmentOn DMO, publication status,
evaluated member count (or PENDING), and activation classification.
Determine activation from matching activation bindings — do not infer it from published status
or from an active target. Do not return segment members or PII.`;
  try {
    await navigator.clipboard.writeText(prompt);
    $("lifecycleStatus").textContent =
      "List-segments agent prompt copied — paste into Cursor with the governed Skill.";
  } catch {
    $("lifecycleStatus").textContent = "Could not copy prompt.";
  }
}

function renderRefreshStamp() {
  const el = $("refreshed");
  if (el) el.textContent = `Data 360 counts as of ${refreshedLabel()}`;
}

async function loadCounts() {
  try {
    const res = await fetch("counts.json", { cache: "no-store" });
    if (res.ok) liveCounts = await res.json();
  } catch {
    // file:// or offline — DEFAULT_COUNTS already loaded
  }
  renderPresets();
  renderFaqs();
  renderDemoSegments();
  renderRefreshStamp();
}

document.querySelectorAll('input[name="dataspace"]').forEach((el) => {
  el.addEventListener("change", () => {
    activePromptId = null;
    renderPresets();
  });
});

$("runBtn").addEventListener("click", onRun);
$("createSegBtn").addEventListener("click", onCreateSegment);
$("copyBtn").addEventListener("click", onCopy);
$("clearBtn").addEventListener("click", onClear);
$("copyStatusPromptBtn").addEventListener("click", copySegmentStatusPrompt);
$("copyListPromptBtn").addEventListener("click", copyListSegmentsPrompt);

renderPresets();
renderFaqs();
renderDemoSegments();
renderRefreshStamp();
loadCounts();
