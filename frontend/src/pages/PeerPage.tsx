import { useState, useEffect } from "react"

const PINK = "#e8a0b4"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend afternoons",
  "Weekend evenings",
]

const LOCATIONS = [
  "Libe Cafe", "Terrace Restaurant", "Trillium", "Temple of Zeus",
  "Olin Library", "Mann Library", "Uris Library", "Duffield Hall Atrium",
  "CTB (Collegetown Bagels)", "Gimme Coffee", "Agora Restaurant",
  "Okenshields", "RPCC Dining", "104West Dining", "Cafe Jennie",
  "Statler Hotel Lobby", "Ho Plaza", "Other (anywhere works for me)",
]

const INTERESTS = [
  "Music", "Sports", "Gaming", "Reading", "Film", "Cooking",
  "Hiking", "Art", "Politics", "Tech", "Finance", "Fashion",
  "Travel", "Fitness", "Photography", "Writing", "Volunteering", "Research",
]

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD", "Other"]

const AVAILABILITY = [
  "Weekday mornings", "Weekday afternoons", "Weekday evenings",
  "Weekend mornings", "Weekend afternoons", "Weekend evenings",
]

interface Supporter {
  name: string
  year: string
  major: string
  locations: string[]
  availability: string[]
  interests: string[]
  about: string
  email: string
  phone: string
}

interface RequestForm {
  requester_name: string
  requester_email: string
  requester_phone: string
  preferred_location: string
  preferred_time: string
  message: string
}

function SupporterCard({ supporter, onRequest }: { supporter: Supporter, onRequest: (s: Supporter) => void }) {
  return (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "18px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>{supporter.name}</p>
          <p style={{ fontSize: "12px", color: "#4a4a4a" }}>{supporter.year}{supporter.major ? ` · ${supporter.major}` : ""}</p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "20px", backgroundColor: "#242424", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "16px", fontWeight: 800, color: PINK }}>{supporter.name.charAt(0)}</span>
        </div>
      </div>
      {supporter.about && (
        <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.5, marginBottom: "12px" }}>{supporter.about}</p>
      )}
      {supporter.interests && supporter.interests.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {supporter.interests.slice(0, 4).map((i: string) => (
            <span key={i} style={{ padding: "4px 10px", backgroundColor: "#242424", borderRadius: "20px", fontSize: "11px", color: "#a0a0a0" }}>{i}</span>
          ))}
        </div>
      )}
      {supporter.availability && supporter.availability.length > 0 && (
        <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "14px" }}>
          Available: {supporter.availability.slice(0, 2).join(", ")}{supporter.availability.length > 2 ? ` +${supporter.availability.length - 2} more` : ""}
        </p>
      )}
      <button onClick={() => onRequest(supporter)} style={{ width: "100%", padding: "13px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 800, letterSpacing: "0.03em" }}>
        Ask to meet up
      </button>
    </div>
  )
}

