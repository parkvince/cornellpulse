# Peer connection privacy model

Peer Connect remains disabled publicly. This implementation is a technical baseline, not authorization to launch.

## Consent and identity

- A requester must authenticate, have a current verified-identity record, select a server-approved public location/window, and explicitly consent before the server creates a `pending` request.
- The supporter must separately authenticate, remain approved and identity-verified, and explicitly accept. Only then does the request become `accepted` and the in-app relay open.
- A Cornell email suffix is contact validation, not identity proof. Development administrators can record hashed manual evidence for testing; production accepts only a future authorized Cornell OIDC result. Production startup keeps Peer Connect blocked until that integration exists.
- Requesters can cancel. Supporters can accept, decline, expire, or block. Either participant can report a safety concern. Staff can mark a request unavailable. The server owns every transition and response.

## Data boundary

- Connection records contain UUID relationships, status/consent/expiry timestamps, and an encrypted payload limited to approved location ID, approved meeting-window ID, and an optional contact-free note.
- Requester and supporter email addresses and phone numbers are never copied into a connection record or returned by connection APIs, including after acceptance.
- After both opt in, participants can use the encrypted in-app relay. Relay validation rejects recognizable email addresses, phone numbers, URLs, and social handles. Email notifications contain only fixed copy and a server-generated record UUID; they are notifications, not a direct-contact exchange.
- Relay messages, reports, audit history, and blocks are separate records with configured retention. Audit metadata excludes message bodies, report reasons, email addresses, and phone numbers.

## Safety and truthful states

The only selectable meeting areas are a small server-controlled set of visible public common areas. Windows are daytime or early evening and require current posted building access. Residences, private vehicles, isolated places, and late-night meetings are explicitly excluded.

The client displays `pending`, `declined`, `expired`, `accepted`, `unavailable`, `canceled`, or `blocked` only when returned by the server. A network error or malformed response is `failed` in the client and is never presented as a successful submission.

## Before launch

Apply `backend/migrations/20260803_connection_relay.sql` after the two 20260802 migrations on a backed-up staging database. Legacy active-looking requests are marked unavailable because they lack auditable requester consent. Complete Cornell OIDC, email/relay abuse review, encryption-key recovery and rotation testing, retention scheduling, production rate-limit concurrency testing, accessibility review, and Cornell safety/privacy/legal approval before enabling either peer flag.
