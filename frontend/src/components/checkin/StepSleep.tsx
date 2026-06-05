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
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
        How much did you sleep last night?
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>
        Pick the closest option.
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
            {opt.label}
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