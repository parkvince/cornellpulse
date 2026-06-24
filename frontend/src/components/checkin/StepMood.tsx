const CORAL = "#FF5A5F"

interface Props { value: number; onChange: (v: number) => void; onNext: () => void }

function moodColor(m: number) {
  if (m >= 7) return "#00A699"
  if (m >= 5) return "#FC642D"
  if (m >= 3) return "#FF5A5F"
  return "#c0392b"
}

function moodLabel(m: number) {
  if (m >= 7) return "Thriving"
  if (m >= 5) return "Managing"
  if (m >= 3) return "Struggling"
  return "Really not great"
}

export default function StepMood({ value, onChange, onNext }: Props) {
  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step 1 of 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>How are you feeling today?</h2>
      <p style={{ fontSize: "14px", color: "#717171", marginBottom: "32px" }}>1 = really not great, 10 = really good</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "28px" }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              aspectRatio: "1",
              border: value === n ? `2px solid ${moodColor(n)}` : "2px solid #ebebeb",
              borderRadius: "14px",
              backgroundColor: value === n ? moodColor(n) : "#ffffff",
              fontSize: "18px",
              fontWeight: 700,
              color: value === n ? "#ffffff" : "#222222",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: value === n ? `0 4px 12px ${moodColor(n)}40` : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.15s ease",
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {value > 0 && (
        <div style={{ backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "12px 16px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: moodColor(value), flexShrink: 0 }} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: moodColor(value) }}>{value}/10 — {moodLabel(value)}</p>
        </div>
      )}

      <button onClick={onNext} disabled={value === 0} style={{ width: "100%", padding: "18px", backgroundColor: value > 0 ? CORAL : "#ebebeb", color: value > 0 ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700 }}>
        Continue
      </button>
    </div>
  )
}