function RequestModal({ supporter, onClose, onSubmit }: { supporter: Supporter, onClose: () => void, onSubmit: () => void }) {
  const [form, setForm] = useState<RequestForm>({
    requester_name: "", requester_email: "", requester_phone: "",
    preferred_location: "", preferred_time: "", message: "",
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const canSubmit = form.requester_name && form.requester_email && form.preferred_location && form.preferred_time

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch(`${API_URL}/peer-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, supporter_name: supporter.name }),
      })
    } catch {}
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#1a1a1a", borderRadius: "16px 16px 0 0", padding: "32px 24px 48px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px", color: PINK }}>&#10003;</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Request sent</h3>
            <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6 }}>We will reach out within 24 hours to connect you with {supporter.name}. Check your email.</p>
          </div>
          <button onClick={onSubmit} style={{ width: "100%", padding: "16px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.04em" }}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ backgroundColor: "#1a1a1a", borderRadius: "16px 16px 0 0", padding: "24px 24px 48px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>Meet with {supporter.name}</h3>
            <p style={{ fontSize: "13px", color: "#4a4a4a" }}>We will make the introduction</p>
          </div>
          <button onClick={onClose} style={{ fontSize: "20px", color: "#4a4a4a", backgroundColor: "transparent", border: "none" }}>x</button>
        </div>
        {[
          { field: "requester_name", label: "Your name", placeholder: "Your first name is fine", type: "text", required: true },
          { field: "requester_email", label: "Your Cornell email", placeholder: "netid@cornell.edu", type: "email", required: true },
          { field: "requester_phone", label: "Your phone", placeholder: "So we can text you", type: "tel", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#e63946" }}>*</span> : <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof RequestForm]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "12px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
          </div>
        ))}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Preferred meetup spot <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {supporter.locations.map((loc: string) => (
              <button key={loc} onClick={() => update("preferred_location", loc)} style={{ padding: "8px 13px", border: "none", borderRadius: "20px", backgroundColor: form.preferred_location === loc ? PINK : "#242424", color: form.preferred_location === loc ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.preferred_location === loc ? 700 : 400 }}>{loc}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>When works for you <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {AVAILABILITY_OPTIONS.map((a: string) => (
              <button key={a} onClick={() => update("preferred_time", a)} style={{ padding: "8px 13px", border: "none", borderRadius: "20px", backgroundColor: form.preferred_time === a ? PINK : "#242424", color: form.preferred_time === a ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.preferred_time === a ? 700 : 400 }}>{a}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Anything you want them to know <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.message} onChange={e => update("message", e.target.value)} maxLength={300} placeholder="Whatever feels right to share." rows={3} style={{ width: "100%", padding: "12px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "14px", backgroundColor: "#242424", color: "#fff", resize: "none" }} />
        </div>
        <div style={{ backgroundColor: "#242424", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "#a0a0a0", lineHeight: 1.6 }}>We will introduce you both over email within 24 hours. {supporter.name} has been vetted and approved by our team.</p>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ width: "100%", padding: "16px", backgroundColor: canSubmit && !loading ? PINK : "#242424", color: canSubmit && !loading ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.04em" }}>
          {loading ? "Sending..." : "Send request"}
        </button>
      </div>
    </div>
  )
}

function SignupForm() {
  const [submitted, setSubmitted] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [form, setForm] = useState({
    name: "", email: "", phone: "", year: "", major: "",
    locations: [] as string[], availability: [] as string[],
    interests: [] as string[], about: "",
    refName: "", refPhone: "", refEmail: "", refRelationship: "",
  })

  function update(field: string, value: string | string[]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleArray(field: string, value: string) {
    const arr = form[field as keyof typeof form] as string[]
    if (arr.includes(value)) {
      update(field, arr.filter((v: string) => v !== value))
    } else {
      update(field, [...arr, value])
    }
  }

  const filteredLocations = LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
  const canSubmit = form.name && form.email && form.phone && form.year && form.locations.length > 0 && form.refName && form.refPhone && form.refEmail

  async function handleSubmit() {
    try {
      await fetch(`${API_URL}/peer-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } catch {}
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px", color: PINK }}>&#10003;</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Application received</h2>
        <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6 }}>We will review your application and reach out within a few days.</p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "28px" }}>Sign up to be someone that students can reach out to when they just want to talk, grab food, or not be alone.</p>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>Your info</p>
        {[
          { field: "name", label: "Full name", placeholder: "Your name", type: "text", required: true },
          { field: "email", label: "Cornell email", placeholder: "netid@cornell.edu", type: "email", required: true },
          { field: "phone", label: "Phone number", placeholder: "Your phone number", type: "tel", required: true },
          { field: "major", label: "Major", placeholder: "Your major", type: "text", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#e63946" }}>*</span> : <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof typeof form] as string} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff" }} />
          </div>
        ))}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Year <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {YEARS.map(y => (
              <button key={y} onClick={() => update("year", y)} style={{ padding: "9px 15px", border: "none", borderRadius: "20px", backgroundColor: form.year === y ? PINK : "#1a1a1a", color: form.year === y ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.year === y ? 800 : 400 }}>{y}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Where you can meet <span style={{ color: "#e63946" }}>*</span></p>
        <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." style={{ width: "100%", padding: "11px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "14px", backgroundColor: "#1a1a1a", color: "#fff", marginBottom: "12px", marginTop: "10px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {filteredLocations.map(loc => (
            <button key={loc} onClick={() => toggleArray("locations", loc)} style={{ padding: "9px 15px", border: "none", borderRadius: "20px", backgroundColor: form.locations.includes(loc) ? PINK : "#1a1a1a", color: form.locations.includes(loc) ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.locations.includes(loc) ? 800 : 400 }}>{loc}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Availability</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {AVAILABILITY.map(a => (
            <button key={a} onClick={() => toggleArray("availability", a)} style={{ padding: "9px 15px", border: "none", borderRadius: "20px", backgroundColor: form.availability.includes(a) ? PINK : "#1a1a1a", color: form.availability.includes(a) ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.availability.includes(a) ? 800 : 400 }}>{a}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Interests <span style={{ color: "#4a4a4a", fontWeight: 400, textTransform: "none", fontSize: "11px" }}>(helps with matching)</span></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {INTERESTS.map(i => (
            <button key={i} onClick={() => toggleArray("interests", i)} style={{ padding: "9px 15px", border: "none", borderRadius: "20px", backgroundColor: form.interests.includes(i) ? PINK : "#1a1a1a", color: form.interests.includes(i) ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: form.interests.includes(i) ? 800 : 400 }}>{i}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>About you <span style={{ color: "#4a4a4a", fontWeight: 400, textTransform: "none", fontSize: "11px" }}>(optional)</span></p>
        <textarea value={form.about} onChange={e => update("about", e.target.value)} maxLength={300} placeholder="A sentence or two. This is what students see when choosing who to reach out to." rows={4} style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "14px", backgroundColor: "#1a1a1a", color: "#fff", resize: "none", marginTop: "12px" }} />
        <p style={{ fontSize: "12px", color: "#4a4a4a", textAlign: "right" }}>{form.about.length}/300</p>
      </section>

      <section style={{ marginBottom: "28px", backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "20px" }}>
        <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>Reference <span style={{ color: "#e63946" }}>*</span></p>
        <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "20px" }}>We require one reference who can speak to your character. We will contact them before approving your application.</p>
        {[
          { field: "refName", label: "Reference name", placeholder: "Their full name", type: "text", required: true },
          { field: "refPhone", label: "Reference phone", placeholder: "Their phone number", type: "tel", required: true },
          { field: "refEmail", label: "Reference email", placeholder: "Their email", type: "email", required: true },
          { field: "refRelationship", label: "How do they know you", placeholder: "e.g. My RA, my friend, my professor", type: "text", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#e63946" }}>*</span> : <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof typeof form] as string} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
          </div>
        ))}
      </section>

      <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
        <p style={{ fontSize: "12px", color: "#4a4a4a", lineHeight: 1.6 }}>By submitting you agree that CornellPulse may contact you and your reference. Your info will never be shared publicly.</p>
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", padding: "18px", backgroundColor: canSubmit ? PINK : "#1a1a1a", color: canSubmit ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.04em" }}>
        Submit application
      </button>
      {!canSubmit && <p style={{ fontSize: "12px", color: "#4a4a4a", textAlign: "center", marginTop: "10px" }}>Fill in all required fields to submit.</p>}
    </div>
  )
}

export default function PeerPage() {
  const [tab, setTab] = useState("find")
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null)
  const [interestFilter, setInterestFilter] = useState("")

  useEffect(() => {
    fetch(`${API_URL}/peer-supporters`)
      .then(r => r.json())
      .then(data => { setSupporters(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allInterests = Array.from(new Set(supporters.flatMap(s => s.interests || [])))
  const filtered = supporters.filter(s => !interestFilter || (s.interests || []).includes(interestFilter))

  return (
    <div style={{ padding: "52px 20px 0" }}>
      {selectedSupporter && (
        <RequestModal
          supporter={selectedSupporter}
          onClose={() => setSelectedSupporter(null)}
          onSubmit={() => setSelectedSupporter(null)}
        />
      )}

      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>Peer support</p>
      <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "8px" }}>Connect</h1>
      <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "24px", lineHeight: 1.5 }}>Connect with a Cornell student who wants to listen, grab food, or just be there.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button onClick={() => setTab("find")} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "8px", backgroundColor: tab === "find" ? PINK : "#1a1a1a", color: tab === "find" ? "#0f0f0f" : "#a0a0a0", fontSize: "14px", fontWeight: tab === "find" ? 800 : 400 }}>
          Find a supporter
        </button>
        <button onClick={() => setTab("signup")} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "8px", backgroundColor: tab === "signup" ? PINK : "#1a1a1a", color: tab === "signup" ? "#0f0f0f" : "#a0a0a0", fontSize: "14px", fontWeight: tab === "signup" ? 800 : 400 }}>
          Become a supporter
        </button>
      </div>

      {tab === "find" && (
        <div>
          {allInterests.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                <button onClick={() => setInterestFilter("")} style={{ padding: "7px 14px", border: "none", borderRadius: "20px", backgroundColor: !interestFilter ? PINK : "#1a1a1a", color: !interestFilter ? "#0f0f0f" : "#a0a0a0", fontSize: "12px", fontWeight: !interestFilter ? 800 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>All</button>
                {allInterests.slice(0, 8).map(i => (
                  <button key={i} onClick={() => setInterestFilter(i === interestFilter ? "" : i)} style={{ padding: "7px 14px", border: "none", borderRadius: "20px", backgroundColor: interestFilter === i ? PINK : "#1a1a1a", color: interestFilter === i ? "#0f0f0f" : "#a0a0a0", fontSize: "12px", fontWeight: interestFilter === i ? 800 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{i}</button>
                ))}
              </div>
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: "48px 0" }}><p style={{ fontSize: "14px", color: "#4a4a4a" }}>Loading supporters...</p></div>}

          {!loading && filtered.length === 0 && (
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>No supporters yet</p>
              <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "20px" }}>We are building our network. Be the first to sign up.</p>
              <button onClick={() => setTab("signup")} style={{ padding: "12px 24px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}>Sign up as a supporter</button>
            </div>
          )}

          {!loading && filtered.map((s, i) => (
            <SupporterCard key={i} supporter={s} onRequest={setSelectedSupporter} />
          ))}

          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "16px", marginTop: "8px", marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.6 }}>All peer supporters have been vetted and approved. If you are in crisis please call 988 or Cornell Health at 607-255-5155.</p>
          </div>
        </div>
      )}

      {tab === "signup" && <SignupForm />}
    </div>
  )
}