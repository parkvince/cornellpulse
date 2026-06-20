const PINK = "#e8a0b4"
interface CollegeOption { value: string; label: string }
interface Props { value: string; onChange: (v: string) => void; college: string; onCollegeChange: (v: string) => void; colleges: CollegeOption[]; onSubmit: () => void; onBack: () => void; loading: boolean; error: string }

export default function StepText({ value, onChange, college, onCollegeChange, colleges, onSubmit, onBack, loading, error }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 4 of 4</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "10px" }}>Anything else on your mind?</h2>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "24px" }}>Optional. Never saved anywhere.</p>
      <textarea value={value} onChange={e => onChange(e.target.value)} maxLength={500} placeholder="You can write anything here..." rows={4} style={{ width: "100%", padding: "16px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", resize: "none", marginBottom: "8px", backgroundColor: "#1a1a1a", color: "#fff" }} />
      <p style={{ fontSize: "12px", color: "#4a4a4a", textAlign: "right", marginBottom: "24px" }}>{value.length}/500</p>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Your college</p>
      <select value={college} onChange={e => onCollegeChange(e.target.value)} style={{ width: "100%", padding: "16px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", marginBottom: "32px", backgroundColor: "#1a1a1a", color: college ? "#fff" : "#4a4a4a" }}>
        <option value="">Select your college (optional)</option>
        {colleges.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      {error && <p style={{ color: "#e63946", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "18px", backgroundColor: "transparent", color: "#a0a0a0", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px" }}>Back</button>
<button onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: "18px", backgroundColor: loading ? "#1a1a1a" : PINK, color: loading ? "#a0a0a0" : "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          {loading && <span style={{ width: "14px", height: "14px", border: "2px solid #4a4a4a", borderTopColor: "#e8a0b4", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          {loading ? "FINDING YOUR MATCH" : "FIND RESOURCES"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>      </div>
    </div>
  )
}