# Cornell affiliation and identity-provider review packet

Packet version: **2026-08-09.1**  
Approval status: **PENDING CORNELL AUTHORIZATION — NOT APPROVED OR AFFILIATED**  
Responsible reviewers: **Cornell-authorized brand/legal owner and Cornell Identity Management service owner**  
Assigned reviewer names / units: ______________________________

## Exact behavior under review

- The product name, Cornell-specific resource descriptions, Cornell phone numbers/URLs, Ithaca campus context, and any Cornell-identifying visual/text cues.
- CornellPulse explicitly does not claim to be Cornell University, Cornell Health, Cornell Police, or an emergency service.
- Public Peer, supporter-signup, and public-admin UI are off. Peer backend readiness hard-codes identity integration as not implemented; an `@cornell.edu` address or client assertion is insufficient.
- Proposed future identity assurance requires an authorized Cornell OIDC/SAML integration, server-side issuer/audience/signature/nonce/state validation, immutable subject identifiers, affiliation/role mapping, lifecycle/deprovisioning, and least-privilege claims.

## Decision questions

1. May this product use the CornellPulse name, Cornell references, marks, domains, and stated relationship? What disclaimer/branding changes are required?
2. Is Cornell willing to sponsor/authorize the application and its resource/safety governance?
3. Which identity platform, client registration, claims, assurance level, role mappings, data-use terms, and support owner are approved?
4. May students/supporters/requesters/moderators/admins use each feature, and how are status changes/revocation handled?
5. What security, privacy, accessibility, incident, support, records, and vendor requirements must be met?

## Known limitations

- No Cornell affiliation, endorsement, sponsorship, trademark permission, IdP registration, or authorization has occurred.
- The repository contains no functioning Cornell identity-provider integration.
- Resource links are public official sources, but accuracy verification does not imply Cornell approval.

## Required evidence

- Current UI/screenshots/copy, domain/branding proposal, data-flow and claims matrix, threat/privacy reviews, redirect/logout URIs, test-tenant evidence, ownership/support plan, and executed Cornell agreements/approvals.

## Decision and signature

Brand/affiliation decision: [ ] Approve  [ ] Conditional  [ ] Changes required  [ ] Reject  
Identity-provider decision: [ ] Approve  [ ] Conditional  [ ] Changes required  [ ] Reject  
Approved name/scope/client ID reference: __________________________________________________  
Conditions / required changes: ____________________________________________________________  
Evidence references: ____________________________________________________________________  
Reviewer names and authority: _____________________________________________________________  
Signatures: __________________________________________  Date: _____________________________
