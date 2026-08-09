# CornellPulse local route walkthrough — 2026-08-09

## Scope and boundary

This is local browser evidence against the production Vite build served at `http://127.0.0.1:4173`. It is not a real-device test, assistive-technology test, staging exercise, production exercise, or external approval.

The in-app browser was set to 320×568, 375×667, 393×852, 412×915, 768×1024, and 1280×900. A 36-case matrix at small iPhone, Android, tablet, and desktop opened Home, Check-in, Resources, a 988 detail, History & Privacy, Privacy & Data, disabled Peer, disabled Admin, and the custom 404. Every case kept Immediate help visible and had no document-level horizontal overflow. Onboarding and the ordinary flow were separately walked at 320×568; the crisis path was walked at 393×852. Browser console errors: zero.

## Manual interaction evidence

| Flow | Local observation |
| --- | --- |
| Onboarding | Walked all five panels at 320×568. Final panel disclosed non-clinical status, no Cornell affiliation, optional transmissions, and emergency actions before completion. |
| Check-in validation | Continue with no mood produced the visible validation message. Mood 6 was selected with Space, remained selected after Back, and native radio semantics were present. |
| Ordinary result | Completed the structured flow. Three qualified options appeared without a best-match claim. A selected plan saved locally and appeared in History & Privacy. |
| Crisis result | Mood 2 plus an explicit first-person crisis phrase produced a separate immediate-support result with 911, 988 call/SMS, and Cornell Health 24/7 consultation; no ordinary best-match wording appeared. |
| Resource search and empty state | Search returned 988 for `988`; an impossible query produced the explicit no-results state. Directory showed 15 records and structured decision filters. |
| Resource details and actions | CAPS showed call/web actions and no Directions because its location is usually Zoom or request-based. Cornell Botanic Gardens showed Directions to the structured street address. |
| History, export, deletion, reminders | Saved-plan controls, local trend, reminders, follow-up, retention selector, export, and delete/clear controls were present. One locally created plan was deleted and the visible plan count decreased. The complete export/download lifecycle is exercised in Playwright. |
| Privacy consent | All three optional choices rendered unchecked. Aggregate contribution could be turned on and back off; the withdrawal status explained that future collection stops. |
| Emergency dialog | Opened from a major screen; the close control received focus and Escape closed the dialog. Playwright additionally verifies focus restoration. |
| Disabled and missing routes | `/peer`, `/peer/signup`, `/peer/reference`, and `/admin` showed “Coming back after safety review.” An unknown route showed “Page not found.” |

## Automated operational-state evidence

Network interception and browser-context offline mode are more deterministic than the in-app browser for these states. The 48-test Playwright matrix therefore supplies the evidence for offline reload, aggregate endpoint failure, retained local results, axe checks, reflow/reduced motion, and install metadata. The 104-test backend suite supplies unauthorized, rate-limited, maintenance, outage, notification-failure, spoofing, injection, duplicate, retention, and readiness evidence.

## Not performed

- No iPhone, iPad, or physical Android hardware was used.
- No Safari/WebKit PWA install, mobile software keyboard, VoiceOver, TalkBack, or NVDA session was performed.
- No signed iOS build was produced; that requires macOS and Xcode.
- No staging or production dependency, migration, backup/restore, mail-delivery, monitoring, rotation, or incident exercise was performed.
