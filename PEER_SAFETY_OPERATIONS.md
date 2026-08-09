# CornellPulse peer safety operations

Peer Connect is disabled publicly. This runbook describes requirements for a future independent CornellPulse operator; it does not represent Cornell University, Cornell Health, Cornell Police, or any emergency service, and it is not launch approval.

Document version: **2026-08-09.1**
Approval status: **PENDING EXTERNAL REVIEW; NOT APPROVED FOR OPERATION**

## Identity, roles, training, and references

- Supporters provide informal peer presence and resource navigation only. They do not diagnose, provide therapy, investigate reports, transport requesters, promise confidentiality, or act as crisis responders.
- Moderators must complete documented training on role boundaries, trauma-aware report handling, privacy minimization, bias, evidence preservation, account suspension, emergency limitations, and operator shutdown. Training completion must be verifiable and renewed when this policy changes.
- Administrators manage moderator access, approve reinstatement and deletion, verify readiness evidence, and run incident/shutdown procedures. A moderator may suspend an active participant when needed to contain risk but cannot reinstate, delete, export, or read relay messages.
- Production identity must come from an authorized Cornell identity-provider integration. An `@cornell.edu` address or manual development evidence is not sufficient.
- The identity owner must approve issuer, audience, claims, assurance level, immutable subject mapping, affiliation/role mapping, deprovisioning, account recovery, and incident contacts. Supporter, requester, moderator, and administrator permissions are distinct and server-enforced.
- The operator must name a training owner, safeguarding owner, moderation lead, privacy contact, security contact, release owner, and on-call escalation decision maker before any pilot. Names, coverage, backups, and acknowledgement evidence belong in the protected operations system; roles written here are not staffed merely because they are documented.
- Supporter training must have an approved version, trainer qualifications, role-boundary/conduct/public-meeting/reporting modules, assessed completion, renewal date, and revocation path. Do not display “trained,” “vetted,” or “approved” until the server has verifiable current evidence.
- References are invited by email only after applicant consent and identity review. The reference must see the purpose, data use, retention, voluntariness, and decline/withdrawal path before providing a response. Phone numbers are not collected. A relationship or statement is not stored until the reference explicitly consents.

## Connection consent, relay, meetings, and participant controls

- A verified requester explicitly submits a request; a verified supporter independently accepts. Pending does not imply contact or success. Declined, canceled, expired, failed, unavailable, and accepted states come only from confirmed server state.
- Neither person receives the other's email or phone. Relay messages are available only after both consent, are encrypted, and reject recognizable email addresses, phone numbers, URLs, and social handles. Fixed email notifications contain a server record reference rather than message/contact content; provider acceptance does not prove delivery.
- Meeting choices are a reviewed allowlist of staffed or commonly used public campus/community locations and reasonable daytime/evening windows. Private residences, vehicles, isolated trails, vague “anywhere” choices, and unsafe late-night framing are prohibited. Either person may decline or leave without explanation.
- Requesters may cancel and report. Supporters may accept, decline, expire, block, and report. Both roles may block/report after connection as authorized. A block prevents new matching without exposing who blocked whom; safety reports do not promise continuous monitoring.

## Triage and response expectations

Reports begin as `submitted`; this confirms database receipt, not that a person has read them. Assignment and severity occur during triage. Notes move a triaged report to `investigating`. Terminal outcomes are `resolved`, `dismissed`, or `duplicate` with a structured resolution code and encrypted summary.

Severity describes operational priority, not a clinical assessment:

- `low`: boundary or conduct concern without an indicated immediate safety risk.
- `moderate`: repeated or escalating conduct requiring timely review.
- `high`: credible safety concern, harassment, coercion, or serious policy breach.
- `critical`: information may indicate imminent danger. Show emergency boundaries immediately and escalate to the trained operator; software must not automatically contact authorities.

No response time is promised until staffing and on-call coverage are formally approved. Reports are not continuously monitored. The UI and notifications must say only `submitted`, `provider accepted`, `failed`, or `skipped` as confirmed by the server; provider acceptance is not proof of delivery or human review.

The accountable operations owner must publish approved triage targets only after staffing is verified. Every shift/handoff records queue age, unassigned high/critical reports, notification failures, suspended participants, and unresolved incidents without copying unnecessary PII. Critical indicates operational priority, not diagnosis. Duplicate submissions link to the surviving report without discarding evidence; spoofed identity or authorization anomalies are escalated to security.

