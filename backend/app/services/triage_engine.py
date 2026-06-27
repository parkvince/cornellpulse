from app.models.schemas import CheckInRequest, TriageResult, ResourceResult

CRISIS_KEYWORDS = [
    "kill myself", "kill my self", "suicide", "suicidal", "end my life", "end it all",
    "want to die", "wanna die", "better off dead", "not worth living", "hurt myself",
    "harm myself", "self harm", "self-harm", "cutting myself", "overdose", "no reason to live",
    "cant go on", "can't go on", "dont want to be here", "don't want to be here",
    "ending it", "take my life", "nothing to live for", "give up on life",
    "rather be dead", "wish i was dead", "wish i were dead", "disappear forever",
    "everyone would be better without me", "no point in living", "life is pointless",
    "dont see the point", "don't see the point", "checked out", "give up",
    "cant do this anymore", "can't do this anymore", "done with everything",
    "done with life", "tired of living", "tired of being alive", "hopeless",
    "no hope", "never get better", "nothing will ever change", "permanent solution",
    "pills", "jump", "hang", "rope", "bridge", "razor", "blades", "cut myself",
]

RESOURCE_KEYWORDS = {
    "caps": [
        "therapy", "therapist", "counseling", "counselor", "mental health", "psychiatrist",
        "psychiatric", "diagnosis", "diagnosed", "depression", "anxiety", "panic attack",
        "panic attacks", "ptsd", "trauma", "ocd", "bipolar", "adhd", "medication",
        "antidepressant", "antidepressants", "prescription", "treatment", "clinical",
        "breakdown", "crying all the time", "cant function", "can't function",
        "not eating", "not sleeping for weeks", "serious", "professional help",
        "see someone", "talk to someone professional", "mental breakdown",
        "emotional breakdown", "dissociating", "dissociation", "depressed",
        "severely anxious", "constant anxiety", "intrusive thoughts", "voices",
        "hallucinating", "hallucinations", "paranoid", "paranoia", "manic",
        "mania", "mood swings", "personality", "borderline", "eating disorder",
        "anorexia", "bulimia", "binge eating", "purging", "restricting",
        "body image", "hate my body", "obsessive", "compulsive", "repetitive thoughts",
        "cant stop thinking", "can't stop thinking", "ruminating", "rumination",
        "psychologist", "psychiatric evaluation", "mental health evaluation",
        "cant get out of bed", "can't get out of bed", "no motivation",
        "dont care about anything", "don't care about anything", "numb",
        "feel nothing", "emotionally exhausted", "emotional pain", "inner pain",
        "deep sadness", "persistent sadness", "mood disorder", "affect",
    ],
    "lets_talk": [
        "stressed", "overwhelmed", "burned out", "burnout", "burnt out", "anxious",
        "nervous", "worried", "worry", "not okay", "struggling", "hard time",
        "difficult", "tough week", "rough week", "too much", "cant handle",
        "can't handle", "breaking down", "falling apart", "need to talk",
        "just need to vent", "vent", "venting", "talk to someone", "chat",
        "drop in", "no appointment", "quick", "today", "right now", "urgent",
        "feeling off", "not myself", "off day", "bad week", "bad month",
        "pressure", "overwhelmed by pressure", "too many things", "everything at once",
        "spinning", "head spinning", "chaotic", "chaos", "scattered", "unfocused",
        "distracted", "cant concentrate", "can't concentrate", "mind racing",
        "racing mind", "overthinking", "overanalyzing", "stressed out",
        "tightly wound", "on edge", "irritable", "irritability", "snapping",
        "short tempered", "angry all the time", "crying randomly", "crying for no reason",
        "emotional", "too emotional", "overwhelmed emotionally", "can barely cope",
        "barely coping", "just getting by", "surviving", "hanging on",
        "need support", "need someone to talk to", "dont know who to talk to",
        "don't know who to talk to", "feeling lost", "feel lost",
    ],
    "ears": [
        "lonely", "loneliness", "alone", "isolated", "isolation", "no friends",
        "no one to talk to", "nobody cares", "feel invisible", "feel like a burden",
        "peer", "student", "someone who gets it", "relate", "understand me",
        "late night", "cant sleep", "can't sleep", "night", "up late",
        "homesick", "miss home", "miss my family", "miss my friends",
        "college is hard", "college is tough", "feel disconnected",
        "disconnected", "no connection", "no community", "dont belong",
        "don't belong", "outsider", "outcast", "rejected", "rejection",
        "excluded", "left out", "not invited", "no one reaches out",
        "no one checks on me", "forgotten", "invisible", "unwanted",
        "feel unwanted", "unloved", "feel unloved", "no one cares about me",
        "acquaintances but no real friends", "surface level", "shallow friendships",
        "hard to open up", "cant open up", "can't open up", "trust issues",
        "dont trust anyone", "don't trust anyone", "hard to connect",
        "social isolation", "withdrawal", "withdrawing", "pulling away",
        "avoiding people", "avoiding everyone", "hiding", "staying in my room",
        "dont leave my room", "don't leave my room", "missing social interaction",
        "crave connection", "need connection", "want someone to listen",
    ],
    "financial": [
        "money", "financial", "finances", "broke", "debt", "loan", "loans",
        "cant afford", "can't afford", "tuition", "rent", "housing costs",
        "food insecure", "hungry", "cant eat", "can't eat", "emergency fund",
        "grant", "scholarship", "financial aid", "work study", "job",
        "pay bills", "bills", "stressed about money", "financial stress",
        "cost of living", "textbooks", "expenses", "running out of money",
        "no money", "broke this month", "cant pay", "can't pay",
        "overdue", "past due", "collections", "credit card", "credit card debt",
        "maxed out", "out of funds", "bank account", "negative balance",
        "overdraft", "financial emergency", "unexpected expense", "car broke down",
        "medical bill", "hospital bill", "can't make ends meet", "end of the month",
        "paycheck to paycheck", "no savings", "drained my savings",
        "parents cut me off", "no support from family", "self supporting",
        "financially independent", "supporting myself", "paying my own way",
        "work two jobs", "working multiple jobs", "can't focus because of money",
        "money is all i think about", "financial anxiety", "financial pressure",
        "economic stress", "poverty", "low income", "need money", "need cash",
    ],
    "basic_needs": [
        "food", "hungry", "starving", "food pantry", "groceries", "eating",
        "housing", "homeless", "evicted", "eviction", "shelter", "housing insecure",
        "couch surfing", "nowhere to stay", "basic needs", "necessities",
        "utilities", "hygiene", "clothes", "clothing", "supplies",
        "no food", "skipping meals", "skipping breakfast", "skipping lunch",
        "skipping dinner", "not eating enough", "cant afford food",
        "can't afford food", "food bank", "free food", "meal plan ran out",
        "dining dollars gone", "no meal plan", "food stamps", "snap",
        "emergency housing", "kicked out", "kicked out of dorm",
        "housing emergency", "unsafe housing", "unsafe living situation",
        "can't afford rent", "behind on rent", "landlord", "eviction notice",
        "sleeping on couches", "no permanent address", "temporary housing",
        "need supplies", "need toiletries", "period products", "hygiene products",
        "can't afford supplies", "don't have what i need", "missing essentials",
        "basic necessities", "survival", "just surviving",
    ],
    "fitness": [
        "exercise", "gym", "workout", "work out", "run", "running", "lift",
        "lifting", "weights", "fitness", "physical", "body", "active",
        "sports", "yoga", "stretch", "movement", "energy", "tired body",
        "need to move", "get active", "stay active", "healthy",
        "sedentary", "sitting all day", "no physical activity", "havent exercised",
        "haven't exercised", "out of shape", "gaining weight", "weight gain",
        "body feels heavy", "sluggish", "lethargic", "no stamina",
        "always tired", "physically drained", "need to work out", "want to work out",
        "want to be active", "be more active", "stress relief through exercise",
        "clear my head with exercise", "cardio", "swim", "swimming",
        "basketball", "tennis", "volleyball", "intramurals", "group fitness",
        "pilates", "cycling", "spin", "elliptical", "treadmill", "classes",
        "fitness classes", "free classes", "helen newman", "noyes", "bartels",
        "recreation", "athletic", "sport", "team sport", "physical health",
    ],
    "nature": [
        "outside", "outdoors", "nature", "walk", "hike", "hiking", "fresh air",
        "clear my head", "get away", "escape", "park", "gorge", "waterfall",
        "trail", "trees", "garden", "botanic", "lake", "scenery", "peaceful",
        "quiet place", "calm", "decompress", "breathe",
        "need fresh air", "need to be outside", "stuck inside", "cooped up",
        "cabin fever", "walls closing in", "need to get out", "go for a walk",
        "take a walk", "walk it off", "be in nature", "green space",
        "trees and nature", "birds", "outdoorsy", "love the outdoors",
        "beebe lake", "suspension bridge", "cascadilla", "libe slope",
        "arts quad", "botanical", "arboretum", "campus walk",
        "buttermilk", "taughannock", "watkins glen", "gorge trail",
        "state park", "ithaca", "finger lakes", "fresh air helps",
        "take my mind off", "reset", "recharge outside", "vitamin d",
        "sunshine", "sunlight", "soak up sun", "mindful walk",
        "walking meditation", "grounding", "get grounded", "earth",
    ],
    "sleep": [
        "sleep", "insomnia", "cant sleep", "can't sleep", "not sleeping",
        "tired", "exhausted", "fatigue", "fatigued", "no energy", "low energy",
        "wired", "racing thoughts at night", "wake up", "waking up",
        "rest", "restless", "sleep deprived", "sleep deprivation", "pulling all nighters",
        "all nighter", "sleep schedule", "circadian",
        "can't fall asleep", "cant fall asleep", "take forever to fall asleep",
        "up all night", "awake all night", "wide awake", "cant wind down",
        "can't wind down", "mind wont stop", "mind won't stop",
        "racing thoughts keeping me up", "anxiety at night", "night anxiety",
        "wake up at 3am", "wake up in the middle of the night",
        "early morning waking", "cant go back to sleep", "can't go back to sleep",
        "too much caffeine", "caffeine dependent", "coffee all day",
        "energy drinks", "relying on caffeine", "sleep hygiene",
        "sleep quality", "poor sleep", "bad sleep", "light sleep",
        "heavy sleeper", "oversleeping", "sleeping too much", "hypersomnia",
        "cant wake up", "can't wake up", "alarm doesnt work", "snooze alarm",
        "groggy", "brain fog", "foggy", "zombie mode", "running on empty",
        "fumes", "crash", "crashing", "afternoon crash", "tired after sleeping",
        "never feel rested", "unrefreshing sleep", "nightmares", "bad dreams",
    ],
    "academics": [
        "grades", "gpa", "failing", "fail", "failed", "exam", "exams", "test",
        "midterm", "midterms", "finals", "assignment", "deadline", "deadlines",
        "paper", "essay", "project", "class", "classes", "professor", "ta",
        "academic probation", "academic stress", "studying", "study",
        "cant focus", "can't focus", "procrastinating", "procrastination",
        "overwhelmed with work", "too much work", "workload", "drop a class",
        "withdraw", "incomplete", "extension",
        "behind on assignments", "behind in class", "missed class",
        "missed lecture", "cant catch up", "can't catch up", "falling behind",
        "way behind", "overwhelmed by coursework", "too many credits",
        "overloaded", "course overload", "double major stress",
        "prelim", "prelims", "quiz", "quizzes", "lab report", "lab reports",
        "research paper", "thesis", "dissertation", "problem set", "pset",
        "homework", "problem sets", "case study", "presentation",
        "group project", "team project", "teammates not helping",
        "group work", "collaboration issues", "academic integrity",
        "plagiarism scare", "cheating accusation", "academic misconduct",
        "grade appeal", "dispute grade", "unfair grading", "curve",
        "bombed the exam", "bombed the test", "failed the midterm",
        "failed the final", "failed the class", "withdrawing from class",
        "late withdrawal", "medical withdrawal", "leave of absence",
        "academic leave", "imposter syndrome in class", "feel dumb",
        "not smart enough", "everyone else gets it", "lost in lecture",
        "confused in class", "dont understand", "don't understand",
        "no office hours", "professor not helpful", "ta not helpful",
        "cant get help", "can't get help", "tutoring", "need a tutor",
    ],
    "social": [
        "friends", "friendship", "social", "socialize", "people", "community",
        "belong", "belonging", "fit in", "fitting in", "left out", "excluded",
        "excluded from", "no social life", "introvert", "shy", "awkward",
        "social anxiety", "meeting people", "making friends", "greek life",
        "club", "clubs", "activities", "get involved",
        "no social skills", "bad at socializing", "bad at small talk",
        "dont know how to make friends", "don't know how to make friends",
        "friend group", "friend groups", "cliques", "everyone has a group",
        "everyone knows each other", "everyone is already friends",
        "too late to make friends", "missed orientation", "transfer student",
        "new student", "feel new", "feel like an outsider",
        "roommate issues", "bad roommate", "roommate conflict", "living with people",
        "dorm life", "residence hall", "suite mates", "floor mates",
        "fraternities", "sororities", "rush", "rushing", "didnt get a bid",
        "rejected from greek life", "social hierarchy", "popularity",
        "fomo", "fear of missing out", "everyone is having fun but me",
        "everyone seems happy", "fake happiness", "fake it",
        "surface level conversations", "deep friendships", "meaningful connection",
        "nobody really knows me", "nobody really listens", "performative friendship",
        "toxic friendship", "toxic friend", "bad friend", "friend drama",
        "drama", "gossip", "social media comparison", "instagram",
        "comparing myself to others", "everyone seems to have it together",
    ],
    "identity": [
        "identity", "who am i", "purpose", "meaning", "lost", "direction",
        "lgbtq", "gay", "lesbian", "bisexual", "transgender", "trans", "queer",
        "nonbinary", "non-binary", "coming out", "sexuality", "gender",
        "race", "racism", "racial", "discrimination", "microaggression",
        "first gen", "first generation", "international student", "immigrant",
        "culture", "cultural", "religion", "religious", "faith", "values",
        "imposter syndrome", "impostor syndrome",
        "questioning my identity", "questioning my sexuality",
        "questioning my gender", "gender dysphoria", "dysphoria",
        "not accepted", "not accepted at home", "family doesnt accept me",
        "family doesn't accept me", "rejected by family", "not out",
        "closeted", "hiding who i am", "hiding my identity",
        "cultural expectations", "family expectations", "pressure from family",
        "arranged marriage pressure", "dont fit cultural norms",
        "don't fit cultural norms", "caught between two cultures",
        "cultural identity crisis", "assimilation", "code switching",
        "code-switching", "racial identity", "ethnic identity",
        "feel ashamed", "shame", "internalized shame", "self acceptance",
        "self acceptance journey", "learning to accept myself",
        "self discovery", "finding myself", "exploring my identity",
        "spiritual crisis", "faith crisis", "questioning religion",
        "lost my faith", "deconstructing", "religious trauma",
        "feel different", "feel like an outsider", "never felt normal",
        "always felt different", "neurodivergent", "autistic", "adhd identity",
        "learning disability", "accommodation", "disability",
    ],
    "grief": [
        "grief", "grieving", "loss", "lost someone", "death", "died", "passed away",
        "funeral", "mourning", "mourn", "heartbreak", "heartbroken", "breakup",
        "broke up", "relationship ended", "divorce", "parents divorcing",
        "family problems", "family issues", "toxic family", "estranged",
        "someone died", "friend died", "family member died", "parent died",
        "sibling died", "grandparent died", "lost my grandma", "lost my grandpa",
        "lost my mom", "lost my dad", "lost my friend", "lost my pet",
        "pet died", "dog died", "cat died", "grief and loss",
        "complicated grief", "unresolved grief", "cant process", "can't process",
        "shocked", "in shock", "numb from grief", "cant cry", "can't cry",
        "crying constantly", "crying every day", "miss them so much",
        "missing someone", "they are gone", "nothing feels real",
        "surreal", "denial", "anger at loss", "bargaining", "acceptance",
        "stages of grief", "dont know how to grieve", "don't know how to grieve",
        "not allowed to grieve", "have to be strong", "cant show emotion",
        "can't show emotion", "anniversary of death", "death anniversary",
        "would have been their birthday", "holidays without them",
        "first holiday without them", "trauma from loss", "sudden death",
        "unexpected death", "suicide of someone close", "traumatic loss",
        "relationship grief", "end of friendship", "friendship breakup",
        "losing a friendship", "ex", "ex partner", "miss my ex",
        "ended a long relationship", "long distance failed",
    ],
    "headspace": [
        "meditate", "meditation", "mindfulness", "breathe", "breathing",
        "calm down", "relax", "relaxation", "stress relief", "app",
        "headspace", "sleep sounds", "guided", "quick fix", "few minutes",
        "on my own", "by myself", "self help", "self-help",
        "breathing exercise", "breathing exercises", "deep breathing",
        "box breathing", "4-7-8 breathing", "belly breathing",
        "grounding technique", "grounding techniques", "5-4-3-2-1",
        "body scan", "progressive muscle relaxation", "pmr",
        "guided meditation", "visualization", "positive visualization",
        "calm app", "calm", "insight timer", "ten percent happier",
        "just a few minutes", "dont have much time", "don't have much time",
        "quick relief", "immediate relief", "right now", "at my desk",
        "in my room", "on my phone", "dont want to see anyone",
        "don't want to see anyone", "want to handle it myself",
        "independent", "self sufficient", "do it myself", "solo",
        "without talking to someone", "private", "keep it private",
        "not ready to talk", "just need to calm down", "need to breathe",
        "spiraling", "spiral", "anxiety spiral", "panic spiral",
        "stop spiraling", "interrupt the spiral", "break the cycle",
    ],
    "health": [
        "sick", "ill", "illness", "doctor", "medical", "health", "physical health",
        "stomach", "headache", "migraine", "pain", "injury", "injured",
        "hospital", "urgent care", "emergency", "infection", "symptoms",
        "medication management", "prescriptions", "cornell health",
        "nausea", "nauseous", "vomiting", "throwing up", "fever", "chills",
        "sore throat", "strep", "mono", "mononucleosis", "flu", "cold",
        "congestion", "sinus", "sinus infection", "respiratory", "cough",
        "shortness of breath", "chest pain", "heart racing", "palpitations",
        "dizziness", "dizzy", "fainting", "fainted", "lightheaded",
        "back pain", "neck pain", "joint pain", "muscle pain", "soreness",
        "chronic pain", "chronic illness", "chronic condition", "flare up",
        "disability", "physical disability", "mobility", "accommodation",
        "glasses", "vision", "hearing", "sensory", "allergies", "allergic",
        "anaphylaxis", "epipen", "asthma", "inhaler", "eczema", "skin",
        "dermatology", "rash", "hives", "reproductive health", "period",
        "menstrual", "pcos", "endometriosis", "contraception", "sexual health",
        "sti", "std", "testing", "urgent care visit", "walk in",
        "need a doctor", "need to see a doctor", "should see a doctor",
        "worried about my health", "health concern", "health anxiety",
        "hypochondria", "hypochondriac", "googling symptoms",
    ],
    "advocacy": [
        "unfair", "policy", "grade appeal", "academic integrity", "dean",
        "misconduct", "harassment", "Title IX", "complaint", "advocate",
        "rights", "navigate", "report", "investigation", "suspend",
        "probation", "disciplinary", "dispute", "conflict with professor",
        "academic misconduct charge", "misconduct investigation",
        "honor code", "code of conduct", "student rights", "due process",
        "hearing", "disciplinary hearing", "appeal", "appealing a decision",
        "unfair treatment", "treated unfairly", "bias", "professor bias",
        "discriminatory", "retaliatory", "retaliation", "power imbalance",
        "professor harassing me", "ta harassing me", "hostile environment",
        "hostile classroom", "hostile professor", "abusive professor",
        "sexual harassment", "sexual misconduct", "sexual assault",
        "assault", "rape", "unwanted contact", "unwanted advances",
        "title ix", "clery act", "confidential reporting", "anonymous report",
        "reporting options", "dont know my options", "don't know my options",
        "dont know what to do", "don't know what to do", "need guidance",
        "need advice", "navigating cornell", "cornell bureaucracy",
        "confused by process", "complicated process", "dont know where to go",
        "don't know where to go", "who do i talk to", "where do i start",
        "advocating for myself", "self advocacy", "need support navigating",
        "systemic issue", "institutional issue", "feel powerless",
        "feel helpless", "system failed me", "no one is listening",
    ],
}

