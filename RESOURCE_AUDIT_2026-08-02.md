# CornellPulse resource audit — 2026-08-02

This audit covers every record in `frontend/src/resources/registry.ts`. Only direct Cornell, government, hospital, or service-provider pages were used. Search-result snippets were not treated as evidence. The active registry contains 15 records, all marked `verified` with a verification date of 2026-08-02 and an official source URL.

## Retained records

| ID | Authoritative source | Audit outcome |
| --- | --- | --- |
| `emergency_911` | [Cornell Health emergency and after-hours care](https://health.cornell.edu/get-care/emergencies-after-hours-care) | Retained; distinguishes 911 emergency dispatch from consultation and follow-up costs. |
| `cornell_public_safety` | [Cornell Public Safety resources](https://publicsafety.cornell.edu/resources) | Retained with 607-255-1111 and 24/7 dispatch language. |
| `988_lifeline` | [988 Suicide & Crisis Lifeline](https://988lifeline.org) | Retained with separate call/text actions and no claim of emergency dispatch. |
| `cornell_health_247` | [Cornell Health 24/7 phone consultation](https://health.cornell.edu/get-care/247-phone-consultation) | Retained with U.S.-location eligibility and consultation scope. |
| `crisis_text_line` | [Crisis Text Line](https://www.crisistextline.org) | Retained with HOME-to-741741 instructions and carrier-cost caveat. |
| `cayuga_medical_er` | [Cayuga Medical Center](https://cayugahealth.org/contact/cayuga-medical-center/) | Retained with hospital-owned address and Emergency Department phone; 24/7 availability is also confirmed on Cayuga Health's emergency-care page. |
| `caps_access` | [CAPS access appointments](https://health.cornell.edu/services/mental-health-care/access) and [Cornell Health costs](https://health.cornell.edu/about/health-requirements-costs/cost-service) | Corrected: access appointment is a free 20-minute first step, usually by Zoom, and is not counseling. Continued individual counseling is generally $10 per visit for registered students; groups are free. |
| `lets_talk` | [Let’s Talk](https://health.cornell.edu/services/mental-health-care/lets-talk) | Corrected: free, first-come consultation for Cornell students; not counseling or urgent care. Term-specific times are not copied into the registry. |
| `ears` | [Cornell EARS Peer Mentoring FAQ](https://mentalhealth.cornell.edu/node/141) | Corrected from the legacy phone/counseling model to current peer mentoring. Removed the stale phone and old `ears.cornell.edu` URL. |
| `learning_strategies` | [Learning Strategies Center](https://lsc.cornell.edu) | Retained with program-specific eligibility, cost, location, and schedule caveats. |
| `basic_needs` | [Cornell Food Pantry](https://scl.cornell.edu/residential-life/dining/about-dining/food-security/cornell-food-pantry) | Replaced an unverified generic Basic Needs listing with a specific official service. Added current eligibility, enrollment, location, and regular hours. |
| `identity_support` | [Cornell LGBT Resource Center](https://scl.cornell.edu/LGBTRC) | Replaced a generic legacy directory with the current center record: 626 Thurston Avenue, 607-254-4987, and published staff/building hours. |
| `financial_aid_emergency_fund` | [Cornell emergency funds](https://finaid.cornell.edu/emergency-funds) | Fixed the broken singular URL; added current enrollment criteria, typical $500 academic-year limit, office, phone, and hours. |
| `cornell_botanic_gardens` | [Cornell Botanic Gardens visitor FAQ](https://cornellbotanicgardens.org/visit/visitor-faq/) | Corrected admission, parking, location, phone, and dawn-to-dusk access; seasonal Welcome Center hours remain on the source page. |
| `helen_newman_fitness` | [Helen Newman Hall](https://scl.cornell.edu/recreation/recreation/facility/helen-newman-hall) and [Cornell Fitness Centers](https://scl.cornell.edu/recreation/recreation/cornell-fitness-centers) | Fixed the legacy URL and removed any implication that fitness access is universally free. Building and fitness-center schedules are explicitly distinguished. |

## Removed or not reintroduced

- Headspace is not in the active registry. It was not reintroduced because Cornell affiliation, price, and availability should not be inferred from older promotional material.
- The Skorton Center is not presented as an individual support service. Its current role is institutional health promotion, and the registry contains no stale Skorton contact record.
- Unsupported copy such as “every option,” guaranteed wait times, and “no questions asked” is absent from the registry. The Food Pantry record instead states the exact published enrollment and documentation process.

## Human confirmation still required

These items are intentionally described as dynamic in the UI and should be confirmed by a Cornell operator before time-sensitive promotion:

- EARS: confirm the next academic term’s dates and each drop-in location with the EARS/Skorton program owner. The retained record links to Cornell’s current schedule gateway and does not promise real-time availability.
- Let’s Talk: confirm the active term schedule and whether each session is in person or on Zoom. The registry does not hardcode a term schedule.
- Helen Newman Hall: confirm current building closures, fitness-center hours, and the price/access rule for each user affiliation. Cornell publishes these separately and changes them by term.
- Cornell Food Pantry: confirm break/summer hours and any temporary inventory or visit-limit changes before a campaign. The registry publishes regular hours and tells users to check the official page.
- Cornell Botanic Gardens: confirm seasonal Welcome Center hours and temporary trail/road closures before an event. The registry only treats dawn-to-dusk garden/natural-area access as the standing schedule.

Human confirmation should update the source page first where possible, then the registry’s fields and `verificationDate` in the same change. See `RESOURCE_UPDATE_WORKFLOW.md` for the required validation steps.
