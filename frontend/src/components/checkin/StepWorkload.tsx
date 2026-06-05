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
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
        How is your workload right now?
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>
        Think about the last few days.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "16px",
              border: value === opt.value ? "2px solid #1a1a1a" : "1px solid #e5e5e5",
              borderRadius: "8px",
              backgroundColor: value === opt.value ? "#f0f0f0" : "#fff",
              fontSize: "15px",
              fontWeight: value === opt.value ? 600 : 400,
              textAlign: "left",
            }}
          >
            <div>{opt.label}</div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "2px", fontWeight: 400 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "14px",
            backgroundColor: "#fff",
            color: "#1a1a1a",
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            fontSize: "15px",
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          style={{
            flex: 2,
            padding: "14px",
            backgroundColor: value ? "#1a1a1a" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}