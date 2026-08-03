# CornellPulse final launch audit — 2026-08-03

## Verdict

**FAIL for public release.** The local remediation is materially stronger and the frontend gates pass, but this checkout cannot be called releasable until the updated backend suite, full browser/axe/device matrix, current dependency scanners, production dependency probes, and the external clinical/privacy/Cornell approvals below are completed. Peer Connect remains publicly disabled.

Status meanings: **PASS** means the checked implementation and available evidence passed locally. **FAIL** means required release evidence is missing or a gate could not run. **EXTERNAL SIGNOFF NEEDED** means code cannot substitute for the named qualified reviewer or production integration.

## Full launch checklist

| # | Area | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Safe baseline and feature flags | PASS | Central flags remain default-off in `frontend/src/config/featureFlags.ts` and `backend/app/config.py`; disabled routes use the safety-review screen and a custom 404 is routed in `frontend/src/App.tsx`. |
| 2 | Server-side administrator security | PASS (implementation) / FAIL (final rerun) | HttpOnly signed short sessions, bcrypt hash configuration, login throttling, logout, authorization dependencies, production validation, and protected endpoint tests exist in `backend/app/auth.py`, `backend/app/routers/admin_auth.py`, and `backend/tests/test_admin_auth.py`. The changed Python suite could not be rerun in this environment. |
| 3 | Administrator frontend states | PASS | `frontend/src/api/admin.ts` validates status and shape, includes cookies, and distinguishes expired, unauthorized, rate-limited, maintenance, network, and unexpected errors. `frontend/src/pages/AdminPage.tsx` exposes loading/empty/error states and confirmation for destructive actions. |
| 4 | Privacy inventory and consent | PASS (implementation) / EXTERNAL SIGNOFF NEEDED | `PRIVACY_DATA_INVENTORY.md`, `MEASUREMENT_PLAN.md`, and the in-app privacy page cover local/server stores, retention, deletion limits, third parties, and opt-in choices. Privacy/legal review is still required; no compliance claim is made. |
| 5 | On-device check-in privacy | PASS | Free text is excluded from drafts, requests, persistence, analytics, logs, Redis, and database schemas; only four aggregate fields can be contributed after opt-in. Privacy regression tests passed. |
| 6 | Crisis and recommendation safety | PASS (implementation) / EXTERNAL SIGNOFF NEEDED | Local routing separates crisis from ordinary recommendations, uses qualified wording, handles tested negation/boundaries, and exposes 911/988/Cornell Health/Public Safety actions. `SAFETY_REVIEW.md` correctly requires licensed mental-health and Cornell Health review. |
| 7 | Typed resource registry | PASS | One 15-record registry validates at build time; schema, duplicate, orphan, consumer, deep-link, and verification tests passed. |
| 8 | Official-source resource accuracy | PASS for standing claims / EXTERNAL SIGNOFF NEEDED for dynamic claims | Refreshed against direct official pages on 2026-08-03; see `RESOURCE_AUDIT_2026-08-02.md`. CAPS downstream prices and an unconfirmed temporary LSC office were removed. Term schedules, closures, and clinical wording still require operator review. |
| 9 | Resource decision directory | PASS | Timezone-aware availability, 24/7 handling, decision filters, search, details, direct SMS actions, deep links, and operational states are covered by passing resource tests. |
| 10 | Accessible check-in flow | PASS (static/component) / FAIL (device execution) | Intentional mood selection, native fieldsets/labels, draft preservation, focus/scroll behavior, and validation tests passed. The six-viewport Playwright matrix was discovered but could not execute here. |
| 11 | Actionable results | PASS | Results provide 2–3 qualified options, supported direct actions, local save/next-step choice, cost/eligibility/hours/verification, offline handling, and crisis/no-result/malformed-resource tests. |
| 12 | History & Privacy follow-up | PASS | Local trends, plans, reminders, follow-up, export, deletion, retention, and consent-gated minimized counters passed unit tests; no account or raw-answer upload is implied. |
| 13 | Peer privacy/security backend | EXTERNAL SIGNOFF NEEDED | Immutable IDs, private/public field separation, encrypted PII, role authorization, audit/retention/deletion, validation, and persistent controls exist. Migrations, identity integration, production topology, and privacy/security review are not externally verified. Public flag remains off. |
| 14 | Supporter onboarding | EXTERNAL SIGNOFF NEEDED | State machine, policy/training boundaries, consent-based reference invitations, withdrawal, and permission tests exist. Cornell identity, training ownership, conduct, and approval remain external launch gates. |
| 15 | Double-opt-in connection flow | EXTERNAL SIGNOFF NEEDED | Contact-free request/accept lifecycle, relay, cancel/decline/expire/block/report states, safe locations, and lifecycle tests exist. Production identity/relay/email behavior and concurrency require staging evidence. |
| 16 | Moderation and safety operations | EXTERNAL SIGNOFF NEEDED | Triage, assignment, encrypted notes, resolution, suspension/reinstatement, blocking, audit history, retention, truthful notification states, and the readiness gate are documented in `PEER_SAFETY_OPERATIONS.md`. Cornell-independent operations staffing and shutdown approval are outstanding. |
| 17 | Fetch/mutation/dependency reliability | PASS (implementation) / FAIL (integration rerun) | All frontend network calls use typed clients with timeout, safe-GET-only retry, shape/status checks, mutation deduplication, and explicit errors. Aggregate receipts plus persistent limits prevent ordinary duplicate inflation. PostgreSQL/Redis/config readiness probes and truthful email acceptance states have outage tests, but the updated backend integration suite and real dependencies were not run. |
| 18 | Accessibility, devices, and PWA | PASS (static) / FAIL (live assistive-tech/device evidence) | Zoom restrictions removed; landmarks, names, focus, modal trap/Escape/restore, live announcements, reduced motion, safe areas, keyboard handling, AA-safe primary text colors, touch targets, manifest/icons/service worker, hardened Android config, and an iOS project are present. Static tests pass. Browser/axe execution was blocked; iOS/VoiceOver was not tested on Windows. |
| 19 | Engineering/release standards | PASS for frontend / FAIL overall | Frontend lint, TypeScript, 65 tests, production build, 15-record schema validation, secret scan, and `git diff --check` pass. Bundle is 484.34 kB (130.58 kB gzip), down from the 500.34 kB baseline. Orphan components/assets/dependencies and the abandoned Expo scaffold were removed. Current npm/Python vulnerability scans and the updated backend suite remain unavailable. |
| 20 | Fresh live final audit | FAIL | Production preview returned HTTP 200 for onboarding/root, home, check-in, resources, a resource deep link, history, privacy, disabled Peer/Admin routes, 404 fallback, and manifest. The in-app browser was explicitly blocked from localhost and Playwright browser execution could not start, so visual interaction, axe, keyboard, screen-reader, and responsive claims are not certified. |

