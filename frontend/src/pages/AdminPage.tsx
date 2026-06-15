import { useState, useEffect } from "react"

const PINK = "#e8a0b4"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
const ADMIN_PASSWORD = "q"

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
        fetch(`${API_URL}/campus/summary`).then(res => res.json()),
        fetch(`${API_URL}/peer-signups`).then(res => res.json()),
        fetch(`${API_URL}/peer-requests`).then(res => res.json()),
      ])
      setSummary(s)
      setSignups(Array.isArray(sg) ? sg : [])
      setRequests(Array.isArray(r) ? r : [])
    } catch {}
  }

  useEffect(() => {
    if (!authed) return
    loadData()
  }, [authed])

  async function approveSignup(id: number) {
    setApproving(id)
    try {
      await fetch(`${API_URL}/peer-signups/${id}/approve`, { method: "POST" })
      await loadData()
    } catch {}
    setApproving(null)
  }

  async function deleteSignup(id: number) {
    if (!confirm("Remove this application? This cannot be undone.")) return
    try {
      await fetch(`${API_URL}/peer-signups/${id}`, { method: "DELETE" })
      await loadData()
    } catch {}
  }

  if (!authed) {
    return (
      <div style={{ padding: "64px 24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>Staff only</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginBottom: "32px", letterSpacing: "-0.02em" }}>Admin</h1>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="Password" style={{ width: "100%", padding: "14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", marginBottom: "12px", backgroundColor: "#1a1a1a", color: "#fff" }} />
        {error && <p style={{ fontSize: "13px", color: "#e63946", marginBottom: "12px" }}>{error}</p>}
        <button onClick={login} style={{ width: "100%", padding: "16px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.04em" }}>Sign in</button>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "signups", label: `Applications (${signups.length})` },
    { id: "requests", label: `Requests (${requests.length})` },
  ]

  return (
    <div style={{ padding: "52px 20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Admin</h1>
        <button onClick={() => setAuthed(false)} style={{ fontSize: "13px", color: "#4a4a4a", backgroundColor: "transparent", border: "none" }}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 14px", border: "none", borderRadius: "20px", backgroundColor: tab === t.id ? PINK : "#1a1a1a", color: tab === t.id ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: tab === t.id ? 800 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "6px" }}>Campus mood today</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>{summary?.avg_mood !== null && summary?.avg_mood !== undefined ? summary.avg_mood + "/10" : "N/A"}</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "6px" }}>Check-ins today</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>{summary?.count ?? 0}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "6px" }}>Supporter applications</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>{signups.length}</p>
              <p style={{ fontSize: "12px", color: PINK }}>{signups.filter(s => s.approved).length} approved</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "6px" }}>Connect requests</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>{requests.length}</p>
              <p style={{ fontSize: "12px", color: PINK }}>{requests.filter(r => r.status === "pending").length} pending</p>
            </div>
          </div>
        </div>
      )}

      {tab === "signups" && !selectedSignup && (
        <div>
          {signups.length === 0 && <p style={{ fontSize: "15px", color: "#4a4a4a", textAlign: "center", padding: "40px 0" }}>No applications yet.</p>}
          {signups.map((s, i) => (
            <div key={i} style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>{s.name}</p>
                  <p style={{ fontSize: "13px", color: "#4a4a4a" }}>{s.email} · {s.year}</p>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", backgroundColor: s.approved ? "rgba(232,160,180,0.15)" : "#242424", color: s.approved ? PINK : "#4a4a4a" }}>
                  {s.approved ? "Approved" : "Pending"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => setSelectedSignup(s)} style={{ flex: 1, padding: "10px", border: "1px solid #2a2a2a", borderRadius: "8px", backgroundColor: "transparent", color: "#a0a0a0", fontSize: "13px" }}>View</button>
                {!s.approved && (
                  <button onClick={() => approveSignup(s.id)} disabled={approving === s.id} style={{ flex: 2, padding: "10px", backgroundColor: approving === s.id ? "#242424" : PINK, color: approving === s.id ? "#4a4a4a" : "#0f0f0f", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 800 }}>
                    {approving === s.id ? "Approving..." : "Approve"}
                  </button>
                )}
                <button onClick={() => deleteSignup(s.id)} style={{ padding: "10px 14px", border: "1px solid #e63946", borderRadius: "8px", backgroundColor: "transparent", color: "#e63946", fontSize: "13px" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "signups" && selectedSignup && (
        <div>
          <button onClick={() => setSelectedSignup(null)} style={{ fontSize: "14px", color: "#4a4a4a", marginBottom: "20px", backgroundColor: "transparent", border: "none" }}>Back to list</button>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{selectedSignup.name}</h2>
          <p style={{ fontSize: "14px", color: "#4a4a4a", marginBottom: "20px" }}>{selectedSignup.year}{selectedSignup.major ? ` · ${selectedSignup.major}` : ""}</p>

          {[
            { label: "Email", value: selectedSignup.email },
            { label: "Phone", value: selectedSignup.phone },
            { label: "About", value: selectedSignup.about || "Not provided" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{f.label}</p>
              <p style={{ fontSize: "15px", color: "#fff" }}>{f.value}</p>
            </div>
          ))}

          {selectedSignup.locations?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Locations</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.locations.map((l: string) => <span key={l} style={{ padding: "5px 10px", backgroundColor: "#242424", borderRadius: "20px", fontSize: "12px", color: "#a0a0a0" }}>{l}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.availability?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Availability</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.availability.map((a: string) => <span key={a} style={{ padding: "5px 10px", backgroundColor: "#242424", borderRadius: "20px", fontSize: "12px", color: "#a0a0a0" }}>{a}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.interests?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.interests.map((i: string) => <span key={i} style={{ padding: "5px 10px", backgroundColor: "#242424", borderRadius: "20px", fontSize: "12px", color: "#a0a0a0" }}>{i}</span>)}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Reference</p>
            <p style={{ fontSize: "14px", color: "#fff", marginBottom: "4px" }}>{selectedSignup.refName}</p>
            <p style={{ fontSize: "13px", color: "#4a4a4a", marginBottom: "2px" }}>{selectedSignup.refPhone}</p>
            <p style={{ fontSize: "13px", color: "#4a4a4a", marginBottom: "12px" }}>{selectedSignup.refEmail}</p>
            {selectedSignup.refRelationship && <p style={{ fontSize: "12px", color: "#4a4a4a", marginBottom: "12px" }}>{selectedSignup.refRelationship}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <a href={`tel:${selectedSignup.refPhone}`} style={{ flex: 1, display: "block", backgroundColor: PINK, color: "#0f0f0f", padding: "11px", borderRadius: "8px", textAlign: "center", fontWeight: 800, fontSize: "13px" }}>Call ref</a>
              <a href={`mailto:${selectedSignup.refEmail}`} style={{ flex: 1, display: "block", border: "1px solid #2a2a2a", color: "#a0a0a0", padding: "11px", borderRadius: "8px", textAlign: "center", fontSize: "13px" }}>Email ref</a>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <a href={`mailto:${selectedSignup.email}`} style={{ flex: 1, display: "block", backgroundColor: PINK, color: "#0f0f0f", padding: "13px", borderRadius: "8px", textAlign: "center", fontWeight: 800, fontSize: "14px" }}>Email applicant</a>
            <a href={`tel:${selectedSignup.phone}`} style={{ flex: 1, display: "block", border: "1px solid #2a2a2a", color: "#a0a0a0", padding: "13px", borderRadius: "8px", textAlign: "center", fontSize: "14px" }}>Call applicant</a>
          </div>

          {!selectedSignup.approved && (
            <button onClick={() => { approveSignup(selectedSignup.id); setSelectedSignup(null) }} style={{ width: "100%", padding: "14px", backgroundColor: "transparent", border: "1px solid " + PINK, color: PINK, borderRadius: "8px", fontSize: "15px", fontWeight: 800, marginTop: "12px" }}>
              Approve this supporter
            </button>
          )}
          <button onClick={() => { deleteSignup(selectedSignup.id); setSelectedSignup(null) }} style={{ width: "100%", padding: "14px", backgroundColor: "transparent", border: "1px solid #e63946", color: "#e63946", borderRadius: "8px", fontSize: "15px", fontWeight: 800, marginTop: "12px" }}>
            Remove this application
          </button>
        </div>
      )}

      {tab === "requests" && (
        <div>
          {requests.length === 0 && <p style={{ fontSize: "15px", color: "#4a4a4a", textAlign: "center", padding: "40px 0" }}>No connect requests yet.</p>}
          {requests.map((r, i) => (
            <div key={i} style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>{r.requester_name}</p>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", backgroundColor: "#242424", color: PINK }}>{r.status}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#a0a0a0", marginBottom: "4px" }}>Wants to meet: <strong style={{ color: "#fff" }}>{r.supporter_name}</strong></p>
              <p style={{ fontSize: "13px", color: "#a0a0a0", marginBottom: "4px" }}>Location: {r.preferred_location}</p>
              <p style={{ fontSize: "13px", color: "#a0a0a0", marginBottom: "8px" }}>Time: {r.preferred_time}</p>
              {r.message && <p style={{ fontSize: "13px", color: "#a0a0a0", backgroundColor: "#242424", padding: "10px", borderRadius: "8px", marginBottom: "12px", lineHeight: 1.5 }}>{r.message}</p>}
              <p style={{ fontSize: "12px", color: "#4a4a4a", marginBottom: "12px" }}>Submitted {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : ""}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href={`mailto:${r.requester_email}?subject=Your CornellPulse peer connect request`} style={{ flex: 1, display: "block", backgroundColor: PINK, color: "#0f0f0f", padding: "10px", borderRadius: "8px", textAlign: "center", fontWeight: 800, fontSize: "13px" }}>Email them</a>
                {r.requester_phone && <a href={`tel:${r.requester_phone}`} style={{ flex: 1, display: "block", border: "1px solid #2a2a2a", color: "#a0a0a0", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "13px" }}>Call them</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}