# CornellPulse staging verification runbook

Version: **2026-08-09.1**  
Status: **READY TO EXECUTE; NO STAGING EXECUTION CLAIMED**  
Operator: __________________  Environment/change ticket: __________________  Date: __________

## Preconditions and fail-closed configuration

1. Use an isolated staging project/database/domain with HTTPS and no production PII. Record commit SHA/artifact digest and dependency lock hashes.
2. Keep `FEATURE_PEER_CONNECT=false`, `FEATURE_SUPPORTER_SIGNUP=false`, `VITE_FEATURE_PEER_CONNECT=false`, `VITE_FEATURE_SUPPORTER_SIGNUP=false`, and `VITE_FEATURE_PUBLIC_ADMIN=false`.
3. Generate separate random administrator, aggregate-signing, peer-auth, and PII-encryption secrets in the approved secret manager. Configure a monitored staging privacy/safety contact. Never paste secret values into evidence.
4. Inventory selected hosting, PostgreSQL, email, monitoring, backup, and (only if required) Redis processors, regions, access roles, log retention, and subprocessors.

## Backup and migration

1. Take a named encrypted backup/snapshot; record ID, time, encryption, retention, and restore owner.
2. Restore that snapshot into a disposable database and run a row-count/schema integrity check before migration.
3. Apply migrations in order, including `20260808_private_aggregate_retention.sql`, under a change transaction where supported. Record migration tool output and schema version.
4. Confirm legacy `college_hour_aggregates` and `campus_hour_aggregates` are absent; `campus_daily_aggregates` contains only date/count/timestamps; no mood/sleep/workload/college/hour/free-text columns remain.
5. Run the backend suite against staging-compatible PostgreSQL. Roll back using the tested backup if invariants fail; do not hand-edit production data.

## Dependency and readiness exercise

For each dependency, record start/end time, probe response/status (no secrets), alert receipt, user-visible state, and recovery:

- PostgreSQL healthy, unreachable, slow, read-only/failing commit, recovered.
- Redis only if `REDIS_REQUIRED=true`: healthy, unreachable, recovered. If unused, record “not required by deployed configuration.”
- Email: provider accepts, provider rejects, timeout, and bounce/webhook where supported. UI/API must never say delivered from provider acceptance alone.
- Required configuration missing/placeholder: process/readiness must fail closed.
- `/health` liveness and `/ready` dependency/config checks through the staging ingress.

## Retention, concurrency, abuse, and monitoring

1. Seed expired/current aggregate, receipt, click, push, calendar, peer, audit, and rate-limit rows. Run the retention sweep and prove only eligible fields/rows are erased. Verify alerting on a forced sweep failure and on missed schedules.
2. Send concurrent duplicate aggregate and mutation requests from multiple application workers. Prove one accepted logical mutation/count, database-backed rate limits, stable idempotency, and truthful 409/429/5xx behavior.
3. Exercise login abuse, spoofed roles/identities, oversized/list/email/phone/content injection, relay contact leakage, duplicate reports, notification failures, authorization bypass, and database/email partial failure.
4. Verify privacy-safe monitoring includes route/status/correlation ID/error type but excludes bodies, free text, raw answers, email/phone, tokens, cookies, authorization headers, and encrypted plaintext.

## Key rotation and recovery

1. Rotate administrator/aggregate secrets with a planned session invalidation window. Verify old signatures fail and new requests work.
2. Exercise PII encryption-key rotation only with the approved re-encryption procedure and reversible backup. Prove old-key recovery and new-key reads without exposing values.
3. Document lost-key outcome: encrypted PII may be unrecoverable; do not claim recovery without a successful restore/decrypt exercise.

## Exit record

All evidence links: ______________________________________________________________________  
Open defects/owners: _____________________________________________________________________  
Rollback tested: [ ]  Retention alert tested: [ ]  Backup restore tested: [ ]  
Staging approver/signature: _______________________________________  Date: _________________
