const PINK = "#e8a0b4"
interface Props { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }
const opts = [
  { value: "light", label: "Light", desc: "Keeping up without much stress" },
  { value: "moderate", label: "Moderate", desc: "Busy but manageable" },
  { value: "heavy", label: "Heavy", desc: "Struggling to keep up" },
  { value: "unbearable", label: "Unbearable", desc: "Cannot keep up at all" },
]

export default function StepWorkload({ value, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 3 of 4</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "10px" }}>How is your workload right now?</h2>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "32px" }}>Think about the last few days.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "48px" }}>
        {opts.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ padding: "18px", border: "none", borderRadius: "8px", backgroundColor: value === o.value ? PINK : "#1a1a1a", textAlign: "left" }}>
            <p style={{ fontSize: "15px", fontWeight: 800, color: value === o.value ? "#0f0f0f" : "#fff", marginBottom: "2px" }}>{o.label}</p>
            <p style={{ fontSize: "12px", color: value === o.value ? "#0f0f0f" : "#4a4a4a" }}>{o.desc}</p>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "18px", backgroundColor: "transparent", color: "#a0a0a0", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px" }}>Back</button>
        <button onClick={onNext} disabled={!value} style={{ flex: 2, padding: "18px", backgroundColor: value ? PINK : "#1a1a1a", color: value ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
      </div>
    </div>
  )
}