## Check evidence

- PASS: `npm.cmd run lint` — zero errors and zero warnings.
- PASS: `npx.cmd tsc -b`.
- PASS: `npm.cmd test` — 65 tests after the final resource-date update (rerun required if this line and terminal evidence diverge).
- PASS: `npm.cmd run build` — Vite production build; 15 registry records validated; 56 modules; 484.34 kB JS / 130.58 kB gzip.
- PASS: Playwright discovery — 24 tests across 320px, small iPhone, modern iPhone, Android, tablet, and desktop projects.
- PASS: tracked-file secret scan.
- PASS: `git diff --check` (line-ending notices are not whitespace errors).
- BLOCKED: updated backend tests and `pip check` after the dependency change; the earlier pre-change baseline was 89 passing tests and no broken requirements, which is not final evidence.
- BLOCKED: Playwright/axe execution and manual in-app-browser inspection because localhost browser navigation was denied and the browser runner could not launch.
- BLOCKED: current online `npm audit` and Python vulnerability scanning in the restricted environment.

## Required external completion

1. Apply every pending migration to a backed-up staging database and rerun all backend authorization, abuse, privacy, readiness, and partial-failure tests against PostgreSQL and Redis.
2. Run the 24-test browser/axe matrix, manual keyboard inspection, NVDA/VoiceOver/TalkBack checks, and real-device viewport/keyboard tests. Build/sign/test iOS on macOS/Xcode.
3. Run current npm and Python advisory scanners, review transitive results, and complete a tested backend dependency refresh. `python-jose` is pinned to 3.5.0 because upstream 3.4.0 fixed CVE-2024-33663 and CVE-2024-33664.
4. Obtain licensed mental-health/Cornell Health review of crisis language, thresholds, false-positive handling, escalation, and resource descriptions.
5. Obtain privacy/legal review of inventories, consent, retention, deletion limitations, third-party processing, and operator contact details.
6. Integrate Cornell-authorized identity, verify the email sending domain and monitored safety mailbox, approve operations/training/shutdown ownership, and record the required Peer readiness approvals. Keep all Peer flags off until then.

