import { useState } from "react"

const CORAL = "#C83C42"

interface Props {
  sleep: string; onSleepChange: (v: string) => void
  workload: string; onWorkloadChange: (v: string) => void
  onNext: () => void; onBack: () => void
}

const sleepOpts = [
  { value: "under_4", label: "Under 4 hours" },
  { value: "4_to_6", label: "4 to 6 hours" },
  { value: "6_to_8", label: "6 to 8 hours" },
  { value: "over_8", label: "More than 8 hours" },
]

const workloadOpts = [
  { value: "light", label: "Light", desc: "Keeping up without much stress" },
  { value: "moderate", label: "Moderate", desc: "Busy but manageable" },
  { value: "heavy", label: "Heavy", desc: "Struggling to keep up" },
  { value: "unbearable", label: "Overwhelming", desc: "It feels impossible to keep up" },
]

export default function StepSleepWorkload({ sleep, onSleepChange, workload, onWorkloadChange, onNext, onBack }: Props) {
  const [error, setError] = useState("")

  function continueFlow() {
    if (!sleep || !workload) {
      setError(!sleep && !workload ? "Choose a sleep range and workload level before continuing." : !sleep ? "Choose a sleep range before continuing." : "Choose a workload level before continuing.")
      return
    }
    onNext()
  }

  function selectWithKeyboard(event: React.KeyboardEvent<HTMLInputElement>, select: () => void) {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    select()
  }

  return (
    <section data-checkin-step="2" aria-labelledby="sleep-workload-heading">
      <h2 id="sleep-workload-heading" tabIndex={-1} style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "24px" }}>Sleep and workload</h2>

      <fieldset style={{ border: 0, minWidth: 0, marginBottom: "24px" }}>
        <legend style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Sleep last night</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {sleepOpts.map(option => <label key={option.value} className="checkin-choice" style={{ padding: "14px 10px", border: `2px solid ${sleep === option.value ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: sleep === option.value ? "#FFF0F0" : "#ffffff", fontSize: "13px", fontWeight: 600, color: sleep === option.value ? CORAL : "#222222", textAlign: "center" }}><input className="checkin-choice-input" type="radio" name="sleep" value={option.value} checked={sleep === option.value} onChange={() => { onSleepChange(option.value); setError("") }} onKeyDown={event => selectWithKeyboard(event, () => { onSleepChange(option.value); setError("") })} /><span>{option.label}</span></label>)}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, minWidth: 0, marginBottom: "28px" }}>
        <legend style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Academic workload</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {workloadOpts.map(option => <label key={option.value} className="checkin-choice" style={{ padding: "14px 16px", border: `2px solid ${workload === option.value ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: workload === option.value ? "#FFF0F0" : "#ffffff", textAlign: "left" }}><input className="checkin-choice-input" type="radio" name="workload" value={option.value} checked={workload === option.value} onChange={() => { onWorkloadChange(option.value); setError("") }} onKeyDown={event => selectWithKeyboard(event, () => { onWorkloadChange(option.value); setError("") })} /><span><span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: workload === option.value ? CORAL : "#222222", marginBottom: "2px" }}>{option.label}</span><span style={{ display: "block", fontSize: "12px", color: workload === option.value ? "#A9461E" : "#717171" }}>{option.desc}</span></span></label>)}
        </div>
      </fieldset>

      {error && <p role="alert" style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
      <div className="checkin-actions" style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Back</button>
        <button type="button" onClick={continueFlow} style={{ flex: 2, padding: "16px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}>Continue</button>
      </div>
    </section>
  )
}
