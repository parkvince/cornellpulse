import { useState } from "react"
import StepMood from "./StepMood"
import StepSleepWorkload from "./StepSleepWorkload"
import StepTrigger from "./StepTrigger"
import StepText from "./StepText"
import ResultCard from "./ResultCard"
import { submitAggregateContribution } from "../../api/client"
import { buildLocalRecommendation } from "../../checkin/localRecommendations"
import { getPrivacyPreferences } from "../../privacy/preferences"

const TOTAL_STEPS = 4

export default function CheckInFlow() {
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState(5)
  const [sleep, setSleep] = useState("")
  const [workload, setWorkload] = useState("")
  const [triggers, setTriggers] = useState<string[]>([])
  const [wantsToTalk, setWantsToTalk] = useState<boolean | null>(null)
  const [freeText, setFreeText] = useState("")
  const [college, setCollege] = useState("")
  const [result, setResult] = useState<ReturnType<typeof buildLocalRecommendation> | null>(null)
  const [checkinId, setCheckinId] = useState(() => crypto.randomUUID())
  const [aggregateNotice, setAggregateNotice] = useState("")

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

  function resetCheckin() {
    setStep(1)
    setMood(5)
    setSleep("")
    setWorkload("")
    setTriggers([])
    setWantsToTalk(null)
    setFreeText("")
    setCollege("")
    setResult(null)
    setAggregateNotice("")
    setCheckinId(crypto.randomUUID())
  }

  function deleteCurrentCheckin() {
    if (!confirm("Delete this check-in from this device?")) return
    try {
      const history = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]") as Array<{ id?: string }>
      localStorage.setItem("cornellpulse_history", JSON.stringify(history.filter(entry => entry.id !== checkinId)))
    } catch {
      localStorage.removeItem("cornellpulse_history")
    }
    resetCheckin()
  }

  function handleSubmit() {
    const localResult = buildLocalRecommendation({ mood, sleep, workload, triggers, wantsToTalk, freeText })
    setResult(localResult)
    setFreeText("")

    if (getPrivacyPreferences().aggregateContribution) {
      setAggregateNotice("Sending the optional four-field aggregate contribution...")
      void submitAggregateContribution({
        mood_score: mood,
        sleep_category: sleep,
        workload_category: workload,
        college: college || "other",
      }).then(() => setAggregateNotice("Optional aggregate contribution sent.")).catch(() => setAggregateNotice("Your local recommendation is ready, but the optional aggregate contribution could not be sent."))
    } else {
      setAggregateNotice("No aggregate contribution was sent.")
    }
  }

  if (result) {
    return <ResultCard result={result} moodScore={mood} triggers={triggers} wantsToTalk={wantsToTalk} checkinId={checkinId} aggregateNotice={aggregateNotice} onRestart={resetCheckin} onDelete={deleteCurrentCheckin} />
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171" }}>Step {step} of {TOTAL_STEPS}</p>
          <p style={{ fontSize: "12px", color: "#b0b0b0" }}>{Math.round((step / TOTAL_STEPS) * 100)}% complete</p>
        </div>
        <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "6px" }}>
          <div style={{ height: "6px", backgroundColor: "#FF5A5F", borderRadius: "6px", width: ((step / TOTAL_STEPS) * 100) + "%", transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginTop: "8px" }}>
          <p style={{ fontSize: "11px", color: "#b0b0b0", lineHeight: 1.5 }}>Answers exist only in this page's memory while it is open. CornellPulse does not save an unfinished check-in draft.</p>
          <button onClick={deleteCurrentCheckin} style={{ backgroundColor: "transparent", border: "none", color: "#717171", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, flexShrink: 0 }}>Delete this check-in</button>
        </div>
      </div>
      {step === 1 && <StepMood value={mood} onChange={setMood} onNext={() => setStep(2)} />}
      {step === 2 && <StepSleepWorkload sleep={sleep} onSleepChange={setSleep} workload={workload} onWorkloadChange={setWorkload} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepTrigger values={triggers} onChange={setTriggers} wantsToTalk={wantsToTalk} onWantsToTalkChange={setWantsToTalk} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <StepText value={freeText} onChange={setFreeText} college={college} onCollegeChange={setCollege} colleges={colleges} onSubmit={handleSubmit} onBack={() => setStep(3)} loading={false} error="" />}
    </div>
  )
}
