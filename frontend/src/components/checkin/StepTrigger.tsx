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
    if (val === "nothing_specific") {
      onChange(["nothing_specific"])
      return
    }
    const filtered = values.filter(function(v) { return v !== "nothing_specific" })
    if (filtered.includes(val)) {
      onChange(filtered.filter(function(v) { return v !== val }))
    } else {
      onChange([...filtered, val])
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>What is weighing on you?</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>Select everything that applies.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "32px" }}>
        {triggers.map(function(opt) {
          const selected = values.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={function() { toggle(opt.value) }}
              style={{
                padding: "12px 8px",
                border: "1.5px solid",
                borderColor: selected ? "#1a1a1a" : "#e5e5e5",
                borderRadius: "10px",
                backgroundColor: selected ? "#1a1a1a" : "#fff",
                cursor: "pointer",
                textAlign: "center",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 500, color: selected ? "#fff" : "#1a1a1a", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>Want to talk to another Cornell student?</p>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>We can connect you with someone who wants to grab food or coffee and just listen.</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={function() { onWantsToTalkChange(true) }} style={{ flex: 1, padding: "14px", border: wantsToTalk === true ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "10px", backgroundColor: wantsToTalk === true ? "#f0f0f0" : "#fff", fontSize: "15px", fontWeight: wantsToTalk === true ? 600 : 400, cursor: "pointer" }}>Yes please</button>
          <button onClick={function() { onWantsToTalkChange(false) }} style={{ flex: 1, padding: "14px", border: wantsToTalk === false ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "10px", backgroundColor: wantsToTalk === false ? "#f0f0f0" : "#fff", fontSize: "15px", fontWeight: wantsToTalk === false ? 600 : 400, cursor: "pointer" }}>Not right now</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", backgroundColor: "#fff", color: "#1a1a1a", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", cursor: "pointer" }}>Back</button>
        <button onClick={onNext} disabled={values.length === 0} style={{ flex: 2, padding: "14px", backgroundColor: values.length > 0 ? "#1a1a1a" : "#ccc", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: values.length > 0 ? "pointer" : "default" }}>Next</button>
      </div>
    </div>
  )
}
