import { useState } from "react"

const CORAL = "#FF5A5F"
const CORAL_TEXT = "#8A292D"

interface Props {
  values: string[]
  onChange: (v: string[]) => void
  wantsToTalk: boolean | null
  onWantsToTalkChange: (v: boolean) => void
  onNext: () => void
  onBack: () => void
}

const triggers = [
  { value: "academics", label: "Academics" }, { value: "social", label: "Social life" },
  { value: "financial", label: "Money" }, { value: "family", label: "Family" },
  { value: "identity", label: "Identity" }, { value: "health", label: "Health" },
  { value: "future", label: "Future" }, { value: "loneliness", label: "Loneliness" },
  { value: "sleep", label: "Sleep" }, { value: "housing", label: "Housing" },
  { value: "grief", label: "Grief or loss" }, { value: "discrimination", label: "Discrimination" },
  { value: "nothing_specific", label: "Nothing specific" },
]

export default function StepTrigger({ values, onChange, wantsToTalk, onWantsToTalkChange, onNext, onBack }: Props) {
  const [error, setError] = useState("")
  const [limitMessage, setLimitMessage] = useState("")

  function toggle(value: string) {
    setError("")
    setLimitMessage("")
    if (value === "nothing_specific") { onChange(["nothing_specific"]); return }
    const selected = values.filter(item => item !== "nothing_specific")
    if (selected.length >= 4 && !selected.includes(value)) {
      setLimitMessage("You can choose up to four. Remove one before adding another.")
      return
    }
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value])
  }

  function continueFlow() {
    if (values.length === 0) {
      setError("Choose at least one option before continuing.")
      return
    }
    onNext()
  }

  function activateWithKeyboard(event: React.KeyboardEvent<HTMLInputElement>, activate: () => void) {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    activate()
  }

  return (
    <section data-checkin-step="3" aria-labelledby="triggers-heading">
      <h2 id="triggers-heading" tabIndex={-1} style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>What is weighing on you?</h2>
      <p id="trigger-help" style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>Choose up to four that feel most relevant.</p>

      <fieldset aria-describedby={`trigger-help${limitMessage ? " trigger-limit" : ""}`} style={{ border: 0, minWidth: 0 }}>
        <legend className="sr-only">Topics weighing on you</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          {triggers.map(option => {
            const selected = values.includes(option.value)
            return <label key={option.value} className="checkin-choice" style={{ padding: "13px 10px", border: `2px solid ${selected ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: selected ? "#FFF0F0" : "#ffffff", textAlign: "center" }}><input className="checkin-choice-input" type="checkbox" value={option.value} checked={selected} onChange={() => toggle(option.value)} onKeyDown={event => activateWithKeyboard(event, () => toggle(option.value))} /><span style={{ fontSize: "13px", fontWeight: 600, color: selected ? CORAL_TEXT : "#222222", display: "block", overflowWrap: "anywhere" }}>{option.label}</span></label>
          })}
        </div>
      </fieldset>
      <p id="trigger-limit" role="status" aria-live="polite" style={{ minHeight: "20px", fontSize: "12px", color: "#b07000", marginBottom: "18px" }}>{limitMessage}</p>

      <fieldset style={{ border: 0, minWidth: 0, marginBottom: "28px" }}>
        <legend style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Would talking to another Cornell student feel useful?</legend>
        <p id="talk-help" style={{ fontSize: "13px", color: "#717171", marginBottom: "14px" }}>This preference only affects the options shown in this check-in.</p>
        <div role="radiogroup" aria-describedby="talk-help" style={{ display: "flex", gap: "8px" }}>
          <label className="checkin-choice" style={{ flex: 1, padding: "14px", border: `2px solid ${wantsToTalk === true ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: wantsToTalk === true ? "#FFF0F0" : "#ffffff", fontSize: "14px", fontWeight: 600, color: wantsToTalk === true ? CORAL_TEXT : "#222222", textAlign: "center" }}><input className="checkin-choice-input" type="radio" name="wants-to-talk" checked={wantsToTalk === true} onChange={() => onWantsToTalkChange(true)} onKeyDown={event => activateWithKeyboard(event, () => onWantsToTalkChange(true))} /><span>Yes</span></label>
          <label className="checkin-choice" style={{ flex: 1, padding: "14px", border: `2px solid ${wantsToTalk === false ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: wantsToTalk === false ? "#FFF0F0" : "#ffffff", fontSize: "14px", fontWeight: 600, color: wantsToTalk === false ? CORAL_TEXT : "#222222", textAlign: "center" }}><input className="checkin-choice-input" type="radio" name="wants-to-talk" checked={wantsToTalk === false} onChange={() => onWantsToTalkChange(false)} onKeyDown={event => activateWithKeyboard(event, () => onWantsToTalkChange(false))} /><span>Not right now</span></label>
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
