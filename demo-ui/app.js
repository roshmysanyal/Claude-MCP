/**
 * CoCo — pullable Data 360 use cases by dataspace.
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
const DEV_INDIVIDUAL_SOURCE = { dmo: "dev_Individual__dlm", snowflake: null };
const DEV_UNIFIED_SOURCE = { dmo: "dev_UnifiedIndividualRs1__dlm", snowflake: null };
const DEV_PARTY_SOURCE = { dmo: "dev_PartyIdentification__dlm", snowflake: null };
const DEV_CPE_SOURCE = { dmo: "dev_ContactPointEmail__dlm", snowflake: null };
const DEV_HEADER_UNSUB_SOURCE = { dmo: "dev_HeaderUnsubscribeBrand__dlm", snowflake: null };
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
  refreshedAt: "2026-08-12T05:00:00Z",
  counts: {
    "dev-individual": { d360: 1517180, status: "live" },
    "dev-unified": { d360: 1097325, status: "live" },
    "dev-cpe": { d360: 999918, status: "live" },
    "dev-party-id": { d360: 1517180, status: "live" },
    "dev-email-open-90d": { d360: 257704, status: "live" },
    "dev-email-click-90d": { d360: 56412, status: "live" },
    "dev-email-send": { d360: 530607, status: "live" },
    "dev-header-unsub": { d360: 35, status: "live" },
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

/** Every entry is a count-returning prompt shown in the FAQ list. */
const PROMPTS = [
  {
    id: "dev-individual",
    tag: "Dev prompt",
    dataspace: "Development",
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
    label: "Header unsubscribe",
    question: "Header-unsubscribe brand list",
    prompt: "In Dev, how many HCPs appear on the header-unsubscribe brand list?",
    filters: "COUNT on HeaderUnsubscribeBrand",
    source: DEV_HEADER_UNSUB_SOURCE,
  },

  {
    id: "stg-hq-opened-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    label: "HQ email · OPENED · 90d",
    question: "HQ email opens — last 90 days",
    prompt:
      "In dataspace STG-US (MCP: STG_US), HCP audience: count distinct HCPs who opened a headquarter email in the last 90 days using populated DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'OPENED'). Do not ask clarifying questions. Return the dual-report table: Data 360 count + Snowflake source count for stream STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL. If Snowflake cannot be tallied, still show the Snowflake validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters:
      "EngagementChannelAction__c = 'OPENED' AND EngagementDateTime__c >= CURRENT_DATE - 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-clicked-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
    label: "HQ email · CLICKED · 90d",
    question: "HQ email clicks — last 90 days",
    prompt:
      "In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who clicked a headquarter email in the last 90 days on DMO stg_Headquarter_Email_Engagement__dlm (EngagementChannelAction__c = 'CLICKED'). No clarifying questions. Dual-report Data 360 vs Snowflake stream STG_HCP_OCL_HEADQUARTER_EMAIL (CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL), including validation SQL if PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters:
      "EngagementChannelAction__c = 'CLICKED' AND EngagementDateTime__c >= CURRENT_DATE - 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-sent",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
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
    label: "HQ email · PAXLOVID · OPENED",
    question: "Paxlovid HQ opens — last 90 days",
    prompt:
      "In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs who opened a Paxlovid headquarter email in the last 90 days on populated DMO stg_Headquarter_Email_Engagement__dlm (Brand__c = 'PAXLOVID', EngagementChannelAction__c = 'OPENED'). No clarifying questions. Dual-report Data 360 + Snowflake source for STG_HCP_OCL_HEADQUARTER_EMAIL → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_OCL_HEADQUARTER_EMAIL. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "Brand__c = 'PAXLOVID' AND EngagementChannelAction__c = 'OPENED' AND last 90 days",
    source: HQ_SOURCE,
  },
  {
    id: "stg-hq-paxlovid-clicked-90d",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
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
    label: "IQVIA · ELIQUIS NRx > 0",
    question: "Eliquis IQVIA NRx > 0",
    prompt:
      "In dataspace STG-US (MCP: STG_US), HCP: count distinct HCPs with Eliquis NRx > 0 using populated DMO stg_IQVIACompetitorSalesFact__dlm. No clarifying questions. Dual-report Data 360 vs Snowflake stream STG_HCP_IQVIA_COMPETITIVE_PRESCRIBING → CDP_US_HCP_STG_DB.HCP_DC_IN.HCP_IQVIA_COMPETITIVE_PRESCRIBING (include SQL if PENDING). Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "BrandName__c = 'ELIQUIS' AND NRXVolume__c > 0",
    source: IQVIA_SOURCE,
  },
  {
    id: "stg-iqvia-eliquis-nrx-gt10",
    tag: "D360 and Snowflake count",
    dataspace: "STG_US",
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
    label: "Email · Send",
    question: "Emails sent (distinct HCPs)",
    prompt: "In Prod, how many HCPs were sent an email?",
    filters: "EngagementChannelActionId__c = 'Send' (all-time)",
    source: PRD_EMAIL_SOURCE,
  },

  {
    id: "dtc-brand-premarin",
    tag: "D2C prompt",
    dataspace: "DTC",
    label: "Brand · Premarin",
    question: "Premarin brand-profile consumers",
    prompt:
      "In dataspace DTC (patient/D2C), count distinct consumers with Brand__c = 'PREMARIN' on populated DMO DTC_BrandProfile__dlm. Do not ask clarifying questions. Dual-report Data 360 count + Snowflake source for stream DTC_BRAND_PROFILE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_BRAND_PROFILES (BRAND_NAME). If Snowflake cannot run, show validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "Brand__c = 'PREMARIN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-brand-comirnaty",
    tag: "D2C prompt",
    dataspace: "DTC",
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
    label: "Consent · opted in",
    question: "Opted-in consumers (IN)",
    prompt:
      "In dataspace DTC (patient/D2C), count distinct consumers with ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm. No clarifying questions. Dual-report Data 360 vs Snowflake stream DTC_OT_EMAIL_CONSENT → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_EMAIL_CONSENTS (CONSENT_VALUE). Include validation SQL if PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "ConsentStatusId__c = 'IN'",
    source: DTC_CONSENT_SOURCE,
  },
  {
    id: "dtc-consent-pref",
    tag: "D2C prompt",
    dataspace: "DTC",
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
    label: "Combined · Premarin + opt-in",
    question: "Premarin brand-profile consumers who are opted in",
    prompt:
      "In dataspace DTC (patient/D2C), count distinct consumers who have PREMARIN on populated DMO DTC_BrandProfile__dlm AND ConsentStatusId__c = 'IN' on populated DMO DTC_ContactPointConsent__dlm (join on IndividualId / PartyId). Do not ask clarifying questions. Dual-report Data 360 + Snowflake validation against DTC_BRAND_PROFILES joined to DTC_OT_EMAIL_CONSENTS in CDP_US_DTC_STG_DB.DTC_DC_IN. If Snowflake is unreachable, return the exact validation SQL and mark PENDING. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "BrandProfile Brand__c='PREMARIN' + ContactPointConsent ConsentStatusId__c='IN'",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-comirnaty-optin",
    tag: "D2C prompt",
    dataspace: "DTC",
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
    label: "Combined · Nurtec opt-in (unified)",
    question: "Nurtec opted-in consumers (unified path)",
    prompt: "For patients, how many Nurtec brand-profile consumers are opted in (unified count)?",
    filters: "UnifiedIndividual → IdentityLink → Individual → BrandProfile NURTEC + Consent IN",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-litfulo-email",
    tag: "D2C prompt",
    dataspace: "DTC",
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
    label: "Combined · Premarin + opt-in + email",
    question: "Premarin opted-in consumers with email",
    prompt:
      "In dataspace DTC (patient/D2C), count distinct consumers with PREMARIN on DTC_BrandProfile__dlm, ConsentStatusId__c = 'IN' on DTC_ContactPointConsent__dlm, and a row on populated DMO DTC_ContactPointEmail__dlm. No clarifying questions. Dual-report Data 360 + Snowflake SQL for brand/consent streams in CDP_US_DTC_STG_DB.DTC_DC_IN (PENDING + SQL if Snowflake cannot tally). Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "BrandProfile PREMARIN + Consent IN + ContactPointEmail",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "dtc-premarin-pref-in",
    tag: "D2C prompt",
    dataspace: "DTC",
    label: "Combined · Premarin preference IN",
    question: "Consumers with Premarin consent preference IN",
    prompt:
      "In dataspace DTC (patient/D2C), count consumers with PreferenceName__c = 'PREMARIN' and PreferenceValue__c = 'IN' on populated DMO DTC_ConsentPreference__dlm (with DTC_ContactPointConsent__dlm as needed). No clarifying questions. Dual-report Data 360 vs Snowflake stream DTC_OT_CONSENT_PREFERENCE → CDP_US_DTC_STG_DB.DTC_DC_IN.DTC_OT_CONSENT_PREFERENCES. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "ConsentPreference PreferenceName=PREMARIN PreferenceValue=IN + Consent",
    source: DTC_PREF_SOURCE,
  },

  // Business-language: create segment + dual D360/Snowflake count
  {
    id: "biz-dtc-premarin-optin-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    createFlow: true,
    countId: "dtc-premarin-optin",
    label: "Create · Premarin opt-in",
    question: "Build D2C Premarin opted-in segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of Premarin consumers who are opted in to communications. Before you create it, show me the expected count. After create, give me the Data 360 segment count and the Snowflake source count for validation. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "CIA Consumer Marketable Email + BrandProfile PREMARIN + ContactPointConsent IN",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-optin-email-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    createFlow: true,
    countId: "dtc-optin-email",
    label: "Create · opt-in + email",
    question: "Build D2C opted-in + email segment + dual-count",
    prompt:
      "For patients in DTC: create a D2C segment of consumers who are opted in and have an email on file. Confirm the filters, create the segment, then compare the Data 360 count to the Snowflake source count. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "CIA Consumer Marketable Email + ContactPointConsent IN + ContactPointEmail",
    source: DTC_CONSENT_SOURCE,
  },
  {
    id: "biz-dtc-premarin-optin-email-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    createFlow: true,
    countId: "dtc-premarin-optin-email",
    label: "Create · Premarin opt-in + email",
    question: "Build D2C Premarin marketable segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of Premarin brand consumers who are opted in and have an email address. Share the Data 360 count and the matching Snowflake validation count. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "CIA Consumer Marketable Email + BrandProfile PREMARIN + Consent IN + ContactPointEmail",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-comirnaty-optin-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    createFlow: true,
    countId: "dtc-comirnaty-optin",
    label: "Create · Comirnaty opt-in",
    question: "Build D2C Comirnaty opted-in segment + dual-count",
    prompt:
      "For patients in DTC: create a D2C segment of Comirnaty consumers who have opted in. Report Data 360 vs Snowflake counts after the segment is created. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "CIA Consumer Marketable Email + BrandProfile COMIRNATY + Consent IN",
    source: DTC_BRAND_SOURCE,
  },
  {
    id: "biz-dtc-premarin-pref-create",
    tag: "Create + dual count",
    dataspace: "DTC",
    createFlow: true,
    countId: "dtc-premarin-pref-in",
    label: "Create · Premarin preference IN",
    question: "Build D2C Premarin preference-IN segment + dual-count",
    prompt:
      "For patients in DTC: build a D2C segment of consumers whose Premarin consent preference is set to IN. Validate the member count in Data 360 against Snowflake. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.",
    filters: "CIA Consumer Marketable Email + ConsentPreference PREMARIN IN",
    source: DTC_PREF_SOURCE,
  },
];

