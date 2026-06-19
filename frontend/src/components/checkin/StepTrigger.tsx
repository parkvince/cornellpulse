const PINK = "#e8a0b4"

interface Props {
  values: string[]
  onChange: (v: string[]) => void
  wantsToTalk: boolean | null
  onWantsToTalkChange: (v: boolean) => void
  onNext: () => void
  onBack: () => void
}

const triggers = [
  { value: "academics", label: "Academics" },
  { value: "social", label: "Social life" },
  { value: "financial", label: "Money" },
  { value: "family", label: "Family" },
  { value: "identity", label: "Identity" },
  { value: "health", label: "Health" },
  { value: "future", label: "Future" },
  { value: "loneliness", label: "Loneliness" },
  { value: "sleep", label: "Sleep" },
  { value: "housing", label: "Housing" },
  { value: "grief", label: "Grief or loss" },
  { value: "discrimination", label: "Discrimination" },
  { value: "nothing_specific", label: "Nothing specific" },
]

export default function StepTrigger(props: Props) {
  const { values, onChange, wantsToTalk, onWantsToTalkChange, onNext, onBack } = props

  function toggle(val: string) {
    if (val === "nothing_specific") { onChange(["nothing_specific"]); return }
    const f = values.filter(v => v !== "nothing_specific")
    onChange(f.includes(val) ? f.filter(v => v !== val) : [...f, val])
  }

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 4 of 4</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "10px" }}>What is weighing on you?</h2>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "24px" }}>Select everything that applies.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "32px" }}>
        {triggers.map(opt => {
          const sel = values.includes(opt.value)
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)} style={{ padding: "15px 10px", border: "none", borderRadius: "8px", backgroundColor: sel ? PINK : "#1a1a1a", textAlign: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: sel ? 800 : 400, color: sel ? "#0f0f0f" : "#fff", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.label}</span>
            </button>
          )
        })}
      </div>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>Want to talk to another Cornell student?</p>
        <p style={{ fontSize: "13px", color: "#a0a0a0", marginBottom: "14px" }}>We can connect you with someone who wants to grab food or coffee and just listen.</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onWantsToTalkChange(true)} style={{ flex: 1, padding: "16px", border: "none", borderRadius: "8px", backgroundColor: wantsToTalk === true ? PINK : "#1a1a1a", fontSize: "14px", fontWeight: wantsToTalk === true ? 800 : 400, color: wantsToTalk === true ? "#0f0f0f" : "#fff" }}>Yes please</button>
          <button onClick={() => onWantsToTalkChange(false)} style={{ flex: 1, padding: "16px", border: "none", borderRadius: "8px", backgroundColor: wantsToTalk === false ? PINK : "#1a1a1a", fontSize: "14px", fontWeight: wantsToTalk === false ? 800 : 400, color: wantsToTalk === false ? "#0f0f0f" : "#fff" }}>Not right now</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "18px", backgroundColor: "transparent", color: "#a0a0a0", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px" }}>Back</button>
        <button onClick={onNext} disabled={values.length === 0} style={{ flex: 2, padding: "18px", backgroundColor: values.length > 0 ? PINK : "#1a1a1a", color: values.length > 0 ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
      </div>
    </div>
  )
}
