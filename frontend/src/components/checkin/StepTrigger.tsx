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
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Step 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>What is weighing on you?</h2>
      <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "24px" }}>Select everything that applies.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "32px" }}>
        {triggers.map(function(opt) {
          const selected = values.includes(opt.value)
          return (
            <button key={opt.value} onClick={function() { toggle(opt.value) }} style={{ padding: "14px 10px", border: "none", borderRadius: "4px", backgroundColor: selected ? "#1db954" : "#181818", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: selected ? 700 : 400, color: selected ? "#000000" : "#ffffff", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>Want to talk to another Cornell student?</p>
        <p style={{ fontSize: "13px", color: "#b3b3b3", marginBottom: "16px" }}>We can connect you with someone who wants to grab food or coffee and just listen.</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={function() { onWantsToTalkChange(true) }} style={{ flex: 1, padding: "14px", border: "none", borderRadius: "4px", backgroundColor: wantsToTalk === true ? "#1db954" : "#181818", fontSize: "14px", fontWeight: wantsToTalk === true ? 700 : 400, color: wantsToTalk === true ? "#000000" : "#ffffff", cursor: "pointer" }}>Yes please</button>
          <button onClick={function() { onWantsToTalkChange(false) }} style={{ flex: 1, padding: "14px", border: "none", borderRadius: "4px", backgroundColor: wantsToTalk === false ? "#1db954" : "#181818", fontSize: "14px", fontWeight: wantsToTalk === false ? 700 : 400, color: wantsToTalk === false ? "#000000" : "#ffffff", cursor: "pointer" }}>Not right now</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "transparent", color: "#b3b3b3", border: "1px solid #282828", borderRadius: "4px", fontSize: "14px", cursor: "pointer" }}>Back</button>
        <button onClick={onNext} disabled={values.length === 0} style={{ flex: 2, padding: "16px", backgroundColor: values.length > 0 ? "#1db954" : "#282828", color: values.length > 0 ? "#000000" : "#535353", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 700, cursor: values.length > 0 ? "pointer" : "default", letterSpacing: "0.04em" }}>NEXT</button>
      </div>
    </div>
  )
}
