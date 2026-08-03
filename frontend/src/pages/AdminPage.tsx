import { type FormEvent, type KeyboardEvent, useCallback, useState, useEffect } from "react"
import { AdminApiError, adminRequest, parseAdminJson } from "../api/admin"

const CORAL = "#C83C42"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const AVATAR_COLORS = ["#C83C42", "#007A70", "#A9461E", "#5C4BC2", "#007B78", "#BD3439", "#337F7C"]
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
  id: string; name: string; email: string; phone: string; year: string; major?: string
  locations: string[]; availability: string[]; interests: string[]; about?: string
  refName: string; refPhone: string; refEmail: string; refRelationship?: string
  approved: boolean; submitted_at?: string
}
interface PeerRequest {
  id: string; supporter_name: string; requester_name: string
  preferred_location: string; preferred_time: string
  message?: string; status: string; requested_at?: string
}
interface SupporterReport {
  id: string; supporter_name: string; reporter_email?: string; reason: string
  reported_at?: string; resolved: boolean
}
type AuthState = "checking" | "unauthenticated" | "authenticated"

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const isSummary = (value: unknown): value is AdminSummary => isRecord(value) && (value.avg_mood === null || typeof value.avg_mood === "number") && typeof value.count === "number"
const isRecordArray = (value: unknown): value is Record<string, unknown>[] => Array.isArray(value) && value.every(isRecord)
const textValue = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback

function mapSignup(item: Record<string, unknown>): PeerSignup {
  const privateData = isRecord(item.private) ? item.private : {}
  return {
    id: textValue(item.supporter_id), name: textValue(item.display_name, "Supporter"), email: textValue(privateData.email), phone: textValue(privateData.phone),
    year: textValue(item.year, "Year not provided"), major: textValue(item.major), locations: Array.isArray(item.locations) ? item.locations.filter(value => typeof value === "string") : [],
    availability: Array.isArray(item.availability) ? item.availability.filter(value => typeof value === "string") : [], interests: Array.isArray(item.interests) ? item.interests.filter(value => typeof value === "string") : [],
    about: textValue(item.about), refName: textValue(privateData.reference_name), refPhone: textValue(privateData.reference_phone), refEmail: textValue(privateData.reference_email), refRelationship: textValue(privateData.reference_relationship),
    approved: item.status === "approved", submitted_at: textValue(item.submitted_at) || undefined,
  }
}

function mapRequest(item: Record<string, unknown>): PeerRequest {
  const request = isRecord(item.request) ? item.request : {}
  const location = isRecord(request.location) ? request.location : {}
  const meetingWindow = isRecord(request.meeting_window) ? request.meeting_window : {}
  const requesterId = textValue(item.requester_id)
  const supporterId = textValue(item.supporter_id)
  return {
    id: textValue(item.request_id), requester_name: `Requester ${requesterId.slice(0, 8)}`, supporter_name: `Supporter ${supporterId.slice(0, 8)}`,
    preferred_location: textValue(location.name, "Not provided"), preferred_time: textValue(meetingWindow.name, "Not provided"), message: textValue(request.message),
    status: textValue(item.status, "unknown"), requested_at: textValue(item.requested_at) || undefined,
  }
}

