const CORAL = "#FF5A5F"
interface CollegeOption { value: string; label: string }
interface Props { value: string; onChange: (v: string) => void; college: string; onCollegeChange: (v: string) => void; colleges: CollegeOption[]; onSubmit: () => void; onBack: () => void; loading: boolean; error: string }

export default function StepText({ value, onChange, college, onCollegeChange, colleges, onSubmit, onBack, loading, error }: Props) {
  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step 4 of 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>Anything else on your mind?</h2>
      <p style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>Optional. Sent to the server for this resource match; the application does not intentionally write raw check-in text to its database.</p>

      <textarea value={value} onChange={e => onChange(e.target.value)} maxLength={500} placeholder="You can write anything here..." rows={4} style={{ width: "100%", padding: "16px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", resize: "none", marginBottom: "6px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
      <p style={{ fontSize: "12px", color: "#b0b0b0", textAlign: "right", marginBottom: "20px" }}>{value.length}/500</p>

      <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Your college</p>
      <select value={college} onChange={e => onCollegeChange(e.target.value)} style={{ width: "100%", padding: "14px 16px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", marginBottom: "32px", backgroundColor: "#ffffff", color: college ? "#222222" : "#b0b0b0", fontFamily: "DM Sans, sans-serif" }}>
        <option value="" style={{ color: "#b0b0b0" }}>Select your college (optional)</option>
        {colleges.map(c => <option key={c.value} value={c.value} style={{ color: "#222222", backgroundColor: "#ffffff" }}>{c.label}</option>)}
      </select>

      {error && <p style={{ color: "#FF5A5F", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Back</button>
        <button onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: "16px", backgroundColor: loading ? "#ebebeb" : CORAL, color: loading ? "#b0b0b0" : "#ffffff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          {loading && <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          {loading ? "Finding your match..." : "Find resources →"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
