# Privacy and legal review packet

Packet version: **2026-08-09.2**
Review scope: **baseline commit `dc2b909`, attached uncommitted remediation diff, policy/inventory version 2026-08-09.2, and final evidence bundle**
Approval status: **PENDING EXTERNAL REVIEW — NOT APPROVED**  
Responsible reviewer: **Qualified privacy counsel or privacy officer familiar with the deployment jurisdictions and processors**  
Assigned reviewer name / authority: ______________________________

## Exact behavior under review

- Local storage holds onboarding state, explicit privacy choices, saved plans/mood numbers/follow-up/reminders, retention preference, and opt-in local measurement counters. Session storage holds only a minimal structured check-in draft; optional free text is excluded.
- Optional campus aggregate contribution is off by default and sends only `checkin_completed`, `consent_granted: true`, and an unlinkable idempotency receipt. The server retains UTC-day campus counts for 30 days and receipts for 2 days; it stores no mood, sleep, workload, college, hour, name, contact, device ID, or free text in that flow.
- Optional resource-click analytics is off by default and sends only resource ID and `call`/`website` action. Rows expire after 30 days. Product measurement is local-only.
- Technical/infrastructure logs may contain IP, time, route, status, user agent, and provider metadata; application error reports exclude request bodies and known sensitive fields. The operator must configure and verify 14-day log deletion.
- Peer features are disabled. If later approved, encrypted contact/reference/report/relay fields and operational metadata use the retention periods in `PRIVACY_POLICY.md` and `PEER_SAFETY_OPERATIONS.md`.

## Decision questions

1. Is each purpose, lawful basis/notice mechanism, consent action, withdrawal path, retention period, and deletion limitation adequate for every launch jurisdiction?
2. Are processors, transfers, subprocessors, infrastructure logs, emails, backups, and incident records described and contractually controlled?
3. Is a daily count with no person-level dimensions sufficiently minimized, and is individual deletion impossibility explained accurately?
4. Are identity, supporter, requester, reference, relay, moderation, and report records lawful and proportionate if Peer is ever enabled?
5. Are operator identity, monitored privacy contact, response procedure, age/eligibility boundaries, and policy-change notice adequate?
6. What records must be placed on legal hold, and how does that override deletion?

## Known limitations

- No legal-compliance claim is made; jurisdiction, controller/operator identity, contracts, and production processors are not finalized here.
- Browser deletion cannot delete server counts, provider logs/mailboxes, external services, backups, or already-expired/unlinkable data.
- Aggregate contributions cannot be retrieved per person because no person link is stored.
- Production backup/log deletion and data-subject workflows have not been exercised.

## Required evidence

- `PRIVACY_POLICY.md`, `CONSENT_MATERIALS.md`, `PRIVACY_DATA_INVENTORY.md`, retention code/tests, processor/subprocessor list, data-flow diagram, production log/backup settings, and deletion drill evidence.
- Screenshots of consent defaults, withdrawal, local export/deletion, and missing-contact fail-closed state.
- Executed data-processing agreements and approved operator contact/response SLA where required.

## Decision and signature

Decision: [ ] Approve  [ ] Approve with conditions  [ ] Changes required  [ ] Reject  
Approved scope/version/jurisdictions: ______________________________________________________  
Conditions / required changes: ____________________________________________________________  
Evidence references: ____________________________________________________________________  
Approval expiry / mandatory re-review date: _______________________________________________
Re-review triggers accepted (purpose/field/processor/retention/jurisdiction/incident changes):
____________________________________________________________________________________________
Reviewer name and authority: ___________________________  Organization: _____________________  
Signature: ___________________________________________  Date: _____________________________
