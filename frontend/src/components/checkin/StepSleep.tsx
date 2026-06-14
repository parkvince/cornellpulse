const PINK = "#e8a0b4"
interface Props { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }
const opts = [{ value: "under_4", label: "Under 4 hours" }, { value: "4_to_6", label: "4 to 6 hours" }, { value: "6_to_8", label: "6 to 8 hours" }, { value: "over_8", label: "More than 8 hours" }]

export default function StepSleep({ value, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 2 of 5</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "10px" }}>How much did you sleep last night?</h2>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "32px" }}>Pick the closest option.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "48px" }}>
        {opts.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ padding: "20px 18px", border: "none", borderRadius: "8px", backgroundColor: value === o.value ? PINK : "#1a1a1a", fontSize: "15px", fontWeight: value === o.value ? 800 : 400, color: value === o.value ? "#0f0f0f" : "#fff", textAlign: "left" }}>
            {o.label}
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