# Independent security review packet

Packet version: **2026-08-09.1**  
Approval status: **PENDING EXTERNAL REVIEW — NOT APPROVED**  
Responsible reviewer: **Independent application-security reviewer**  
Assigned reviewer name / organization: ______________________________

## Exact behavior under review

- FastAPI administrator authentication verifies a bcrypt hash from environment configuration and issues short-lived signed tokens in HttpOnly, SameSite=Strict cookies; production cookies require Secure/HTTPS. Login is persistently rate-limited, logout clears the session, and protected reads/mutations require server authorization.
- CORS is transport policy only and never grants access. Mutation idempotency, validation, safe error responses, secure headers, readiness checks, and privacy-safe logging are enforced server-side.
- Peer routes are fail-closed behind default-off flags and a readiness gate requiring strong secrets, PII encryption, monitored contacts, current approval identifiers, and a real Cornell identity integration.
- Secrets are environment-only; placeholder/missing production values fail validation. Tracked tree/bundle/history scanners report patterns without printing values.

## Decision questions

1. Are session/token construction, cookie attributes, CSRF assumptions, logout/revocation, brute-force controls, and secret separation adequate?
2. Is every administrative and peer read/mutation protected against horizontal/vertical authorization bypass?
3. Are encryption, key rotation/recovery, log redaction, injection defenses, content limits, relay boundaries, and deletion/tombstoning sound?
4. Can rate limits, idempotency, retention, and readiness checks withstand multiple workers and partial dependency failures?
5. Are dependency, container, network, database, backup, email, and monitoring controls safe in the target production topology?
6. What penetration tests and remediation SLA are required before release or Peer enablement?

## Known limitations

- Local automated tests are not a penetration test or production configuration review.
- PostgreSQL, Redis, email, backup, concurrency, restoration, key-recovery, and alerting have not been exercised in staging/production.
- Credential rotation and Git-history rewriting have not occurred.
- Cornell identity integration is intentionally hard-gated as not implemented.

## Required evidence

- Threat model, endpoint inventory, current dependency/SBOM and secret-scan reports, authorization/injection/rate-limit/outage tests, configuration validation, staging penetration evidence, production topology, key custody/rotation evidence, backup restore, and incident exercise.

## Decision and signature

Decision: [ ] Approve  [ ] Approve with conditions  [ ] Changes required  [ ] Reject  
Approved scope/version: ______________________________  
Risk exceptions and owners: ______________________________________________________________  
Evidence references: ____________________________________________________________________  
Reviewer name and qualifications: ______________________  Organization: ____________________  
Signature: ___________________________________________  Date: _____________________________
