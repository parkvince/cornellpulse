# CornellPulse security remediation

Peer Connect, supporter signup, and the public admin UI are disabled by default while the following launch blockers remain.

- Replace the process-local login limiter with a shared store before running multiple API instances.
- Review and minimize collection, exposure, retention, deletion, and email handling of student, supporter, reference, and wellness data.
- Define supporter vetting, training, supervision, incident response, reporting, escalation, and emergency boundaries with qualified Cornell stakeholders.
- Add persistent, shared rate limiting, abuse controls, input/output sanitization, audit logging, and security-focused API tests.
- Rotate any credential ever committed or shared, remove it from repository history where appropriate, and use deployment secret storage.
- Validate privacy language, crisis guidance, resource accuracy, accessibility, monitoring, backups, and recovery in a production-like environment.
- Require a documented safety/privacy sign-off before enabling any feature flag in production.
- Complete every licensed-professional and Cornell Health review item in `SAFETY_REVIEW.md`; automated phrase tests are not clinical validation.

Default-off flags are centralized in `frontend/src/config/featureFlags.ts` and `backend/app/config.py`. Environment overrides must not be treated as launch approval.

Administrator access uses a short-lived signed token in an HttpOnly, SameSite=Strict cookie. Production startup rejects missing or unsafe session secrets, password hashes, or non-HTTPS frontend origins. CORS controls which browser origins may send credentialed requests; it is not an authentication mechanism.
