import { useState } from "react"
import StepMood from "./StepMood"
import StepSleep from "./StepSleep"
import StepWorkload from "./StepWorkload"
import StepTrigger from "./StepTrigger"
import StepText from "./StepText"
import ResultCard from "./ResultCard"
import { submitCheckin } from "../../api/client"

const TOTAL_STEPS = 5

export default function CheckInFlow() {
  const [step, setStep] = useState<number>(1)
  const [mood, setMood] = useState<number>(5)
  const [sleep, setSleep] = useState<string>("")
  const [workload, setWorkload] = useState<string>("")
  const [triggers, setTriggers] = useState<string[]>([])
  const [wantsToTalk, setWantsToTalk] = useState<boolean | null>(null)
  const [freeText, setFreeText] = useState<string>("")
  const [college, setCollege] = useState<string>("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const colleges = [
    { value: "engineering", label: "Engineering" },
    { value: "arts_sciences", label: "Arts and Sciences" },
    { value: "dyson", label: "Dyson" },
    { value: "ilr", label: "ILR" },
    { value: "cals", label: "CALS" },
    { value: "aap", label: "AAP" },
    { value: "vet", label: "Vet" },
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
  }

  if (result) {
    return <ResultCard result={result} moodScore={mood} onRestart={restart} />
  }

  return (
    <div style={{ padding: "24px 20px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>Step {step} of {TOTAL_STEPS}</div>
        <div style={{ height: "3px", backgroundColor: "#e5e5e5", borderRadius: "2px" }}>
          <div style={{ height: "3px", backgroundColor: "#1a1a1a", borderRadius: "2px", width: ((step / TOTAL_STEPS) * 100) + "%", transition: "width 0.3s ease" }} />
        </div>
      </div>
      {step === 1 && <StepMood value={mood} onChange={setMood} onNext={function() { setStep(2) }} />}
      {step === 2 && <StepSleep value={sleep} onChange={setSleep} onNext={function() { setStep(3) }} onBack={function() { setStep(1) }} />}
      {step === 3 && <StepWorkload value={workload} onChange={setWorkload} onNext={function() { setStep(4) }} onBack={function() { setStep(2) }} />}
      {step === 4 && <StepTrigger values={triggers} onChange={(v: string[]) => setTriggers(v)} wantsToTalk={wantsToTalk} onWantsToTalkChange={(v: boolean) => setWantsToTalk(v)} onNext={function() { setStep(5) }} onBack={function() { setStep(3) }} />}
      {step === 5 && <StepText value={freeText} onChange={setFreeText} college={college} onCollegeChange={setCollege} colleges={colleges} onSubmit={handleSubmit} onBack={function() { setStep(4) }} loading={loading} error={error} />}
    </div>
  )
}
