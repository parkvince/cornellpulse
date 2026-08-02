# CornellPulse security remediation

Peer Connect, supporter signup, and the public admin UI are disabled by default while the following launch blockers remain.

- Apply and verify `backend/migrations/20260802_peer_security_redesign.sql` on a backed-up staging database, run the encrypted PII backfill in dry-run and apply modes, and reconcile ambiguous legacy name relationships before enabling Peer Connect.
- Establish credential enrollment/reset and identity-verification procedures for migrated supporters, requesters, moderators, withdrawals, and deletion requests.
- Review the implemented collection, encryption, retention, deletion, audit, status-history, and minimal email-notification boundaries with qualified privacy/security reviewers.
- Define supporter vetting, training, supervision, incident response, reporting, escalation, and emergency boundaries with qualified Cornell stakeholders.
- Schedule the administrator-only cleanup for expired peer records, audit logs, status history, and rate-limit buckets; exercise concurrency and failover against the production PostgreSQL topology.
- Rotate any credential ever committed or shared, remove it from repository history where appropriate, and use deployment secret storage.
- Validate privacy language, crisis guidance, resource accuracy, accessibility, monitoring, backups, and recovery in a production-like environment.
- Require a documented safety/privacy sign-off before enabling any feature flag in production.
- Complete every licensed-professional and Cornell Health review item in `SAFETY_REVIEW.md`; automated phrase tests are not clinical validation.

Default-off flags are centralized in `frontend/src/config/featureFlags.ts` and `backend/app/config.py`. Environment overrides must not be treated as launch approval.

Administrator access uses a short-lived signed token in an HttpOnly, SameSite=Strict cookie. Production startup rejects missing or unsafe session secrets, password hashes, or non-HTTPS frontend origins. CORS controls which browser origins may send credentialed requests; it is not an authentication mechanism.

The redesigned peer backend uses immutable UUIDs, separate encrypted private payloads, short-lived role tokens, administrator cookies, database-backed rate-limit buckets, least-privilege serializers, audit events, status history, and configured retention windows. These controls reduce technical risk but do not constitute launch approval; see `PEER_SECURITY_MODEL.md` for deployment and legacy-data requirements.
