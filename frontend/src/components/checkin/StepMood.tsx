interface Props {
  value: number
  onChange: (v: number) => void
  onNext: () => void
}

export default function StepMood({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
        How are you feeling right now?
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "40px" }}>
        1 is overwhelmed, 10 is thriving.
      </p>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span style={{ fontSize: "48px", fontWeight: 700 }}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", marginBottom: "40px", accentColor: "#1a1a1a" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#888", marginBottom: "40px" }}>
        <span>Overwhelmed</span>
        <span>Thriving</span>
      </div>
      <button
        onClick={onNext}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#1a1a1a",
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
  )
}