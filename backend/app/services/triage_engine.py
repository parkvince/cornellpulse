from app.models.schemas import CheckInRequest, TriageResult, ResourceResult
from typing import List

RESOURCES = {
    "caps_individual": ResourceResult(
        resource_id="caps_individual",
        name="CAPS Individual Therapy",
        tagline="One-on-one counseling with a licensed therapist. Best for persistent or serious concerns.",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/mental-health-care",
        hours="Mon-Fri 8:30am-4:30pm. 24/7 phone line available.",
        how_to_access="Call 607-255-5155 and ask for an Access Appointment. You can usually be seen within 1-2 days. Tell them briefly what you are dealing with so they can match you to the right counselor."
    ),
    "caps_group": ResourceResult(
        resource_id="caps_group",
        name="CAPS Group Therapy",
        tagline="Therapist-led groups for anxiety, grief, identity, relationships, and more.",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/mental-health-care",
        hours="Varies by group. Most meet weekly during the semester.",
        how_to_access="Call CAPS at 607-255-5155 to ask about current groups. They will match you to one that fits. Groups are confidential and free."
    ),
    "lets_talk": ResourceResult(
        resource_id="lets_talk",
        name="Let's Talk Drop-In",
        tagline="Free, informal 15-20 minute conversations with a CAPS counselor. No appointment needed.",
        phone=None,
        url="https://health.cornell.edu/services/mental-health-care/lets-talk",
        hours="Mon-Fri at various campus locations. Check the website for today's schedule.",
        how_to_access="Just show up during listed hours. No appointment, no paperwork, no commitment to ongoing therapy. Great if you want to talk to someone today without the formality of a full appointment."
    ),
    "ears": ResourceResult(
        resource_id="ears",
        name="EARS Peer Counseling",
        tagline="Talk to a trained Cornell student who genuinely gets what you are going through.",
        phone="607-255-4050",
        url="https://ears.cornell.edu",
        hours="Sun-Thu 9pm-1am during the semester.",
        how_to_access="Call 607-255-4050 or walk into 305 Willard Straight Hall during hours. EARS counselors are fellow students trained in active listening. Everything is confidential. There is no judgment."
    ),
    "cornell_health_phone": ResourceResult(
        resource_id="cornell_health_phone",
        name="Cornell Health 24/7 Phone Line",
        tagline="Talk to a real health professional right now, any time of day or night.",
        phone="607-255-5155",
        url="https://health.cornell.edu",
        hours="24 hours a day, 7 days a week including holidays.",
        how_to_access="Call 607-255-5155 and press 2 for after-hours mental health support. A counselor will pick up. This is not a crisis line, it is a real consultation with a trained professional."
    ),
    "protocall": ResourceResult(
        resource_id="protocall",
        name="ProtoCall After-Hours Counseling",
        tagline="Professional mental health support on evenings and weekends when CAPS is closed.",
        phone="607-255-5155",
        url=None,
        hours="Weekdays after 4:30pm, all day Saturday and Sunday.",
        how_to_access="Call Cornell Health at 607-255-5155. After hours you will be automatically connected to ProtoCall, a professional after-hours mental health service. Free for Cornell students."
    ),
    "crisis_line": ResourceResult(
        resource_id="crisis_line",
        name="988 Suicide and Crisis Lifeline",
        tagline="Immediate support if you are in crisis. Call or text 988 right now.",
        phone="988",
        url="https://988lifeline.org",
        hours="24 hours a day, 7 days a week.",
        how_to_access="Call or text 988. You will reach a trained crisis counselor within seconds. You can also text HOME to 741741 for the Crisis Text Line. Both are free, confidential, and available right now."
    ),
    "cornell_police_crisis": ResourceResult(
        resource_id="cornell_police_crisis",
        name="Cornell Crisis Response",
        tagline="On-campus emergency mental health response.",
        phone="607-255-1111",
        url=None,
        hours="24 hours a day, 7 days a week.",
        how_to_access="Call Cornell Police at 607-255-1111. Ask for the on-call mental health crisis manager. They can send someone to you on campus."
    ),
    "self_help": ResourceResult(
        resource_id="self_help",
        name="Cornell Self-Help Resources",
        tagline="Guided tools, wellness tips, and mental health content you can use right now.",
        phone=None,
        url="https://mentalhealth.cornell.edu",
        hours="Always available online.",
        how_to_access="Visit mentalhealth.cornell.edu for self-guided programs, relaxation tools, and wellness tips. Also check out the Headspace app which is free for all Cornell students through Student Health Benefits."
    ),
    "headspace": ResourceResult(
        resource_id="headspace",
        name="Headspace App",
        tagline="Free meditation and sleep app for all Cornell students.",
        phone=None,
        url="https://www.headspace.com/studentplan",
        hours="Always available.",
        how_to_access="Sign up at headspace.com/studentplan using your Cornell email. Free for enrolled students. Great for stress, sleep issues, and building a daily mindfulness habit."
    ),
    "diversity_inclusion": ResourceResult(
        resource_id="diversity_inclusion",
        name="Office of Diversity and Inclusion Counseling",
        tagline="Culturally sensitive counseling for students from underrepresented communities.",
        phone="607-255-4857",
        url="https://diversity.cornell.edu",
        hours="Mon-Fri 8am-5pm.",
        how_to_access="Call 607-255-4857 or visit 626 Thurston Ave. Offers counseling and support specifically attuned to the experiences of students of color, LGBTQ+ students, first-gen students, and international students."
    ),
    "lgbtq_center": ResourceResult(
        resource_id="lgbtq_center",
        name="Cornell LGBT Resource Center",
        tagline="Support, community, and resources for LGBTQ+ students.",
        phone="607-255-6482",
        url="https://lgbtq.cornell.edu",
        hours="Mon-Fri 9am-5pm.",
        how_to_access="Visit 626 Thurston Ave or call 607-255-6482. Offers individual support, community events, and referrals to LGBTQ-affirming counselors at CAPS."
    ),
    "international_students": ResourceResult(
        resource_id="international_students",
        name="International Student Support",
        tagline="Dedicated support for international students navigating life at Cornell.",
        phone="607-255-5243",
        url="https://isso.cornell.edu",
        hours="Mon-Fri 9am-5pm.",
        how_to_access="Contact the International Students and Scholars Office at 607-255-5243 or isso.cornell.edu. They offer counseling referrals, cultural adjustment support, and visa-related stress resources."
    ),
    "financial_stress": ResourceResult(
        resource_id="financial_stress",
        name="Student Financial Aid Emergency Fund",
        tagline="Emergency financial assistance for students in unexpected hardship.",
        phone="607-255-5145",
        url="https://finaid.cornell.edu/emergency-fund",
        hours="Mon-Fri 8am-5pm.",
        how_to_access="Contact the Financial Aid office at 607-255-5145 or visit 203 Day Hall. Emergency grants are available for unexpected expenses. You do not need to pay them back."
    ),
    "basic_needs": ResourceResult(
        resource_id="basic_needs",
        name="Cornell Basic Needs Support",
        tagline="Food, housing, and emergency support for students in need.",
        phone="607-255-5243",
        url="https://basicneeds.cornell.edu",
        hours="Mon-Fri 9am-5pm.",
        how_to_access="Visit basicneeds.cornell.edu to access food pantry locations, emergency housing support, and other basic needs resources. No questions asked."
    ),
    "graduate_support": ResourceResult(
        resource_id="graduate_support",
        name="Graduate Student Mental Health",
        tagline="Specialized support for the unique pressures of graduate and PhD programs.",
        phone="607-255-5155",
        url="https://gradschool.cornell.edu/student-life/health-and-wellness",
        hours="Mon-Fri 8:30am-4:30pm.",
        how_to_access="CAPS has counselors who specialize in graduate student concerns including advisor relationships, dissertation stress, imposter syndrome, and career uncertainty. Request a grad-specialist when you call."
    ),
    "student_advocacy": ResourceResult(
        resource_id="student_advocacy",
        name="University Advocate",
        tagline="Free confidential support navigating Cornell policies and difficult situations.",
        phone="607-255-4321",
        url="https://advocate.cornell.edu",
        hours="Mon-Fri 9am-5pm.",
        how_to_access="Call 607-255-4321 or visit advocate.cornell.edu. The University Advocate helps students navigate academic difficulties, conflicts with professors, and other institutional challenges."
    ),
    "gannett_health": ResourceResult(
        resource_id="gannett_health",
        name="Cornell Health Primary Care",
        tagline="Medical care for physical health concerns, including mental health medication management.",
        phone="607-255-5155",
        url="https://health.cornell.edu",
        hours="Mon-Fri 8am-5pm. Urgent care available during extended hours.",
        how_to_access="Call 607-255-5155 to schedule an appointment. Cornell Health can also help with medication management for depression, anxiety, and ADHD if you are already working with a provider."
    ),
    "bereavement": ResourceResult(
        resource_id="bereavement",
        name="Grief and Loss Support at CAPS",
        tagline="Specialized support for students dealing with loss, grief, or trauma.",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/mental-health-care",
        hours="Mon-Fri 8:30am-4:30pm.",
        how_to_access="Call CAPS at 607-255-5155 and mention you are dealing with grief or loss. They can connect you with a counselor who specializes in bereavement and trauma."
    ),
    "sleep_health": ResourceResult(
        resource_id="sleep_health",
        name="Cornell Sleep Health Program",
        tagline="Evidence-based help for sleep problems that are affecting your life.",
        phone="607-255-5155",
        url="https://health.cornell.edu/services/health-coaching",
        hours="Mon-Fri 8am-5pm.",
        how_to_access="Call Cornell Health and ask about the Sleep Health Program. They offer individual coaching and CBT-based techniques for insomnia and sleep disruption. Free for enrolled students."
    ),
    "career_advising": ResourceResult(
        resource_id="career_advising",
        name="Cornell Career Services",
        tagline="Support for career anxiety, job search stress, and uncertainty about the future.",
        phone="607-255-5378",
        url="https://career.cornell.edu",
        hours="Mon-Fri 8am-5pm.",
        how_to_access="Call 607-255-5378 or visit career.cornell.edu to schedule an appointment. Career counselors can help with job search anxiety, career uncertainty, and the stress of figuring out what comes next."
    ),
    "let_me_help": ResourceResult(
        resource_id="let_me_help",
        name="Let Me Help Peer Support",
        tagline="Cornell students trained to support peers through difficult times.",
        phone=None,
        url="https://health.cornell.edu/resources/health-topics/mental-health",
        hours="Available during the academic semester.",
        how_to_access="Ask your RA or residence hall staff about Let Me Help peer supporters in your building. They are trained students who can listen, provide support, and connect you to professional resources."
    ),
    "gym": ResourceResult(
        resource_id="gym",
        name="Campus Fitness Centers",
        tagline="Free gym access for all Cornell students. Exercise is one of the most effective stress relievers.",
        phone=None,
        url="https://recreation.athletics.cornell.edu",
        hours="Mon-Fri 6am-11pm, weekends 8am-9pm.",
        how_to_access="Show your Cornell ID at Helen Newman Hall, Noyes Center, or Bartels Hall. All free for enrolled students. Group fitness classes including yoga are also free."
    ),
    "botanic_gardens": ResourceResult(
        resource_id="botanic_gardens",
        name="Cornell Botanic Gardens",
        tagline="Free, peaceful gardens on campus. A walk here genuinely clears your head.",
        phone=None,
        url="https://cornellbotanicgardens.org",
        hours="Dawn to dusk daily.",
        how_to_access="Walk in for free any time. Located on the north end of campus near the engineering quad. No need to bring anything."
    ),
    "outdoor_education": ResourceResult(
        resource_id="outdoor_education",
        name="Cornell Outdoor Education",
        tagline="Climbing wall, outdoor trips, and adventure programs. A great way to get outside and reset.",
        phone="607-255-6415",
        url="https://outdoor.cornell.edu",
        hours="Mon-Fri 9am-5pm.",
        how_to_access="Visit Bartels Hall or outdoor.cornell.edu to sign up for trips and use the climbing wall. Many programs are free or low cost for Cornell students."
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
    college = request.college.value
    triggers = [t.value for t in request.stress_triggers] if request.stress_triggers else []

    if mood <= 2:
        return TriageResult(
            primary=RESOURCES["crisis_line"],
            secondary=[
                RESOURCES["cornell_health_phone"],
                RESOURCES["cornell_police_crisis"],
            ],
            crisis_flag=True,
            distress_level="crisis",
            why="Based on what you shared, we think you need immediate support right now. Please reach out.",
            show_peer_connect=False
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

    if "grief" in triggers:
        return TriageResult(
            primary=RESOURCES["bereavement"],
            secondary=[RESOURCES["caps_individual"], RESOURCES["ears"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Grief and loss are some of the hardest things to carry alone. CAPS has counselors who specialize in exactly this and can support you through it.",
            show_peer_connect=True
        )

    if "discrimination" in triggers:
        return TriageResult(
            primary=RESOURCES["diversity_inclusion"],
            secondary=[RESOURCES["lgbtq_center"], RESOURCES["student_advocacy"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Experiencing discrimination is serious and you deserve support. The Office of Diversity and Inclusion has counselors who understand these experiences deeply.",
            show_peer_connect=True
        )

    if "identity" in triggers:
        return TriageResult(
            primary=RESOURCES["diversity_inclusion"],
            secondary=[RESOURCES["lgbtq_center"], RESOURCES["caps_group"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Questions of identity and belonging can be deeply personal. The Office of Diversity and Inclusion has counselors who specialize in exactly this.",
            show_peer_connect=True
        )

    if "financial" in triggers or "housing" in triggers:
        sec = [RESOURCES["basic_needs"]] if "housing" in triggers else [RESOURCES["lets_talk"]]
        sec.append(RESOURCES["caps_individual"] if distress_level == "high" else RESOURCES["ears"])
        return TriageResult(
            primary=RESOURCES["financial_stress"],
            secondary=sec,
            crisis_flag=False,
            distress_level=distress_level,
            why="Financial and housing stress are some of the most common but least talked about struggles at Cornell. Real help is available and you do not have to figure this out alone.",
            show_peer_connect=True
        )

    if "sleep" in triggers or (sleep == "under_4" and distress_level != "high"):
        return TriageResult(
            primary=RESOURCES["sleep_health"],
            secondary=[RESOURCES["headspace"], RESOURCES["gym"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Poor sleep affects everything else -- your mood, focus, and ability to cope. Cornell has a dedicated Sleep Health program that can help.",
            show_peer_connect=True
        )

    if "future" in triggers or "academics" in triggers:
        if distress_level == "high":
            return TriageResult(
                primary=RESOURCES["caps_individual"],
                secondary=[RESOURCES["career_advising"], RESOURCES["student_advocacy"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="Academic and career pressure at Cornell can feel overwhelming. A counselor can help you work through the anxiety and figure out next steps.",
                show_peer_connect=False
            )
        else:
            return TriageResult(
                primary=RESOURCES["career_advising"],
                secondary=[RESOURCES["lets_talk"], RESOURCES["ears"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="Uncertainty about the future is one of the most common stressors at Cornell. Career Services can help you work through the anxiety, not just the logistics.",
                show_peer_connect=True
            )

    if "health" in triggers:
        return TriageResult(
            primary=RESOURCES["gannett_health"],
            secondary=[RESOURCES["caps_individual"], RESOURCES["lets_talk"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Physical health concerns can take a serious toll on your mental health too. Cornell Health can address both together.",
            show_peer_connect=True
        )

    if "loneliness" in triggers or "social" in triggers:
        return TriageResult(
            primary=RESOURCES["ears"],
            secondary=[RESOURCES["let_me_help"], RESOURCES["caps_group"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Feeling disconnected or lonely at Cornell is more common than people admit. Talking to a peer counselor or joining a group can help more than you might expect.",
            show_peer_connect=True
        )

    if "family" in triggers:
        if distress_level == "high":
            return TriageResult(
                primary=RESOURCES["caps_individual"],
                secondary=[RESOURCES["lets_talk"], RESOURCES["ears"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="Family struggles can be especially hard to deal with when you are far from home. A counselor can give you a private space to work through what you are carrying.",
                show_peer_connect=False
            )
        else:
            return TriageResult(
                primary=RESOURCES["lets_talk"],
                secondary=[RESOURCES["ears"], RESOURCES["caps_individual"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="Family struggles can be especially hard to deal with when you are far from home. Talking to someone even informally can help.",
                show_peer_connect=True
            )

    if college in ["graduate", "professional"]:
        if distress_level == "high":
            return TriageResult(
                primary=RESOURCES["caps_individual"],
                secondary=[RESOURCES["graduate_support"], RESOURCES["lets_talk"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="Your responses suggest you are under significant stress. A counselor can help you work through this.",
                show_peer_connect=False
            )
        elif distress_level == "moderate":
            return TriageResult(
                primary=RESOURCES["graduate_support"],
                secondary=[RESOURCES["ears"], RESOURCES["lets_talk"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="It sounds like things are weighing on you. Talking to someone, even informally, can help.",
                show_peer_connect=True
            )
        else:
            return TriageResult(
                primary=RESOURCES["self_help"],
                secondary=[RESOURCES["headspace"], RESOURCES["botanic_gardens"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="You seem to be managing okay. These resources can help you stay that way.",
                show_peer_connect=True
            )

    if distress_level == "high":
        return TriageResult(
            primary=RESOURCES["caps_individual"],
            secondary=[RESOURCES["lets_talk"], RESOURCES["cornell_health_phone"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="Your responses suggest you are under significant stress. A counselor can help you work through this.",
            show_peer_connect=False
        )
    elif distress_level == "moderate":
        if workload in ["heavy", "unbearable"]:
            return TriageResult(
                primary=RESOURCES["lets_talk"],
                secondary=[RESOURCES["ears"], RESOURCES["caps_group"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="It sounds like things are weighing on you. Talking to someone, even informally, can help.",
                show_peer_connect=True
            )
        else:
            return TriageResult(
                primary=RESOURCES["ears"],
                secondary=[RESOURCES["lets_talk"], RESOURCES["caps_group"]],
                crisis_flag=False,
                distress_level=distress_level,
                why="It sounds like things are weighing on you. Talking to someone, even informally, can help.",
                show_peer_connect=True
            )
    else:
        return TriageResult(
            primary=RESOURCES["self_help"],
            secondary=[RESOURCES["headspace"], RESOURCES["gym"]],
            crisis_flag=False,
            distress_level=distress_level,
            why="You seem to be managing okay. These resources can help you stay that way.",
            show_peer_connect=True
        )