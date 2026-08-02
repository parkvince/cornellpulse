from __future__ import annotations

import re
from typing import Final, Literal


ConnectionState = Literal[
    "pending",
    "failed",
    "declined",
    "expired",
    "accepted",
    "unavailable",
    "canceled",
    "blocked",
]

CONNECTION_STATES: Final[tuple[ConnectionState, ...]] = (
    "pending",
    "failed",
    "declined",
    "expired",
    "accepted",
    "unavailable",
    "canceled",
    "blocked",
)

CONNECTION_TRANSITIONS: Final[dict[ConnectionState, frozenset[ConnectionState]]] = {
    "pending": frozenset({"accepted", "declined", "expired", "unavailable", "canceled", "blocked", "failed"}),
    "accepted": frozenset({"unavailable", "canceled", "blocked"}),
    "failed": frozenset(),
    "declined": frozenset(),
    "expired": frozenset(),
    "unavailable": frozenset(),
    "canceled": frozenset(),
    "blocked": frozenset(),
}

PUBLIC_MEETING_LOCATIONS: Final = (
    {
        "id": "olin_library_common_area",
        "name": "Olin Library public common area",
        "rule": "Meet only while the building is open and remain in a visible public common area.",
    },
    {
        "id": "mann_library_common_area",
        "name": "Mann Library public common area",
        "rule": "Meet only while the building is open and remain in a visible public common area.",
    },
    {
        "id": "willard_straight_common_area",
        "name": "Willard Straight Hall public common area",
        "rule": "Meet only while the building is open and remain in a visible public common area.",
    },
    {
        "id": "duffield_atrium",
        "name": "Duffield Hall atrium",
        "rule": "Meet only during normal building access hours in the populated atrium.",
    },
)

PUBLIC_MEETING_LOCATION_IDS: Final = frozenset(item["id"] for item in PUBLIC_MEETING_LOCATIONS)

SAFE_MEETING_WINDOWS: Final = (
    {"id": "weekday_daytime", "name": "Weekday daytime", "rule": "Choose a time during the venue's posted open hours."},
    {"id": "weekday_early_evening", "name": "Weekday early evening", "rule": "Finish while the venue is open and normally populated."},
    {"id": "weekend_daytime", "name": "Weekend daytime", "rule": "Choose a time during the venue's posted open hours."},
)

SAFE_MEETING_WINDOW_IDS: Final = frozenset(item["id"] for item in SAFE_MEETING_WINDOWS)

PUBLIC_MEETING_SAFETY_NOTE: Final = (
    "Meet only in a visible, populated public area during posted open hours. "
    "Residences, private vehicles, isolated places, and late-night meetings are not offered."
)

_EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE = re.compile(r"(?:\+?\d[\s().-]*){8,}")
_URL = re.compile(r"(?:https?://|www\.)\S+", re.IGNORECASE)
_HANDLE = re.compile(r"(?<!\w)@[A-Za-z0-9_]{2,32}\b")


def transition_allowed(current: str, target: str) -> bool:
    return current in CONNECTION_TRANSITIONS and target in CONNECTION_TRANSITIONS[current]  # type: ignore[index]


def contains_contact_details(value: str) -> bool:
    return any(pattern.search(value) for pattern in (_EMAIL, _PHONE, _URL, _HANDLE))


def public_meeting_location(location_id: str) -> dict[str, str] | None:
    return next((dict(item) for item in PUBLIC_MEETING_LOCATIONS if item["id"] == location_id), None)


def safe_meeting_window(window_id: str) -> dict[str, str] | None:
    return next((dict(item) for item in SAFE_MEETING_WINDOWS if item["id"] == window_id), None)