## Emergency boundaries

CornellPulse cannot dispatch responders. For immediate danger in the United States, users should call 911. For suicide or crisis support, call or text 988. A trained operator may contact emergency services when available information indicates an imminent threat, but must document the basis, information disclosed, recipient, time, and outcome. This is a human decision under an approved protocol—not an automated classifier decision and not an action on Cornell's behalf.

## Documentation and privacy

- The report queue contains operational metadata only. User-written reasons and encrypted moderation notes require an explicit detail read that is audited.
- Moderators cannot read relay messages, access private contact records through report routes, perform bulk export, delete reports, or reinstate participants.
- Notes record observable facts, decisions, sources, and next actions. Do not copy unrelated PII, speculate about diagnoses, or paste entire relay conversations.
- Suspension ends active connections as unavailable. Reinstatement is administrator-only and requires current identity, policy, reference, and training gates for supporters.
- Participant blocks are available to both requester and supporter. The target is inferred from the authenticated connection; clients cannot nominate another identity.
- Routine moderators see only fields necessary to triage/resolve the assigned report. They cannot bulk export, casually reveal identity/contact/reference data, read relay messages, decrypt unrelated PII, delete reports, reinstate participants, or change approval gates. Administrator access is exceptional, reason-bound, and audited.

## Retention and deletion

- Connection requests and relay messages default to 90 days. Reports, moderation notes, audit/status history, and blocks default to 365 days. Notification metadata defaults to 90 days.
- The protected purge tombstones encrypted content at expiry, deactivates blocks, removes provider identifiers/error codes, and deletes expired audit/status/rate-control rows.
- Active connections cannot be deleted before they are canceled, blocked, expired, declined, or unavailable. Active reports cannot be deleted before resolution. Administrator deletion redacts report reasons, resolutions, and notes while retaining time-limited non-PII audit evidence.
- Provider mailboxes, infrastructure logs, and backups follow separate operator/provider schedules and may not be erased by an application deletion.
- Withdrawal stops new participation and removes public profiles/contact credentials. Legal holds or active safety investigations may delay specific deletion only under an approved documented policy. A restored backup must reapply deletion tombstones and expiry before returning to service.

## Shutdown procedure

1. Set backend and frontend Peer Connect and supporter-signup flags to false and confirm the unavailable screen is served.
2. Revoke peer/moderator signing secrets and active credentials; preserve administrator access for incident handling.
3. Stop new notifications and mark unconfirmed attempts accurately. Do not describe queued or provider-accepted messages as delivered.
4. Mark active connections unavailable, preserve open safety reports under the retention policy, and notify affected participants only through an approved, tested channel.
5. Capture non-PII audit/status evidence, rotate exposed encryption/provider credentials, and follow the incident-response and backup-restoration plan.
6. Do not re-enable until the readiness endpoint reports no blockers and current safety, privacy, security, operations, identity-provider, accessibility, and deployment approvals are independently verified.

## Re-enablement procedure

1. Name the human operators and confirm coverage, training, access reviews, incident contacts, and shutdown authority.
2. Close every incident/root-cause action and attach staging evidence for identity, relay delivery/failure, concurrency, rate limits, retention, backups, monitoring, and notification truthfulness.
3. Obtain signed current-version clinical/safety, privacy/legal, security, accessibility, Cornell identity/affiliation, and peer-training/operations decisions. Enter only real approval identifiers in protected configuration.
4. Confirm the Cornell-authorized identity integration code gate, secrets/keys, monitored contacts, migrations, readiness probes, and all default-off flags in a change-reviewed canary.
5. Enable only the smallest approved pilot scope, monitor the agreed stop conditions, and keep a tested kill switch. A readiness response or configuration value alone is not authorization.

## Readiness gate

`FEATURE_PEER_CONNECT=true` is insufficient. Runtime routes also require a valid peer signing secret, Fernet encryption key, monitored safety contact, the current approval version, four non-empty approval identifiers, and the hard-coded identity-integration implementation gate. The administrator-only readiness endpoint reports missing categories without exposing secret values. Default environment examples intentionally leave approval identifiers blank.
