# CornellPulse security remediation

Peer Connect, supporter signup, and the public admin UI are disabled by default while the following launch blockers remain.

- Apply and verify `backend/migrations/20260802_peer_security_redesign.sql` on a backed-up staging database, run the encrypted PII backfill in dry-run and apply modes, and reconcile ambiguous legacy name relationships before enabling Peer Connect.
- Apply `backend/migrations/20260802_supporter_onboarding.sql`, quarantine legacy reference records so they cannot satisfy consent gates, and complete an approved deletion/notification decision for that pre-consent data.
- Apply `backend/migrations/20260803_connection_relay.sql`; verify legacy requests become unavailable rather than appearing accepted or pending; exercise double opt-in, block/report, relay encryption, and expiry under concurrency.
- Apply `backend/migrations/20260803_peer_safety_operations.sql`; validate triage assignment, encrypted notes/resolutions, bidirectional blocks, suspension/reinstatement, notification failure states, and retention on a backed-up staging copy.
- Apply `backend/migrations/20260808_private_aggregate_retention.sql` on a backed-up staging copy. Verify it preserves only campus-wide daily completion counts of five or more and irreversibly removes legacy mood, sleep, workload, college, and hour data.
- Integrate an authorized Cornell OIDC/SAML identity provider, including server-side assertion validation and revocation handling. The current manual non-production evidence route is deliberately not production-eligible.
- Establish credential enrollment/reset procedures for migrated supporters, requesters, moderators, withdrawals, and deletion requests.
- Review the implemented collection, encryption, retention, deletion, audit, status-history, and minimal email-notification boundaries with qualified privacy/security reviewers.
- Have qualified Cornell stakeholders approve the implemented supporter role scope, conduct, training, supervision, incident response, reporting, escalation, emergency, and public-meeting boundaries in `SUPPORTER_ONBOARDING.md`.
- Schedule the administrator-only cleanup for expired peer records, audit logs, status history, and rate-limit buckets; exercise concurrency and failover against the production PostgreSQL topology.
- Rotate any credential ever committed or shared, remove it from repository history where appropriate, and use deployment secret storage.
- Validate privacy language, crisis guidance, resource accuracy, accessibility, monitoring, backups, and recovery in a production-like environment.
- Configure and exercise required PostgreSQL, Redis, and email dependencies through `/api/v1/health/ready`; provider acceptance is not proof of email delivery.
- Run the updated backend authorization/outage suite, full browser end-to-end/axe matrix, current npm and Python vulnerability scanners, and an assistive-technology pass in an environment that permits those tools. Do not release from a static-only result.
- Keep the tested backend pins current. The 2026-08-08 refresh replaced `python-jose`/its unfixed `ecdsa` dependency with PyJWT, upgraded FastAPI/Starlette, cryptography, Pydantic settings, SQLAlchemy, and test/runtime packages, and passed the full backend suite plus `pip-audit` with no known findings.
- Require a documented safety/privacy sign-off before enabling any feature flag in production.
- Complete every licensed-professional and Cornell Health review item in `SAFETY_REVIEW.md`; automated phrase tests are not clinical validation.

Default-off flags are centralized in `frontend/src/config/featureFlags.ts` and `backend/app/config.py`. Environment overrides are not launch approval: the runtime readiness gate additionally requires current safety, privacy, security, operations, identity-provider, encryption, authentication, and monitored-contact evidence.

Administrator access uses a short-lived signed token in an HttpOnly, SameSite=Strict cookie. Production startup rejects missing or unsafe session secrets, password hashes, or non-HTTPS frontend origins. CORS controls which browser origins may send credentialed requests; it is not an authentication mechanism.

The redesigned peer backend uses immutable UUIDs, double opt-in, an encrypted contact-free in-app relay, separate encrypted private payloads, short-lived role tokens, administrator cookies, database-backed rate-limit buckets, least-privilege serializers, audit events, status history, and configured retention windows. These controls reduce technical risk but do not constitute launch approval; see `PEER_SECURITY_MODEL.md` and `CONNECTION_PRIVACY_MODEL.md`.
