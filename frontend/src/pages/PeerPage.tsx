import { useState, useEffect } from "react"
import { featureFlags } from "../config/featureFlags"
import { getResource } from "../resources/registry.ts"
import { requestJson } from "../api/client"

const CORAL = "#D70466"
const AIRBNB_GRADIENT = "linear-gradient(135deg, #FF5A5F 0%, #FF385C 52%, #E31C5F 100%)"
const crisisResource = getResource("988_lifeline")
const healthResource = getResource("cornell_health_247")

const AVATAR_COLORS = ["#D70466", "#007A70", "#E31C5F", "#5C4BC2", "#007B78", "#FF385C", "#337F7C"]

function isCornellEmail(email: string) {
  return /^[a-zA-Z0-9._%+-]+@cornell\.edu$/i.test(email.trim())
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

const MAJORS = [
  "Africana Studies", "Agricultural Sciences", "American Studies", "Animal Science", "Anthropology",
  "Applied Economics and Management", "Archaeology", "Architecture", "Asian Studies", "Astronomy",
  "Atmospheric Science", "Biological Engineering", "Biological Sciences", "Biology and Society",
  "Biomedical Engineering", "Biometry and Statistics", "Chemical Engineering", "Chemistry",
  "China and Asia-Pacific Studies", "Civil Engineering", "Classics", "Cognitive Science",
  "College Scholar", "Communication", "Comparative Literature", "Computer Science",
  "Design and Environmental Analysis", "Earth and Atmospheric Sciences", "Economics",
  "Electrical and Computer Engineering", "Engineering Physics", "English", "Entomology",
  "Environment and Sustainability", "Environmental Engineering", "Fashion Design and Management",
  "Feminist Gender and Sexuality Studies", "Fiber Science", "Fine Arts", "Food Science", "French",
  "German Studies", "Global and Public Health Sciences", "Global Development", "Government",
  "Health Care Policy", "History", "History of Architecture", "History of Art",
  "Hotel Administration", "Human Biology Health and Society", "Human Development",
  "Independent Major Engineering", "Industrial and Labor Relations", "Information Science",
  "Information Science Systems and Technology", "Interdisciplinary Studies", "Italian",
  "Jewish Studies", "Landscape Architecture", "Linguistics", "Materials Science and Engineering",
  "Mathematics", "Mechanical Engineering", "Music", "Near Eastern Studies", "Nutritional Sciences",
  "Operations Research and Engineering", "Performing and Media Arts", "Philosophy", "Physics",
  "Plant Sciences", "Public Policy", "Psychology", "Religious Studies",
  "Science and Technology Studies", "Sociology", "Spanish", "Statistical Science",
  "Urban and Regional Studies", "Viticulture and Enology",
]

const LOCATIONS = [
  "Olin Library", "Uris Library", "Mann Library", "Engineering Library",
  "Clark Physical Sciences Library", "Math Library", "Management Library",
  "Kroch Library", "Law Library", "Catherwood Library", "Fine Arts Library",
  "Music Library", "Veterinary Library", "Hotel School Library",
  "Goldwin Smith Hall", "Klarman Hall", "Gates Hall", "Physical Sciences Building",
  "Baker Lab", "Rockefeller Hall", "White Hall", "Morrill Hall", "Stimson Hall",
  "Ives Hall", "Statler Hall", "Sibley Hall", "Milstein Hall", "Duffield Hall",
  "Upson Hall", "Phillips Hall", "Hollister Hall", "Rhodes Hall",
  "Libe Cafe", "Mann Cafe", "Cafe Jennie", "Temple of Zeus", "Green Dragon Cafe",
  "Atrium Cafe", "Goldies Cafe", "Mattins Cafe", "Dairy Bar", "Appel Commons",
  "RPCC", "Okenshields", "Trillium",
  "Willard Straight Hall", "Noyes Community Center", "Big Red Barn",
  "Barnes Hall", "Anabel Taylor Hall",
  "Libe Slope", "Arts Quad", "Engineering Quad", "Ag Quad", "Ho Plaza",
  "Snee Hall Terrace", "Botanic Gardens", "Beebe Lake", "Suspension Bridge",
  "Cascadilla Gorge",
  "Donlon Hall", "Risley Hall", "Balch Hall", "Dickson Hall",
  "Court Kay Bauer", "Morrison Hall", "West Campus",
  "Gimme Coffee", "Ithaca Bakery", "Press Cafe", "Collegetown Bagels",
  "Starbucks", "Odyssey Bookstore", "Tompkins County Public Library",
  "Other (anywhere works for me)",
]

const INTERESTS = [
  "Music", "Sports", "Gaming", "Reading", "Film", "Cooking",
  "Hiking", "Art", "Politics", "Tech", "Finance", "Fashion",
  "Travel", "Fitness", "Photography", "Writing", "Volunteering", "Research",
]

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD", "Other"]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_BLOCKS = ["Mornings", "Afternoons", "Early evenings"]

interface MeetingOption { id: string; name: string; rule: string }
type ConnectionState = "pending" | "failed" | "declined" | "expired" | "accepted" | "unavailable" | "canceled" | "blocked"

interface Supporter {
  supporter_id: string
  display_name: string; year: string; major: string
  locations: string[]; availability: string[]
  interests: string[]; about: string
  identity_status?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const hasString = (value: unknown, key: string): boolean => isRecord(value) && typeof value[key] === "string"
const isTokenResponse = (value: unknown): value is { access_token: string } => hasString(value, "access_token")
const CONNECTION_STATES: ConnectionState[] = ["pending", "failed", "declined", "expired", "accepted", "unavailable", "canceled", "blocked"]
const isStatusResponse = (value: unknown): value is { status: string } => hasString(value, "status")
const isConnectionStatusResponse = (value: unknown): value is { status: ConnectionState } => isStatusResponse(value) && CONNECTION_STATES.includes(value.status as ConnectionState)
const isSupporterList = (value: unknown): value is Supporter[] => Array.isArray(value) && value.every(item => hasString(item, "supporter_id") && hasString(item, "display_name"))
const isConnectionList = (value: unknown): value is ManagedConnection[] => Array.isArray(value) && value.every(item => hasString(item, "request_id") && hasString(item, "status"))

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function SupporterCard({ supporter, onRequest }: { supporter: Supporter, onRequest: (s: Supporter) => void }) {
  const color = avatarColor(supporter.display_name)
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", marginBottom: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "12px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: color }}>{supporter.display_name.charAt(0)}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{supporter.display_name}</p>
            {supporter.identity_status === "unverified" && <span style={{ padding: "3px 7px", borderRadius: "999px", backgroundColor: "#FFF5E8", color: "#704214", fontSize: "10px", fontWeight: 700 }}>Identity not verified</span>}
          </div>
          <p style={{ fontSize: "12px", color: "#717171" }}>{supporter.year}{supporter.major ? ` · ${supporter.major}` : ""}</p>
        </div>
      </div>

      {supporter.about && (
        <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.55, marginBottom: "12px" }}>{supporter.about}</p>
      )}

      {supporter.interests && supporter.interests.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {supporter.interests.slice(0, 3).map((i: string) => (
            <span key={i} style={{ padding: "4px 10px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "8px", fontSize: "12px", fontWeight: 500 }}>{i}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
        {supporter.locations && supporter.locations.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: "12px", color: "#717171" }}>{supporter.locations[0]}{supporter.locations.length > 1 ? ` +${supporter.locations.length - 1}` : ""}</span>
          </div>
        )}
        {supporter.availability && supporter.availability.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: "12px", color: "#717171" }}>{supporter.availability[0]}{supporter.availability.length > 1 ? ` +${supporter.availability.length - 1}` : ""}</span>
          </div>
        )}
      </div>

      <button onClick={() => onRequest(supporter)} aria-label={`Talk to ${supporter.display_name}`} style={{ width: "100%", padding: "14px", background: AIRBNB_GRADIENT, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
        Talk to {supporter.display_name}
      </button>
    </div>
  )
}

