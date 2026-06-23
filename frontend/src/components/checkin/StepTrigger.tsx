const CORAL = "#FF5A5F"

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
    if (f.length >= 4 && !f.includes(val)) return
    onChange(f.includes(val) ? f.filter(v => v !== val) : [...f, val])
  }

  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step 3 of 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>What is weighing on you?</h2>
      <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>Select up to 4 that apply most.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "28px" }}>
        {triggers.map(opt => {
          const sel = values.includes(opt.value)
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)} style={{ padding: "13px 10px", border: "2px solid " + (sel ? CORAL : "#ebebeb"), borderRadius: "12px", backgroundColor: sel ? "#FFF0F0" : "#ffffff", textAlign: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: sel ? CORAL : "#222222", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.label}</span>
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Want to talk to another Cornell student?</p>
      <p style={{ fontSize: "13px", color: "#717171", marginBottom: "14px" }}>We can connect you with someone who wants to grab food or coffee.</p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        <button onClick={() => onWantsToTalkChange(true)} style={{ flex: 1, padding: "14px", border: "2px solid " + (wantsToTalk === true ? CORAL : "#ebebeb"), borderRadius: "12px", backgroundColor: wantsToTalk === true ? "#FFF0F0" : "#ffffff", fontSize: "14px", fontWeight: 600, color: wantsToTalk === true ? CORAL : "#222222" }}>Yes please</button>
        <button onClick={() => onWantsToTalkChange(false)} style={{ flex: 1, padding: "14px", border: "2px solid " + (wantsToTalk === false ? CORAL : "#ebebeb"), borderRadius: "12px", backgroundColor: wantsToTalk === false ? "#FFF0F0" : "#ffffff", fontSize: "14px", fontWeight: 600, color: wantsToTalk === false ? CORAL : "#222222" }}>Not right now</button>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Back</button>
        <button onClick={onNext} disabled={values.length === 0} style={{ flex: 2, padding: "16px", backgroundColor: values.length > 0 ? CORAL : "#ebebeb", color: values.length > 0 ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}>Continue ?</button>
      </div>
    </div>
  )
}
