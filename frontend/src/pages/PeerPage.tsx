import { useState, useEffect } from "react"
import { featureFlags } from "../config/featureFlags"
import { getResource } from "../resources/registry.ts"

const CORAL = "#FF5A5F"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
const crisisResource = getResource("988_lifeline")
const healthResource = getResource("cornell_health_247")

const AVATAR_COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#7B68EE", "#20B2AA", "#FF6B6B", "#4ECDC4"]

function isCornellEmail(email: string) {
  return /^[a-zA-Z0-9._%+-]+@cornell\.edu$/i.test(email.trim())
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
const TIME_BLOCKS = ["Mornings", "Afternoons", "Evenings", "Late nights"]

interface Supporter {
  supporter_id: string
  display_name: string; year: string; major: string
  locations: string[]; availability: string[]
  interests: string[]; about: string
}

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
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "2px" }}>{supporter.display_name}</p>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: "12px", color: "#717171" }}>{supporter.locations[0]}{supporter.locations.length > 1 ? ` +${supporter.locations.length - 1}` : ""}</span>
          </div>
        )}
        {supporter.availability && supporter.availability.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: "12px", color: "#717171" }}>{supporter.availability[0]}{supporter.availability.length > 1 ? ` +${supporter.availability.length - 1}` : ""}</span>
          </div>
        )}
      </div>

      <button onClick={() => onRequest(supporter)} style={{ width: "100%", padding: "14px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
        Ask to meet up
      </button>
    </div>
  )
}

