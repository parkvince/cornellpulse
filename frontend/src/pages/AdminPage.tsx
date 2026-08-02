import { useCallback, useState, useEffect } from "react"

const CORAL = "#FF5A5F"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const AVATAR_COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#7B68EE", "#20B2AA", "#FF6B6B", "#4ECDC4"]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff < 7) return `${diff}d ago`
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", flex: 1 }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "28px", fontWeight: 800, color: color || "#222222", lineHeight: 1, marginBottom: "4px" }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: CORAL, fontWeight: 600 }}>{sub}</p>}
    </div>
  )
}

interface AdminSummary { avg_mood: number | null; count: number }
interface PeerSignup {
  id: number; name: string; email: string; phone: string; year: string; major?: string
  locations: string[]; availability: string[]; interests: string[]; about?: string
  refName: string; refPhone: string; refEmail: string; refRelationship?: string
  approved: boolean; submitted_at?: string
}
interface PeerRequest {
  id: number; supporter_name: string; requester_name: string; requester_email: string
  requester_phone?: string; preferred_location: string; preferred_time: string
  message?: string; status: string; requested_at?: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState("overview")
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [signups, setSignups] = useState<PeerSignup[]>([])
  const [requests, setRequests] = useState<PeerRequest[]>([])
  const [selectedSignup, setSelectedSignup] = useState<PeerSignup | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PeerRequest | null>(null)
  const [approving, setApproving] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all")

