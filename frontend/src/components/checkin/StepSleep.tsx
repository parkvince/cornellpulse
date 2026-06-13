interface Props {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}

const options = [
  { value: "under_4", label: "Under 4 hours" },
  { value: "4_to_6", label: "4 to 6 hours" },
  { value: "6_to_8", label: "6 to 8 hours" },
  { value: "over_8", label: "More than 8 hours" },
]

export default function StepSleep({ value, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Step 2</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        How much did you sleep last night?
      </h2>
      <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "32px" }}>Pick the closest option.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "48px" }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ padding: "18px 16px", border: "none", borderRadius: "4px", backgroundColor: value === opt.value ? "#1db954" : "#181818", fontSize: "15px", fontWeight: value === opt.value ? 700 : 400, color: value === opt.value ? "#000000" : "#ffffff", textAlign: "left", cursor: "pointer", letterSpacing: value === opt.value ? "0.02em" : "0" }}>
            {opt.label}
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