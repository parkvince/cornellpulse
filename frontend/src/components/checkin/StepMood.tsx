const CORAL = "#FF5A5F"

interface Props { value: number; onChange: (v: number) => void; onNext: () => void }

function moodColor(m: number) {
  if (m >= 7) return "#00A699"
  if (m >= 5) return "#FC642D"
  if (m >= 3) return "#FF5A5F"
  return "#c0392b"
}

export default function StepMood({ value, onChange, onNext }: Props) {
  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step 1 of 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>How are you feeling today?</h2>
      <p style={{ fontSize: "14px", color: "#717171", marginBottom: "40px" }}>1 = really not great, 10 = really good</p>

      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <span style={{ fontSize: "88px", fontWeight: 800, color: moodColor(value), letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: "24px", color: "#b0b0b0" }}>/10</span>
      </div>

      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", marginBottom: "10px", accentColor: moodColor(value), height: "4px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#b0b0b0", marginBottom: "48px" }}>
        <span>Overwhelmed</span><span>Thriving</span>
      </div>

      <button onClick={onNext} style={{ width: "100%", padding: "18px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700 }}>Continue →</button>
    </div>
  )
}