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
    { value: "hotel", label: "Nolan School of Hotel Administration" },
    { value: "bowers", label: "Bowers College of Computing and Information Science" },
    { value: "public_policy", label: "Brooks School of Public Policy" },
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
      setError("Something went wrong. Please try again.")
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
    return <ResultCard result={result} moodScore={mood} triggers={triggers} onRestart={restart} />
  }

  return (
    <div>
      <div style={{ marginBottom: "36px" }}>
        <div style={{ height: "2px", backgroundColor: "#1a1a1a", borderRadius: "2px" }}>
          <div style={{
            height: "2px",
            backgroundColor: "#e8a0b4",
            borderRadius: "2px",
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