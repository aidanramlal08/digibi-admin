# DigiBi n8n Workflows — Backup & Migration Kit

Full export of the DigiBi n8n workflows, saved here so they survive the old
account lapsing and can be rebuilt on a new n8n account.

Old account: `aidannnnn.app.n8n.cloud` (project "DigiBi", aidanramlal24@gmail.com).

Each `*.json` file is an importable workflow (name + nodes + connections +
settings). Import via **n8n → Workflows → Import from File**, or I can recreate
them via the n8n MCP once the new account is connected.

## Workflows

| File | Workflow | Trigger | Status |
|------|----------|---------|--------|
| 01-auto-provisioning.json | Auto-Provisioning (client → Retell agent + number) | Webhook `paystack-provision` | active |
| 02-client-call-ingest.json | Client Call Ingest | Webhook `client-call-ingest` | active |
| 03-client-onboarding-paystack.json | Client Onboarding (Paystack) | Schedule (every 15 min) | active |
| 04-client-portal-api.json | Client Portal API | Webhook | active |
| 05-consultation-config-capture.json | Consultation Config Capture | Form | active |
| 06-inbox-log.json | Inbox Log | IMAP trigger | active |
| 07-owner-dashboard-api.json | Owner Dashboard API | Webhook | active |
| 08-web-lead-intake.json | Web Lead Intake | Webhook | active |
| 09-website-chatbot-gemini.json | Website Chatbot (Gemini) | Chat/Webhook | active |
| 10-immigration-lady-calendar.json | Immigration Lady — Calendar Availability & Booking | Webhook x2 | inactive (client project) |
| 11-immigration-lady-whatsapp.json | Immigration Lady — WhatsApp Chatbot | WhatsApp Cloud trigger | inactive (client project) |

> The 3 old "Immigration Lady - WhatsApp Chatbot" duplicate/backup versions in
> the old account were superseded and are not exported.

## What does NOT survive an import (must be recreated on the new account)

These are account-scoped and will be blank/broken after import until redone:

### 1. Credentials (recreate all 4, then re-link them on each node)
| Credential | Type | Used by |
|------------|------|---------|
| HubSpot account | `hubspotOAuth2Api` | most DigiBi workflows |
| SMTP account | `smtp` | onboarding / outbound emails |
| IMAP account | `imap` | Inbox Log trigger |
| Google Gemini(PaLM) Api account | `googlePalmApi` | Website Chatbot, Web Lead Intake |

Plus the generic Bearer credentials referenced by HTTP nodes:
- **Retell API** (Bearer) — Auto-Provisioning
- **Paystack API** (Bearer) — Client Onboarding

### 2. Data tables (recreate with same names + columns)
| Table name | Old ID | Columns |
|------------|--------|---------|
| calls | PpSYnXA04kFYDCf2 | client_key, call_id, ts, duration_min, call_type, connected, booked, caller_number, disconnection_reason, transcript |
| emails_log | t2bRfNb2aIumYxlc | sent_at, to_address, subject, email_type |
| inbox_log | (see 06) | from, subject, snippet, received_at |
| (others referenced in Owner Dashboard API / Portal API — see those files) | | |

After recreating the tables, update the `dataTableId.value` in each node to the
new table IDs (the `cachedResultName` shows which table each node targets).

### 3. Webhook URLs regenerate
Every webhook node gets a new URL on the new account. Repoint external callers:
- Paystack `charge.success` → Auto-Provisioning `paystack-provision`
- Retell call webhook → Client Call Ingest `client-call-ingest`
- Website forms / chatbot → Web Lead Intake, Website Chatbot, Portal API
- digibi-admin & digibi-portal apps → Owner Dashboard API / Client Portal API

### 4. Third-party plan/agent IDs
- **Paystack plan codes** (in 03, the `PLANS` map) are per-account — recreate the
  9 plans on the new Paystack account and swap in the new `PLN_...` codes.
- **Retell** `llm_id` / `voice_id` placeholders (`REPLACE_ME_...` in 01).
- **Slack** webhook URL placeholder (`REPLACE_ME_SLACK_WEBHOOK_URL` in 01).

## HubSpot custom properties these workflows depend on
`digibi_lead_status, digibi_go_live_date, digibi_plan, digibi_product,
digibi_tier, digibi_contact_email, digibi_client_agents_id,
digibi_setup_fee_cents, digibi_retell_agent_id, digibi_retell_number,
digibi_paystack_reference, digibi_paystack_checkout_url,
digibi_paystack_authorization_code, digibi_onboarding_status`.
Deal stage `5698192620` = Closed Won.
