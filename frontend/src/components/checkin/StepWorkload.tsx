interface Props {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}

const options = [
  { value: "light", label: "Light", desc: "Keeping up without much stress" },
  { value: "moderate", label: "Moderate", desc: "Busy but manageable" },
  { value: "heavy", label: "Heavy", desc: "Struggling to keep up" },
  { value: "unbearable", label: "Unbearable", desc: "Cannot keep up at all" },
]

export default function StepWorkload({ value, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Step 3</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        How is your workload right now?
      </h2>
      <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "32px" }}>Think about the last few days.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "48px" }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ padding: "18px 16px", border: "none", borderRadius: "4px", backgroundColor: value === opt.value ? "#1db954" : "#181818", textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: value === opt.value ? "#000000" : "#ffffff", marginBottom: "2px" }}>{opt.label}</div>
            <div style={{ fontSize: "12px", color: value === opt.value ? "#000000" : "#535353" }}>{opt.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "transparent", color: "#b3b3b3", border: "1px solid #282828", borderRadius: "4px", fontSize: "14px", cursor: "pointer" }}>Back</button>
        <button onClick={onNext} disabled={!value} style={{ flex: 2, padding: "16px", backgroundColor: value ? "#1db954" : "#282828", color: value ? "#000000" : "#535353", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 700, cursor: value ? "pointer" : "default", letterSpacing: "0.04em" }}>NEXT</button>
      </div>
    </div>
  )
}