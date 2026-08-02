from __future__ import annotations

from typing import Final


REPORT_SEVERITIES: Final = ("low", "moderate", "high", "critical")
REPORT_STATES: Final = ("submitted", "triaged", "investigating", "resolved", "dismissed", "duplicate")
REPORT_TRANSITIONS: Final = {
    "submitted": frozenset({"triaged", "duplicate"}),
    "triaged": frozenset({"investigating", "resolved", "dismissed", "duplicate"}),
    "investigating": frozenset({"resolved", "dismissed", "duplicate"}),
    "resolved": frozenset(),
    "dismissed": frozenset(),
    "duplicate": frozenset(),
}
RESOLUTION_CODES: Final = (
    "no_action",
    "documented_guidance",
    "participant_blocked",
    "account_suspended",
    "account_reinstated",
    "duplicate_report",
    "unable_to_investigate",
    "operator_emergency_escalation",
)

EMERGENCY_BOUNDARIES: Final = {
    "independence": "CornellPulse is an independent project. It is not Cornell University, Cornell Health, Cornell Police, or an emergency service.",
    "monitoring": "Reports are not continuously monitored and do not replace contacting emergency services.",
    "dispatch": "Moderators cannot dispatch responders or promise a response time.",
    "immediate_danger": "For immediate danger in the United States, call 911. For suicide or crisis support, call or text 988.",
    "operator_action": "A trained operator may contact emergency services when available information indicates an imminent threat, but the system does not make that decision automatically.",
}


def report_transition_allowed(current: str, target: str) -> bool:
    return current in REPORT_TRANSITIONS and target in REPORT_TRANSITIONS[current]

