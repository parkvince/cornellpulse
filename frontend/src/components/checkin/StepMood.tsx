import { useState } from "react"

const CORAL = "#D70466"

interface Props { value: number | null; onChange: (v: number) => void; onNext: () => void }

function moodColor(m: number) {
  if (m >= 7) return "#007A70"
  if (m >= 5) return "#A9461E"
  if (m >= 3) return "#D70466"
  return "#c0392b"
}

function moodLabel(m: number) {
  if (m >= 7) return "Feeling good"
  if (m >= 5) return "Getting through it"
  if (m >= 3) return "Having a hard day"
  return "Having a very hard day"
}

export default function StepMood({ value, onChange, onNext }: Props) {
  const [error, setError] = useState("")

  function selectMood(mood: number) {
    onChange(mood)
    setError("")
  }

  function continueFlow() {
    if (value === null) {
      setError("Choose a number before continuing.")
      return
    }
    onNext()
  }

  function handleMoodKey(event: React.KeyboardEvent<HTMLInputElement>, mood: number) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      selectMood(mood)
      return
    }
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const nextMood = Math.min(10, Math.max(1, mood + direction))
    selectMood(nextMood)
    event.currentTarget.closest("fieldset")?.querySelector<HTMLInputElement>(`input[value="${nextMood}"]`)?.focus()
  }

  return (
    <section data-checkin-step="1" aria-labelledby="mood-heading">
      <h2 id="mood-heading" tabIndex={-1} style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>How are you feeling today?</h2>
      <p id="mood-help" style={{ fontSize: "14px", color: "#717171", marginBottom: "32px" }}>Choose the number that feels closest. There is no right answer.</p>

      <fieldset aria-describedby={`mood-help${error ? " mood-error" : ""}`} style={{ border: 0, minWidth: 0 }}>
        <legend className="sr-only">Mood from 1, having a very hard day, to 10, feeling good</legend>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "10px", marginBottom: "28px" }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <label key={n} className="checkin-choice" style={{ aspectRatio: "1", border: value === n ? `2px solid ${moodColor(n)}` : "2px solid #ebebeb", borderRadius: "14px", backgroundColor: value === n ? moodColor(n) : "#ffffff", fontSize: "18px", fontWeight: 700, color: value === n ? "#ffffff" : "#222222", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: value === n ? `0 4px 12px ${moodColor(n)}40` : "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.15s ease" }}>
              <input className="checkin-choice-input" type="radio" name="mood" value={n} checked={value === n} onChange={() => selectMood(n)} onKeyDown={event => handleMoodKey(event, n)} />
              <span aria-hidden="true">{n}</span>
              <span className="sr-only">{n}: {moodLabel(n)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {value !== null && <div aria-live="polite" style={{ backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}><div aria-hidden="true" style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: moodColor(value), flexShrink: 0 }} /><p style={{ fontSize: "14px", fontWeight: 600, color: moodColor(value) }}>{value}/10 — {moodLabel(value)}</p></div>}
      {error && <p id="mood-error" role="alert" style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      <button type="button" onClick={continueFlow} style={{ width: "100%", padding: "18px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700 }}>Continue</button>
    </section>
  )
}
