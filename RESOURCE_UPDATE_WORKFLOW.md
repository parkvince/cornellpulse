# CornellPulse resource maintenance workflow

Version: **2026-08-09.2**
Registry: `frontend/src/resources/registry.ts` (the only source of truth)
Correction channel: monitored address configured in `VITE_PRIVACY_CONTACT_EMAIL`

## Accountable roles and schedule

| Record class | Accountable owner | Independent second reviewer | Cadence | Alert/expiry behavior |
| --- | --- | --- | --- | --- |
| Emergency and urgent | CornellPulse Safety Resource Steward | CornellPulse Clinical Safety Reviewer | Every 14 days and immediately after a provider alert | Warning 7 days before deadline; scheduled workflow fails on warning; build fails after expiry |
| Routine | CornellPulse Resource Registry Steward | CornellPulse Resource QA Reviewer | Every 90 days and immediately after a provider alert | Warning 7 days before deadline; scheduled workflow fails on warning; build fails after expiry |

These role names identify accountability but do not prove staffing. Before production, the operator must record the human role holder, backup, contact, acknowledgement, and coverage in the protected operations system. `secondReviewStatus` stays `pending` until an independent person reviews the same source/fields and records an approval date.

The GitHub workflow `.github/workflows/resource-maintenance.yml` runs daily at 13:00 UTC and on demand. It validates schema/deadlines and checks every unique official/direct-action URL. Repository notifications must be configured to reach both owner roles; workflow existence alone is not evidence that alerts are monitored.

## Verification/change procedure

1. Open the provider’s current official Cornell, government, hospital, or service-provider page. Do not use search snippets, directories, remembered details, or social posts as evidence.
2. Compare official name, purpose/description, eligibility, cost, phone/SMS protocol, URL, physical/virtual location, structured hours/timezone/overrides, appointment requirement, access instructions, and “what happens next.” For a material claim absent from the source, qualify or remove it.
3. Keep the stable `id`. Set `physicalAddress` only for one unambiguous navigable street address; do not generate directions for Zoom, phone/web, multiple sites, campuses, or vague locations.
4. Record the current source, actual `verificationDate`, verifier role, owner, second reviewer, second-review status/date, cadence, computed `reviewDeadline`, and correction channel. A source check is not a clinical/Cornell/legal approval.
5. For announced seasonal schedules/closures, add a dated override that expires automatically. If the same source also verifies the post-period fallback, keep the normal deadline and test the boundary; otherwise set the review deadline no later than the end/change date.
6. If a material field cannot be verified, set `needs_review`, clear the verification date, remove the record from recommendations, and use 911/988 source redundancies for an emergency-action error. Retired services retain their stable ID with `retired`; IDs are never reused.
7. The independent second reviewer compares the diff and official source, checks every action on a safe device, records approved/changes-requested plus date/evidence, and never self-approves.
8. Run `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run check:resource-links`; then review the count, diff, expiry output, and deep links. Link status does not prove content accuracy.
9. Update `RESOURCE_AUDIT_YYYY-MM-DD.md` with source evidence, corrections, reviewer status, and next deadline. Archive superseded audits only when the new audit is complete and traceable.
10. Record the independent decision and signature in `RESOURCE_SECOND_REVIEW_SHEET_YYYY-MM-DD.md`, then update registry status/date. The sheet and registry must agree; pending or unsigned rows cannot be represented as approved.

## Correction intake and incident response

A report should include stable resource ID, observed problem, time, and official source. The monitored operator acknowledges crisis/action errors immediately during coverage hours, removes an unsafe action from recommendations until independently verified, and completes same-business-day triage. Routine errors are triaged within five business days. Do not promise these targets publicly until staffing/coverage is approved.

For a phone/SMS/emergency-routing error: disable the affected action/record, confirm 911/988 access is intact, preserve non-sensitive evidence, notify the safety owner and clinical reviewer, correct and test, obtain independent review, and record the incident/re-review trigger. Never put private correspondence, personal data, or secrets in the public registry/audit.
