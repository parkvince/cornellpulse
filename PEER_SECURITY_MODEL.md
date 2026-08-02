# CornellPulse peer backend security model

Peer Connect and supporter signup remain disabled by default. This document describes the code boundary; it is not approval to launch the feature.

## Identity and authorization

- Supporters, requesters, connection requests, and reports use server-generated UUIDs. New relationships never use display names as keys.
- Supporter and requester passwords are stored only as bcrypt hashes. Private contact/reference data and request/report content are stored in Fernet-encrypted payloads using `PEER_PII_ENCRYPTION_KEY`.
- Supporter, requester, and moderator sessions are signed, audience-bound bearer tokens with a 15-minute default lifetime. Administrators retain the separate HttpOnly, SameSite=Strict cookie session.
- Supporters can access their own private profile and respond only to requests addressed to their UUID. Requesters can create and cancel only their own requests. Both roles require an identity-verification record for connection actions. Moderators can review operational queues and mark records unavailable but cannot delete records, read supporter reference details, or read relay messages. Administrators can perform destructive actions and authorized operational review.
- Supporter onboarding follows the gated state machine and consent invitation described in `SUPPORTER_ONBOARDING.md`. The current repository does not implement Cornell OIDC/SAML verification, so supporter signup must remain disabled in production.
- CORS is not an authorization control. Every protected route validates a signed session and role/ownership before the database action.

## Public/private boundary

The public supporter serializer returns only supporter UUID, display name, year, major, locations, availability, interests, and profile text. It has no code path for email, phone, reference fields, credential hashes, encrypted payloads, or legacy database IDs.

New email notifications use fixed subjects and HTML-escaped server-generated UUID references. They do not copy user messages, report reasons, reference details, or requester contact data into email bodies.

Connection requests use double opt-in and never copy or return either person's phone number or email. An encrypted in-app relay opens only after requester and supporter consent; recognizable direct-contact details are rejected. See `CONNECTION_PRIVACY_MODEL.md`.

Safety reports now use submitted, triaged, investigating, and terminal resolution states with severity, assignment, encrypted notes/resolution, participant suspension/reinstatement, bidirectional blocks, and PII-minimized audit history. Bulk report export is not implemented; the queue omits report reasons and moderators cannot read relay messages. See `PEER_SAFETY_OPERATIONS.md`.

## Abuse, audit, and retention

- Login, registration, connection, and report limits use PostgreSQL rows with a unique scope/subject hash and `SELECT ... FOR UPDATE`, so limits are shared across API processes.
- Audit records contain role/actor ID, action code, target type/ID, and allowlisted non-PII metadata. Status changes have a separate append-only history.
- Default retention is 365 days for supporters/reports/audit/status history and blocks, and 90 days for requesters, connection requests, and relay messages. An administrator-only purge erases expired private/public profile, relay, and connection-report payloads; deactivates expired blocks; and deletes expired audit, status-history, and rate-limit rows. Production must schedule this endpoint.
- Withdrawal invalidates stored credentials and erases private fields. Administrator deletion preserves only pseudonymized tombstones and non-PII audit/status evidence for accountability.
- Reference invitations store only an encrypted invitee email, a keyed token hash, status/timestamps, and an encrypted response after consent. They never collect a reference phone number.

## Safe migration sequence

1. Keep all peer feature flags false and take a verified database backup.
2. Apply `backend/migrations/20260802_peer_security_redesign.sql`, `backend/migrations/20260802_supporter_onboarding.sql`, `backend/migrations/20260803_connection_relay.sql`, and `backend/migrations/20260803_peer_safety_operations.sql` in staging. They add and backfill columns/tables without removing existing rows or columns. Only unique legacy supporter names are linked automatically; ambiguous names remain null for human reconciliation. Legacy references do not satisfy consent gates, legacy active-looking connections become unavailable because they lack explicit requester consent, and legacy open connection reports become submitted for triage.
3. Configure a new Fernet key in secret storage. Run `backend/scripts/backfill_peer_pii.py` without `--apply` and review counts without exposing row content.
4. Run the backfill with `--apply` in staging, verify decryptability and that copied plaintext columns are empty, then repeat through the approved production change process. Quarantine and resolve legacy reference data under an approved deletion/notification plan.
5. Provide a verified credential enrollment/reset process for migrated people. The migration intentionally does not invent passwords.
6. Complete an authorized Cornell OIDC/SAML integration. Manual non-production identity evidence cannot make a supporter publicly eligible.
7. Exercise authorization, concurrency, key rotation/recovery, retention jobs, backup restoration, email-provider behavior, and incident response in the production topology.
8. Obtain safety, privacy, security, legal, and Cornell stakeholder approval before changing either feature flag.
