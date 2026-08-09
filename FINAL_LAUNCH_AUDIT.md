# CornellPulse final launch audit — 2026-08-09

Audit version: **2026-08-09.1**

## Final verdict

**FAIL for public release.** The locally executable technical suite passes, the Android debug project assembles, the resource registry has a current first-party-source review, and safety-sensitive public flags remain locked off. Public release is still blocked by staging/production execution, real-device and assistive-technology evidence, an authorized Cornell identity integration, independent resource second review, named human operators, and the six external review approvals. Peer Connect, supporter signup, and public Admin remain disabled.

Status meanings:

- **PASS** — current evidence proves this locally scoped criterion.
- **FAIL** — a required technical or operational exercise has not been completed in its target environment.
- **EXTERNAL SIGN-OFF NEEDED** — implementation and an approval packet exist, but an authorized independent reviewer has not approved it.

## Complete 41-item launch checklist

| # | Criterion | Status | Evidence and boundary |
| --- | --- | --- | --- |
| 1 | Central safety feature flags | PASS | `frontend/src/config/featureFlags.ts` and `backend/app/config.py`; frontend release-approval constants and backend readiness blockers prevent environment flags alone from enabling safety-sensitive features. Frontend release-gate and backend feature-flag tests pass. |
| 2 | Disabled routes and 404 | PASS | `/peer`, `/peer/signup`, `/peer/reference`, and `/admin` show the intentional safety-review screen; unknown routes show the custom 404. Verified at six viewports in Playwright and the local walkthrough. |
| 3 | Server-side administrator authentication | PASS | Short-lived signed HttpOnly sessions, bcrypt hash from environment, secure production cookie validation, rate-limited login, logout, and no browser-bundle credential comparison. Covered by backend auth tests and tracked/bundle secret scan. |
| 4 | Administrative authorization boundaries | PASS | Every administrative read/mutation requires administrator authorization; unauthenticated approve, resolve, report, read, and delete attempts are covered in the 102-test backend suite. |
| 5 | Administrator frontend API states | PASS | Secure credentialed requests and explicit loading, empty, unauthorized/expired, rate-limited, maintenance, network, unexpected-error, and destructive-confirmation behavior are covered by frontend tests. The public route remains disabled. |
| 6 | CORS and production secret validation | PASS | CORS is an origin control, not authentication. Production startup rejects unsafe/missing admin, aggregate, encryption, origin, and contact configuration; backend tests pass. A deployment exercise is separately row 39. |
| 7 | Data inventory | PASS | `PRIVACY_DATA_INVENTORY.md` covers device storage, PostgreSQL, rate-limit state, Redis status, logs, email, processors, analytics, supporter/reference/peer data, aggregate counts, and backups. |
| 8 | Privacy policy and consent materials | PASS | `PRIVACY_POLICY.md`, `CONSENT_MATERIALS.md`, and the in-app Privacy & Data screen match current fields, thresholds, retention, deletion limits, logs, backups, processor gaps, and contact fail-closed behavior. Frontend privacy regression tests pass. |
| 9 | Privacy and legal approval | EXTERNAL SIGN-OFF NEEDED | `review-packets/PRIVACY_LEGAL_REVIEW.md` is complete but unsigned. No legal-compliance claim is made. |
| 10 | On-device free-text boundary | PASS | Free text remains only in current page memory, is absent from session/local storage and requests, and is cleared after local recommendation. Frontend and backend privacy tests prohibit request, database, Redis, analytics, and log sinks. |
| 11 | Aggregate privacy minimization | PASS | Opt-in request contains only `checkin_completed`, consent `true`, and a one-time idempotency header. Server stores a UTC-day campus completion count and short-lived keyed receipt, never mood/sleep/workload/college/hour cells. Migration irreversibly drops legacy sensitive aggregate tables. |
| 12 | Automated retention and deletion | PASS | Hourly retention covers 30-day aggregates/clicks, 2-day receipts, 90-day inactive push rows, 365-day calendar cache, expired rate limits, and configured peer records. Backend retention tests pass; target-environment scheduling is row 39. |
| 13 | Monitored privacy-contact fail-closed gate | PASS | Production validation and peer readiness require a non-placeholder monitored privacy contact; the in-app page exposes an alert when absent. Identifiable features remain disabled locally. |
| 14 | Crisis separation and emergency actions | PASS | Crisis routing is separate from ordinary recommendations and exposes distinct 911, 988, Cornell Health, and Cornell Public Safety language/actions. Crisis, negation, boundary, empty, and ambiguous unit tests plus Playwright crisis flow pass. |
| 15 | Qualified non-clinical recommendation wording | PASS | “Best match,” diagnosis, validation, and certainty claims are absent; 2–3 options explain why they may fit. Automated clinical-language regressions pass. |
| 16 | Licensed clinical/Cornell Health approval | EXTERNAL SIGN-OFF NEEDED | `review-packets/CLINICAL_SAFETY_REVIEW.md` is complete but unsigned. Automated phrase tests are not clinical validation. |
| 17 | Typed resource source of truth | PASS | All screens and recommendation logic consume 15 validated records from `frontend/src/resources/registry.ts`; malformed, duplicate, orphaned, and unsupported claims fail tests/build. |
| 18 | Current authoritative resource verification | PASS | `RESOURCE_AUDIT_2026-08-09.md` records all 15 first-pass checks against official Cornell, government, hospital, park, or provider pages, corrections, source, verifier role, date, next review, owner, second reviewer, and correction channel. Dynamic facts still require scheduled re-review. |
| 19 | Resource maintenance schedule and alerts | PASS | `RESOURCE_UPDATE_WORKFLOW.md`, daily CI, schema validation, 14-day crisis and 90-day routine deadlines, seven-day alerts, hard expiry failures, and 17-link automation are present. SAMHSA returns HTTP 403 to automation and therefore has documented manual-source verification rather than a false automated pass. |
| 20 | Independent second resource review | EXTERNAL SIGN-OFF NEEDED | Every registry record names a second-review role, but all 15 statuses remain `pending`; no independent reviewer has signed them. |
| 21 | Decision-oriented directory | PASS | Cost, urgency, eligibility, modality, scope, appointment, category, search, timezone-aware Open now, 24/7 handling, loading/no-results/offline/stale states, and count consistency pass unit/E2E tests. |
| 22 | Resource detail and direct-action integrity | PASS | Details expose cost, eligibility, next step, source, verification/deadline, and supported actions. Directions use only structured unambiguous street addresses; CAPS has none and Botanic Gardens has one. E2E regression passes across six projects. |
| 23 | Check-in semantics and input behavior | PASS | Intentional mood choice, fieldsets/legends/labels, native radio/checkbox state, validation, focus, Back preservation, real app-container scrolling, and pointer/keyboard behavior pass unit and six-project E2E tests without force clicking. |
| 24 | Actionable result plan | PASS | Qualified options, supported call/text/book/directions/site/save actions, local next-step selection, unavailable/malformed/no-result/offline behavior, and local-only feedback are tested. |
| 25 | Private history and follow-up | PASS | Local trends, save/complete/dismiss/replace, reminders, follow-up, 20-plan limit, configurable retention, export, and deletion pass frontend and E2E tests; raw answers are not uploaded. |
| 26 | Consent-gated measurement | PASS | Aggregate, resource-click, and local product measurement choices default off. Tests constrain fields and prevent free text, raw answers, names, emails, and phone numbers. |
| 27 | Peer backend privacy and authorization | PASS | Immutable IDs, public/private serialization, encrypted PII/notes/relay, role authorization, audit/status history, deletion/withdrawal, validation, injection defenses, and persistent rate limits pass locally. Public Peer remains off. |
| 28 | Cornell affiliation and identity authorization | EXTERNAL SIGN-OFF NEEDED | `review-packets/CORNELL_AFFILIATION_IDENTITY_REVIEW.md` is unsigned and no Cornell-authorized IdP is integrated. Manual development evidence is deliberately production-ineligible. |
| 29 | Supporter onboarding workflow | PASS | Draft-to-terminal state machine, identity/reference/training/review gates, consent-based reference invitation, no reference phone requirement, privacy serializers, and transition/permission tests pass locally. |
| 30 | Peer training and safety review | EXTERNAL SIGN-OFF NEEDED | `review-packets/PEER_TRAINING_SAFETY_REVIEW.md` is unsigned. No supporter is represented as trained or vetted without verifiable completion. |
| 31 | Double-consent connection and relay | PASS | Request/cancel/accept/decline/expire/block/report lifecycle, contact-free encrypted relay, safe public place/window registry, truthfully confirmed server states, and authorization tests pass locally. |
| 32 | Moderation, reporting, and notification truthfulness | PASS | Severity, assignment, encrypted notes/resolution, suspension/reinstatement, blocking, audit history, retention, duplicate/spoof/injection tests, and delivery-failure states pass locally. |
| 33 | Responsible human peer operations | EXTERNAL SIGN-OFF NEEDED | `PEER_SAFETY_OPERATIONS.md` specifies required named roles, triage, escalation boundaries, shutdown, and re-enable procedure, but no operators or approving authority are assigned. |
| 34 | Peer readiness gate | PASS | Frontend code gates and backend readiness checks require approvals, identity, encryption, auth, mail, operations, and monitored contact; environment flags alone fail tests. All Peer/supporter/public-admin flags remain off. |
| 35 | API and outage reliability | PASS | Response status/shape validation, timeouts, safe GET retries, no mutation retry, duplicate suppression, explicit error states, notification failure truthfulness, and partial-outage tests pass. |
| 36 | Abuse, spam, and rate-limit controls | PASS | Aggregate idempotency/receipt, database-backed rate limits, strict lengths/types/list sizes/email/phone/content validation, duplicate and spoof tests, and injection defenses pass the backend suite. |
| 37 | Health/readiness and privacy-safe monitoring code | PASS | Readiness evaluates PostgreSQL, optional Redis, email/config, worker requirements, and safe configuration. Error monitoring excludes request bodies/sensitive fields. Target-environment evidence is not claimed. |
| 38 | Independent security approval | EXTERNAL SIGN-OFF NEEDED | `review-packets/SECURITY_REVIEW.md` is complete but unsigned. Local auth, dependency, authorization, injection, abuse, secret, and outage tests do not substitute for independent review. |
| 39 | Staging and production operational proof | FAIL | `STAGING_VERIFICATION_RUNBOOK.md` and `PRODUCTION_VERIFICATION_RUNBOOK.md` exist, but migrations, production-like PostgreSQL/Redis/email, backup/restore, key recovery/rotation, retention worker, concurrency, abuse, readiness, monitoring, and incident exercises were not executed. |
| 40 | Automated accessibility, PWA, and native configuration | PASS | Serious/critical axe violations are zero in 42 E2E runs; focus/zoom/reduced-motion/safe-area tests pass. Manifest, service worker, icons, offline emergency shell, Android/iOS Capacitor sync pass; Android `assembleDebug` succeeds on Windows. |
| 41 | Accessibility approval and real-device/iOS evidence | EXTERNAL SIGN-OFF NEEDED | `review-packets/ACCESSIBILITY_REVIEW.md` and `REAL_DEVICE_ACCESSIBILITY_TEST_PLAN.md` are ready but unsigned/unexecuted. No physical iPhone/Android, VoiceOver/TalkBack/NVDA, Safari PWA, mobile-keyboard, or signed Xcode iOS test is claimed. |

