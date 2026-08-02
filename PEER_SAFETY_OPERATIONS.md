# CornellPulse peer safety operations

Peer Connect is disabled publicly. This runbook describes requirements for a future independent CornellPulse operator; it does not represent Cornell University, Cornell Health, Cornell Police, or any emergency service, and it is not launch approval.

## Roles and training

- Supporters provide informal peer presence and resource navigation only. They do not diagnose, provide therapy, investigate reports, transport requesters, promise confidentiality, or act as crisis responders.
- Moderators must complete documented training on role boundaries, trauma-aware report handling, privacy minimization, bias, evidence preservation, account suspension, emergency limitations, and operator shutdown. Training completion must be verifiable and renewed when this policy changes.
- Administrators manage moderator access, approve reinstatement and deletion, verify readiness evidence, and run incident/shutdown procedures. A moderator may suspend an active participant when needed to contain risk but cannot reinstate, delete, export, or read relay messages.
- Production identity must come from an authorized Cornell identity-provider integration. An `@cornell.edu` address or manual development evidence is not sufficient.

## Triage and response expectations

Reports begin as `submitted`; this confirms database receipt, not that a person has read them. Assignment and severity occur during triage. Notes move a triaged report to `investigating`. Terminal outcomes are `resolved`, `dismissed`, or `duplicate` with a structured resolution code and encrypted summary.

Severity describes operational priority, not a clinical assessment:

- `low`: boundary or conduct concern without an indicated immediate safety risk.
- `moderate`: repeated or escalating conduct requiring timely review.
- `high`: credible safety concern, harassment, coercion, or serious policy breach.
- `critical`: information may indicate imminent danger. Show emergency boundaries immediately and escalate to the trained operator; software must not automatically contact authorities.

No response time is promised until staffing and on-call coverage are formally approved. Reports are not continuously monitored. The UI and notifications must say only `submitted`, `provider accepted`, `failed`, or `skipped` as confirmed by the server; provider acceptance is not proof of delivery or human review.

## Emergency boundaries

CornellPulse cannot dispatch responders. For immediate danger in the United States, users should call 911. For suicide or crisis support, call or text 988. A trained operator may contact emergency services when available information indicates an imminent threat, but must document the basis, information disclosed, recipient, time, and outcome. This is a human decision under an approved protocol—not an automated classifier decision and not an action on Cornell's behalf.

## Documentation and privacy

- The report queue contains operational metadata only. User-written reasons and encrypted moderation notes require an explicit detail read that is audited.
- Moderators cannot read relay messages, access private contact records through report routes, perform bulk export, delete reports, or reinstate participants.
- Notes record observable facts, decisions, sources, and next actions. Do not copy unrelated PII, speculate about diagnoses, or paste entire relay conversations.
- Suspension ends active connections as unavailable. Reinstatement is administrator-only and requires current identity, policy, reference, and training gates for supporters.
- Participant blocks are available to both requester and supporter. The target is inferred from the authenticated connection; clients cannot nominate another identity.

## Retention and deletion

- Connection requests and relay messages default to 90 days. Reports, moderation notes, audit/status history, and blocks default to 365 days. Notification metadata defaults to 90 days.
- The protected purge tombstones encrypted content at expiry, deactivates blocks, removes provider identifiers/error codes, and deletes expired audit/status/rate-control rows.
- Active connections cannot be deleted before they are canceled, blocked, expired, declined, or unavailable. Active reports cannot be deleted before resolution. Administrator deletion redacts report reasons, resolutions, and notes while retaining time-limited non-PII audit evidence.
- Provider mailboxes, infrastructure logs, and backups follow separate operator/provider schedules and may not be erased by an application deletion.

## Shutdown procedure

1. Set backend and frontend Peer Connect and supporter-signup flags to false and confirm the unavailable screen is served.
2. Revoke peer/moderator signing secrets and active credentials; preserve administrator access for incident handling.
3. Stop new notifications and mark unconfirmed attempts accurately. Do not describe queued or provider-accepted messages as delivered.
4. Mark active connections unavailable, preserve open safety reports under the retention policy, and notify affected participants only through an approved, tested channel.
5. Capture non-PII audit/status evidence, rotate exposed encryption/provider credentials, and follow the incident-response and backup-restoration plan.
6. Do not re-enable until the readiness endpoint reports no blockers and current safety, privacy, security, operations, identity-provider, accessibility, and deployment approvals are independently verified.

## Readiness gate

`FEATURE_PEER_CONNECT=true` is insufficient. Runtime routes also require a valid peer signing secret, Fernet encryption key, monitored safety contact, the current approval version, four non-empty approval identifiers, and the hard-coded identity-integration implementation gate. The administrator-only readiness endpoint reports missing categories without exposing secret values. Default environment examples intentionally leave approval identifiers blank.

