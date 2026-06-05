import { useState } from "react"
import StepMood from "./StepMood"
import StepSleep from "./StepSleep"
import StepWorkload from "./StepWorkload"
import StepText from "./StepText"
import ResultCard from "./ResultCard"
import { submitCheckin } from "../../api/client"

interface CheckInResponse {
  triage_result: {
    primary: object
    secondary: object[]
    crisis_flag: boolean
    distress_level: string
  }
  aggregate_updated: boolean
}

const TOTAL_STEPS = 4

export default function CheckInFlow() {
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState(5)
  const [sleep, setSleep] = useState("")
  const [workload, setWorkload] = useState("")
  const [freeText, setFreeText] = useState("")
  const [college, setCollege] = useState("")
  const [result, setResult] = useState<CheckInResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
        free_text: freeText || undefined,
        college: college || "other",
        session_token: token,
      })
      setResult(data)
    } catch {
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
    setFreeText("")
    setCollege("")
    setResult(null)
    setError("")
  }

  if (result) {
    return <ResultCard result={result} onRestart={restart} />
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
          Step {step} of {TOTAL_STEPS}
        </div>
        <div style={{ height: "3px", backgroundColor: "#e5e5e5", borderRadius: "2px" }}>
          <div style={{
            height: "3px",
            backgroundColor: "#1a1a1a",
            borderRadius: "2px",
            width: `${(step / TOTAL_STEPS) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {step === 1 && (
        <StepMood
          value={mood}
          onChange={setMood}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepSleep
          value={sleep}
          onChange={setSleep}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepWorkload
          value={workload}
          onChange={setWorkload}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepText
          value={freeText}
          onChange={setFreeText}
          college={college}
          onCollegeChange={setCollege}
          colleges={colleges}
          onSubmit={handleSubmit}
          onBack={() => setStep(3)}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}