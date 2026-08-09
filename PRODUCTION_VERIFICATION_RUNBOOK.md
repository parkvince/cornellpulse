# CornellPulse production verification and release runbook

Version: **2026-08-09.1**  
Status: **BLOCKED UNTIL EXTERNAL APPROVALS AND STAGING EVIDENCE EXIST**  
Release owner: __________________  Change ticket: __________________  Date: __________

## Go/no-go gate

Do not proceed unless the exact artifact passed staging; all six review packets contain approval decisions for the release scope; the 41-row audit has no release-blocking FAIL; privacy/safety contacts are monitored; processor/log/backup schedules are approved; resource crisis second reviews are current; and real-device/assistive-technology evidence is attached. Peer/supporter/public-admin flags remain off unless the separate Peer readiness gate and Cornell authorization are genuinely complete.

## Release sequence

1. Announce change window and freeze migrations/config. Record artifact digest, database/schema version, approvers, rollback owner, status page, and incident channel.
2. Validate production secret references and HTTPS origin without exposing values. Confirm least-privilege database/email/monitoring roles and secret-manager audit access.
3. Take and verify an encrypted pre-release backup. Confirm retention, region, restore account, immutable/offline protection, and deletion-tombstone replay procedure.
4. Apply reviewed migrations with timing/lock monitoring. Run schema invariants and minimal privacy-preserving smoke queries; if any invariant fails, stop and execute the approved rollback.
5. Deploy one canary, verify `/health` and `/ready` through ingress, then expand gradually. Monitor error rate, latency, database pool/locks, retention job heartbeat, login/rate-limit anomalies, email rejection/timeouts, and client offline/update behavior.
6. Run non-destructive smoke tests: onboarding, check-in local result, explicit aggregate opt-in test account/device, resource actions, local history/export/delete, privacy withdrawal, disabled Peer/Admin/404, admin login/session/logout/unauthorized, and emergency actions. Do not use real crisis narratives or personal data.
7. Verify log redaction and 14-day deletion configuration; verify backup/provider/email schedules and alert routing. Record evidence IDs, not secret values.

## Production exercises required after deployment

- PostgreSQL failover/unavailability, email timeout/rejection, optional Redis outage, readiness removal/recovery, concurrency/idempotency, abuse/rate limits, retention-job failure/missed schedule, backup restore, key rotation/recovery, privacy deletion/tombstone restore, monitoring alert acknowledgement, and incident tabletop.
- Run only in approved windows with user-impact limits and rollback authority. A written plan is not evidence of execution.

## Rollback and incident boundary

Disable optional writes first, keep local emergency/resources available, turn all Peer/supporter/admin public flags off, preserve required safety/security evidence, revoke affected secrets, and restore only from the verified backup. Never claim email delivery, data deletion, recovery, or incident containment until confirmed by the owning system.

## Completion record

Deployment evidence: ____________________________________________________________________  
Migration/backup/restore evidence: _________________________________________________________  
Monitoring and incident exercise evidence: _________________________________________________  
Open risks/owners/deadlines: _______________________________________________________________  
Release decision: [ ] Go  [ ] No-go  Approver/signature: __________________  Date: __________
