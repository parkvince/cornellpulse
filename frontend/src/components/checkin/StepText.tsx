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
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
        Anything else on your mind?
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
        Optional. This is completely anonymous and is never saved anywhere.
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={500}
        placeholder="You can write anything here..."
        rows={4}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          fontSize: "15px",
          resize: "none",
          marginBottom: "8px",
          outline: "none",
        }}
      />
      <div style={{ fontSize: "12px", color: "#999", textAlign: "right", marginBottom: "24px" }}>
        {value.length}/500
      </div>
      <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
        Your college (optional)
      </label>
      <select
        value={college}
        onChange={e => onCollegeChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          fontSize: "15px",
          marginBottom: "32px",
          backgroundColor: "#fff",
        }}
      >
        <option value="">Select your college</option>
        {colleges.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      {error && (
        <div style={{ color: "#c00", fontSize: "14px", marginBottom: "16px" }}>{error}</div>
      )}
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
          onClick={onSubmit}
          disabled={loading}
          style={{
            flex: 2,
            padding: "14px",
            backgroundColor: loading ? "#ccc" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          {loading ? "Finding resources..." : "Find my resources"}
        </button>
      </div>
    </div>
  )
}