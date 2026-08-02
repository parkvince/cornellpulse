# CornellPulse privacy-minimized measurement plan

This plan describes the current on-device implementation. It does not authorize analytics transmission and is not a claim of anonymity or legal compliance.

## Consent and storage boundary

- Product measurement starts **off** and is separate from aggregate check-in contribution and server-side resource-click analytics.
- A user must explicitly enable **Keep privacy-minimized measurement on this device** in Privacy & Data before counters are written.
- Turning the choice off stops future counting. Clearing device data deletes the counters.
- Current counters stay in `localStorage` under `cornellpulse_local_measurement`; the current code does not upload them.

## Metrics

| Metric | Counted when | Stored detail |
| --- | --- | --- |
| Check-in completion | A locally generated results screen is reached | One integer counter |
| Resource actions | A call, text, booking, directions, website, or detail action is selected | One counter per action type; no resource identifier |
| Successful contact | A user answers **Yes** to “Did you contact this resource?” | One integer counter; the plan and resource are not included |
| Repeat use | A next-step plan is saved while another retained plan exists | One integer counter |

These are product signals, not clinical outcomes. “Successful contact” means only that the user reported making contact; it does not establish access, treatment, benefit, safety, or quality.

## Prohibited fields

Measurement must never contain free text, raw check-in answers, mood scores, triggers, sleep/workload choices, college, resource identifiers, plan IDs, timestamps, names, emails, phone numbers, account identifiers, or contact/fit responses beyond the successful-contact count.

## Review gate before any future upload

Do not transmit these counters without a new consent flow and documented review covering purpose, endpoint authorization, aggregation thresholds, retention and deletion, hosting logs and network metadata, vendor/processors, security testing, and qualified privacy/legal review. Existing on-device consent does not cover transmission.