## Exact local check evidence

- `npm.cmd run lint`: **PASS** — 0 errors, 0 warnings.
- `npm.cmd test`: **PASS** — 68 passed, 0 failed, 0 skipped.
- `npm.cmd run build`: **PASS** — 15 resources, 0 review warnings, 56 modules; production JS 488.63 kB (131.89 kB gzip).
- `npm.cmd run test:e2e`: **PASS** — 42 passed, 0 failed/skipped across 320px, small iPhone, modern iPhone, Android, tablet, and desktop; serious/critical axe violations: 0.
- `npm.cmd audit --omit=dev`: **PASS** — 0 vulnerabilities; React Router DOM is locked to 7.18.2.
- `backend\venv\Scripts\python.exe -m pytest -q`: **PASS** — 102 passed, 0 failed/skipped; one upstream Starlette TestClient/httpx deprecation warning.
- `backend\venv\Scripts\python.exe -m pip check`: **PASS** — no broken requirements.
- `backend\venv\Scripts\python.exe -m pip_audit -r backend\requirements.txt`: **PASS** — no known vulnerabilities.
- `npm.cmd run check:resource-links`: **PASS with one manual-verification warning** — 17 unique links checked; SAMHSA blocks automation with HTTP 403 and was verified manually against its official 988 FAQ.
- Resource schema/deadline validation with warnings-as-errors: **PASS** — performed by the production build and daily workflow; 15 records, 0 warnings.
- `node --require ./scripts/node-userinfo-shim.cjs ./node_modules/@capacitor/cli/bin/capacitor sync`: **PASS** — Android, iOS, and web projects synchronized.
- Android `:app:assembleDebug`: **PASS** — 71 tasks executed; debug APK assembled in 3m 36s. This is not physical-device validation or a signed release build.
- Tracked-file/current-production-bundle secret scan: **PASS** — no known credential formats; values were not printed.
- Git-history secret scan: **PASS** — no known credential-format matches; values were not printed. This is not provider-side credential inventory or rotation evidence.
- `git diff --check`: **PASS** after remediation; Windows line-ending notices are informational only.
- Local route walkthrough: **PASS for stated local scope** — 42 route/viewport combinations had expected headings, Immediate help, and no horizontal overflow; see `LOCAL_ROUTE_WALKTHROUGH_2026-08-09.md`.

