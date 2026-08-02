# CornellPulse peer backend security model

Peer Connect and supporter signup remain disabled by default. This document describes the code boundary; it is not approval to launch the feature.

## Identity and authorization

- Supporters, requesters, connection requests, and reports use server-generated UUIDs. New relationships never use display names as keys.
- Supporter and requester passwords are stored only as bcrypt hashes. Private contact/reference data and request/report content are stored in Fernet-encrypted payloads using `PEER_PII_ENCRYPTION_KEY`.
- Supporter, requester, and moderator sessions are signed, audience-bound bearer tokens with a 15-minute default lifetime. Administrators retain the separate HttpOnly, SameSite=Strict cookie session.
- Supporters can access their own private profile and respond only to requests addressed to their UUID. Requesters can create and close only their own requests. Moderators can review operational queues and resolve records but cannot delete records or read supporter reference details. Administrators can perform destructive actions and private-data review.
- CORS is not an authorization control. Every protected route validates a signed session and role/ownership before the database action.

## Public/private boundary

The public supporter serializer returns only supporter UUID, display name, year, major, locations, availability, interests, and profile text. It has no code path for email, phone, reference fields, credential hashes, encrypted payloads, or legacy database IDs.

New email notifications use fixed subjects and HTML-escaped server-generated UUID references. They do not copy user messages, report reasons, reference details, or requester contact data into email bodies.

## Abuse, audit, and retention

- Login, registration, connection, and report limits use PostgreSQL rows with a unique scope/subject hash and `SELECT ... FOR UPDATE`, so limits are shared across API processes.
- Audit records contain role/actor ID, action code, target type/ID, and allowlisted non-PII metadata. Status changes have a separate append-only history.
- Default retention is 365 days for supporters/reports/audit/status history and 90 days for requesters/connection requests. An administrator-only purge erases expired private/public profile payloads and deletes expired audit, status-history, and rate-limit rows. Production must schedule this endpoint.
- Withdrawal invalidates stored credentials and erases private fields. Administrator deletion preserves only pseudonymized tombstones and non-PII audit/status evidence for accountability.

## Safe migration sequence

1. Keep all peer feature flags false and take a verified database backup.
2. Apply `backend/migrations/20260802_peer_security_redesign.sql` in staging. It adds and backfills columns/tables without removing existing rows or columns. Only unique legacy supporter names are linked automatically; ambiguous names remain null for human reconciliation.
3. Configure a new Fernet key in secret storage. Run `backend/scripts/backfill_peer_pii.py` without `--apply` and review counts without exposing row content.
4. Run the backfill with `--apply` in staging, verify decryptability and that copied plaintext columns are empty, then repeat through the approved production change process.
5. Provide a verified credential enrollment/reset process for migrated people. The migration intentionally does not invent passwords.
6. Exercise authorization, concurrency, key rotation/recovery, retention jobs, backup restoration, email-provider behavior, and incident response in the production topology.
7. Obtain safety, privacy, security, legal, and Cornell stakeholder approval before changing either feature flag.