function RequestModal({ supporter, onClose, onSubmit }: { supporter: Supporter, onClose: () => void, onSubmit: () => void }) {
  const [form, setForm] = useState({ requester_id: "", password: "", location_id: "", meeting_window_id: "", message: "", requester_consent: false })
  const [accountMode, setAccountMode] = useState<"new" | "returning">(featureFlags.peerSandbox ? "new" : "returning")
  const [newAccount, setNewAccount] = useState({ display_name: "", email: "" })
  const [createdRequesterId, setCreatedRequesterId] = useState("")
  const [meetingOptions, setMeetingOptions] = useState<{ locations: MeetingOption[]; meeting_windows: MeetingOption[]; safety_note: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState("")

  useEffect(() => {
    let active = true
    requestJson<{ locations: MeetingOption[]; meeting_windows: MeetingOption[]; safety_note: string }>("/peer/public-meeting-options", {
      validate: (value): value is { locations: MeetingOption[]; meeting_windows: MeetingOption[]; safety_note: string } => isRecord(value) && Array.isArray(value.locations) && Array.isArray(value.meeting_windows) && typeof value.safety_note === "string",
    })
      .then(data => {
        if (active) setMeetingOptions(data)
      })
      .catch(() => { if (active) setError("Peer Connect is unavailable while the safety review is in progress.") })
    return () => { active = false }
  }, [])

  function update(field: string, value: string | boolean) { setForm(prev => ({ ...prev, [field]: value })) }

  const accountReady = accountMode === "new"
    ? Boolean(newAccount.display_name.trim() && isValidEmail(newAccount.email) && form.password.length >= 12)
    : Boolean(form.requester_id && form.password)
  const canSubmit = Boolean(accountReady && form.location_id && form.meeting_window_id && form.requester_consent && meetingOptions)

  async function handleSubmit() {
    setLoading(true)
    setError("")
    setConnectionState(null)
    try {
      let requesterId = form.requester_id
      let accessToken = ""
      if (accountMode === "new") {
        const account = await requestJson<{ requester_id: string; access_token: string; identity_status: string }>("/peer/requesters", {
          method: "POST",
          body: { display_name: newAccount.display_name.trim(), email: newAccount.email.trim(), phone: null, password: form.password },
          idempotencyKey: crypto.randomUUID(),
          validate: (value): value is { requester_id: string; access_token: string; identity_status: string } => hasString(value, "requester_id") && hasString(value, "access_token") && hasString(value, "identity_status"),
        })
        requesterId = account.requester_id
        accessToken = account.access_token
        setCreatedRequesterId(requesterId)
        setForm(current => ({ ...current, requester_id: requesterId }))
      } else {
        const login = await requestJson<{ access_token: string }>("/peer/auth/login", {
          method: "POST",
          body: { role: "requester", subject_id: requesterId, password: form.password },
          idempotencyKey: crypto.randomUUID(),
          validate: isTokenResponse,
        })
        accessToken = login.access_token
      }
      const data = await requestJson<{ request_id: string; status: ConnectionState }>("/peer-connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { supporter_id: supporter.supporter_id, location_id: form.location_id, meeting_window_id: form.meeting_window_id, requester_consent: true, message: form.message || null },
        idempotencyKey: crypto.randomUUID(),
        validate: (value): value is { request_id: string; status: ConnectionState } => isConnectionStatusResponse(value) && hasString(value, "request_id"),
      })
      if (data.status !== "pending") throw new Error("The server did not confirm your request.")
      setToken(accessToken)
      setRequestId(data.request_id)
      setConnectionState("pending")
    } catch (cause) {
      setConnectionState("failed")
      setError(cause instanceof Error ? cause.message : "We could not confirm the request. It has not been shown as submitted.")
    } finally {
      setLoading(false)
    }
  }

  const color = avatarColor(supporter.display_name)

  async function submitReport() {
    if (!token || !requestId || reportReason.trim().length < 10) return
    setLoading(true); setError("")
    try {
      const data = await requestJson<{ status: string }>(`/peer-requests/${requestId}/report`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { reason: reportReason }, idempotencyKey: crypto.randomUUID(), validate: isStatusResponse })
      if (data.status !== "submitted") throw new Error("The server did not confirm the safety report.")
      setShowReport(false); setReportReason("")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The safety report was not confirmed.") }
    finally { setLoading(false) }
  }

  if (showReport) {
    return (
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "24px 24px 48px", width: "100%" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#222222", marginBottom: "8px" }}>Report a concern</h3>
          <p style={{ fontSize: "13px", color: "#717171", marginBottom: "16px" }}>This goes directly to our team and is kept confidential.</p>
          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="What happened?" rows={4} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", resize: "none", marginBottom: "16px", fontFamily: "DM Sans, sans-serif" }} />
          {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}
          <button onClick={submitReport} disabled={reportReason.trim().length < 10 || loading} style={{ width: "100%", padding: "14px", backgroundColor: reportReason.trim().length >= 10 ? CORAL : "#ebebeb", color: reportReason.trim().length >= 10 ? "#fff" : "#717171", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: reportReason.trim().length >= 10 ? "pointer" : "default" }}>
            Submit report
          </button>
        </div>
      </div>
    )
  }

  if (connectionState && connectionState !== "failed") {
    return (
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "32px 24px 48px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", marginBottom: "8px" }}>{connectionState === "accepted" ? "Both people opted in" : connectionState === "pending" ? "Request pending" : `Request ${connectionState}`}</h3>
            <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6 }}>
              {connectionState === "pending" && `The server confirmed your request. ${supporter.display_name} still needs to choose whether to accept.`}
              {connectionState === "accepted" && "The in-app relay is now available. Neither person's email address or phone number is revealed."}
              {connectionState === "declined" && "The supporter declined this request. No contact information was shared."}
              {connectionState === "expired" && "The response window ended before both people opted in."}
              {connectionState === "unavailable" && "This connection is no longer available."}
              {connectionState === "canceled" && "You canceled this request."}
              {connectionState === "blocked" && "This connection is unavailable."}
            </p>
          </div>

          <div style={{ backgroundColor: "#fff8f7", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: color }}>{supporter.display_name.charAt(0)}</span>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222" }}>{supporter.display_name}</p>
            </div>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>No phone number or email address is returned by the public supporter API.</p>
          </div>

          {createdRequesterId && <div role="note" style={{ backgroundColor: "#FFF1F2", borderRadius: "14px", padding: "14px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 800, color: "#222222", marginBottom: "4px" }}>Save your private requester ID</p>
            <p style={{ fontSize: "12px", color: "#595959", lineHeight: 1.5, marginBottom: "8px" }}>You’ll need this ID and your password to check the request later.</p>
            <p style={{ fontSize: "12px", fontWeight: 700, color: CORAL, overflowWrap: "anywhere", userSelect: "all" }}>{createdRequesterId}</p>
          </div>}

          {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}
          {connectionState === "pending" && <button onClick={async () => {
            if (!token || !requestId) return
            setLoading(true); setError("")
            try {
              const data = await requestJson<ManagedConnection[]>(`/peer/requesters/${form.requester_id}/requests`, { headers: { Authorization: `Bearer ${token}` }, validate: isConnectionList })
              const current = data.find(item => item.request_id === requestId)
              if (!current) throw new Error("The server could not confirm the current request state.")
              setConnectionState(current.status)
            } catch (cause) { setError(cause instanceof Error ? cause.message : "Status could not be refreshed.") }
            finally { setLoading(false) }
          }} disabled={loading} style={{ width: "100%", padding: "14px", backgroundColor: "#FFF0F0", color: CORAL, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, marginBottom: "10px", cursor: "pointer" }}>Refresh status</button>}
          {(connectionState === "pending" || connectionState === "accepted") && <button onClick={async () => {
            if (!token || !requestId) return
            setLoading(true); setError("")
            try {
              const data = await requestJson<{ status: ConnectionState }>(`/peer-requests/${requestId}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, idempotencyKey: crypto.randomUUID(), validate: isConnectionStatusResponse })
              if (data.status !== "canceled") throw new Error("The server did not confirm cancellation.")
              setConnectionState("canceled")
            } catch (cause) { setError(cause instanceof Error ? cause.message : "Cancellation was not confirmed.") }
            finally { setLoading(false) }
          }} disabled={loading} style={{ width: "100%", padding: "12px", backgroundColor: "#f5f5f5", color: "#595959", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 600, marginBottom: "10px", cursor: "pointer" }}>Cancel request</button>}
          <button onClick={onSubmit} style={{ width: "100%", padding: "16px", backgroundColor: "#f5f5f5", color: "#595959", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, marginBottom: "10px", cursor: "pointer" }}>Done</button>
          <button onClick={() => setShowReport(true)} style={{ width: "100%", padding: "10px", backgroundColor: "transparent", border: "none", color: "#717171", fontSize: "12px", cursor: "pointer" }}>Report a safety concern</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "24px 24px 48px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "2px" }}>Talk to {supporter.display_name}</h3>
            <p style={{ fontSize: "13px", color: "#717171" }}>One private request. Your contact details stay hidden.</p>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#f5f5f5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {featureFlags.peerSandbox && <div role="group" aria-label="Account status" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "4px", backgroundColor: "#F7F5F4", borderRadius: "14px", marginBottom: "18px" }}>
          <button type="button" aria-pressed={accountMode === "new"} onClick={() => setAccountMode("new")} style={{ padding: "10px", borderRadius: "11px", backgroundColor: accountMode === "new" ? "#ffffff" : "transparent", color: accountMode === "new" ? "#222222" : "#717171", boxShadow: accountMode === "new" ? "0 1px 5px rgba(0,0,0,0.08)" : "none", fontSize: "13px", fontWeight: 700 }}>I’m new</button>
          <button type="button" aria-pressed={accountMode === "returning"} onClick={() => setAccountMode("returning")} style={{ padding: "10px", borderRadius: "11px", backgroundColor: accountMode === "returning" ? "#ffffff" : "transparent", color: accountMode === "returning" ? "#222222" : "#717171", boxShadow: accountMode === "returning" ? "0 1px 5px rgba(0,0,0,0.08)" : "none", fontSize: "13px", fontWeight: 700 }}>I have an account</button>
        </div>}

        {accountMode === "new" ? <>
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="request-display-name" style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>First name or nickname <span style={{ color: CORAL }}>*</span></label>
            <input id="request-display-name" value={newAccount.display_name} onChange={event => setNewAccount(current => ({ ...current, display_name: event.target.value }))} placeholder="What should we call you?" autoComplete="name" style={{ width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="request-email" style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Email <span style={{ color: CORAL }}>*</span></label>
            <input id="request-email" value={newAccount.email} onChange={event => setNewAccount(current => ({ ...current, email: event.target.value }))} placeholder="you@example.com" type="email" autoComplete="email" style={{ width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
          </div>
        </> : <div style={{ marginBottom: "14px" }}>
          <label htmlFor="requester-id" style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Requester ID <span style={{ color: CORAL }}>*</span></label>
          <input id="requester-id" value={form.requester_id} onChange={event => update("requester_id", event.target.value)} placeholder="Your requester ID" autoComplete="username" style={{ width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
        </div>}

        <div style={{ marginBottom: "18px" }}>
          <label htmlFor="requester-password" style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>{accountMode === "new" ? "Create a password" : "Password"} <span style={{ color: CORAL }}>*</span></label>
          <input id="requester-password" value={form.password} onChange={event => update("password", event.target.value)} placeholder={accountMode === "new" ? "At least 12 characters" : "Your requester password"} type="password" autoComplete={accountMode === "new" ? "new-password" : "current-password"} style={{ width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
        </div>

        <fieldset style={{ margin: "0 0 14px", padding: 0, border: 0 }}>
          <legend style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "8px" }}>Public meetup area <span style={{ color: CORAL }}>*</span></legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {(meetingOptions?.locations || []).map(location => (
              <button key={location.id} type="button" role="radio" aria-checked={form.location_id === location.id} onClick={() => update("location_id", location.id)} style={{ padding: "12px 8px", border: `2px solid ${form.location_id === location.id ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: form.location_id === location.id ? "#FFF0F0" : "#ffffff", color: form.location_id === location.id ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>
                {location.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ margin: "0 0 20px", padding: 0, border: 0 }}>
          <legend style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "8px" }}>Safe meeting window <span style={{ color: CORAL }}>*</span></legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {(meetingOptions?.meeting_windows || []).map(window => <button key={window.id} type="button" role="radio" aria-checked={form.meeting_window_id === window.id} onClick={() => update("meeting_window_id", window.id)} style={{ padding: "12px 8px", border: `2px solid ${form.meeting_window_id === window.id ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: form.meeting_window_id === window.id ? "#FFF0F0" : "#ffffff", color: form.meeting_window_id === window.id ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>{window.name}</button>)}
          </div>
        </fieldset>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Anything you want them to know <span style={{ color: "#717171", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.message} onChange={e => update("message", e.target.value)} maxLength={300} placeholder="Whatever feels right to share." rows={3} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", resize: "none", fontFamily: "DM Sans, sans-serif" }} />
          <p style={{ fontSize: "12px", color: "#717171", textAlign: "right", marginTop: "4px" }}>{form.message.length}/300</p>
        </div>

        <div style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "12px 14px", marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.6 }}>{meetingOptions?.safety_note || "Loading safe meeting options..."}</p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "10px", fontSize: "12px", color: "#717171", lineHeight: 1.5 }}>
            <input type="checkbox" checked={form.requester_consent} onChange={event => update("requester_consent", event.target.checked)} />
            I choose to send this request. My contact information stays private; the in-app relay opens only if the supporter also accepts.
          </label>
        </div>

        {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ width: "100%", padding: "16px", backgroundColor: canSubmit && !loading ? CORAL : "#ebebeb", color: canSubmit && !loading ? "#ffffff" : "#717171", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: canSubmit && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {loading && <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          {loading ? "Sending..." : "Send request"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

interface ManagedConnection {
  request_id: string
  supporter_id: string
  requester_id: string
  status: ConnectionState
  expires_at: string | null
  requester_consented: boolean
  supporter_consented: boolean
  relay_available: boolean
  request?: { location?: MeetingOption; meeting_window?: MeetingOption; message?: string | null }
}

function ConnectionManager() {
  const [role, setRole] = useState<"supporter" | "requester">("supporter")
  const [subjectId, setSubjectId] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [connections, setConnections] = useState<ManagedConnection[]>([])
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [reportDrafts, setReportDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function loadConnections(activeToken = token) {
    const path = role === "supporter" ? `supporters/${subjectId}` : `requesters/${subjectId}`
    const data = await requestJson<ManagedConnection[]>(`/peer/${path}/requests`, { headers: { Authorization: `Bearer ${activeToken}` }, validate: isConnectionList })
    setConnections(data)
  }

  async function login() {
    setLoading(true); setError("")
    try {
      const data = await requestJson<{ access_token: string }>("/peer/auth/login", { method: "POST", body: { role, subject_id: subjectId, password }, idempotencyKey: crypto.randomUUID(), validate: isTokenResponse })
      setToken(data.access_token)
      await loadConnections(data.access_token)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed.") }
    finally { setLoading(false) }
  }

  async function supporterAction(requestId: string, action: "accept" | "decline" | "expire" | "block") {
    setLoading(true); setError("")
    try {
      const data = await requestJson<{ status: ConnectionState }>(`/peer-requests/${requestId}/supporter-action`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: { action }, idempotencyKey: crypto.randomUUID(), validate: isConnectionStatusResponse })
      const expected = action === "accept" ? "accepted" : action === "decline" ? "declined" : action === "expire" ? "expired" : "blocked"
      if (data.status !== expected) throw new Error(`The server did not confirm ${expected}.`)
      await loadConnections()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The action was not confirmed.") }
    finally { setLoading(false) }
  }

  async function confirmedAction(path: string, expected: string, body?: object) {
    setLoading(true); setError("")
    try {
      const data = await requestJson<{ status: string }>(`/${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, idempotencyKey: crypto.randomUUID(), validate: isStatusResponse })
      if (data.status !== expected) throw new Error(`The server did not confirm ${expected}.`)
      await loadConnections()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The action was not confirmed.") }
    finally { setLoading(false) }
  }

  if (!token) return <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#222222", marginBottom: "6px" }}>Manage connection requests</h3>
    <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, marginBottom: "16px" }}>Credentials stay in this page's memory and are exchanged only for a short-lived server token.</p>
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Role</label>
    <select value={role} onChange={event => setRole(event.target.value as "supporter" | "requester")} style={{ width: "100%", padding: "13px", border: "2px solid #ebebeb", borderRadius: "12px", marginBottom: "12px", backgroundColor: "#fff" }}><option value="supporter">Supporter</option><option value="requester">Requester</option></select>
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Account ID</label>
    <input value={subjectId} onChange={event => setSubjectId(event.target.value)} autoComplete="username" style={{ width: "100%", padding: "13px", border: "2px solid #ebebeb", borderRadius: "12px", marginBottom: "12px" }} />
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Password</label>
    <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" style={{ width: "100%", padding: "13px", border: "2px solid #ebebeb", borderRadius: "12px", marginBottom: "12px" }} />
    {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}
    <button onClick={login} disabled={!subjectId || !password || loading} style={{ width: "100%", padding: "14px", border: 0, borderRadius: "12px", backgroundColor: subjectId && password ? CORAL : "#ebebeb", color: subjectId && password ? "#fff" : "#717171", fontWeight: 700 }}>{loading ? "Signing in..." : "Sign in"}</button>
  </div>

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}><p style={{ fontSize: "13px", color: "#717171" }}>{connections.length} request{connections.length === 1 ? "" : "s"}</p><button onClick={() => { setToken(""); setConnections([]); setPassword("") }} style={{ border: 0, background: "transparent", color: CORAL, fontWeight: 600 }}>Sign out</button></div>
    {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}
    {connections.length === 0 && <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "24px", textAlign: "center" }}><p style={{ color: "#717171", fontSize: "14px" }}>No connection requests.</p></div>}
    {connections.map(connection => <div key={connection.request_id} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", marginBottom: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><p style={{ fontSize: "14px", fontWeight: 700, color: "#222" }}>Connection request</p><span style={{ fontSize: "12px", color: CORAL, textTransform: "capitalize" }}>{connection.status}</span></div>
      {connection.request?.location && <p style={{ fontSize: "13px", color: "#717171", marginBottom: "4px" }}>{connection.request.location.name}</p>}
      {connection.request?.meeting_window && <p style={{ fontSize: "13px", color: "#717171", marginBottom: "10px" }}>{connection.request.meeting_window.name}</p>}
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "12px" }}>{connection.status === "pending" ? "The requester opted in. No contact details are shown; the relay opens only after acceptance." : connection.relay_available ? "Both people opted in. Use the in-app relay; contact details remain private." : "This request is no longer awaiting a response."}</p>
      {role === "supporter" && connection.status === "pending" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button onClick={() => supporterAction(connection.request_id, "accept")} disabled={loading} style={{ padding: "11px", border: 0, borderRadius: "10px", backgroundColor: CORAL, color: "#fff", fontWeight: 700 }}>Accept</button>
        <button onClick={() => supporterAction(connection.request_id, "decline")} disabled={loading} style={{ padding: "11px", border: 0, borderRadius: "10px", backgroundColor: "#f5f5f5", color: "#595959", fontWeight: 700 }}>Decline</button>
        <button onClick={() => supporterAction(connection.request_id, "expire")} disabled={loading} style={{ padding: "11px", border: 0, borderRadius: "10px", backgroundColor: "#f5f5f5", color: "#595959", fontWeight: 700 }}>Expire</button>
        <button onClick={() => window.confirm("Block this requester? This ends the request and prevents another request while the block is active.") && supporterAction(connection.request_id, "block")} disabled={loading} style={{ padding: "11px", border: 0, borderRadius: "10px", backgroundColor: "#FFF0F0", color: CORAL, fontWeight: 700 }}>Block</button>
      </div>}
      {role === "requester" && (connection.status === "pending" || connection.status === "accepted") && <button onClick={() => window.confirm("Cancel this connection request?") && confirmedAction(`peer-requests/${connection.request_id}/cancel`, "canceled")} disabled={loading} style={{ width: "100%", padding: "11px", border: 0, borderRadius: "10px", backgroundColor: "#f5f5f5", color: "#595959", fontWeight: 700 }}>Cancel request</button>}
      {connection.relay_available && <div style={{ marginTop: "12px" }}>
        <label htmlFor={`relay-${connection.request_id}`} style={{ fontSize: "12px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>In-app relay message</label>
        <textarea id={`relay-${connection.request_id}`} value={messageDrafts[connection.request_id] || ""} onChange={event => setMessageDrafts(current => ({ ...current, [connection.request_id]: event.target.value }))} maxLength={1000} placeholder="Do not include email, phone, links, or social handles." rows={2} style={{ width: "100%", padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", resize: "vertical", marginBottom: "6px" }} />
        <button onClick={() => confirmedAction(`peer-requests/${connection.request_id}/messages`, "sent", { body: messageDrafts[connection.request_id] })} disabled={loading || !messageDrafts[connection.request_id]?.trim()} style={{ width: "100%", padding: "10px", border: 0, borderRadius: "10px", backgroundColor: CORAL, color: "#fff", fontWeight: 700 }}>Send through relay</button>
      </div>}
      <details style={{ marginTop: "12px" }}><summary style={{ fontSize: "12px", color: "#717171", cursor: "pointer" }}>Report a safety concern</summary>
        <label htmlFor={`report-${connection.request_id}`} style={{ fontSize: "12px", color: "#717171", display: "block", margin: "8px 0 4px" }}>Describe the concern (at least 10 characters)</label>
        <textarea id={`report-${connection.request_id}`} value={reportDrafts[connection.request_id] || ""} onChange={event => setReportDrafts(current => ({ ...current, [connection.request_id]: event.target.value }))} maxLength={500} rows={2} style={{ width: "100%", padding: "10px", border: "2px solid #ebebeb", borderRadius: "10px", resize: "vertical", marginBottom: "6px" }} />
        <button onClick={() => confirmedAction(`peer-requests/${connection.request_id}/report`, "submitted", { reason: reportDrafts[connection.request_id] })} disabled={loading || (reportDrafts[connection.request_id]?.trim().length || 0) < 10} style={{ width: "100%", padding: "10px", border: 0, borderRadius: "10px", backgroundColor: "#FFF0F0", color: CORAL, fontWeight: 700 }}>Submit safety report</button>
      </details>
    </div>)}
  </div>
}

function RequesterSignupForm() {
  const [form, setForm] = useState({ display_name: "", email: "", phone: "", password: "" })
  const [requesterId, setRequesterId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const valid = Boolean(form.display_name.trim() && isValidEmail(form.email) && form.password.length >= 12)

  function update(field: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function register() {
    if (!valid) return
    setLoading(true); setError("")
    try {
      const result = await requestJson<{ requester_id: string; access_token: string; identity_status: string }>("/peer/requesters", {
        method: "POST",
        body: { ...form, phone: form.phone.trim() || null },
        idempotencyKey: crypto.randomUUID(),
        validate: (value): value is { requester_id: string; access_token: string; identity_status: string } => hasString(value, "requester_id") && hasString(value, "access_token") && hasString(value, "identity_status"),
      })
      setRequesterId(result.requester_id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The server did not create the requester account.")
    } finally { setLoading(false) }
  }

  if (requesterId) return (
    <section aria-labelledby="requester-created" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "22px", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
      <div style={{ width: "54px", height: "54px", borderRadius: "17px", backgroundColor: "#E8F8F5", color: "#007A70", display: "grid", placeItems: "center", fontSize: "24px", fontWeight: 800, marginBottom: "15px" }}>✓</div>
      <h2 id="requester-created" style={{ fontSize: "21px", color: "#222222", marginBottom: "7px" }}>Your requester account is ready</h2>
      <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.55, marginBottom: "14px" }}>Save this ID. You will use it with your password to request peers and manage connections.</p>
      <div style={{ backgroundColor: "#F7F5F4", borderRadius: "13px", padding: "12px", marginBottom: "13px" }}><p style={{ fontSize: "11px", color: "#717171", marginBottom: "3px" }}>Requester ID</p><p style={{ fontSize: "12px", color: "#222222", fontWeight: 700, overflowWrap: "anywhere", userSelect: "all" }}>{requesterId}</p></div>
      <div role="note" style={{ backgroundColor: "#FFF5E8", color: "#704214", borderRadius: "13px", padding: "12px", fontSize: "12px", lineHeight: 1.5 }}>Cornell identity verification is coming soon. This sandbox account is not identity verified.</div>
    </section>
  )

  const inputStyle = { width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }
  return (
    <section aria-labelledby="requester-signup-title">
      <h2 id="requester-signup-title" style={{ fontSize: "21px", color: "#222222", marginBottom: "6px" }}>Create a requester account</h2>
      <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "18px" }}>Use this account to ask a peer to connect. Your email and phone are never shown in the supporter directory.</p>
      <div role="note" style={{ backgroundColor: "#FFF5E8", border: "1px solid #F1D4A8", borderRadius: "14px", padding: "12px", marginBottom: "16px", color: "#704214", fontSize: "12px", lineHeight: 1.5 }}><strong>Cornell identity verification is coming soon.</strong> Anyone can create an account in this non-production sandbox, so identities are not verified.</div>
      {([
        ["display_name", "Display name", "Your name", "text"],
        ["email", "Email", "you@example.com", "email"],
        ["phone", "Phone (optional and private)", "Optional phone number", "tel"],
        ["password", "Password", "At least 12 characters", "password"],
      ] as const).map(([field, label, placeholder, type]) => <div key={field} style={{ marginBottom: "13px" }}><label htmlFor={`requester-${field}`} style={{ display: "block", fontSize: "13px", fontWeight: 650, color: "#222222", marginBottom: "6px" }}>{label}</label><input id={`requester-${field}`} value={form[field]} onChange={event => update(field, event.target.value)} placeholder={placeholder} type={type} autoComplete={field === "password" ? "new-password" : undefined} style={inputStyle} /></div>)}
      {form.email && !isValidEmail(form.email) && <p role="alert" style={{ fontSize: "12px", color: CORAL, margin: "-5px 0 12px" }}>Enter a valid email address.</p>}
      {error && <p role="alert" style={{ fontSize: "12px", color: CORAL, marginBottom: "12px" }}>{error}</p>}
      <button type="button" onClick={register} disabled={!valid || loading} style={{ width: "100%", padding: "15px", border: 0, borderRadius: "13px", backgroundColor: valid && !loading ? CORAL : "#ebebeb", color: valid && !loading ? "#ffffff" : "#717171", fontSize: "14px", fontWeight: 750 }}>{loading ? "Creating account..." : "Create requester account"}</button>
    </section>
  )
}

function SignupForm({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const TOTAL = 3
  const [submitted, setSubmitted] = useState(false)
  const [supporterId, setSupporterId] = useState("")
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [majorSearch, setMajorSearch] = useState("")
  const [showMajorList, setShowMajorList] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", year: "", majors: [] as string[],
    locations: [] as string[], availability: [] as string[],
    interests: [] as string[], about: "",
  })

  function update(field: string, value: string | string[]) { setForm(prev => ({ ...prev, [field]: value })) }
  function toggleArray(field: string, value: string) {
    const arr = form[field as keyof typeof form] as string[]
    update(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }
  function addMajor(m: string) {
    if (form.majors.includes(m) || form.majors.length >= 2) return
    update("majors", [...form.majors, m])
    setMajorSearch(""); setShowMajorList(false)
  }

  const filteredMajors = majorSearch ? MAJORS.filter(m => m.toLowerCase().includes(majorSearch.toLowerCase()) && !form.majors.includes(m)).slice(0, 8) : []
  const filteredLocations = LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
  const emailValid = featureFlags.peerSandbox ? isValidEmail(form.email) : isCornellEmail(form.email)

  const step1Valid = form.name && emailValid && form.phone && form.password.length >= 12 && form.year
  const step2Valid = form.locations.length > 0
  const step3Valid = policyAccepted

  async function handleSubmit() {
    setSubmitError("")
    try {
      const draft = await requestJson<{ supporter_id: string; access_token: string }>("/peer-signup", {
        method: "POST",
        body: { display_name: form.name, email: form.email, phone: form.phone, password: form.password, year: form.year, major: form.majors.join(", "), locations: form.locations, availability: form.availability, interests: form.interests, about: form.about },
        idempotencyKey: crypto.randomUUID(),
        validate: (value): value is { supporter_id: string; access_token: string } => hasString(value, "supporter_id") && hasString(value, "access_token"),
      })
      const submittedApplication = await requestJson<{ status: string }>(`/peer-signups/${draft.supporter_id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${draft.access_token}` },
        body: { policy_version: "2026-08-02", role_scope_accepted: true, conduct_standards_accepted: true, crisis_boundaries_accepted: true, public_meeting_rules_accepted: true, reporting_policy_accepted: true, withdrawal_controls_acknowledged: true },
        idempotencyKey: crypto.randomUUID(),
        validate: isStatusResponse,
      })
      if (featureFlags.peerSandbox && submittedApplication.status !== "approved") throw new Error("The sandbox did not publish the supporter profile.")
      setSupporterId(draft.supporter_id)
      setSubmitted(true)
      onCreated()
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "The server did not confirm this application.")
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", marginBottom: "10px" }}>{featureFlags.peerSandbox ? "Your supporter profile is live" : "Application received"}</h2>
        {featureFlags.peerSandbox ? <>
          <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>People using this sandbox can now find your profile. Save your supporter ID to manage and respond to requests.</p>
          <div style={{ backgroundColor: "#F7F5F4", borderRadius: "13px", padding: "12px", marginBottom: "12px", textAlign: "left" }}><p style={{ fontSize: "11px", color: "#717171", marginBottom: "3px" }}>Supporter ID</p><p style={{ fontSize: "12px", color: "#222222", fontWeight: 700, overflowWrap: "anywhere", userSelect: "all" }}>{supporterId}</p></div>
          <div role="note" style={{ backgroundColor: "#FFF5E8", color: "#704214", borderRadius: "13px", padding: "12px", fontSize: "12px", lineHeight: 1.5, textAlign: "left" }}>Cornell identity verification is coming soon. Your profile is labeled as not identity verified.</div>
        </> : <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6 }}>The server recorded the application. Review, identity, reference, training, and approval steps are still pending; no outreach or approval is guaranteed.</p>}
      </div>
    )
  }

  const inputStyle = { width: "100%", padding: "13px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }
  const labelStyle = { fontSize: "14px", fontWeight: 600 as const, color: "#222222", display: "block" as const, marginBottom: "6px" }

  function PillBtn({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} style={{ padding: "10px 12px", border: `2px solid ${selected ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: selected ? "#FFF0F0" : "#ffffff", color: selected ? CORAL : "#717171", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "center" as const }}>
        {label}
      </button>
    )
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171" }}>Step {step} of {TOTAL}</p>
          <p style={{ fontSize: "12px", color: "#717171" }}>{Math.round((step / TOTAL) * 100)}% complete</p>
        </div>
        <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "6px" }}>
          <div style={{ height: "6px", backgroundColor: CORAL, borderRadius: "6px", width: ((step / TOTAL) * 100) + "%", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "6px" }}>Basic info</h3>
          <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px" }}>Tell us a little about yourself.</p>

          <div style={{ marginBottom: "14px" }}><label style={labelStyle}>Full name <span style={{ color: CORAL }}>*</span></label><input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your name" style={inputStyle} /></div>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>{featureFlags.peerSandbox ? "Email" : "Cornell email"} <span style={{ color: CORAL }}>*</span></label>
            <input value={form.email} onChange={e => update("email", e.target.value)} placeholder={featureFlags.peerSandbox ? "you@example.com" : "netid@cornell.edu"} type="email" style={{ ...inputStyle, borderColor: form.email && !emailValid ? CORAL : "#ebebeb" }} />
            {form.email && !emailValid && <p style={{ fontSize: "12px", color: CORAL, marginTop: "4px" }}>{featureFlags.peerSandbox ? "Enter a valid email address." : "Must be a valid @cornell.edu email."}</p>}
          </div>
          <div style={{ marginBottom: "14px" }}><label style={labelStyle}>Phone number <span style={{ color: CORAL }}>*</span></label><input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Your phone" type="tel" style={inputStyle} /></div>
          <div style={{ marginBottom: "14px" }}><label style={labelStyle}>Password <span style={{ color: CORAL }}>*</span></label><input value={form.password} onChange={e => update("password", e.target.value)} placeholder="At least 12 characters" type="password" autoComplete="new-password" style={inputStyle} /></div>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Year <span style={{ color: CORAL }}>*</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {YEARS.map(y => <PillBtn key={y} label={y} selected={form.year === y} onClick={() => update("year", y)} />)}
            </div>
          </div>
          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label style={labelStyle}>Major <span style={{ color: "#717171", fontWeight: 400 }}>(up to 2, optional)</span></label>
            {form.majors.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {form.majors.map(m => (
                  <span key={m} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    {m}
                    <button onClick={() => update("majors", form.majors.filter(x => x !== m))} style={{ background: "transparent", border: "none", color: CORAL, fontSize: "14px", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            {form.majors.length < 2 && (
              <input value={majorSearch} onChange={e => { setMajorSearch(e.target.value); setShowMajorList(true) }} onFocus={() => setShowMajorList(true)} placeholder="Search majors..." style={inputStyle} />
            )}
            {showMajorList && filteredMajors.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#ffffff", borderRadius: "12px", marginTop: "4px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #f0f0f0" }}>
                {filteredMajors.map(m => (
                  <button key={m} onClick={() => addMajor(m)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", color: "#222222", fontSize: "14px", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #f5f5f5", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>{m}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>About you <span style={{ color: "#717171", fontWeight: 400 }}>(optional)</span></label>
            <textarea value={form.about} onChange={e => update("about", e.target.value)} maxLength={300} placeholder="A sentence or two. This is what students see when choosing who to reach out to." rows={3} style={{ ...inputStyle, resize: "none" as const }} />
            <p style={{ fontSize: "12px", color: "#717171", textAlign: "right" as const, marginTop: "4px" }}>{form.about.length}/300</p>
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid} style={{ width: "100%", padding: "18px", backgroundColor: step1Valid ? CORAL : "#ebebeb", color: step1Valid ? "#ffffff" : "#717171", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step1Valid ? "pointer" : "default" }}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "6px" }}>Availability</h3>
          <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px" }}>Where and when can you meet up?</p>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ ...labelStyle, marginBottom: "10px" }}>Where you can meet <span style={{ color: CORAL }}>*</span></label>
            <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." style={{ ...inputStyle, marginBottom: "10px" }} />
            <div style={{ maxHeight: "240px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {filteredLocations.map(loc => <PillBtn key={loc} label={loc} selected={form.locations.includes(loc)} onClick={() => toggleArray("locations", loc)} />)}
            </div>
            {form.locations.length > 0 && <p style={{ fontSize: "12px", color: "#717171", marginTop: "8px" }}>{form.locations.length} location{form.locations.length !== 1 ? "s" : ""} selected</p>}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Which days work</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "14px" }}>
              {DAYS.map((d, idx) => (
                <button key={d} onClick={() => toggleArray("availability", d)} style={{ padding: "10px 8px", border: `2px solid ${form.availability.includes(d) ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: form.availability.includes(d) ? "#FFF0F0" : "#ffffff", color: form.availability.includes(d) ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, cursor: "pointer", gridColumn: idx === DAYS.length - 1 ? "1 / -1" : "auto" }}>{d}</button>
              ))}
            </div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>What times work</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "20px" }}>
              {TIME_BLOCKS.map(t => <PillBtn key={t} label={t} selected={form.availability.includes(t)} onClick={() => toggleArray("availability", t)} />)}
            </div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Interests <span style={{ color: "#717171", fontWeight: 400, fontSize: "12px" }}>(optional, helps with matching)</span></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {INTERESTS.map(i => <PillBtn key={i} label={i} selected={form.interests.includes(i)} onClick={() => toggleArray("interests", i)} />)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid} style={{ flex: 2, padding: "16px", backgroundColor: step2Valid ? CORAL : "#ebebeb", color: step2Valid ? "#ffffff" : "#717171", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step2Valid ? "pointer" : "default" }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "6px" }}>Role boundaries</h3>
          <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px", lineHeight: 1.6 }}>Supporters offer informal peer presence and resource navigation. They do not provide therapy, diagnosis, crisis response, transportation, or guaranteed confidentiality.</p>

          <div style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "14px", marginBottom: "20px", border: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.6, marginBottom: "10px" }}>{featureFlags.peerSandbox ? "This sandbox publishes your profile after submission. Cornell identity verification is coming soon, and the app will label your profile as not identity verified. You must still follow the conduct, crisis-escalation, public-meeting, reporting, privacy, and withdrawal rules." : "You must follow the conduct, crisis-escalation, public-meeting, reporting, privacy, and withdrawal rules. Cornell identity verification, a consent-based reference invitation, training requirements, and administrator review are still required after submission."}</p>
            <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: "#222222", lineHeight: 1.5 }}><input type="checkbox" checked={policyAccepted} onChange={event => setPolicyAccepted(event.target.checked)} />I reviewed and accept the current supporter role and conduct policy.</label>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button onClick={handleSubmit} disabled={!step3Valid} style={{ flex: 2, padding: "16px", backgroundColor: step3Valid ? CORAL : "#ebebeb", color: step3Valid ? "#ffffff" : "#717171", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step3Valid ? "pointer" : "default" }}>Submit application</button>
          </div>
          {submitError && <p role="alert" style={{ color: CORAL, fontSize: "13px", marginTop: "12px" }}>{submitError}</p>}
        </div>
      )}
    </div>
  )
}

