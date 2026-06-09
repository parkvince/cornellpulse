import { useState, useEffect } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
const ADMIN_PASSWORD = "cornellpulse2026"

interface PeerSignup {
  name: string
  email: string
  phone: string
  year: string
  major: string
  locations: string[]
  availability: string[]
  interests: string[]
  about: string
  refName: string
  refPhone: string
  refEmail: string
  refRelationship: string
}

interface Summary {
  avg_mood: number | null
  count: number
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState("overview")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [signups, setSignups] = useState<PeerSignup[]>([])
  const [selected, setSelected] = useState<PeerSignup | null>(null)

  function login() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError("")
    } else {
      setError("Incorrect password.")
    }
  }

  useEffect(() => {
    if (!authed) return
    fetch(`${API_URL}/campus/summary`).then(r => r.json()).then(setSummary).catch(() => {})
    fetch(`${API_URL}/peer-signups`).then(r => r.json()).then(setSignups).catch(() => {})
  }, [authed])

  if (!authed) {
    return (
      <div style={{ padding: "48px 24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Admin</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "32px" }}>CornellPulse staff only.</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          placeholder="Password"
          style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", marginBottom: "12px", backgroundColor: "#fff" }}
        />
        {error && <p style={{ fontSize: "13px", color: "#c00", marginBottom: "12px" }}>{error}</p>}
        <button onClick={login} style={{ width: "100%", padding: "14px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Admin Dashboard</h1>
        <button onClick={() => setAuthed(false)} style={{ fontSize: "13px", color: "#888", cursor: "pointer", backgroundColor: "transparent", border: "none" }}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["overview", "signups"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px", border: tab === t ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "10px", backgroundColor: tab === t ? "#1a1a1a" : "#fff", color: tab === t ? "#fff" : "#1a1a1a", fontSize: "14px", fontWeight: tab === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
            {t === "overview" ? "Overview" : `Peer Signups (${signups.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Campus mood today</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a" }}>
                {summary?.avg_mood !== null && summary?.avg_mood !== undefined ? summary.avg_mood + "/10" : "N/A"}
              </p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Check-ins today</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a" }}>{summary?.count ?? 0}</p>
            </div>
          </div>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Peer supporter applications</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>{signups.length}</p>
            <p style={{ fontSize: "13px", color: "#888" }}>Total applications received</p>
          </div>
          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>
              Data refreshes automatically. Check-in data is fully anonymous. Only aggregate mood scores and counts are visible here.
            </p>
          </div>
        </div>
      )}

      {tab === "signups" && !selected && (
        <div>
          {signups.length === 0 && (
            <p style={{ fontSize: "15px", color: "#aaa", textAlign: "center", padding: "40px 0" }}>No applications yet.</p>
          )}
          {signups.map((s, i) => (
            <button key={i} onClick={() => setSelected(s)} style={{ width: "100%", textAlign: "left", backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "10px", cursor: "pointer" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>{s.name}</div>
              <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>{s.email} � {s.year}{s.major ? ` � ${s.major}` : ""}</div>
              <div style={{ fontSize: "13px", color: "#aaa" }}>{s.locations.length} location{s.locations.length !== 1 ? "s" : ""} � Ref: {s.refName}</div>
            </button>
          ))}
        </div>
      )}

      {tab === "signups" && selected && (
        <div>
          <button onClick={() => setSelected(null)} style={{ fontSize: "14px", color: "#888", marginBottom: "20px", cursor: "pointer", backgroundColor: "transparent", border: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            Back to list
          </button>

          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>{selected.name}</h2>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>{selected.year}{selected.major ? ` � ${selected.major}` : ""}</p>

          {[
            { label: "Email", value: selected.email },
            { label: "Phone", value: selected.phone },
            { label: "About", value: selected.about || "Not provided" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{f.label}</p>
              <p style={{ fontSize: "15px", color: "#1a1a1a" }}>{f.value}</p>
            </div>
          ))}

          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Locations</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selected.locations.map(l => (
                <span key={l} style={{ padding: "4px 10px", backgroundColor: "#f0f0f0", borderRadius: "20px", fontSize: "13px", color: "#333" }}>{l}</span>
              ))}
            </div>
          </div>

          {selected.availability && selected.availability.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Availability</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selected.availability.map(a => (
                  <span key={a} style={{ padding: "4px 10px", backgroundColor: "#f0f0f0", borderRadius: "20px", fontSize: "13px", color: "#333" }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {selected.interests && selected.interests.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selected.interests.map(i => (
                  <span key={i} style={{ padding: "4px 10px", backgroundColor: "#f0f0f0", borderRadius: "20px", fontSize: "13px", color: "#333" }}>{i}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginTop: "8px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", marginBottom: "12px" }}>Reference</p>
            {[
              { label: "Name", value: selected.refName },
              { label: "Phone", value: selected.refPhone },
              { label: "Email", value: selected.refEmail },
              { label: "Relationship", value: selected.refRelationship || "Not provided" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{f.label}</p>
                <p style={{ fontSize: "14px", color: "#1a1a1a" }}>{f.value}</p>
              </div>
            ))}
            <a href={`tel:${selected.refPhone}`} style={{ display: "block", marginTop: "12px", backgroundColor: "#1a1a1a", color: "#fff", padding: "12px", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>
              Call reference now
            </a>
            <a href={`mailto:${selected.refEmail}`} style={{ display: "block", marginTop: "8px", border: "1px solid #e5e5e5", color: "#1a1a1a", padding: "12px", borderRadius: "8px", textAlign: "center", fontSize: "14px" }}>
              Email reference
            </a>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <a href={`mailto:${selected.email}?subject=Your CornellPulse peer supporter application`} style={{ flex: 1, display: "block", backgroundColor: "#1a1a1a", color: "#fff", padding: "14px", borderRadius: "10px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>
              Email applicant
            </a>
            <a href={`tel:${selected.phone}`} style={{ flex: 1, display: "block", border: "1px solid #e5e5e5", color: "#1a1a1a", padding: "14px", borderRadius: "10px", textAlign: "center", fontSize: "14px" }}>
              Call applicant
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
