import { useState, useEffect } from "react"
import StepMood from "./StepMood"
import StepSleepWorkload from "./StepSleepWorkload"
import StepTrigger from "./StepTrigger"
import StepText from "./StepText"
import ResultCard from "./ResultCard"
import { submitCheckin } from "../../api/client"

const TOTAL_STEPS = 4

function loadSaved() {
  try {
    const raw = sessionStorage.getItem("cornellpulse_checkin_draft")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const FALLBACK_RESULT = {
  triage_result: {
    distress_level: "moderate",
    crisis_flag: false,
    why: "We could not reach our servers right now. Here are the most important resources for Cornell students.",
    primary: {
      resource_id: "cornell_health",
      name: "Cornell Health 24/7",
      tagline: "Talk to a health professional any time. Press 2 for mental health support.",
      phone: "607-255-5155",
      hours: "24/7 including holidays",
      how_to_access: "Call 607-255-5155 any time and press 2 for mental health support.",
      url: "https://health.cornell.edu",
      tags: ["24/7", "free"],
    },
    secondary: [
      {
        resource_id: "ears",
        name: "EARS Peer Counseling",
        tagline: "Confidential peer counseling with trained Cornell students. Sun-Thu 9pm-1am.",
        phone: "607-255-4050",
        hours: "Sun-Thu 9pm-1am",
        how_to_access: "Call or walk into 305 Willard Straight Hall Sunday through Thursday 9pm-1am.",
        url: "https://ears.cornell.edu",
        tags: ["peer", "free"],
      },
      {
        resource_id: "crisis_988",
        name: "988 Suicide and Crisis Lifeline",
        tagline: "Call or text 988. Free, confidential, 24/7.",
        phone: "988",
        hours: "24/7",
        how_to_access: "Call or text 988 from any phone.",
        url: "https://988lifeline.org",
        tags: ["crisis", "24/7", "free"],
      },
    ],
    show_peer_connect: false,
  }
}

export default function CheckInFlow() {
  const saved = loadSaved()
  const [step, setStep] = useState<number>(saved?.step || 1)
  const [mood, setMood] = useState<number>(saved?.mood ?? 5)
  const [sleep, setSleep] = useState<string>(saved?.sleep || "")
  const [workload, setWorkload] = useState<string>(saved?.workload || "")
  const [triggers, setTriggers] = useState<string[]>(saved?.triggers || [])
  const [wantsToTalk, setWantsToTalk] = useState<boolean | null>(saved?.wantsToTalk ?? null)
  const [freeText, setFreeText] = useState<string>(saved?.freeText || "")
  const [college, setCollege] = useState<string>(saved?.college || "")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  useEffect(() => {
    if (result) return
    sessionStorage.setItem("cornellpulse_checkin_draft", JSON.stringify({
      step, mood, sleep, workload, triggers, wantsToTalk, freeText, college,
    }))
  }, [step, mood, sleep, workload, triggers, wantsToTalk, freeText, college, result])

  const colleges = [
    { value: "engineering", label: "Engineering" },
    { value: "arts_sciences", label: "Arts and Sciences" },
    { value: "dyson", label: "Dyson" },
    { value: "ilr", label: "ILR" },
    { value: "cals", label: "CALS" },
    { value: "aap", label: "AAP" },
    { value: "vet", label: "Vet" },
    { value: "human_ecology", label: "Human Ecology" },
    { value: "hotel", label: "Nolan School of Hotel Administration" },
    { value: "bowers", label: "Bowers College of Computing and Information Science" },
    { value: "public_policy", label: "Brooks School of Public Policy" },
    { value: "law", label: "Law School" },
    { value: "tech", label: "Cornell Tech" },
    { value: "weill", label: "Weill Cornell Medicine" },
    { value: "graduate", label: "Graduate" },
    { value: "professional", label: "Professional" },
    { value: "other", label: "Prefer not to say" },
  ]

  async function handleSubmit() {
    setLoading(true)
    setError("")
    try {
      const token = crypto.randomUUID()
      const data = await submitCheckin({
        mood_score: mood,
        sleep_category: sleep,
        workload_category: workload,
        stress_triggers: triggers.length > 0 ? triggers : undefined,
        wants_to_talk: wantsToTalk,
        free_text: freeText || undefined,
        college: college || "other",
        session_token: token,
      })
      setResult(data)
      sessionStorage.removeItem("cornellpulse_checkin_draft")
    } catch (e) {
      setResult(FALLBACK_RESULT)
      sessionStorage.removeItem("cornellpulse_checkin_draft")
    } finally {
      setLoading(false)
    }
  }

  function restart() {
    setStep(1)
    setMood(5)
    setSleep("")
    setWorkload("")
    setTriggers([])
    setWantsToTalk(null)
    setFreeText("")
    setCollege("")
    setResult(null)
    setError("")
    sessionStorage.removeItem("cornellpulse_checkin_draft")
  }

  if (result) {
    return <ResultCard result={result} moodScore={mood} triggers={triggers} wantsToTalk={wantsToTalk} onRestart={restart} />
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171" }}>Step {step} of {TOTAL_STEPS}</p>
          <p style={{ fontSize: "12px", color: "#b0b0b0" }}>{Math.round((step / TOTAL_STEPS) * 100)}% complete</p>
        </div>
        <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "6px" }}>
          <div style={{
            height: "6px",
            backgroundColor: "#FF5A5F",
            borderRadius: "6px",
            width: ((step / TOTAL_STEPS) * 100) + "%",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>
      {step === 1 && <StepMood value={mood} onChange={setMood} onNext={() => setStep(2)} />}
      {step === 2 && <StepSleepWorkload sleep={sleep} onSleepChange={setSleep} workload={workload} onWorkloadChange={setWorkload} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepTrigger values={triggers} onChange={(v: string[]) => setTriggers(v)} wantsToTalk={wantsToTalk} onWantsToTalkChange={(v: boolean) => setWantsToTalk(v)} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <StepText value={freeText} onChange={setFreeText} college={college} onCollegeChange={setCollege} colleges={colleges} onSubmit={handleSubmit} onBack={() => setStep(3)} loading={loading} error={error} />}
    </div>
  )
}