/** One FAQ group per dataspace, plus the create + dual-count business prompts. */
const FAQ_GROUPS = [
  {
    dataspace: "Development",
    label: "DEV-US (HCP)",
    className: "tag-dev",
    note: "HCP · identity & CRM email (Snowflake N/A for CRM)",
  },
  {
    dataspace: "STG_US",
    label: "STG-US (HCP)",
    className: "tag-dual",
    note: "HCP · HQ email & IQVIA — ACTIVE Snowflake streams",
    excludeCreateFlow: true,
  },
  {
    dataspace: "PRD_US",
    label: "PRD-US (HCP)",
    className: "tag-prod",
    note: "HCP · identity & CRM email (Snowflake N/A for CRM)",
  },
  {
    dataspace: "DTC",
    label: "DTC (Patient)",
    className: "tag-dtc",
    note: "Patient · brand, consent, identity & combined multi-DMO counts",
    excludeCreateFlow: true,
  },
  {
    label: "Create segment + dual count",
    className: "tag-dual",
    note: "Create a D2C segment (CIA Consumer Marketable Email nested first), then compare Data 360 vs Snowflake",
    createFlowOnly: true,
  },
];

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveCountId(entry) {
  return entry.countId || entry.id;
}

function countFor(entry) {
  const record = liveCounts.counts && liveCounts.counts[resolveCountId(entry)];
  return record && typeof record.d360 === "number" ? record.d360 : null;
}