def contains_crisis_language(text: str) -> bool:
    if not text:
        return False
    lowered = text.lower()
    return any(kw in lowered for kw in CRISIS_KEYWORDS)

def score_text_keywords(text: str) -> dict:
    if not text:
        return {}
    lowered = text.lower()
    scores = {}
    for resource, keywords in RESOURCE_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in lowered)
        if count > 0:
            scores[resource] = count
    return scores

RESOURCES = {
    "caps": ResourceResult(
        resource_id="caps",
        name="CAPS Individual Therapy",
        tagline="One-on-one counseling with a licensed therapist. First appointment within 1-2 days.",
        phone="607-255-5155",
        hours="Mon-Fri 8:30am-4:30pm",
        how_to_access="Call or walk into Gannett Health Center at 110 Ho Plaza. Ask for CAPS. First appointments are usually within 1-2 business days.",
        url="https://health.cornell.edu/services/mental-health-care",
        tags=["therapy", "free", "professional"],
    ),
    "lets_talk": ResourceResult(
        resource_id="lets_talk",
        name="Let's Talk Drop-In",
        tagline="Informal 15-20 min chat with a CAPS counselor. No appointment needed.",
        phone=None,
        hours="Mon-Fri, check website for locations and times",
        how_to_access="Just show up. No appointment, no paperwork. Various locations around campus including Olin Library and the multicultural center.",
        url="https://health.cornell.edu/services/mental-health-care/lets-talk",
        tags=["drop-in", "free", "quick"],
    ),
    "ears": ResourceResult(
        resource_id="ears",
        name="EARS Peer Counseling",
        tagline="Confidential peer counseling with trained Cornell students. No judgment.",
        phone="607-255-4050",
        hours="Sun-Thu 9pm-1am",
        how_to_access="Call the EARS line or walk into 305 Willard Straight Hall Sunday through Thursday between 9pm and 1am.",
        url="https://ears.cornell.edu",
        tags=["peer", "free", "evening"],
    ),
    "cornell_health": ResourceResult(
        resource_id="cornell_health",
        name="Cornell Health 24/7",
        tagline="Talk to a health professional any time. Press 2 for mental health.",
        phone="607-255-5155",
        hours="24/7 including holidays",
        how_to_access="Call 607-255-5155 any time and press 2 for mental health support. Available around the clock.",
        url="https://health.cornell.edu",
        tags=["24/7", "free"],
    ),
    "financial": ResourceResult(
        resource_id="financial",
        name="Financial Aid Emergency Fund",
        tagline="Emergency grants for unexpected expenses. You do not need to pay them back.",
        phone="607-255-5145",
        hours="Mon-Fri 8am-5pm",
        how_to_access="Call or visit 203 Day Hall. Explain your situation and ask about emergency funding. Grants do not need to be repaid.",
        url="https://finaid.cornell.edu/emergency-fund",
        tags=["financial", "emergency", "free"],
    ),
    "basic_needs": ResourceResult(
        resource_id="basic_needs",
        name="Basic Needs Support",
        tagline="Food pantry, emergency housing, and basic needs. No questions asked.",
        phone=None,
        hours="Check website",
        how_to_access="Visit basicneeds.cornell.edu to find the nearest food pantry location and hours. No ID or referral required.",
        url="https://basicneeds.cornell.edu",
        tags=["food", "housing", "free"],
    ),
    "fitness": ResourceResult(
        resource_id="fitness",
        name="Campus Fitness Centers",
        tagline="Free gym access for all Cornell students. One of the most effective stress relievers.",
        phone=None,
        hours="Mon-Fri 6am-11pm, weekends 8am-9pm",
        how_to_access="Show your Cornell ID at Helen Newman Hall, Noyes Center, or Bartels Hall. Free group fitness classes including yoga are also available.",
        url="https://recreation.athletics.cornell.edu",
        tags=["gym", "free", "fitness"],
    ),
    "nature": ResourceResult(
        resource_id="nature",
        name="Cornell Botanic Gardens",
        tagline="Free, beautiful gardens on campus. A walk here genuinely clears your head.",
        phone=None,
        hours="Dawn to dusk",
        how_to_access="Walk in from any entrance. Completely free and open to everyone. The F.R. Newman Arboretum is also worth exploring.",
        url="https://cornellbotanicgardens.org",
        tags=["nature", "free", "outdoors"],
    ),
    "sleep": ResourceResult(
        resource_id="sleep",
        name="Sleep Health Program",
        tagline="Evidence-based coaching for sleep problems. CBT techniques for insomnia.",
        phone="607-255-5155",
        hours="Mon-Fri 8am-5pm",
        how_to_access="Call Cornell Health and ask about the Sleep Health program. They use proven cognitive behavioral techniques specifically for insomnia.",
        url="https://health.cornell.edu/services/health-coaching",
        tags=["sleep", "free"],
    ),
    "headspace": ResourceResult(
        resource_id="headspace",
        name="Headspace App",
        tagline="Free meditation and sleep tools for all Cornell students.",
        phone=None,
        hours="Always available",
        how_to_access="Sign up at headspace.com/studentplan using your Cornell email. Free for all enrolled students.",
        url="https://www.headspace.com/studentplan",
        tags=["app", "free", "meditation"],
    ),
    "identity": ResourceResult(
        resource_id="identity",
        name="Office of Diversity and Inclusion",
        tagline="Counseling and support for students of color, LGBTQ+, first-gen, and international students.",
        phone="607-255-4857",
        hours="Mon-Fri 8am-5pm",
        how_to_access="Visit 626 Thurston Ave or call to schedule a meeting. Counselors specialize in identity-related stress and discrimination.",
        url="https://diversity.cornell.edu",
        tags=["identity", "diversity", "free", "lgbtq"],
    ),
    "advocacy": ResourceResult(
        resource_id="advocacy",
        name="University Advocate",
        tagline="Free confidential support navigating Cornell policies and academic difficulties.",
        phone="607-255-4321",
        hours="Mon-Fri 9am-5pm",
        how_to_access="Call or visit 160 Day Hall. The advocate helps you understand your rights and navigate Cornell's systems confidentially.",
        url="https://advocate.cornell.edu",
        tags=["advocacy", "free"],
    ),
    "health": ResourceResult(
        resource_id="health",
        name="Cornell Health Primary Care",
        tagline="General medical care including mental health medication management.",
        phone="607-255-5155",
        hours="Mon-Fri 8am-5pm",
        how_to_access="Call to make an appointment at Gannett Health Center. Walk-in urgent care is also available for acute concerns.",
        url="https://health.cornell.edu",
        tags=["medical", "free"],
    ),
    "self_help": ResourceResult(
        resource_id="self_help",
        name="Cornell Self-Help Resources",
        tagline="Guided tools, wellness tips, and mental health content you can use right now.",
        phone=None,
        hours="Always available online",
        how_to_access="Visit mentalhealth.cornell.edu for self-guided programs, relaxation tools, and wellness tips. Also check out the Headspace app which is free for all Cornell students through Student Health Benefits.",
        url="https://mentalhealth.cornell.edu",
        tags=["self-help", "free", "online"],
    ),
    "crisis_988": ResourceResult(
        resource_id="crisis_988",
        name="988 Suicide and Crisis Lifeline",
        tagline="Call or text 988. Trained crisis counselor in seconds. Free, confidential, 24/7.",
        phone="988",
        hours="24/7",
        how_to_access="Call or text 988 from any phone. You will reach a trained crisis counselor within seconds. Free and confidential.",
        url="https://988lifeline.org",
        tags=["crisis", "24/7", "free"],
    ),
    "crisis_text": ResourceResult(
        resource_id="crisis_text",
        name="Crisis Text Line",
        tagline="Text HOME to 741741. Free confidential crisis counseling by text.",
        phone="741741",
        hours="24/7",
        how_to_access="Text HOME to 741741 from any phone. Free, confidential, and available 24/7.",
        url="https://www.crisistextline.org",
        tags=["crisis", "text", "free"],
    ),
}