  const adminFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include" })
    if (response.status === 401 || response.status === 403) setAuthed(false)
    if (!response.ok) throw new Error(`Admin request failed: ${response.status}`)
    return response
  }, [])

  async function login() {
    setError("")
    try {
      await adminFetch("/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      setPassword("")
      setAuthed(true)
      await loadData()
    } catch {
      setError("Incorrect password or too many attempts. Please try again later.")
    }
  }

  async function logout() {
    try {
      await adminFetch("/admin/auth/logout", { method: "POST" })
    } catch {
      // The local session is cleared even if the server is unavailable.
    }
    setAuthed(false)
    setSummary(null)
    setSignups([])
    setRequests([])
  }

  const loadData = useCallback(async () => {
    try {
      const [s, sg, r] = await Promise.all([
        adminFetch("/campus/summary").then(res => res.json()),
        adminFetch("/peer-signups").then(res => res.json()),
        adminFetch("/peer-requests").then(res => res.json()),
      ])
      setSummary(s as AdminSummary)
      setSignups(Array.isArray(sg) ? sg as PeerSignup[] : [])
      setRequests(Array.isArray(r) ? r as PeerRequest[] : [])
    } catch {
      // adminFetch already clears authentication for unauthorized responses.
    }
  }, [adminFetch])

  useEffect(() => {
    fetch(`${API_URL}/admin/auth/session`, { credentials: "include" })
      .then(response => {
        if (!response.ok) throw new Error("No active administrator session")
        setAuthed(true)
        void loadData()
      })
      .catch(() => setAuthed(false))
  }, [loadData])

  async function approveSignup(id: number) {
    setApproving(id)
    try {
      await adminFetch(`/peer-signups/${id}/approve`, { method: "POST" })
      await loadData()
      if (selectedSignup?.id === id) setSelectedSignup(prev => prev ? ({ ...prev, approved: true }) : prev)
    } catch {
      // adminFetch handles expired or unauthorized sessions.
    }
    setApproving(null)
  }

  async function deleteSignup(id: number) {
    if (!confirm("Remove this application? This cannot be undone.")) return
    try {
      await adminFetch(`/peer-signups/${id}`, { method: "DELETE" })
      await loadData()
      setSelectedSignup(null)
    } catch {
      // adminFetch handles expired or unauthorized sessions.
    }
  }

  async function resolveRequest(id: number) {
    try {
      await adminFetch(`/peer-requests/${id}/resolve`, { method: "POST" })
      await loadData()
      if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? ({ ...prev, status: "resolved" }) : prev)
    } catch {
      // adminFetch handles expired or unauthorized sessions.
    }
  }

  async function deleteRequest(id: number) {
    if (!confirm("Delete this request? This cannot be undone.")) return
    try {
      await adminFetch(`/peer-requests/${id}`, { method: "DELETE" })
      await loadData()
      setSelectedRequest(null)
    } catch {
      // adminFetch handles expired or unauthorized sessions.
    }
  }

  const filteredSignups = signups.filter(s => {
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || (statusFilter === "approved" ? s.approved : !s.approved)
    return matchSearch && matchStatus
  })

  const pendingCount = signups.filter(s => !s.approved).length
  const approvedCount = signups.filter(s => s.approved).length
  const pendingRequestCount = requests.filter(r => r.status === "pending").length

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#fff8f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", marginBottom: "6px", letterSpacing: "-0.02em" }}>Admin access</h1>
        <p style={{ fontSize: "14px", color: "#717171", marginBottom: "32px" }}>CornellPulse staff only.</p>
        <div style={{ width: "100%", maxWidth: "320px" }}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="Password" style={{ width: "100%", padding: "14px 16px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", marginBottom: "12px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
          {error && (
            <div style={{ backgroundColor: "#FFF0F0", border: "1px solid #FF5A5F", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: CORAL }}>{error}</p>
            </div>
          )}
          <button onClick={login} style={{ width: "100%", padding: "16px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Sign in</button>
        </div>
      </div>
    )
  }

  if (selectedSignup) {
    return (
      <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
        <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 32px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
          <button onClick={() => setSelectedSignup(null)} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px 14px", color: "#ffffff", fontSize: "13px", fontWeight: 600, marginBottom: "20px", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Applications
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>{selectedSignup.name.charAt(0)}</span>
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>{selectedSignup.name}</h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>{selectedSignup.year}{selectedSignup.major ? ` · ${selectedSignup.major}` : ""}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: selectedSignup.approved ? "#E8F8F5" : "#FFF0F0", color: selectedSignup.approved ? "#00A699" : CORAL, fontSize: "12px", fontWeight: 700 }}>
              {selectedSignup.approved ? "Approved" : "Pending review"}
            </span>
            {selectedSignup.submitted_at && (
              <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: "#f5f5f5", color: "#717171", fontSize: "12px", fontWeight: 600 }}>{timeAgo(selectedSignup.submitted_at)}</span>
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Contact</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <a href={`mailto:${selectedSignup.email}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", backgroundColor: CORAL, color: "#ffffff", borderRadius: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </a>
              <a href={`tel:${selectedSignup.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", border: "2px solid #ebebeb", color: "#222222", borderRadius: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                Call
              </a>
            </div>
            <p style={{ fontSize: "13px", color: "#717171" }}>{selectedSignup.email}</p>
            <p style={{ fontSize: "13px", color: "#717171" }}>{selectedSignup.phone}</p>
          </div>

          {selectedSignup.about && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>About</p>
              <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6 }}>{selectedSignup.about}</p>
            </div>
          )}

          {selectedSignup.locations?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Locations</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.locations.map((l: string) => <span key={l} style={{ padding: "6px 12px", backgroundColor: "#fff8f7", border: "1px solid #ebebeb", borderRadius: "8px", fontSize: "12px", color: "#717171" }}>{l}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.availability?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Availability</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.availability.map((a: string) => <span key={a} style={{ padding: "6px 12px", backgroundColor: "#fff8f7", border: "1px solid #ebebeb", borderRadius: "8px", fontSize: "12px", color: "#717171" }}>{a}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.interests?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.interests.map((i: string) => <span key={i} style={{ padding: "6px 12px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "8px", fontSize: "12px", fontWeight: 500 }}>{i}</span>)}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Reference</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#717171" }}>{selectedSignup.refName?.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222" }}>{selectedSignup.refName}</p>
                {selectedSignup.refRelationship && <p style={{ fontSize: "12px", color: "#717171" }}>{selectedSignup.refRelationship}</p>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <a href={`mailto:${selectedSignup.refEmail}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", border: "2px solid #ebebeb", color: "#222222", borderRadius: "12px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email ref
              </a>
              <a href={`tel:${selectedSignup.refPhone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", border: "2px solid #ebebeb", color: "#222222", borderRadius: "12px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                Call ref
              </a>
            </div>
          </div>

          {!selectedSignup.approved && (
            <button onClick={() => approveSignup(selectedSignup.id)} disabled={approving === selectedSignup.id} style={{ width: "100%", padding: "16px", backgroundColor: approving === selectedSignup.id ? "#ebebeb" : CORAL, color: approving === selectedSignup.id ? "#b0b0b0" : "#ffffff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {approving === selectedSignup.id ? "Approving..." : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve as supporter
                </>
              )}
            </button>
          )}

          {selectedSignup.approved && (
            <div style={{ backgroundColor: "#E8F8F5", borderRadius: "14px", padding: "14px 18px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00A699" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#00A699" }}>Approved and live on the app</p>
            </div>
          )}

          <button onClick={() => deleteSignup(selectedSignup.id)} style={{ width: "100%", padding: "16px", backgroundColor: "transparent", border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "14px", fontWeight: 600, color: "#717171", cursor: "pointer" }}>
            Remove application
          </button>
        </div>
      </div>
    )
  }

  if (selectedRequest) {
    return (
      <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
        <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 32px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
          <button onClick={() => setSelectedRequest(null)} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px 14px", color: "#ffffff", fontSize: "13px", fontWeight: 600, marginBottom: "20px", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Requests
          </button>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Connect request</p>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>{selectedRequest.requester_name}</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Wants to meet {selectedRequest.supporter_name}</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: selectedRequest.status === "resolved" ? "#E8F8F5" : "#FFF0F0", color: selectedRequest.status === "resolved" ? "#00A699" : CORAL, fontSize: "12px", fontWeight: 700, textTransform: "capitalize" }}>
              {selectedRequest.status}
            </span>
            {selectedRequest.requested_at && (
              <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: "#f5f5f5", color: "#717171", fontSize: "12px", fontWeight: 600 }}>{timeAgo(selectedRequest.requested_at)}</span>
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Contact requester</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <a href={`mailto:${selectedRequest.requester_email}?subject=Your CornellPulse peer connect request`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", backgroundColor: CORAL, color: "#ffffff", borderRadius: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </a>
              {selectedRequest.requester_phone && (
                <a href={`tel:${selectedRequest.requester_phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", border: "2px solid #ebebeb", color: "#222222", borderRadius: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  Call
                </a>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#717171" }}>{selectedRequest.requester_email}</p>
            {selectedRequest.requester_phone && <p style={{ fontSize: "13px", color: "#717171" }}>{selectedRequest.requester_phone}</p>}
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Request details</p>
            {[
              { label: "Supporter", value: selectedRequest.supporter_name },
              { label: "Location", value: selectedRequest.preferred_location },
              { label: "Time", value: selectedRequest.preferred_time },
              { label: "Submitted", value: selectedRequest.requested_at ? new Date(selectedRequest.requested_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unknown" },
            ].map((f, idx, arr) => (
              <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "10px", marginBottom: "10px", borderBottom: idx < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <p style={{ fontSize: "13px", color: "#717171", fontWeight: 600 }}>{f.label}</p>
                <p style={{ fontSize: "13px", color: "#222222", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{f.value}</p>
              </div>
            ))}
          </div>

          {selectedRequest.message && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Message</p>
              <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6, fontStyle: "italic" }}>"{selectedRequest.message}"</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            {selectedRequest.status === "pending" && (
              <button onClick={() => resolveRequest(selectedRequest.id)} style={{ flex: 2, padding: "14px", backgroundColor: "#E8F8F5", color: "#00A699", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A699" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Mark as handled
              </button>
            )}
            {selectedRequest.status === "resolved" && (
              <div style={{ flex: 2, padding: "14px", backgroundColor: "#E8F8F5", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A699" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#00A699" }}>Handled</p>
              </div>
            )}
            <button onClick={() => deleteRequest(selectedRequest.id)} style={{ flex: 1, padding: "14px", backgroundColor: "transparent", border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "14px", fontWeight: 600, color: "#717171", cursor: "pointer" }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "signups", label: "Applications" },
    { id: "requests", label: "Requests" },
  ]

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 28px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>CornellPulse</p>
          <button onClick={logout} style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Sign out</button>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>Admin</h1>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "#ffffff", padding: "4px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 6px", border: "none", borderRadius: "10px", backgroundColor: tab === t.id ? CORAL : "transparent", color: tab === t.id ? "#ffffff" : "#717171", fontSize: "13px", fontWeight: tab === t.id ? 700 : 500, cursor: "pointer" }}>
              {t.id === "signups" && pendingCount > 0 ? `Applications (${pendingCount})` : t.id === "requests" && pendingRequestCount > 0 ? `Requests (${pendingRequestCount})` : t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <StatCard label="Campus mood" value={summary?.avg_mood !== null && summary?.avg_mood !== undefined ? summary.avg_mood + "/10" : "N/A"} sub="Today" />
              <StatCard label="Check-ins" value={summary?.count ?? 0} sub="Today" />
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <StatCard label="Applications" value={signups.length} sub={`${pendingCount} pending`} color={pendingCount > 0 ? CORAL : "#222222"} />
              <StatCard label="Requests" value={requests.length} sub={`${pendingRequestCount} pending`} />
            </div>

            {pendingCount > 0 && (
              <div style={{ backgroundColor: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: CORAL, marginBottom: "2px" }}>{pendingCount} application{pendingCount !== 1 ? "s" : ""} need review</p>
                  <p style={{ fontSize: "12px", color: "#FF8A8A" }}>Approve to make them live on the app</p>
                </div>
                <button onClick={() => setTab("signups")} style={{ padding: "8px 16px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Review</button>
              </div>
            )}

            {pendingRequestCount > 0 && (
              <div style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFE0C0", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#FC642D", marginBottom: "2px" }}>{pendingRequestCount} connect request{pendingRequestCount !== 1 ? "s" : ""} need follow-up</p>
                  <p style={{ fontSize: "12px", color: "#FCA06A" }}>Email both students to make the introduction</p>
                </div>
                <button onClick={() => setTab("requests")} style={{ padding: "8px 16px", backgroundColor: "#FC642D", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>View</button>
              </div>
            )}

            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222" }}>Recent applications</p>
                <button onClick={() => setTab("signups")} style={{ fontSize: "13px", color: CORAL, fontWeight: 600, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>See all</button>
              </div>
              {signups.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "#b0b0b0" }}>No applications yet.</p>
                </div>
              )}
              {signups.slice(0, 4).map(s => {
                const color = avatarColor(s.name)
                return (
                  <button key={s.id} onClick={() => { setSelectedSignup(s); setTab("signups") }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderBottom: "1px solid #f5f5f5", backgroundColor: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color }}>{s.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "2px" }}>{s.name}</p>
                      <p style={{ fontSize: "12px", color: "#717171" }}>{s.year}{s.major ? ` · ${s.major}` : ""}</p>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: s.approved ? "#E8F8F5" : "#FFF0F0", color: s.approved ? "#00A699" : CORAL, flexShrink: 0 }}>
                      {s.approved ? "Live" : "Pending"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === "signups" && (
          <div>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..." style={{ width: "100%", padding: "12px 14px 12px 40px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {(["all", "pending", "approved"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: "10px", backgroundColor: statusFilter === f ? CORAL : "#ffffff", color: statusFilter === f ? "#ffffff" : "#717171", fontSize: "12px", fontWeight: statusFilter === f ? 700 : 500, cursor: "pointer", boxShadow: statusFilter === f ? "none" : "0 1px 4px rgba(0,0,0,0.08)" }}>
                  {f === "all" ? `All (${signups.length})` : f === "pending" ? `Pending (${pendingCount})` : `Approved (${approvedCount})`}
                </button>
              ))}
            </div>

            {filteredSignups.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "15px", color: "#b0b0b0" }}>No applications found.</p>
              </div>
            )}

            {filteredSignups.map(s => {
              const color = avatarColor(s.name)
              return (
                <div key={s.id} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: s.approved ? "1px solid #f0f0f0" : "1px solid #FFE8E8" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "18px", fontWeight: 800, color }}>{s.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{s.name}</p>
                          <p style={{ fontSize: "12px", color: "#717171" }}>{s.year}{s.major ? ` · ${s.major}` : ""}</p>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: s.approved ? "#E8F8F5" : "#FFF0F0", color: s.approved ? "#00A699" : CORAL, flexShrink: 0 }}>
                          {s.approved ? "Live" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.about && <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, marginBottom: "10px" }}>{s.about.slice(0, 100)}{s.about.length > 100 ? "..." : ""}</p>}
                  {s.submitted_at && <p style={{ fontSize: "11px", color: "#b0b0b0", marginBottom: "12px" }}>Applied {timeAgo(s.submitted_at)}</p>}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setSelectedSignup(s)} style={{ flex: 1, padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>View</button>
                    {!s.approved && (
                      <button onClick={() => approveSignup(s.id)} disabled={approving === s.id} style={{ flex: 2, padding: "10px", backgroundColor: approving === s.id ? "#ebebeb" : CORAL, color: approving === s.id ? "#b0b0b0" : "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        {approving === s.id ? "Approving..." : "Approve"}
                      </button>
                    )}
                    <button onClick={() => deleteSignup(s.id)} style={{ padding: "10px 14px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === "requests" && (
          <div>
            {requests.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "15px", color: "#b0b0b0" }}>No connect requests yet.</p>
              </div>
            )}
            {requests.map((r, i) => (
              <div key={i} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: r.status === "resolved" ? "1px solid #f0f0f0" : "1px solid #FFE8E8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{r.requester_name}</p>
                    <p style={{ fontSize: "12px", color: "#717171" }}>Wants to meet <strong style={{ color: CORAL }}>{r.supporter_name}</strong></p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: r.status === "resolved" ? "#E8F8F5" : "#FFF0F0", color: r.status === "resolved" ? "#00A699" : CORAL, flexShrink: 0, textTransform: "capitalize" }}>{r.status}</span>
                </div>

                <div style={{ display: "flex", gap: "14px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{r.preferred_location}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{r.preferred_time}</p>
                  </div>
                </div>

                {r.message && (
                  <div style={{ backgroundColor: "#fff8f7", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, fontStyle: "italic" }}>"{r.message}"</p>
                  </div>
                )}

                {r.requested_at && <p style={{ fontSize: "11px", color: "#b0b0b0", marginBottom: "12px" }}>{timeAgo(r.requested_at)}</p>}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setSelectedRequest(r)} style={{ flex: 1, padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Details</button>
                  <a href={`mailto:${r.requester_email}?subject=Your CornellPulse peer connect request`} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </a>
                  {r.status === "pending" && (
                    <button onClick={() => resolveRequest(r.id)} style={{ flex: 2, padding: "10px", backgroundColor: "#E8F8F5", color: "#00A699", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      Handled
                    </button>
                  )}
                  <button onClick={() => deleteRequest(r.id)} style={{ padding: "10px 12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
