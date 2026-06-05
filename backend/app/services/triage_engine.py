from app.models.schemas import CheckInRequest, TriageResult, ResourceResult

RESOURCES = {
    "caps_individual": ResourceResult(
        resource_id="caps_individual",
        name="CAPS Individual Therapy",
        tagline="One-on-one counseling with a licensed therapist",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/mental-health-care",
        hours="Mon-Fri 8:30am-4:30pm, 24/7 phone line available",
        how_to_access="Call to schedule an Access Appointment within 48 hours"
    ),
    "caps_group": ResourceResult(
        resource_id="caps_group",
        name="CAPS Group Therapy",
        tagline="Therapist-led group sessions for shared concerns",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/mental-health-care",
        hours="Mon-Fri, varies by group",
        how_to_access="Call CAPS to get matched to a group"
    ),
    "lets_talk": ResourceResult(
        resource_id="lets_talk",
        name="Let's Talk Drop-In",
        tagline="Informal same-day consultations, no appointment needed",
        phone=None,
        url="https://health.cornell.edu/services/mental-health-care/lets-talk",
        hours="Mon-Fri, check website for daily locations",
        how_to_access="Just show up during listed hours"
    ),
    "ears": ResourceResult(
        resource_id="ears",
        name="EARS Peer Counseling",
        tagline="Talk with a trained fellow Cornell student",
        phone="607-255-4050",
        url="https://ears.cornell.edu",
        hours="Sun-Thu 9pm-1am during the semester",
        how_to_access="Call or walk in to 305 Willard Straight Hall"
    ),
    "cornell_health_phone": ResourceResult(
        resource_id="cornell_health_phone",
        name="Cornell Health 24/7 Phone",
        tagline="Talk to a health professional any time, day or night",
        phone="607-255-5155",
        url="https://health.cornell.edu",
        hours="24 hours a day, 7 days a week",
        how_to_access="Call and press 2 for after-hours mental health support"
    ),
    "protocall": ResourceResult(
        resource_id="protocall",
        name="ProtoCall After-Hours",
        tagline="Professional mental health support on evenings and weekends",
        phone="607-255-5155",
        url=None,
        hours="After 4:30pm weekdays and all weekend",
        how_to_access="Call Cornell Health and you will be connected automatically"
    ),
    "crisis_line": ResourceResult(
        resource_id="crisis_line",
        name="Crisis Text Line and 988",
        tagline="Immediate support if you are in crisis right now",
        phone="988",
        url="https://988lifeline.org",
        hours="24 hours a day, 7 days a week",
        how_to_access="Call or text 988, or text HOME to 741741"
    ),
    "self_help": ResourceResult(
        resource_id="self_help",
        name="Self-Help Resources",
        tagline="Guided tools, tips, and wellness content at your own pace",
        phone=None,
        url="https://mentalhealth.cornell.edu",
        hours="Always available online",
        how_to_access="Visit the website and explore the self-help library"
    ),
}

SLEEP_SCORES = {
    "under_4": 1.0,
    "4_to_6": 0.6,
    "6_to_8": 0.2,
    "over_8": 0.0,
}

WORKLOAD_SCORES = {
    "light": 0.0,
    "moderate": 0.3,
    "heavy": 0.6,
    "unbearable": 1.0,
}

def run_triage(request: CheckInRequest) -> TriageResult:
    mood = request.mood_score
    sleep = request.sleep_category.value
    workload = request.workload_category.value

    crisis_flag = False

    if mood <= 2:
        crisis_flag = True
        return TriageResult(
            primary=RESOURCES["crisis_line"],
            secondary=[
                RESOURCES["cornell_health_phone"],
                RESOURCES["caps_individual"],
            ],
            crisis_flag=True,
            distress_level="high"
        )

    sleep_score = SLEEP_SCORES.get(sleep, 0.5)
    workload_score = WORKLOAD_SCORES.get(workload, 0.5)
    mood_normalized = (10 - mood) / 9

    combined = (mood_normalized * 0.5) + (sleep_score * 0.25) + (workload_score * 0.25)

    if combined >= 0.75:
        distress_level = "high"
    elif combined >= 0.45:
        distress_level = "moderate"
    else:
        distress_level = "low"

    if distress_level == "high":
        primary = RESOURCES["caps_individual"]
        secondary = [RESOURCES["lets_talk"], RESOURCES["cornell_health_phone"]]
    elif distress_level == "moderate":
        if workload == "unbearable":
            primary = RESOURCES["lets_talk"]
            secondary = [RESOURCES["ears"], RESOURCES["caps_group"]]
        else:
            primary = RESOURCES["ears"]
            secondary = [RESOURCES["lets_talk"], RESOURCES["caps_group"]]
    else:
        primary = RESOURCES["self_help"]
        secondary = [RESOURCES["ears"], RESOURCES["lets_talk"]]

    return TriageResult(
        primary=primary,
        secondary=secondary,
        crisis_flag=False,
        distress_level=distress_level
    )