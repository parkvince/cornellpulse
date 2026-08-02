from __future__ import annotations

from typing import Final, Literal


SupporterApplicationState = Literal[
    "draft",
    "submitted",
    "identity_pending",
    "reference_pending",
    "training_pending",
    "review",
    "approved",
    "suspended",
    "withdrawn",
    "rejected",
]

SUPPORTER_APPLICATION_STATES: Final[tuple[SupporterApplicationState, ...]] = (
    "draft",
    "submitted",
    "identity_pending",
    "reference_pending",
    "training_pending",
    "review",
    "approved",
    "suspended",
    "withdrawn",
    "rejected",
)

SUPPORTER_POLICY_VERSION: Final = "2026-08-02"
SUPPORTER_TRAINING_VERSION: Final = "2026-08-02"

SUPPORTER_TRAINING_MODULES: Final[tuple[str, ...]] = (
    "role-scope-and-boundaries",
    "conduct-and-privacy",
    "crisis-escalation",
    "public-meeting-safety",
    "reporting-and-incident-response",
    "withdrawal-and-data-handling",
)

SUPPORTER_POLICY: Final = {
    "version": SUPPORTER_POLICY_VERSION,
    "role_scope": [
        "Offer informal peer presence, listening, and help locating official resources.",
        "Do not provide therapy, diagnosis, clinical assessment, medical advice, emergency response, transportation, housing, money, or legal advice.",
        "Do not promise availability, confidentiality beyond the stated safety limits, or a particular outcome.",
    ],
    "conduct_standards": [
        "Respect boundaries, identity, autonomy, privacy, and a request to end contact.",
        "Do not discriminate, harass, intimidate, exploit, retaliate, pursue romantic or sexual contact through the role, or use the role for commercial or political solicitation.",
        "Do not save, copy, photograph, publish, or share requester contact or conversation content except through the reporting and emergency boundaries below.",
    ],
    "crisis_escalation_boundaries": [
        "CornellPulse supporters are not crisis responders and must not attempt a clinical risk assessment.",
        "For an immediate threat to life or safety, contact 911; on the Ithaca campus, Cornell Public Safety can also be reached at 607-255-1111.",
        "For suicide or emotional crisis support in the United States, call or text 988. Cornell Health 24/7 consultation is 607-255-5155.",
        "Report urgent safety concerns through the protected CornellPulse reporting route after contacting emergency services when immediate action is needed.",
    ],
    "public_meeting_rules": [
        "Meet only in mutually agreed, public, well-lit locations where other people or staff are normally present.",
        "Do not use residence rooms, private homes, vehicles, isolated outdoor areas, or transportation supplied by either participant as meeting locations.",
        "Do not use alcohol or other non-prescribed substances during a meeting. Either participant may leave or cancel at any time.",
    ],
    "reporting_policy": [
        "Report harassment, discrimination, boundary violations, threats, suspected exploitation, repeated unwanted contact, or unsafe meeting conduct promptly.",
        "Reports are reviewed by authorized moderators or administrators; reporting does not guarantee a particular outcome or replace emergency services or Cornell processes.",
        "Do not investigate, confront, or collect extra evidence from another person on CornellPulse's behalf.",
    ],
    "withdrawal_controls": [
        "A supporter may withdraw their application or participation without giving a reason.",
        "Withdrawal removes the public profile, invalidates supporter credentials, and erases protected contact/reference payloads subject to documented backup, audit, and legal limitations.",
        "Suspension, rejection, or withdrawal must never be presented publicly as a safety finding about a person.",
    ],
    "training_requirements": list(SUPPORTER_TRAINING_MODULES),
}

SUPPORTER_TRANSITIONS: Final[dict[SupporterApplicationState, frozenset[SupporterApplicationState]]] = {
    "draft": frozenset({"submitted", "withdrawn"}),
    "submitted": frozenset({"identity_pending", "withdrawn", "rejected"}),
    "identity_pending": frozenset({"reference_pending", "withdrawn", "rejected"}),
    "reference_pending": frozenset({"training_pending", "withdrawn", "rejected"}),
    "training_pending": frozenset({"review", "withdrawn", "rejected"}),
    "review": frozenset({"approved", "withdrawn", "rejected"}),
    "approved": frozenset({"suspended", "withdrawn"}),
    "suspended": frozenset({"review", "withdrawn", "rejected"}),
    "withdrawn": frozenset(),
    "rejected": frozenset(),
}


def transition_allowed(current: str, target: str) -> bool:
    return current in SUPPORTER_TRANSITIONS and target in SUPPORTER_TRANSITIONS[current]  # type: ignore[index]