function RequestModal({ supporter, onClose, onSubmit }: { supporter: Supporter, onClose: () => void, onSubmit: () => void }) {
  const [form, setForm] = useState({ requester_name: "", requester_email: "", requester_phone: "", preferred_location: "", preferred_times: [] as string[], message: "" })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState("")

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })) }

  const emailValid = isCornellEmail(form.requester_email)
  const canSubmit = form.requester_name && emailValid && form.preferred_location && form.preferred_times.length > 0

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch(`${API_URL}/peer-connect`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supporter_id: supporter.supporter_id, preferred_location: form.preferred_location, preferred_time: form.preferred_times.join(", "), message: form.message }),
      })
    } catch { /* Peer Connect remains feature-gated during safety review. */ }
    setLoading(false)
    setDone(true)
  }

  const color = avatarColor(supporter.display_name)

  if (showReport) {
    return (
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "24px 24px 48px", width: "100%" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#222222", marginBottom: "8px" }}>Report a concern</h3>
          <p style={{ fontSize: "13px", color: "#717171", marginBottom: "16px" }}>This goes directly to our team and is kept confidential.</p>
          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="What happened?" rows={4} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", resize: "none", marginBottom: "16px", fontFamily: "DM Sans, sans-serif" }} />
          <button onClick={async () => {
            try { await fetch(`${API_URL}/report-supporter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supporter_id: supporter.supporter_id, reason: reportReason }) }) } catch { /* Peer Connect remains feature-gated during safety review. */ }
            setShowReport(false); onSubmit()
          }} disabled={!reportReason.trim()} style={{ width: "100%", padding: "14px", backgroundColor: reportReason.trim() ? CORAL : "#ebebeb", color: reportReason.trim() ? "#fff" : "#b0b0b0", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: reportReason.trim() ? "pointer" : "default" }}>
            Submit report
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "32px 24px 48px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", marginBottom: "8px" }}>Request submitted</h3>
            <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6 }}>The protected workflow records your request without displaying {supporter.display_name}'s private contact information.</p>
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

          <button onClick={onSubmit} style={{ width: "100%", padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, marginBottom: "10px", cursor: "pointer" }}>Done</button>
          <button onClick={() => setShowReport(true)} style={{ width: "100%", padding: "10px", backgroundColor: "transparent", border: "none", color: "#b0b0b0", fontSize: "12px", cursor: "pointer" }}>Report a concern about this supporter</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "24px 24px 48px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#222222", marginBottom: "2px" }}>Meet with {supporter.display_name}</h3>
            <p style={{ fontSize: "13px", color: "#717171" }}>We will send them your details</p>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#f5f5f5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {[
          { field: "requester_name", label: "Your name", placeholder: "First name is fine", type: "text", required: true },
          { field: "requester_email", label: "Your Cornell email", placeholder: "netid@cornell.edu", type: "email", required: true },
          { field: "requester_phone", label: "Your phone", placeholder: "So we can text you", type: "tel", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: CORAL }}>*</span> : <span style={{ color: "#b0b0b0", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input
              value={form[f.field as keyof typeof form] as string}
              onChange={e => update(f.field, e.target.value)}
              placeholder={f.placeholder}
              type={f.type}
              style={{ width: "100%", padding: "13px 14px", border: `2px solid ${f.field === "requester_email" && form.requester_email && !emailValid ? CORAL : "#ebebeb"}`, borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }}
            />
            {f.field === "requester_email" && form.requester_email && !emailValid && <p style={{ fontSize: "12px", color: CORAL, marginTop: "4px" }}>Must be a valid @cornell.edu email.</p>}
          </div>
        ))}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "8px" }}>Preferred meetup spot <span style={{ color: CORAL }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[...supporter.locations, "Not sure yet, we will figure it out"].map((loc: string, idx: number) => (
              <button key={loc} onClick={() => update("preferred_location", loc)} style={{ padding: "12px 8px", border: `2px solid ${form.preferred_location === loc ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: form.preferred_location === loc ? "#FFF0F0" : "#ffffff", color: form.preferred_location === loc ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, textAlign: "center", gridColumn: idx === supporter.locations.length ? "1 / -1" : "auto" }}>
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "8px" }}>When works for you <span style={{ color: CORAL }}>*</span> <span style={{ color: "#b0b0b0", fontWeight: 400 }}>(select all that apply)</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[...supporter.availability, "Not sure yet, we will figure it out"].map((a: string, idx: number) => {
              const sel = form.preferred_times.includes(a)
              return (
                <button key={a} onClick={() => {
                  const times = a === "Not sure yet, we will figure it out"
                    ? [a]
                    : form.preferred_times.includes(a)
                      ? form.preferred_times.filter(t => t !== a)
                      : [...form.preferred_times.filter(t => t !== "Not sure yet, we will figure it out"), a]
                  setForm(prev => ({ ...prev, preferred_times: times }))
                }} style={{ padding: "12px 8px", border: `2px solid ${sel ? CORAL : "#ebebeb"}`, borderRadius: "10px", backgroundColor: sel ? "#FFF0F0" : "#ffffff", color: sel ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, textAlign: "center", gridColumn: idx === supporter.availability.length ? "1 / -1" : "auto" }}>
                  {a}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#222222", display: "block", marginBottom: "6px" }}>Anything you want them to know <span style={{ color: "#b0b0b0", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.message} onChange={e => update("message", e.target.value)} maxLength={300} placeholder="Whatever feels right to share." rows={3} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", resize: "none", fontFamily: "DM Sans, sans-serif" }} />
          <p style={{ fontSize: "12px", color: "#b0b0b0", textAlign: "right", marginTop: "4px" }}>{form.message.length}/300</p>
        </div>

        <div style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "12px 14px", marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.6 }}>Submitting a request does not share this supporter's private phone number or email. Contact is handled only through the protected workflow.</p>
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ width: "100%", padding: "16px", backgroundColor: canSubmit && !loading ? CORAL : "#ebebeb", color: canSubmit && !loading ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: canSubmit && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {loading && <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          {loading ? "Sending..." : "Send request"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function SignupForm() {
  const [step, setStep] = useState(1)
  const TOTAL = 3
  const [submitted, setSubmitted] = useState(false)
  const [policyAccepted, setPolicyAccepted] = useState(false)
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
  const emailValid = isCornellEmail(form.email)

  const step1Valid = form.name && emailValid && form.phone && form.password.length >= 12 && form.year
  const step2Valid = form.locations.length > 0
  const step3Valid = policyAccepted

  async function handleSubmit() {
    try {
      const response = await fetch(`${API_URL}/peer-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: form.name, email: form.email, phone: form.phone, password: form.password, year: form.year, major: form.majors.join(", "), locations: form.locations, availability: form.availability, interests: form.interests, about: form.about }),
      })
      if (!response.ok) return
      const draft = await response.json() as { supporter_id: string; access_token: string }
      const submitResponse = await fetch(`${API_URL}/peer-signups/${draft.supporter_id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${draft.access_token}` },
        body: JSON.stringify({ policy_version: "2026-08-02", role_scope_accepted: true, conduct_standards_accepted: true, crisis_boundaries_accepted: true, public_meeting_rules_accepted: true, reporting_policy_accepted: true, withdrawal_controls_acknowledged: true }),
      })
      if (!submitResponse.ok) return
    } catch { /* Supporter signup remains feature-gated during safety review. */ }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", marginBottom: "10px" }}>Application received</h2>
        <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6 }}>We will review your application and reach out within a few days.</p>
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
          <p style={{ fontSize: "12px", color: "#b0b0b0" }}>{Math.round((step / TOTAL) * 100)}% complete</p>
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
            <label style={labelStyle}>Cornell email <span style={{ color: CORAL }}>*</span></label>
            <input value={form.email} onChange={e => update("email", e.target.value)} placeholder="netid@cornell.edu" type="email" style={{ ...inputStyle, borderColor: form.email && !emailValid ? CORAL : "#ebebeb" }} />
            {form.email && !emailValid && <p style={{ fontSize: "12px", color: CORAL, marginTop: "4px" }}>Must be a valid @cornell.edu email.</p>}
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
            <label style={labelStyle}>Major <span style={{ color: "#b0b0b0", fontWeight: 400 }}>(up to 2, optional)</span></label>
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
            <label style={labelStyle}>About you <span style={{ color: "#b0b0b0", fontWeight: 400 }}>(optional)</span></label>
            <textarea value={form.about} onChange={e => update("about", e.target.value)} maxLength={300} placeholder="A sentence or two. This is what students see when choosing who to reach out to." rows={3} style={{ ...inputStyle, resize: "none" as const }} />
            <p style={{ fontSize: "12px", color: "#b0b0b0", textAlign: "right" as const, marginTop: "4px" }}>{form.about.length}/300</p>
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid} style={{ width: "100%", padding: "18px", backgroundColor: step1Valid ? CORAL : "#ebebeb", color: step1Valid ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step1Valid ? "pointer" : "default" }}>
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
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Interests <span style={{ color: "#b0b0b0", fontWeight: 400, fontSize: "12px" }}>(optional, helps with matching)</span></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {INTERESTS.map(i => <PillBtn key={i} label={i} selected={form.interests.includes(i)} onClick={() => toggleArray("interests", i)} />)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid} style={{ flex: 2, padding: "16px", backgroundColor: step2Valid ? CORAL : "#ebebeb", color: step2Valid ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step2Valid ? "pointer" : "default" }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "6px" }}>Role boundaries</h3>
          <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px", lineHeight: 1.6 }}>Supporters offer informal peer presence and resource navigation. They do not provide therapy, diagnosis, crisis response, transportation, or guaranteed confidentiality.</p>

          <div style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "14px", marginBottom: "20px", border: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.6, marginBottom: "10px" }}>You must follow the conduct, crisis-escalation, public-meeting, reporting, privacy, and withdrawal rules. Cornell identity verification, a consent-based reference invitation, training requirements, and administrator review are still required after submission.</p>
            <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: "#222222", lineHeight: 1.5 }}><input type="checkbox" checked={policyAccepted} onChange={event => setPolicyAccepted(event.target.checked)} />I reviewed and accept the current supporter role and conduct policy.</label>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button onClick={handleSubmit} disabled={!step3Valid} style={{ flex: 2, padding: "16px", backgroundColor: step3Valid ? CORAL : "#ebebeb", color: step3Valid ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: step3Valid ? "pointer" : "default" }}>Submit application</button>
          </div>
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

  useEffect(() => {
    fetch(`${API_URL}/peer-supporters`)
      .then(r => r.json())
      .then(data => { setSupporters(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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

<div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 32px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "280px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Peer support</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "6px" }}>Talk to a student who gets it.</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", marginBottom: "20px", lineHeight: 1.5 }}>Peer Connect remains unavailable while identity, training, conduct, and safety requirements are reviewed.</p>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, major, interest..." style={{ width: "100%", padding: "13px 14px 13px 42px", border: "none", borderRadius: "14px", fontSize: "14px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif" }} />
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setTab("find")} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "12px", backgroundColor: tab === "find" ? CORAL : "#ffffff", color: tab === "find" ? "#ffffff" : "#717171", fontSize: "14px", fontWeight: 600, boxShadow: tab === "find" ? "none" : "0 1px 4px rgba(0,0,0,0.08)", cursor: "pointer" }}>
            Find a supporter
          </button>
          {featureFlags.supporterSignup && <button onClick={() => setTab("signup")} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "12px", backgroundColor: tab === "signup" ? CORAL : "#ffffff", color: tab === "signup" ? "#ffffff" : "#717171", fontSize: "14px", fontWeight: 600, boxShadow: tab === "signup" ? "none" : "0 1px 4px rgba(0,0,0,0.08)", cursor: "pointer" }}>
            Become a supporter
          </button>}
        </div>

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

            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "14px" }}>How peer connect works</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { step: "1", text: "Browse students who have signed up to listen, grab food, or just hang out." },
                  { step: "2", text: "Tap a supporter and fill out a short request. Takes 30 seconds." },
                  { step: "3", text: "The protected workflow records status and contact sharing remains limited to authorized participants." },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "8px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: CORAL }}>{item.step}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, paddingTop: "2px" }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: "14px", color: "#b0b0b0" }}>Loading supporters...</p></div>}

            {!loading && filtered.length === 0 && (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px 20px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>No supporters yet</p>
                <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "20px" }}>Be the first to sign up and help other students.</p>
                {featureFlags.supporterSignup && <button onClick={() => setTab("signup")} style={{ padding: "12px 24px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Sign up as a supporter</button>}
              </div>
            )}

            {!loading && filtered.map(s => <SupporterCard key={s.supporter_id} supporter={s} onRequest={setSelectedSupporter} />)}

            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "14px 16px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: "12px", color: "#b0b0b0", lineHeight: 1.6 }}>If you need crisis support, call or text {crisisResource.phone}. For 24/7 consultation, call {healthResource.officialName} at {healthResource.phone}.</p>
            </div>
          </div>
        )}

        {featureFlags.supporterSignup && tab === "signup" && <SignupForm />}
      </div>
    </div>
  )
}
