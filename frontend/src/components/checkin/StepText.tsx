interface CollegeOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (v: string) => void
  college: string
  onCollegeChange: (v: string) => void
  colleges: CollegeOption[]
  onSubmit: () => void
  onBack: () => void
  loading: boolean
  error: string
}

export default function StepText({ value, onChange, college, onCollegeChange, colleges, onSubmit, onBack, loading, error }: Props) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Step 5</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        Anything else on your mind?
      </h2>
      <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "24px" }}>
        Optional. Never saved or stored anywhere.
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={500}
        placeholder="You can write anything here..."
        rows={4}
        style={{ width: "100%", padding: "14px", border: "1px solid #282828", borderRadius: "4px", fontSize: "15px", resize: "none", marginBottom: "8px", backgroundColor: "#181818", color: "#ffffff", outline: "none" }}
      />
      <div style={{ fontSize: "12px", color: "#535353", textAlign: "right", marginBottom: "24px" }}>
        {value.length}/500
      </div>
      <label style={{ fontSize: "11px", fontWeight: 700, color: "#b3b3b3", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>
        Your college
      </label>
      <select
        value={college}
        onChange={e => onCollegeChange(e.target.value)}
        style={{ width: "100%", padding: "14px", border: "1px solid #282828", borderRadius: "4px", fontSize: "15px", marginBottom: "32px", backgroundColor: "#181818", color: college ? "#ffffff" : "#535353", outline: "none" }}
      >
        <option value="">Select your college (optional)</option>
        {colleges.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      {error && (
        <div style={{ color: "#e63946", fontSize: "14px", marginBottom: "16px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "transparent", color: "#b3b3b3", border: "1px solid #282828", borderRadius: "4px", fontSize: "14px", cursor: "pointer" }}>Back</button>
        <button onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: "16px", backgroundColor: loading ? "#282828" : "#1db954", color: loading ? "#535353" : "#000000", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 700, cursor: loading ? "default" : "pointer", letterSpacing: "0.04em" }}>
          {loading ? "FINDING..." : "FIND RESOURCES"}
        </button>
      </div>
    </div>
  )
}