function statusFor(entry) {
  const record = liveCounts.counts && liveCounts.counts[resolveCountId(entry)];
  return (record && record.status) || "live";
}

function formatCount(n) {
  return n == null ? "—" : n.toLocaleString("en-US");
}

function countBadge(entry) {
  if (entry.tag === "D360 and Snowflake count" || (entry.source && entry.source.stream)) {
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
  return el ? el.value : "all";
}

/** True when the prompt has a live Data 360 count greater than zero. */
function isPullable(entry) {
  const n = countFor(entry);
  return statusFor(entry) === "live" && typeof n === "number" && n > 0;
}

function setStatus(text) {
  const el = $("status");
  if (el) el.textContent = text;
}

async function copyPrompt(entry) {
  try {
    await navigator.clipboard.writeText(entry.prompt);
    setStatus("Prompt copied — paste into Cursor with the governed Skill + data360 MCP.");
  } catch {
    setStatus("Could not copy — select the prompt text manually.");
  }
}

function dataspaceLabel(dataspace) {
  const group = FAQ_GROUPS.find((g) => g.dataspace === dataspace);
  return group ? group.label : dataspace;
}

/**
 * Renders the dual report for one use case. The Data 360 side comes from the
 * agent-refreshed snapshot; Snowflake stays PENDING because the browser cannot
 * reach the warehouse.
 */
function resultHtml(entry) {
  const source = entry.source || {};
  const hasStream = Boolean(source.table && source.stream);
  const snowValue = hasStream
    ? '<p class="count-value pending">PENDING — run in warehouse</p>'
    : '<p class="count-value pending">N/A — connector is not Snowflake</p>';
  const snowMeta = hasStream
    ? `Source: ${escapeHtml(source.database)}.${escapeHtml(source.schema)}.${escapeHtml(source.table)} · Stream: ${escapeHtml(source.stream)}`
    : "This DMO is CRM-sourced — use the OCL benchmark instead of a stream comparison.";
  const delta = hasStream
    ? "Delta: PENDING — copy the prompt into Cursor and let the Skill tally the Snowflake source count. Note: Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING."
    : "Delta: N/A for stream parity — validate with the OCL benchmark.";

  return `
    <div class="count-block d360">
      <p class="count-label">Data 360 count</p>
      <p class="count-value">${escapeHtml(formatCount(countFor(entry)))}</p>
      <p class="count-meta">
        Dataspace ${escapeHtml(dataspaceLabel(entry.dataspace))} · DMO <code>${escapeHtml(source.dmo)}</code>
        · as of ${escapeHtml(refreshedLabel())}
      </p>
    </div>
    <div class="count-block snow">
      <p class="count-label">Snowflake source count</p>
      ${snowValue}
      <p class="count-meta">${snowMeta}</p>
    </div>
    <p class="delta">${escapeHtml(delta)}</p>
    <p class="count-meta">Count only — no PII is returned.</p>
    ${
      hasStream
        ? '<p class="count-meta"><strong>Note:</strong> Authenticate the Snowflake MCP once so the agent can fill the Snowflake count instead of PENDING.</p>'
        : ""
    }
  `;
}

function runUseCase(entry, panel, btn) {
  panel.innerHTML = resultHtml(entry);
  panel.hidden = false;
  btn.textContent = "Re-run";
  setStatus(
    `Ran "${entry.question}" — Data 360 ${formatCount(countFor(entry))} from the snapshot refreshed ${refreshedLabel()}.`
  );
}

function renderFaqs() {
  const root = $("faqs");
  if (!root) return;
  root.innerHTML = "";

  const ds = selectedDataspace();
  let total = 0;

  FAQ_GROUPS.forEach((group) => {
    const items = PROMPTS.filter((p) => {
      if (!isPullable(p)) return false;
      if (ds !== "all" && p.dataspace !== ds) return false;
      if (group.createFlowOnly) return !!p.createFlow;
      if (group.excludeCreateFlow && p.createFlow) return false;
      return p.dataspace === group.dataspace;
    });
    if (!items.length) return;
    total += items.length;

    const section = document.createElement("div");
    section.className = "faq-group";
    section.innerHTML = `<h3 class="faq-group-title"><span class="faq-cat ${group.className}">${escapeHtml(
      group.label
    )}</span><span class="faq-group-count">${items.length}</span>${
      group.note ? ` <span class="faq-group-note">${escapeHtml(group.note)}</span>` : ""
    }</h3>`;

    const list = document.createElement("div");
    list.className = "faq-group-list";

    items.forEach((entry) => {
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
            ${countBadge(entry)} · DMO <code>${escapeHtml(entry.source.dmo)}</code></p>
          <p class="faq-answer"><strong>Filters:</strong> ${escapeHtml(entry.filters)}</p>
          ${
            entry.createFlow
              ? '<p class="faq-answer"><strong>Agent flow:</strong> count → confirm → create D2C segment (CIA Consumer Marketable Email nested first) → dual-report Data 360 vs Snowflake.</p>'
              : ""
          }
          <div class="faq-actions">
            <button type="button" class="btn primary faq-run" data-id="${entry.id}">Run use case</button>
            <button type="button" class="btn ghost faq-copy" data-id="${entry.id}">Copy prompt</button>
          </div>
          <div class="result" data-result="${entry.id}" hidden></div>
        </div>
      `;
      list.appendChild(details);
    });

    section.appendChild(list);
    root.appendChild(section);
  });

  if (!total) {
    root.innerHTML = '<p class="muted">No pullable use cases for this dataspace yet.</p>';
    return;
  }

  root.querySelectorAll(".faq-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = PROMPTS.find((p) => p.id === btn.getAttribute("data-id"));
      if (entry) copyPrompt(entry);
    });
  });

  root.querySelectorAll(".faq-run").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const entry = PROMPTS.find((p) => p.id === id);
      const panel = root.querySelector(`[data-result="${id}"]`);
      if (entry && panel) runUseCase(entry, panel, btn);
    });
  });
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
  renderFaqs();
  renderRefreshStamp();
}

document.querySelectorAll('input[name="dataspace"]').forEach((el) => {
  el.addEventListener("change", () => {
    setStatus("");
    renderFaqs();
  });
});

renderFaqs();
renderRefreshStamp();
loadCounts();
