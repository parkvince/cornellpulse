# CornellPulse supporter onboarding

Peer Connect and supporter signup remain disabled by default. This document defines the implemented onboarding boundary; it is not authorization to recruit, approve, or display supporters.

## Application states

`draft` → `submitted` → `identity pending` → `reference pending` → `training pending` → `review` → `approved`

- An applicant may withdraw from any active state. Withdrawal removes the public profile, invalidates the credential, erases protected contact and reference payloads, and retains only documented audit/status evidence and backup limitations.
- An administrator may reject a submitted application or later application. A moderator or administrator may suspend an approved supporter. Only an administrator may advance an application, reinstate it through review, approve it, or reject it.
- Approval is rejected by the server unless the current policy was accepted, Cornell identity evidence exists, a reference explicitly consented and responded, and every current training requirement has verifiable evidence.
- Public records expose only the existing allowlisted profile fields. Identity, contact, invitation, reference, training, review, suspension, rejection, and audit information is never returned by the public supporter endpoint.

## Cornell identity integration still required

The repository does not have Cornell's OIDC/SAML client registration, issuer metadata, signing-key validation, audience, callback, account-status claims, or operator authorization to integrate Cornell identity. It therefore cannot truthfully verify a Cornell identity in production.

The code permits an administrator to record hashed manual evidence only outside production for workflow testing. That evidence is explicitly marked `manual_nonproduction_review` and is not production-eligible. Production configuration refuses to enable supporter signup until a real Cornell identity integration is implemented, and production approval requires a `cornell_oidc` verification record that no current route can create.

Required integration work:

1. Obtain Cornell authorization and OIDC/SAML client configuration.
2. Validate issuer, audience, signature, nonce, state, time claims, and the Cornell account-status/affiliation claim server-side.
3. Store only an HMAC-derived stable subject reference; do not store access tokens or raw identity assertions.
4. Define account revocation and affiliation-change handling, test it in staging, and complete privacy/security review.

## Role and conduct boundary

The versioned policy returned by the protected onboarding API covers role scope, conduct and privacy, crisis escalation, public-meeting rules, reporting, withdrawal, and data handling. Supporters provide informal peer presence and resource navigation only. They are not therapists, clinicians, emergency responders, transportation providers, or investigators.

Immediate threats belong with 911; Cornell Public Safety is 607-255-1111 on the Ithaca campus. Call or text 988 for suicide or emotional crisis support in the United States. Cornell Health 24/7 consultation is 607-255-5155. Supporters must not perform clinical risk assessment or promise confidentiality beyond the documented safety boundaries.

Meetings must be mutually agreed, public, well-lit, and ordinarily staffed or populated. Residence rooms, private homes, vehicles, isolated areas, transportation supplied by participants, and alcohol or non-prescribed substance use are outside the role.

## Consent-based reference invitation

- An applicant provides only an email address needed to deliver a single-use invitation. Reference phone numbers, names, and statements are not collected from the applicant.
- The email is encrypted, the capability token is stored only as a keyed hash, and the invitation expires after 14 days by default.
- The reference may decline without supplying content. Relationship and statement fields are accepted only after explicit consent and are encrypted.
- Applicants can see invitation status but not the private response. Only administrators can review the encrypted response; moderators and public endpoints cannot.
- Withdrawal, administrator deletion, or retention expiry revokes the invitation and erases its email/response payload.
- Legacy reference columns are preserved only so the additive migration cannot destroy existing data. They do not satisfy the new consent requirement and must be reviewed, quarantined, and erased under an approved legacy-data plan before launch.

## Training and truthful labels

The current requirements are role scope and boundaries, conduct and privacy, crisis escalation, public-meeting safety, reporting and incident response, and withdrawal/data handling. The server accepts completion only when every versioned module is present exactly once and an evidence reference is supplied; only an HMAC of that evidence reference is stored.

CornellPulse must not describe a supporter as “trained,” “vetted,” certified, clinically qualified, or Cornell-endorsed based only on an application state. The public API exposes no such label. Even `approved` means only that the configured CornellPulse workflow gates were recorded; it is not clinical certification or Cornell endorsement.
