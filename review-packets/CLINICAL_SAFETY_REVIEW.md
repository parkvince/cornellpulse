# Licensed mental-health and clinical-safety review packet

Packet version: **2026-08-10.2**
Review scope: **commit `72ef3c4ad7788ad6d89b640b097eec90c1364215`, the explicitly listed uncommitted Peer-navigation, test, audit-document, and evidence-validation diff, resource audit 2026-08-09.2, and final evidence bundle**
Approval status: **PENDING EXTERNAL REVIEW — NOT APPROVED**  
Responsible reviewer: **Independent licensed mental-health professional**  
Cornell-specific co-reviewer: **Cornell Health-authorized clinical representative**  
Assigned reviewer name / license / jurisdiction: ______________________________

## Exact behavior under review

- A four-step, non-diagnostic check-in processes mood (1–10), sleep range, workload, selected stressors, and optional free text in browser memory. Free text is neither drafted to storage nor transmitted.
- Local rules route crisis language away from ordinary recommendations. They include explicit negation/boundary handling and show 911, 988, Cornell Health, and Cornell Public Safety as distinct options.
- Ordinary results show two or three qualified resource options and explanations using “may fit” language. The app states that it is not a diagnosis or validated clinical assessment.
- Emergency help is available from major screens. CornellPulse does not dispatch responders, promise monitoring, or automatically contact authorities.
- Resource wording and actions are the 15 records in `frontend/src/resources/registry.ts`, verified on 2026-08-09 from the official sources in `RESOURCE_AUDIT_2026-08-09.md`.

## Decision questions

1. Are crisis triggers, negation handling, ambiguous-input behavior, and mood boundaries acceptably conservative without implying validated triage?
2. Could any result delay 911/988 or incorrectly substitute Cornell Health/Public Safety for emergency response?
3. Are “what happens next,” eligibility, cost, and limitation statements clinically and operationally safe?
4. Are 911, 988, Cornell Health, Cornell Public Safety, EARS, CAPS, and Let’s Talk distinguished accurately?
5. Is the non-diagnosis/non-validation disclaimer prominent enough at the decision points?
6. What false-negative/false-positive monitoring and change-control thresholds are required?

## Known limitations

- Rules are not clinically validated and have not undergone prospective outcome testing.
- Free text is processed only by simple local rules; language, idiom, sarcasm, misspelling, context, and accessibility limitations remain.
- No current evidence demonstrates clinical effectiveness, reduced harm, or Cornell Health endorsement.
- 988/911/provider availability and outcomes are outside CornellPulse control.
- No clinician has signed this version.

## Required evidence

- Current crisis/recommendation source and unit tests, including negation, ambiguous, empty, mood-boundary, crisis, offline, malformed-resource, and no-result cases.
- Screenshots or recordings of ordinary and crisis paths at representative sizes.
- Current official source evidence for all crisis and Cornell Health statements.
- Reviewer-authored hazard analysis with required changes, residual risks, monitoring plan, and re-review triggers.

## Decision and signature

Decision: [ ] Approve  [ ] Approve with conditions  [ ] Changes required  [ ] Reject  
Approved scope/version: ______________________________  
Conditions / required changes: ____________________________________________________________  
Evidence references: ____________________________________________________________________  
Approval expiry / mandatory re-review date: _______________________________________________
Re-review triggers accepted (clinical/resource/crisis-copy/algorithm/incident changes): ____
Reviewer name and credentials: ________________________  Organization: _____________________  
Signature: ___________________________________________  Date: _____________________________