export default function PeerPage() {
  const [tab, setTab] = useState("find")
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null)
  const [search, setSearch] = useState("")
  const [interestFilter, setInterestFilter] = useState("")
  const [listError, setListError] = useState("")
  const [directoryVersion, setDirectoryVersion] = useState(0)

  useEffect(() => {
    requestJson<Supporter[]>("/peer-supporters", { validate: isSupporterList })
      .then(data => { setSupporters(data); setLoading(false) })
      .catch(cause => { setListError(cause instanceof Error ? cause.message : "Supporter profiles could not be loaded."); setLoading(false) })
  }, [directoryVersion])

  const allInterests = Array.from(new Set(supporters.flatMap(s => s.interests || [])))
  const filtered = supporters.filter(s => {
    const matchInterest = !interestFilter || (s.interests || []).includes(interestFilter)
    const matchSearch = !search || s.display_name.toLowerCase().includes(search.toLowerCase()) || (s.major || "").toLowerCase().includes(search.toLowerCase()) || (s.about || "").toLowerCase().includes(search.toLowerCase())
    return matchInterest && matchSearch
  })

  return (
    <div>
      {selectedSupporter && (
        <RequestModal supporter={selectedSupporter} onClose={() => setSelectedSupporter(null)} onSubmit={() => setSelectedSupporter(null)} />
      )}

      <div style={{ background: AIRBNB_GRADIENT, padding: "52px 20px 30px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "238px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Peer support</p>
        <h1 style={{ fontSize: "31px", fontWeight: 800, color: "#ffffff", lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: "10px", maxWidth: "320px" }}>Need someone to talk to?</h1>
        <p style={{ fontSize: "15px", color: "#ffffff", marginBottom: supporters.length > 0 ? "20px" : 0, lineHeight: 1.5, maxWidth: "330px" }}>Pick someone who feels right and send one private request. No long setup.</p>
        {supporters.length > 0 && <div style={{ position: "relative" }}>
          <svg aria-hidden="true" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)" }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <label className="sr-only" htmlFor="peer-search">Search people ready to listen</label>
          <input id="peer-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people or interests" style={{ width: "100%", padding: "14px 14px 14px 44px", border: "none", borderRadius: "16px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222", boxShadow: "0 6px 20px rgba(80,0,30,0.12)" }} />
        </div>}
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {featureFlags.peerSandbox && <details role="note" style={{ backgroundColor: "#FFF5F6", border: "1px solid #FFD1D8", borderRadius: "14px", padding: "12px 14px", marginBottom: "16px", color: "#595959" }}><summary style={{ fontSize: "13px", fontWeight: 800, color: "#B32505", cursor: "pointer" }}>Cornell identity verification coming soon</summary><p style={{ fontSize: "12px", lineHeight: 1.55, marginTop: "7px" }}>This is an open non-production sandbox. Profiles are not currently verified as Cornell students.</p></details>}
        {listError && <p role="alert" style={{ backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "12px", padding: "12px", marginBottom: "12px", fontSize: "13px" }}>{listError}</p>}
        {tab !== "signup" && <div role="tablist" aria-label="Peer Connect sections" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "4px", backgroundColor: "#F2F2F2", borderRadius: "16px", marginBottom: "18px" }}>
          <button role="tab" aria-selected={tab === "find"} onClick={() => setTab("find")} style={{ padding: "11px", borderRadius: "12px", background: tab === "find" ? AIRBNB_GRADIENT : "transparent", color: tab === "find" ? "#ffffff" : "#595959", fontSize: "14px", fontWeight: 700, boxShadow: tab === "find" ? "0 3px 10px rgba(215,4,102,0.2)" : "none" }}>Find someone</button>
          <button role="tab" aria-selected={tab === "manage"} onClick={() => setTab("manage")} style={{ padding: "11px", borderRadius: "12px", backgroundColor: tab === "manage" ? "#ffffff" : "transparent", color: tab === "manage" ? "#222222" : "#595959", fontSize: "14px", fontWeight: 700, boxShadow: tab === "manage" ? "0 1px 5px rgba(0,0,0,0.08)" : "none" }}>My requests</button>
        </div>}

        {tab === "find" && (
          <div>
            {!loading && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#717171" }}>{filtered.length} supporter{filtered.length !== 1 ? "s" : ""} available</p>
                {allInterests.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                    {allInterests.slice(0, 4).map(i => (
                      <button key={i} onClick={() => setInterestFilter(i === interestFilter ? "" : i)} style={{ padding: "5px 10px", border: `1.5px solid ${interestFilter === i ? CORAL : "#ebebeb"}`, borderRadius: "20px", backgroundColor: interestFilter === i ? "#FFF0F0" : "#ffffff", color: interestFilter === i ? CORAL : "#717171", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}>{i}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading && <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: "14px", color: "#717171" }}>Loading supporters...</p></div>}

            {!loading && filtered.length === 0 && (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "22px", padding: "30px 22px", textAlign: "center", boxShadow: "0 4px 22px rgba(40,0,20,0.06)", marginBottom: "14px" }}>
                <div aria-hidden="true" style={{ width: "52px", height: "52px", borderRadius: "17px", backgroundColor: "#FFF1F2", color: CORAL, display: "grid", placeItems: "center", margin: "0 auto 14px", fontSize: "24px" }}>♡</div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#222222", marginBottom: "7px" }}>No one is available yet</p>
                <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.55, marginBottom: "20px" }}>You can still use the verified resources tab, or help this community by becoming the first listener.</p>
                {(featureFlags.supporterSignup || featureFlags.peerSandbox) && <button onClick={() => setTab("signup")} style={{ padding: "13px 22px", background: AIRBNB_GRADIENT, color: "#ffffff", border: "none", borderRadius: "13px", fontSize: "14px", fontWeight: 700 }}>Become a listener</button>}
              </div>
            )}

            {!loading && filtered.map(s => <SupporterCard key={s.supporter_id} supporter={s} onRequest={setSelectedSupporter} />)}

            {!loading && filtered.length > 0 && (featureFlags.supporterSignup || featureFlags.peerSandbox) && <button type="button" onClick={() => setTab("signup")} style={{ width: "100%", padding: "15px", border: "1px solid #FFD1D8", borderRadius: "15px", backgroundColor: "#ffffff", color: CORAL, fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>Want to listen? Become a supporter</button>}

            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "14px 16px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.6 }}>If you need crisis support, call or text {crisisResource.phone}. For 24/7 consultation, call {healthResource.officialName} at {healthResource.phone}.</p>
            </div>
          </div>
        )}

        {(featureFlags.supporterSignup || featureFlags.peerSandbox) && tab === "signup" && <div><button type="button" onClick={() => setTab("find")} style={{ color: CORAL, fontSize: "13px", fontWeight: 700, marginBottom: "16px" }}>← Back to finding someone</button><SignupForm onCreated={() => setDirectoryVersion(version => version + 1)} /></div>}
        {tab === "manage" && <div><ConnectionManager />{featureFlags.peerSandbox && <details style={{ marginTop: "18px", backgroundColor: "#ffffff", borderRadius: "14px", padding: "13px 15px" }}><summary style={{ color: "#595959", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Create an account without sending a request</summary><div style={{ marginTop: "18px" }}><RequesterSignupForm /></div></details>}</div>}
      </div>
    </div>
  )
}
