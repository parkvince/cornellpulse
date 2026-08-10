# CornellPulse external review packet index

Packet set version: **2026-08-10.2**
Prepared: **2026-08-10**
Product version: commit `72ef3c4ad7788ad6d89b640b097eec90c1364215` plus the explicitly listed uncommitted Peer-navigation, test, audit-document, and evidence-validation diff and final test evidence
Overall status: **PENDING EXTERNAL REVIEW**

These packets are approval forms, not approvals. A reviewer must enter their name, qualifications/authority, decision, date, evidence references, conditions, and signature. A repository document, disabled feature, or completed local test does not replace that decision.

| Packet | Responsible reviewer role | Current status |
| --- | --- | --- |
| [Clinical safety](CLINICAL_SAFETY_REVIEW.md) | Independent licensed mental-health professional; Cornell Health reviewer for Cornell-specific statements | Pending; reviewer not assigned |
| [Privacy and legal](PRIVACY_LEGAL_REVIEW.md) | Qualified privacy counsel/privacy officer with jurisdiction and processor knowledge | Pending; reviewer not assigned |
| [Security](SECURITY_REVIEW.md) | Independent application-security reviewer | Pending; reviewer not assigned |
| [Accessibility](ACCESSIBILITY_REVIEW.md) | Qualified accessibility specialist plus disabled-user testing coordinator | Pending; reviewer not assigned |
| [Cornell affiliation and identity](CORNELL_AFFILIATION_IDENTITY_REVIEW.md) | Cornell-authorized brand, legal, and identity-provider owners | Pending; reviewer not assigned |
| [Peer training and safety operations](PEER_TRAINING_SAFETY_REVIEW.md) | Qualified peer-support program, safeguarding, and operations leads | Pending; reviewer not assigned |

Approval identifiers must be stored in the deployment's protected configuration or approval system, not invented in this repository. Peer readiness requires current safety, privacy, security, and operations approval identifiers plus a implemented Cornell-authorized identity integration; the public flags remain off until those checks pass.

Every approval must identify its exact artifact/diff, accepted conditions, evidence references, decision date, expiry/review date, and re-review triggers. A code, resource, processor, incident, clinical-language, identity, retention, or deployment-topology change invalidates the affected decision unless the reviewer explicitly scopes it otherwise. Blank or expired fields mean pending, not approval.