function mapReport(item: Record<string, unknown>): SupporterReport {
  const supporterId = textValue(item.supporter_id)
  return { id: textValue(item.report_id), supporter_name: `Supporter ${supporterId.slice(0, 8)}`, reason: "Legacy report details are restricted to the moderation record.", reported_at: textValue(item.reported_at) || undefined, resolved: item.status === "resolved" }
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("checking")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [pageError, setPageError] = useState("")
  const [loadingData, setLoadingData] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [actionKey, setActionKey] = useState("")
  const [tab, setTab] = useState("overview")
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [signups, setSignups] = useState<PeerSignup[]>([])
  const [requests, setRequests] = useState<PeerRequest[]>([])
  const [reports, setReports] = useState<SupporterReport[]>([])
  const [selectedSignup, setSelectedSignup] = useState<PeerSignup | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PeerRequest | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all")

  const adminFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    try {
      return await adminRequest(API_URL, path, options)
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.kind === "unauthorized") {
        setAuthState("unauthenticated")
        setLoginError(requestError.message)
      }
      throw requestError
    }
  }, [])

  const showApiError = useCallback((requestError: unknown, fallback: string) => {
    const message = requestError instanceof AdminApiError ? requestError.message : fallback
    setPageError(message)
  }, [])

  async function login(event?: FormEvent) {
    event?.preventDefault()
    if (!password || loginLoading) return
    setLoginError("")
    setLoginLoading(true)
    try {
      await adminFetch("/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      setPassword("")
      setAuthState("authenticated")
      await loadData()
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.kind !== "unauthorized") {
        setLoginError(requestError.message)
      } else if (!(requestError instanceof AdminApiError)) {
        setLoginError("Unable to sign in. Please try again.")
      }
    } finally {
      setLoginLoading(false)
    }
  }

  async function logout() {
    try {
      await adminFetch("/admin/auth/logout", { method: "POST" })
    } catch (requestError) {
      setLoginError(requestError instanceof AdminApiError ? `Signed out locally. ${requestError.message}` : "Signed out locally, but the server could not be reached.")
    }
    setAuthState("unauthenticated")
    setSummary(null)
    setSignups([])
    setRequests([])
    setReports([])
    setDataReady(false)
  }

  const loadData = useCallback(async () => {
    setLoadingData(true)
    setPageError("")
    try {
      const [s, sg, r, rp] = await Promise.all([
        adminFetch("/campus/summary").then(res => parseAdminJson(res, isSummary)),
        adminFetch("/peer-signups").then(res => parseAdminJson(res, isRecordArray)),
        adminFetch("/peer-requests").then(res => parseAdminJson(res, isRecordArray)),
        adminFetch("/reports").then(res => parseAdminJson(res, isRecordArray)),
      ])
      setSummary(s)
      setSignups(sg.map(mapSignup))
      setRequests(r.map(mapRequest))
      setReports(rp.map(mapReport))
      setDataReady(true)
    } catch (requestError) {
      showApiError(requestError, "Unable to load administrator data.")
    } finally {
      setLoadingData(false)
    }
  }, [adminFetch, showApiError])

  useEffect(() => {
    adminRequest(API_URL, "/admin/auth/session")
      .then(() => {
        setAuthState("authenticated")
        void loadData()
      })
      .catch(requestError => {
        setAuthState("unauthenticated")
        if (requestError instanceof AdminApiError && requestError.kind === "network") setLoginError(requestError.message)
      })
  }, [loadData])

  async function approveSignup(id: string) {
    setApproving(id)
    setActionKey(`approve-signup-${id}`)
    setPageError("")
    try {
      await adminFetch(`/peer-signups/${id}/approve`, { method: "POST" })
      await loadData()
      if (selectedSignup?.id === id) setSelectedSignup(prev => prev ? ({ ...prev, approved: true }) : prev)
    } catch (requestError) {
      showApiError(requestError, "Unable to approve this application.")
    }
    setApproving(null)
    setActionKey("")
  }

  async function deleteSignup(id: string) {
    if (!confirm("Remove this application? This cannot be undone.")) return
    setActionKey(`delete-signup-${id}`)
    setPageError("")
    try {
      await adminFetch(`/peer-signups/${id}`, { method: "DELETE" })
      await loadData()
      setSelectedSignup(null)
    } catch (requestError) {
      showApiError(requestError, "Unable to delete this application.")
    } finally {
      setActionKey("")
    }
  }

  async function resolveRequest(id: string) {
    setActionKey(`resolve-request-${id}`)
    setPageError("")
    try {
      await adminFetch(`/peer-requests/${id}/resolve`, { method: "POST" })
      await loadData()
      if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? ({ ...prev, status: "resolved" }) : prev)
    } catch (requestError) {
      showApiError(requestError, "Unable to update this connection request.")
    } finally {
      setActionKey("")
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm("Delete this request? This cannot be undone.")) return
    setActionKey(`delete-request-${id}`)
    setPageError("")
    try {
      await adminFetch(`/peer-requests/${id}`, { method: "DELETE" })
      await loadData()
      setSelectedRequest(null)
    } catch (requestError) {
      showApiError(requestError, "Unable to delete this connection request.")
    } finally {
      setActionKey("")
    }
  }

  async function resolveReport(id: string) {
    setActionKey(`resolve-report-${id}`)
    setPageError("")
    try {
      await adminFetch(`/reports/${id}/resolve`, { method: "POST" })
      setReports(current => current.map(report => report.id === id ? { ...report, resolved: true } : report))
    } catch (requestError) {
      showApiError(requestError, "Unable to update this report.")
    } finally {
      setActionKey("")
    }
  }

  async function deleteReport(id: string) {
    if (!confirm("Delete this report? This cannot be undone.")) return
    setActionKey(`delete-report-${id}`)
    setPageError("")
    try {
      await adminFetch(`/reports/${id}`, { method: "DELETE" })
      setReports(current => current.filter(report => report.id !== id))
    } catch (requestError) {
      showApiError(requestError, "Unable to delete this report.")
    } finally {
      setActionKey("")
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
  const unresolvedReportCount = reports.filter(report => !report.resolved).length

  if (authState !== "authenticated") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#fff8f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", marginBottom: "6px", letterSpacing: "-0.02em" }}>Admin access</h1>
        <p style={{ fontSize: "14px", color: "#717171", marginBottom: "32px" }}>{authState === "checking" ? "Checking secure session..." : "CornellPulse staff only."}</p>
        {authState === "unauthenticated" && <form onSubmit={login} style={{ width: "100%", maxWidth: "320px" }} aria-busy={loginLoading}>
          <label htmlFor="admin-password" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Administrator password</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" disabled={loginLoading} aria-describedby={loginError ? "admin-login-error" : undefined} style={{ width: "100%", padding: "14px 16px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", marginBottom: "12px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
          {loginError && (
            <div id="admin-login-error" role="alert" style={{ backgroundColor: "#FFF0F0", border: "1px solid #C83C42", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: CORAL }}>{loginError}</p>
            </div>
          )}
          <button type="submit" disabled={!password || loginLoading} style={{ width: "100%", padding: "16px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>{loginLoading ? "Signing in..." : "Sign in"}</button>
        </form>}
      </div>
    )
  }

  if (selectedSignup) {
    return (
      <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
        <div style={{ background: "linear-gradient(135deg, #C83C42 0%, #A9461E 100%)", padding: "52px 20px 32px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
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
          {pageError && <div role="alert" style={{ backgroundColor: "#FFF0F0", border: "1px solid #C83C42", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px" }}><p style={{ fontSize: "13px", color: CORAL }}>{pageError}</p></div>}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: selectedSignup.approved ? "#E8F8F5" : "#FFF0F0", color: selectedSignup.approved ? "#007A70" : CORAL, fontSize: "12px", fontWeight: 700 }}>
              {selectedSignup.approved ? "Approved" : "Pending review"}
            </span>
            {selectedSignup.submitted_at && (
              <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: "#f5f5f5", color: "#717171", fontSize: "12px", fontWeight: 600 }}>{timeAgo(selectedSignup.submitted_at)}</span>
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Contact</p>
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
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>About</p>
              <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6 }}>{selectedSignup.about}</p>
            </div>
          )}

          {selectedSignup.locations?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Locations</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.locations.map((l: string) => <span key={l} style={{ padding: "6px 12px", backgroundColor: "#fff8f7", border: "1px solid #ebebeb", borderRadius: "8px", fontSize: "12px", color: "#717171" }}>{l}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.availability?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Availability</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.availability.map((a: string) => <span key={a} style={{ padding: "6px 12px", backgroundColor: "#fff8f7", border: "1px solid #ebebeb", borderRadius: "8px", fontSize: "12px", color: "#717171" }}>{a}</span>)}
              </div>
            </div>
          )}

          {selectedSignup.interests?.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedSignup.interests.map((i: string) => <span key={i} style={{ padding: "6px 12px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "8px", fontSize: "12px", fontWeight: 500 }}>{i}</span>)}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Reference</p>
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
            <button onClick={() => approveSignup(selectedSignup.id)} disabled={approving === selectedSignup.id} style={{ width: "100%", padding: "16px", backgroundColor: approving === selectedSignup.id ? "#ebebeb" : CORAL, color: approving === selectedSignup.id ? "#717171" : "#ffffff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A70" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#007A70" }}>Approved and live on the app</p>
            </div>
          )}

          <button onClick={() => deleteSignup(selectedSignup.id)} disabled={actionKey === `delete-signup-${selectedSignup.id}`} style={{ width: "100%", padding: "16px", backgroundColor: "transparent", border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "14px", fontWeight: 600, color: "#717171", cursor: "pointer" }}>
            {actionKey === `delete-signup-${selectedSignup.id}` ? "Removing..." : "Remove application"}
          </button>
        </div>
      </div>
    )
  }

  if (selectedRequest) {
    return (
      <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
        <div style={{ background: "linear-gradient(135deg, #C83C42 0%, #A9461E 100%)", padding: "52px 20px 32px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
          <button onClick={() => setSelectedRequest(null)} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px 14px", color: "#ffffff", fontSize: "13px", fontWeight: 600, marginBottom: "20px", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Requests
          </button>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Connect request</p>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>{selectedRequest.requester_name}</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Wants to meet {selectedRequest.supporter_name}</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          {pageError && <div role="alert" style={{ backgroundColor: "#FFF0F0", border: "1px solid #C83C42", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px" }}><p style={{ fontSize: "13px", color: CORAL }}>{pageError}</p></div>}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: selectedRequest.status === "resolved" ? "#E8F8F5" : "#FFF0F0", color: selectedRequest.status === "resolved" ? "#007A70" : CORAL, fontSize: "12px", fontWeight: 700, textTransform: "capitalize" }}>
              {selectedRequest.status}
            </span>
            {selectedRequest.requested_at && (
              <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: "#f5f5f5", color: "#717171", fontSize: "12px", fontWeight: 600 }}>{timeAgo(selectedRequest.requested_at)}</span>
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Private contact</p>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55 }}>Direct phone numbers and email addresses are not exposed here. Use the authenticated relay and moderation workflow.</p>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Request details</p>
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
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Message</p>
              <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6, fontStyle: "italic" }}>"{selectedRequest.message}"</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            {selectedRequest.status === "pending" && (
              <button onClick={() => resolveRequest(selectedRequest.id)} disabled={actionKey === `resolve-request-${selectedRequest.id}`} style={{ flex: 2, padding: "14px", backgroundColor: "#E8F8F5", color: "#007A70", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007A70" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {actionKey === `resolve-request-${selectedRequest.id}` ? "Updating..." : "Mark as handled"}
              </button>
            )}
            {selectedRequest.status === "resolved" && (
              <div style={{ flex: 2, padding: "14px", backgroundColor: "#E8F8F5", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007A70" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#007A70" }}>Handled</p>
              </div>
            )}
            <button onClick={() => deleteRequest(selectedRequest.id)} disabled={actionKey === `delete-request-${selectedRequest.id}`} style={{ flex: 1, padding: "14px", backgroundColor: "transparent", border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "14px", fontWeight: 600, color: "#717171", cursor: "pointer" }}>
              {actionKey === `delete-request-${selectedRequest.id}` ? "Deleting..." : "Delete"}
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
    { id: "reports", label: "Reports" },
  ]

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextTab = tabs[nextIndex]
    setTab(nextTab.id)
    document.getElementById(`admin-tab-${nextTab.id}`)?.focus()
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #C83C42 0%, #A9461E 100%)", padding: "52px 20px 28px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>CornellPulse</p>
          <button onClick={logout} style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Sign out</button>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>Admin</h1>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div role="tablist" aria-label="Administrator sections" style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "#ffffff", padding: "4px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {tabs.map((t, index) => (
            <button id={`admin-tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls={`admin-panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} key={t.id} onKeyDown={event => handleTabKeyDown(event, index)} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 6px", border: "none", borderRadius: "10px", backgroundColor: tab === t.id ? CORAL : "transparent", color: tab === t.id ? "#ffffff" : "#717171", fontSize: "13px", fontWeight: tab === t.id ? 700 : 500, cursor: "pointer" }}>
              {t.id === "signups" && pendingCount > 0 ? `Applications (${pendingCount})` : t.id === "requests" && pendingRequestCount > 0 ? `Requests (${pendingRequestCount})` : t.id === "reports" && unresolvedReportCount > 0 ? `Reports (${unresolvedReportCount})` : t.label}
            </button>
          ))}
        </div>

        {pageError && <div role="alert" style={{ backgroundColor: "#FFF0F0", border: "1px solid #C83C42", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: CORAL }}>{pageError}</p>
          <button onClick={() => void loadData()} style={{ color: CORAL, backgroundColor: "transparent", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Retry</button>
        </div>}
        {loadingData && <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "24px 0" }}><p style={{ fontSize: "14px", color: "#717171" }}>Loading administrator data...</p></div>}

        {!loadingData && dataReady && tab === "overview" && (
          <div id="admin-panel-overview" role="tabpanel" aria-labelledby="admin-tab-overview">
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
                  <p style={{ fontSize: "12px", color: "#C83C42" }}>Approve to make them live on the app</p>
                </div>
                <button onClick={() => setTab("signups")} style={{ padding: "8px 16px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Review</button>
              </div>
            )}

            {pendingRequestCount > 0 && (
              <div style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFE0C0", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#A9461E", marginBottom: "2px" }}>{pendingRequestCount} connect request{pendingRequestCount !== 1 ? "s" : ""} need follow-up</p>
                  <p style={{ fontSize: "12px", color: "#A9461E" }}>Email both students to make the introduction</p>
                </div>
                <button onClick={() => setTab("requests")} style={{ padding: "8px 16px", backgroundColor: "#A9461E", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>View</button>
              </div>
            )}

            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222" }}>Recent applications</p>
                <button onClick={() => setTab("signups")} style={{ fontSize: "13px", color: CORAL, fontWeight: 600, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>See all</button>
              </div>
              {signups.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "#717171" }}>No applications yet.</p>
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
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: s.approved ? "#E8F8F5" : "#FFF0F0", color: s.approved ? "#007A70" : CORAL, flexShrink: 0 }}>
                      {s.approved ? "Live" : "Pending"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!loadingData && dataReady && tab === "signups" && (
          <div id="admin-panel-signups" role="tabpanel" aria-labelledby="admin-tab-signups">
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <label htmlFor="application-search" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Search supporter applications</label>
              <input id="application-search" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..." style={{ width: "100%", padding: "12px 14px 12px 40px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
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
                <p style={{ fontSize: "15px", color: "#717171" }}>No applications found.</p>
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
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: s.approved ? "#E8F8F5" : "#FFF0F0", color: s.approved ? "#007A70" : CORAL, flexShrink: 0 }}>
                          {s.approved ? "Live" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.about && <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, marginBottom: "10px" }}>{s.about.slice(0, 100)}{s.about.length > 100 ? "..." : ""}</p>}
                  {s.submitted_at && <p style={{ fontSize: "11px", color: "#717171", marginBottom: "12px" }}>Applied {timeAgo(s.submitted_at)}</p>}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setSelectedSignup(s)} style={{ flex: 1, padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>View</button>
                    {!s.approved && (
                      <button onClick={() => approveSignup(s.id)} disabled={approving === s.id} style={{ flex: 2, padding: "10px", backgroundColor: approving === s.id ? "#ebebeb" : CORAL, color: approving === s.id ? "#717171" : "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        {approving === s.id ? "Approving..." : "Approve"}
                      </button>
                    )}
                    <button aria-label={`Delete application from ${s.name}`} onClick={() => deleteSignup(s.id)} disabled={actionKey === `delete-signup-${s.id}`} style={{ padding: "10px 14px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loadingData && dataReady && tab === "requests" && (
          <div id="admin-panel-requests" role="tabpanel" aria-labelledby="admin-tab-requests">
            {requests.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "15px", color: "#717171" }}>No connect requests yet.</p>
              </div>
            )}
            {requests.map((r, i) => (
              <div key={i} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: r.status === "resolved" ? "1px solid #f0f0f0" : "1px solid #FFE8E8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{r.requester_name}</p>
                    <p style={{ fontSize: "12px", color: "#717171" }}>Wants to meet <strong style={{ color: CORAL }}>{r.supporter_name}</strong></p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: r.status === "resolved" ? "#E8F8F5" : "#FFF0F0", color: r.status === "resolved" ? "#007A70" : CORAL, flexShrink: 0, textTransform: "capitalize" }}>{r.status}</span>
                </div>

                <div style={{ display: "flex", gap: "14px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{r.preferred_location}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{r.preferred_time}</p>
                  </div>
                </div>

                {r.message && (
                  <div style={{ backgroundColor: "#fff8f7", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, fontStyle: "italic" }}>"{r.message}"</p>
                  </div>
                )}

                {r.requested_at && <p style={{ fontSize: "11px", color: "#717171", marginBottom: "12px" }}>{timeAgo(r.requested_at)}</p>}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setSelectedRequest(r)} style={{ flex: 1, padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Details</button>
                  {r.status === "pending" && (
                    <button onClick={() => resolveRequest(r.id)} disabled={actionKey === `resolve-request-${r.id}`} style={{ flex: 2, padding: "10px", backgroundColor: "#E8F8F5", color: "#007A70", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      {actionKey === `resolve-request-${r.id}` ? "Updating..." : "Handled"}
                    </button>
                  )}
                  <button aria-label={`Delete connection request from ${r.requester_name}`} onClick={() => deleteRequest(r.id)} disabled={actionKey === `delete-request-${r.id}`} style={{ padding: "10px 12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingData && dataReady && tab === "reports" && (
          <div id="admin-panel-reports" role="tabpanel" aria-labelledby="admin-tab-reports">
            {reports.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "15px", color: "#717171" }}>No supporter reports yet.</p>
              </div>
            )}
            {reports.map(report => (
              <div key={report.id} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: report.resolved ? "1px solid #f0f0f0" : "1px solid #FFE8E8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{report.supporter_name}</p>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{report.reporter_email || "Reporter contact not provided"}</p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", backgroundColor: report.resolved ? "#E8F8F5" : "#FFF0F0", color: report.resolved ? "#007A70" : CORAL, flexShrink: 0 }}>{report.resolved ? "Resolved" : "Needs review"}</span>
                </div>
                <div style={{ backgroundColor: "#fff8f7", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>{report.reason}</p>
                </div>
                {report.reported_at && <p style={{ fontSize: "11px", color: "#717171", marginBottom: "12px" }}>Reported {timeAgo(report.reported_at)}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  {!report.resolved && <button onClick={() => resolveReport(report.id)} disabled={actionKey === `resolve-report-${report.id}`} style={{ flex: 1, padding: "10px", backgroundColor: "#E8F8F5", color: "#007A70", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{actionKey === `resolve-report-${report.id}` ? "Updating..." : "Mark resolved"}</button>}
                  <button aria-label={`Delete report about ${report.supporter_name}`} onClick={() => deleteReport(report.id)} disabled={actionKey === `delete-report-${report.id}`} style={{ padding: "10px 14px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
