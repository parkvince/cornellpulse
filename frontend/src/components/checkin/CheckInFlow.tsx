import { useEffect, useRef, useState } from "react"
import StepMood from "./StepMood"
import StepSleepWorkload from "./StepSleepWorkload"
import StepTrigger from "./StepTrigger"
import StepText from "./StepText"
import ResultCard from "./ResultCard"
import { submitAggregateContribution } from "../../api/client"
import { buildLocalRecommendation } from "../../checkin/localRecommendations"
import { getPrivacyPreferences } from "../../privacy/preferences"
import { recordLocalMeasurement } from "../../privacy/measurement"
import { deletePlanEntry } from "../../history/localHistory"

const TOTAL_STEPS = 4
const DRAFT_KEY = "cornellpulse_checkin_draft_v2"
const STEP_LABELS = ["How today feels", "Sleep and workload", "What is weighing on you", "Optional context"]

interface StructuredDraft {
  checkinId: string
  step: number
  mood: number | null
  sleep: string
  workload: string
  triggers: string[]
  wantsToTalk: boolean | null
}

function loadDraft(): StructuredDraft {
  const empty: StructuredDraft = { checkinId: crypto.randomUUID(), step: 1, mood: null, sleep: "", workload: "", triggers: [], wantsToTalk: null }
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null") as Partial<StructuredDraft> | null
    if (!parsed || typeof parsed !== "object") return empty
    return {
      checkinId: typeof parsed.checkinId === "string" && /^[0-9a-f-]{36}$/i.test(parsed.checkinId) ? parsed.checkinId : empty.checkinId,
      step: typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= TOTAL_STEPS ? parsed.step : 1,
      mood: typeof parsed.mood === "number" && parsed.mood >= 1 && parsed.mood <= 10 ? parsed.mood : null,
      sleep: typeof parsed.sleep === "string" ? parsed.sleep : "",
      workload: typeof parsed.workload === "string" ? parsed.workload : "",
      triggers: Array.isArray(parsed.triggers) ? parsed.triggers.filter(value => typeof value === "string").slice(0, 4) : [],
      wantsToTalk: typeof parsed.wantsToTalk === "boolean" ? parsed.wantsToTalk : null,
    }
  } catch {
    return empty
  }
}

export default function CheckInFlow() {
  const [initialDraft] = useState(loadDraft)
  const [step, setStep] = useState(initialDraft.step)
  const [mood, setMood] = useState<number | null>(initialDraft.mood)
  const [sleep, setSleep] = useState(initialDraft.sleep)
  const [workload, setWorkload] = useState(initialDraft.workload)
  const [triggers, setTriggers] = useState<string[]>(initialDraft.triggers)
  const [wantsToTalk, setWantsToTalk] = useState<boolean | null>(initialDraft.wantsToTalk)
  const [freeText, setFreeText] = useState("")
  const [result, setResult] = useState<ReturnType<typeof buildLocalRecommendation> | null>(null)
  const [checkinId, setCheckinId] = useState(initialDraft.checkinId)
  const [aggregateNotice, setAggregateNotice] = useState("")
  const stepContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const draft: StructuredDraft = { checkinId, step, mood, sleep, workload, triggers, wantsToTalk }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [checkinId, mood, sleep, step, triggers, wantsToTalk, workload])

  useEffect(() => {
    const appScroller = document.getElementById("app-scroll-container")
    appScroller?.scrollTo({ top: 0, behavior: "smooth" })
    const focusHeading = () => stepContainerRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true })
    const frame = window.requestAnimationFrame(focusHeading)
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  function resetCheckin() {
    sessionStorage.removeItem(DRAFT_KEY)
    setStep(1)
    setMood(null)
    setSleep("")
    setWorkload("")
    setTriggers([])
    setWantsToTalk(null)
    setFreeText("")
    setResult(null)
    setAggregateNotice("")
    setCheckinId(crypto.randomUUID())
  }

  function deleteCurrentCheckin() {
    if (!confirm("Delete this check-in from this device?")) return
    try {
      deletePlanEntry(checkinId)
    } catch {
      localStorage.removeItem("cornellpulse_history")
    }
    resetCheckin()
  }

  function handleSubmit() {
    if (mood === null || !sleep || !workload || triggers.length === 0) return
    const localResult = buildLocalRecommendation({ mood, sleep, workload, triggers, wantsToTalk, freeText })
    setResult(localResult)
    setFreeText("")
    sessionStorage.removeItem(DRAFT_KEY)
    recordLocalMeasurement("checkin_completion")

    if (getPrivacyPreferences().aggregateContribution) {
      setAggregateNotice("Sending an optional campus-wide completion count...")
      void submitAggregateContribution({ event: "checkin_completed", consent_granted: true }, fetch, undefined, checkinId)
        .then(() => setAggregateNotice("Optional completion count sent. No check-in answers or college were included."))
        .catch(() => setAggregateNotice("Your local recommendation is ready, but the optional completion count could not be sent."))
    } else {
      setAggregateNotice("No aggregate contribution was sent.")
    }
  }

  if (result && mood !== null) {
    return <ResultCard result={result} moodScore={mood} triggers={triggers} wantsToTalk={wantsToTalk} checkinId={checkinId} aggregateNotice={aggregateNotice} onRestart={resetCheckin} onDelete={deleteCurrentCheckin} />
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", marginBottom: "10px" }}>Part {step} of {TOTAL_STEPS} · {STEP_LABELS[step - 1]}</p>
        <div role="progressbar" aria-label="Check-in progress" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-valuetext={`Part ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step - 1]}`} style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "6px" }}>
          <div style={{ height: "6px", background: "linear-gradient(90deg, #FF385C 0%, #D70466 100%)", borderRadius: "6px", width: `${(step / TOTAL_STEPS) * 100}%`, transition: "width 0.25s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginTop: "8px" }}>
          <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5 }}>Your choices and a random duplicate-prevention ID are kept temporarily in this tab so Back and refresh work. Optional written context is never included.</p>
          <button type="button" onClick={deleteCurrentCheckin} style={{ backgroundColor: "transparent", border: "none", color: "#717171", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, flexShrink: 0 }}>Delete this check-in</button>
        </div>
      </div>

      <div ref={stepContainerRef}>
        {step === 1 && <StepMood value={mood} onChange={setMood} onNext={() => setStep(2)} />}
        {step === 2 && <StepSleepWorkload sleep={sleep} onSleepChange={setSleep} workload={workload} onWorkloadChange={setWorkload} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepTrigger values={triggers} onChange={setTriggers} wantsToTalk={wantsToTalk} onWantsToTalkChange={setWantsToTalk} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepText value={freeText} onChange={setFreeText} onSubmit={handleSubmit} onBack={() => setStep(3)} loading={false} error="" />}
      </div>
    </div>
  )
}