TRIGGER_TO_RESOURCES = {
    "academics": ["lets_talk", "caps", "advocacy", "headspace"],
    "social": ["ears", "lets_talk", "fitness", "nature"],
    "financial": ["financial", "basic_needs", "lets_talk"],
    "family": ["caps", "ears", "lets_talk"],
    "identity": ["identity", "caps", "ears"],
    "health": ["health", "caps", "cornell_health"],
    "future": ["lets_talk", "caps", "self_help"],
    "loneliness": ["ears", "fitness", "nature", "lets_talk"],
    "sleep": ["sleep", "headspace", "fitness"],
    "housing": ["basic_needs", "financial", "advocacy"],
    "grief": ["caps", "ears", "lets_talk"],
    "discrimination": ["identity", "advocacy", "caps"],
    "nothing_specific": ["self_help", "headspace", "nature"],
}

def run_triage(request: CheckInRequest) -> TriageResult:
    mood = request.mood_score
    triggers = [t.value for t in request.stress_triggers] if request.stress_triggers else []

    if mood <= 2 or contains_crisis_language(request.free_text):
        return TriageResult(
            distress_level="crisis",
            crisis_flag=True,
            why="Based on what you shared, please reach out for immediate support.",
            primary=RESOURCES["crisis_988"],
            secondary=[RESOURCES["crisis_text"], RESOURCES["cornell_health"]],
            show_peer_connect=False,
        )

    keyword_scores = score_text_keywords(request.free_text)

    resource_votes: dict[str, int] = {}

    def vote(resource_id: str, weight: int):
        resource_votes[resource_id] = resource_votes.get(resource_id, 0) + weight

    for resource_id, score in keyword_scores.items():
        vote(resource_id, score * 3)

    for trigger in triggers:
        if trigger in TRIGGER_TO_RESOURCES:
            for i, rid in enumerate(TRIGGER_TO_RESOURCES[trigger]):
                vote(rid, 4 - i)

    if mood <= 3:
        vote("caps", 5)
        vote("lets_talk", 4)
        vote("cornell_health", 3)
    elif mood <= 5:
        vote("lets_talk", 4)
        vote("ears", 3)
        vote("self_help", 2)
    elif mood <= 7:
        vote("headspace", 3)
        vote("nature", 3)
        vote("fitness", 2)
    else:
        vote("self_help", 3)
        vote("headspace", 2)
        vote("nature", 2)

    sleep = request.sleep_category.value
    workload = request.workload_category.value

    if sleep in ["under_4", "4_to_6"]:
        vote("sleep", 4)
        vote("headspace", 2)

    if workload in ["heavy", "unbearable"]:
        vote("lets_talk", 3)
        vote("caps", 2)
        vote("advocacy", 2)

    if request.wants_to_talk:
        vote("ears", 3)
        vote("lets_talk", 2)

    if not resource_votes:
        vote("self_help", 1)

    sorted_resources = sorted(resource_votes.items(), key=lambda x: x[1], reverse=True)
    primary_id = sorted_resources[0][0]
    secondary_ids = [rid for rid, _ in sorted_resources[1:4] if rid != primary_id]

    distress_level = "crisis" if mood <= 2 else "high" if mood <= 4 else "moderate" if mood <= 6 else "low"

    why_map = {
        "caps": "Based on what you shared, connecting with a counselor one-on-one could make a real difference right now.",
        "lets_talk": "A quick drop-in chat with a counselor might be exactly what you need -- no appointment, no commitment.",
        "ears": "Talking to another Cornell student who has been through it can be surprisingly helpful.",
        "cornell_health": "Cornell Health has professionals available around the clock who can help you figure out next steps.",
        "financial": "Financial stress is real and you do not have to navigate it alone. Emergency support exists.",
        "basic_needs": "Your basic needs come first. Cornell has resources ready for you right now, no questions asked.",
        "fitness": "Physical movement is one of the most proven ways to shift how you feel. Even a short gym session helps.",
        "nature": "Getting outside -- even just a short walk -- can genuinely reset your nervous system.",
        "sleep": "Sleep affects everything. Cornell has a dedicated program that can actually help fix this.",
        "headspace": "A few minutes of guided breathing or meditation can take the edge off. Free for all Cornell students.",
        "identity": "You deserve support from people who truly understand what you are navigating.",
        "advocacy": "If you are dealing with something systemic or policy-related, an advocate can help you find your footing.",
        "health": "Physical and mental health are deeply connected. Cornell Health can help with both.",
        "self_help": "You seem to be managing okay. These tools can help you stay that way.",
        "crisis_988": "Please reach out right now. You do not have to face this alone.",
        "crisis_text": "Immediate support is available right now, by text.",
    }

    return TriageResult(
        distress_level=distress_level,
        crisis_flag=False,
        why=why_map.get(primary_id, "Based on what you shared, here is what we think could help most."),
        primary=RESOURCES[primary_id],
        secondary=[RESOURCES[rid] for rid in secondary_ids if rid in RESOURCES],
        show_peer_connect=mood <= 6 or bool(request.wants_to_talk),
    )