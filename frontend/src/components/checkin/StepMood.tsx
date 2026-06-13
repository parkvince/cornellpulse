interface Props {
  value: number
  onChange: (v: number) => void
  onNext: () => void
}

export default function StepMood({ value, onChange, onNext }: Props) {
  function getMoodColor(m: number) {
    if (m >= 7) return "#1db954"
    if (m >= 5) return "#f59b00"
    if (m >= 3) return "#e85d04"
    return "#e63946"
  }

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Step 1</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        How are you feeling right now?
      </h2>
      <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "48px" }}>
        1 is overwhelmed, 10 is thriving.
      </p>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span style={{ fontSize: "80px", fontWeight: 700, color: getMoodColor(value), letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: "24px", color: "#535353" }}>/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", marginBottom: "12px", accentColor: getMoodColor(value), height: "4px" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#535353", marginBottom: "48px" }}>
        <span>Overwhelmed</span>
        <span>Thriving</span>
      </div>
      <button onClick={onNext} style={{ width: "100%", padding: "16px", backgroundColor: "#1db954", color: "#000000", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
        NEXT
      </button>
    </div>
  )
}