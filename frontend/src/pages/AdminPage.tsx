import { useState, useEffect } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
const ADMIN_PASSWORD = "cornellpulse2026"

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState("overview")
  const [summary, setSummary] = useState<any>(null)
  const [signups, setSignups] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [selectedSignup, setSelectedSignup] = useState<any>(null)
  const [approving, setApproving] = useState<number | null>(null)

  function login() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError("")
    } else {
      setError("Incorrect password.")
    }
  }

  async function loadData() {
    try {
      const [s, sg, r] = await Promise.all([
        fetch(`${API_URL}/campus/summary`).then(r => r.json()),
        fetch(`${API_URL}/peer-signups`).then(r => r.json()),
        fetch(`${API_URL}/peer-requests`).then(r => r.json()),
      ])
      setSummary(s)
      setSignups(sg)
      setRequests(r)
    } catch {}
  }

  useEffect(() => {
    if (!authed) return
    loadData()
  }, [authed])

  async function approveSignup(index: number) {
    setApproving(index)
    try {
      await fetch(`${API_URL}/peer-signups/${index}/approve`, { method: "POST" })
      await loadData()
    } catch {}
    setApproving(null)
  }

  if (!authed) {
    return (
      <div style={{ padding: "48px 24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Admin</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "32px" }}>CornellPulse staff only.</p>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="Password" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", marginBottom: "12px", backgroundColor: "#fff" }} />
        {error && <p style={{ fontSize: "13px", color: "#c00", marginBottom: "12px" }}>{error}</p>}
        <button onClick={login} style={{ width: "100%", padding: "14px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Sign in</button>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "signups", label: `Applications (${signups.length})` },
    { id: "requests", label: `Requests (${requests.length})` },
  ]

  return (
    <div style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Admin</h1>
        <button onClick={() => setAuthed(false)} style={{ fontSize: "13px", color: "#888", cursor: "pointer", backgroundColor: "transparent", border: "none" }}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 14px", border: tab === t.id ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: tab === t.id ? "#1a1a1a" : "#fff", color: tab === t.id ? "#fff" : "#1a1a1a", fontSize: "13px", fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Campus mood today</p>
              <p style={{ fontSize: "26px", fontWeight: 700 }}>{summary?.avg_mood !== null && summary?.avg_mood !== undefined ? summary.avg_mood + "/10" : "N/A"}</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Check-ins today</p>
              <p style={{ fontSize: "26px", fontWeight: 700 }}>{summary?.count ?? 0}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Supporter applications</p>
              <p style={{ fontSize: "26px", fontWeight: 700 }}>{signups.length}</p>
              <p style={{ fontSize: "12px", color: "#aaa" }}>{signups.filter(s => s.approved).length} approved</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Connect requests</p>
              <p style={{ fontSize: "26px", fontWeight: 700 }}>{requests.length}</p>
              <p style={{ fontSize: "12px", color: "#aaa" }}>{requests.filter(r => r.status === "pending").length} pending</p>
            </div>
          </div>
        </div>
      )}

      {tab === "signups" && !selectedSignup && (
        <div>
          {signups.length === 0 && <p style={{ fontSize: "15px", color: "#aaa", textAlign: "center", padding: "40px 0" }}>No applications yet.</p>}
          {signups.map((s, i) => (
            <div key={i} style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "2px" }}>{s.name}</div>
                  <div style={{ fontSize: "13px", color: "#888" }}>{s.email} · {s.year}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "10px", backgroundColor: s.approved ? "#e8f5e9" : "#f5f5f5", color: s.approved ? "#2e7d32" : "#888" }}>
                  {s.approved ? "Approved" : "Pending"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => setSelectedSignup({ ...s, index: i })} style={{ flex: 1, padding: "10px", border: "1px solid #e5e5e5", borderRadius: "8px", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer" }}>View</button>
                {!s.approved && (
                  <button onClick={() => approveSignup(i)} disabled={approving === i} style={{ flex: 2, padding: "10px", backgroundColor: approving === i ? "#ccc" : "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: approving === i ? "default" : "pointer" }}>
                    {approving === i ? "Approving..." : "Approve"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "signups" && selectedSignup && (
        <div>
          <button onClick={() => setSelectedSignup(null)} style={{ fontSize: "14px", color: "#888", marginBottom: "20px", cursor: "pointer", backgroundColor: "transparent", border: "none" }}>Back to list</button>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>{selectedSignup.name}</h2>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>{selectedSignup.year}{selectedSignup.major ? ` · ${selectedSignup.major}` : ""}</p>
          {[
            { label: "Email", value: selectedSignup.email },
            { label: "Phone", value: selectedSignup.phone },
            { label: "About", value: selectedSignup.about || "Not provided" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{f.label}</p>
              <p style={{ fontSize: "15px", color: "#1a1a1a" }}>{f.value}</p>
            </div>
          ))}
          {selectedSignup.locations?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Locations</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.locations.map((l: string) => <span key={l} style={{ padding: "4px 10px", backgroundColor: "#f0f0f0", borderRadius: "20px", fontSize: "13px" }}>{l}</span>)}
              </div>
            </div>
          )}
          {selectedSignup.interests?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.interests.map((i: string) => <span key={i} style={{ padding: "4px 10px", backgroundColor: "#f0f0f0", borderRadius: "20px", fontSize: "13px" }}>{i}</span>)}
              </div>
            </div>
          )}
          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Reference</p>
            <p style={{ fontSize: "14px", marginBottom: "4px" }}>{selectedSignup.refName}</p>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>{selectedSignup.refPhone}</p>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>{selectedSignup.refEmail}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <a href={`tel:${selectedSignup.refPhone}`} style={{ flex: 1, display: "block", backgroundColor: "#1a1a1a", color: "#fff", padding: "10px", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>Call ref</a>
              <a href={`mailto:${selectedSignup.refEmail}`} style={{ flex: 1, display: "block", border: "1px solid #e5e5e5", color: "#1a1a1a", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "13px", textDecoration: "none" }}>Email ref</a>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <a href={`mailto:${selectedSignup.email}`} style={{ flex: 1, display: "block", backgroundColor: "#1a1a1a", color: "#fff", padding: "12px", borderRadius: "10px", textAlign: "center", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>Email applicant</a>
            <a href={`tel:${selectedSignup.phone}`} style={{ flex: 1, display: "block", border: "1px solid #e5e5e5", color: "#1a1a1a", padding: "12px", borderRadius: "10px", textAlign: "center", fontSize: "14px", textDecoration: "none" }}>Call applicant</a>
          </div>
          {!selectedSignup.approved && (
            <button onClick={() => { approveSignup(selectedSignup.index); setSelectedSignup(null) }} style={{ width: "100%", padding: "14px", backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "12px" }}>
              Approve this supporter
            </button>
          )}
        </div>
      )}

      {tab === "requests" && (
        <div>
          {requests.length === 0 && <p style={{ fontSize: "15px", color: "#aaa", textAlign: "center", padding: "40px 0" }}>No connect requests yet.</p>}
          {requests.map((r, i) => (
            <div key={i} style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600 }}>{r.requester_name}</div>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "10px", backgroundColor: "#fff9c4", color: "#f57f17" }}>Pending</span>
              </div>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>Wants to meet: <strong style={{ color: "#1a1a1a" }}>{r.supporter_name}</strong></p>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>Location: {r.preferred_location}</p>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Time: {r.preferred_time}</p>
              {r.message && <p style={{ fontSize: "13px", color: "#555", backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "8px", marginBottom: "12px", lineHeight: 1.5 }}>{r.message}</p>}
              <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "12px" }}>Submitted {new Date(r.requested_at).toLocaleDateString()}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href={`mailto:${r.requester_email}?subject=Your CornellPulse peer connect request`} style={{ flex: 1, display: "block", backgroundColor: "#1a1a1a", color: "#fff", padding: "10px", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>Email them</a>
                {r.requester_phone && <a href={`tel:${r.requester_phone}`} style={{ flex: 1, display: "block", border: "1px solid #e5e5e5", color: "#1a1a1a", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "13px", textDecoration: "none" }}>Call them</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
