const PINK = "#e8a0b4"

interface Props { value: number; onChange: (v: number) => void; onNext: () => void }

function moodColor(m: number) {
  if (m >= 7) return "#e8a0b4"
  if (m >= 5) return "#f4c97a"
  if (m >= 3) return "#e8935a"
  return "#e63946"
}

export default function StepMood({ value, onChange, onNext }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 1 of 4</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "10px" }}>How are you feeling right now?</h2>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "52px" }}>1 is overwhelmed, 10 is thriving.</p>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <span style={{ fontSize: "96px", fontWeight: 800, color: moodColor(value), letterSpacing: "-0.06em", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: "28px", color: "#4a4a4a", fontWeight: 400 }}>/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", marginBottom: "10px", accentColor: moodColor(value) }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#4a4a4a", marginBottom: "52px" }}>
        <span>Overwhelmed</span><span>Thriving</span>
      </div>
      <button onClick={onNext} style={{ width: "100%", padding: "18px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
    </div>
  )
}