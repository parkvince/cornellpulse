# CornellPulse privacy and data policy

Version: **2026-08-09.1**  
Prepared: **2026-08-09**  
Status: **DRAFT PENDING PRIVACY/LEGAL APPROVAL**  
Operator/contact: **must be configured as a monitored address in `PRIVACY_CONTACT_EMAIL` and `VITE_PRIVACY_CONTACT_EMAIL` before identifiable features or production release**

This document describes the current implementation. It is not a claim of anonymity, legal compliance, Cornell affiliation, or legal approval.

## Scope and core choices

CornellPulse provides a local check-in, resource directory, local follow-up history, and optional privacy-minimized measurements. Recommendations are informational, are not a diagnosis or validated clinical assessment, and are generated on the device. Optional aggregate contribution, resource-click analytics, and local product measurement are separate controls, each off by default. Disabling a control stops future collection under that control.

## Data kept on the device

- Onboarding completion and three privacy choices remain in browser/app local storage until cleared.
- A check-in draft in session storage contains a random draft ID, current step, mood, sleep/workload categories, selected triggers, and talk preference. It excludes optional free text and college. It is deleted on completion, **Delete this check-in**, tab/session close, or full device-data clearing.
- Optional free text exists only in page memory while the check-in is open and is cleared after local recommendation generation. It is not transmitted, logged by the application, or written to browser/server storage.
- Saving a next step creates local history with at most 20 entries: random local ID, date, mood number, selected resource, status, optional reminder, and optional contact/fit answers. Default retention is 90 days; users may select 30, 90, or 365 days or keep until deletion. Export and deletion occur locally.
- Product measurement, when explicitly enabled, stores local integer counters only. It contains no timestamps, resource IDs, raw answers, free text, names, emails, phone numbers, or account ID and is not uploaded.

## Server processing

### Optional aggregate contribution

After explicit opt-in, completing a check-in sends only the fixed event `checkin_completed`, `consent_granted: true`, and a random one-time request ID. The server stores a campus-wide UTC-date count for 30 days and a keyed hash of the one-time ID for 2 days to prevent duplicates. No per-college/hour cell or mood, sleep, workload, trigger, recommendation, free text, person, device, or account field is stored. Because there is no person link, an earlier contribution cannot be retrieved or individually deleted; it expires with the daily count.

### Optional resource-click analytics

After separate explicit opt-in, only `call` and `website` actions send the stable resource ID and action type. Rows expire after 30 days. They contain no CornellPulse account ID, raw check-in answer, free text, name, email, or phone. Network/infrastructure metadata may still be identifying.

### Administration and Peer records

Administrator sessions use a signed short-lived HttpOnly cookie. Peer Connect/supporter signup remain off. If later approved and enabled, supporter/requester identity/contact, reference responses, connection notes, relay messages, safety-report reasons, moderation notes, and resolution summaries are encrypted or hashed as appropriate; public endpoints receive only approved profile fields. Peer request/relay/notification records default to 90 days. Supporter, block, report, moderation, audit, and status-history records default to 365 days. Reference invitations expire after 14 days. Active connections and reports must first reach a safe terminal state before manual deletion. See `PRIVACY_DATA_INVENTORY.md` for every field and limitation.

## Logs, processors, email, Redis, and backups

- The application/hosting stack may process IP address, time, method/path, status, user agent, and provider metadata. Application errors omit request bodies and known sensitive fields. Production technical logs must be configured and verified for deletion after 14 days.
- PostgreSQL is the application database. Redis is not used by current application behavior; if a production topology later requires it, its purpose, fields, retention, access control, and processor must be reviewed before use.
- Resend may be configured for fixed peer/reference workflow email. Provider acceptance is not proof of delivery or human review. Provider logs and recipient/operator mailboxes follow separate settings.
- Phone, SMS, map, and official-provider links are external services with their own practices.
- Hosting, database, monitoring, email, DNS/CDN, and backup vendors must be listed in the deployed notice after selection. Production release requires processor review and contracts where applicable.
- Application deletion does not erase immutable/offline backups immediately. The operator must document backup frequency, encryption, access, maximum retention, restore behavior, and how deleted data is prevented from re-entering active service after restoration. These settings are not proven locally.

## Automated retention

The application runs an hourly sweep for 30-day daily aggregates, 2-day contribution receipts, 30-day resource clicks, 90-day inactive legacy push subscriptions, 365-day cached academic-calendar rows, expired rate-limit buckets, and configured peer field-level retention. Hosting logs, backups, provider logs, and mailboxes require separate operator/provider enforcement and evidence.

## Access, export, withdrawal, correction, and deletion

- Device history can be exported as JSON, individual plans can be deleted, retention shortened, and all known CornellPulse device keys cleared.
- Turning optional controls off stops future optional collection but does not identify previously unlinkable aggregate/click rows for deletion.
- Identifiable peer records, if ever enabled, require authenticated withdrawal/deletion controls or a verified request to the monitored operator. Identity verification must be proportionate and not collect unnecessary new data.
- External providers, mailboxes, logs, legal holds, and backups may require separate action or delayed deletion. A restored backup must reapply deletion tombstones before becoming active.

## Contact, changes, and complaints

The deployed application must display a monitored operator privacy address and response procedure. Production startup fails without the backend address, and identifiable features must remain disabled without it. The operator must record material policy changes, provide notice/renewed consent where required, and publish applicable complaint/escalation channels after legal review.

Legal reviewer approval: ______________________________  Date: __________________  Version: __________
