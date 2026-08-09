# CornellPulse consent materials

Version: **2026-08-09.1**  
Status: **IMPLEMENTED COPY; PENDING PRIVACY/LEGAL APPROVAL**

The UI controls are independent, unchecked by default, and may not be bundled with onboarding, check-in completion, resource access, or crisis access.

## Campus completion count

Label: **Contribute a campus completion count**

Short notice: “Off by default. When on, finishing a check-in sends only a completion event, an affirmative consent flag, and a random one-time anti-duplicate ID. Mood, sleep, workload, college, triggers, recommendations, and written context are not sent.”

Retention/withdrawal notice: “The server keeps a campus-wide UTC-day count for 30 days and a keyed anti-duplicate receipt for 2 days. Turning this off stops future contributions. A past contribution cannot be linked back to you or deleted individually because no person/device link is stored.”

## Resource-click analytics

Label: **Share resource-click analytics**

Short notice: “Off by default. When on, choosing a phone-call or official-website action sends only the resource ID and action type. Rows are deleted after 30 days. Network and hosting logs may separately contain IP, time, path, status, and user-agent metadata for up to 14 days.”

Withdrawal notice: “Turning this off stops future events. Existing rows have no CornellPulse account ID and expire automatically rather than supporting individual lookup.”

## Local product measurement

Label: **Keep privacy-minimized measurement on this device**

Short notice: “Off by default. When on, this device keeps integer counters for completed check-ins, action types, reported successful contact, and repeat use. No raw answers, free text, resource IDs, timestamps, names, emails, or phone numbers are stored, and the counters are not uploaded.”

Deletion notice: “Turning this off stops future counting. Clear CornellPulse device data to delete existing counters.”

## Consent interaction and evidence requirements

- Use a native checkbox with an accessible label and no preselection.
- Save the choice only after the user changes it; access to essential/crisis features never depends on consent.
- Display a status message after change and make withdrawal available from the same Privacy & Data screen.
- Record no server-side consent ledger for local-only measurement. For aggregate/click requests, the request carries `consent_granted: true`; the server rejects missing/false consent.
- Do not repurpose data or upload local counters without a new notice, new explicit opt-in, data-flow/security review, and privacy/legal approval.
- Existing local product-measurement consent does not authorize transmission of those counters.

Reviewer decision/signature: _______________________________________  Date: __________________