## Authoritative resource-source evidence

The complete field-by-field ledger is `RESOURCE_AUDIT_2026-08-09.md`. Key safety-sensitive sources include Cornell Health emergency/after-hours guidance, Cornell Public Safety reporting guidance, SAMHSA’s 988 FAQ, Cornell Health 24/7 consultation and CAPS access pages, and the provider’s Crisis Text Line page. Dynamic availability must be rechecked on each record’s deadline.

## External approvals still missing

1. Licensed mental-health/clinical safety review.
2. Privacy and legal review.
3. Independent security review.
4. Accessibility review.
5. Cornell affiliation and identity-provider authorization.
6. Peer-support training and safety-operations review, including named responsible operators.
7. Independent second review of all 15 resource records.

## Real-device and production work still missing

- Physical iPhone Safari/PWA and Android device tests; mobile software-keyboard and install/update/offline cold-start evidence.
- Signed Capacitor iOS build on macOS/Xcode.
- VoiceOver, TalkBack, NVDA, keyboard-only, 200%/400% zoom, and reduced-motion sessions using the evidence template.
- Backed-up staging migration, rollback rehearsal, restored-data deletion-tombstone check, and production change approval.
- Real PostgreSQL/optional Redis/email readiness, delivery confirmation, retention-worker scheduling, concurrency/abuse, log-deletion, monitoring, alerting, backup/restore, key recovery/rotation, and incident/shutdown exercises.
- Provider-side secret inventory and rotation evidence. Git history was scanned, not rewritten; no rewrite is authorized.

## Shortest ordered release path

1. Assign named accountable operators, a monitored privacy contact, deployment processors, and independent resource reviewers; complete the 15 second reviews.
2. Complete and sign the six review packets, including Cornell IdP/affiliation authorization and licensed clinical review; remediate any conditions.
3. Execute the staging runbook on backed-up real infrastructure, including migrations, restore, retention, email, readiness, concurrency, abuse, monitoring, and incident exercises.
4. Complete the real-device/assistive-technology matrix and a signed macOS/Xcode iOS build; remediate and rerun affected checks.
5. Complete the production runbook, provider secret inventory/rotation evidence, and controlled launch approval. Keep Peer, supporter signup, and public Admin off until their separate readiness gates are genuinely satisfied.
