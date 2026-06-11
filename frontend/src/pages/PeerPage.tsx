import { useState, useEffect } from "react"

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
    <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "18px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", marginBottom: "2px" }}>{supporter.name}</div>
          <div style={{ fontSize: "13px", color: "#888" }}>{supporter.year}{supporter.major ? ` · ${supporter.major}` : ""}</div>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "20px", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>{supporter.name.charAt(0)}</span>
        </div>
      </div>
      {supporter.about && (
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.5, marginBottom: "12px" }}>{supporter.about}</p>
      )}
      {supporter.interests && supporter.interests.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {supporter.interests.slice(0, 4).map((i: string) => (
            <span key={i} style={{ padding: "3px 10px", backgroundColor: "#f5f5f5", borderRadius: "20px", fontSize: "12px", color: "#555" }}>{i}</span>
          ))}
        </div>
      )}
      {supporter.availability && supporter.availability.length > 0 && (
        <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "14px" }}>
          Available: {supporter.availability.slice(0, 2).join(", ")}{supporter.availability.length > 2 ? ` +${supporter.availability.length - 2} more` : ""}
        </div>
      )}
      <button onClick={() => onRequest(supporter)} style={{ width: "100%", padding: "12px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
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
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: "16px 16px 0 0", padding: "32px 24px 48px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>&#10003;</div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Request sent</h3>
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>We will reach out within 24 hours to connect you with {supporter.name}. Check your email.</p>
          </div>
          <button onClick={onSubmit} style={{ width: "100%", padding: "14px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 24px 48px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "2px" }}>Meet with {supporter.name}</h3>
            <p style={{ fontSize: "13px", color: "#888" }}>We will make the introduction</p>
          </div>
          <button onClick={onClose} style={{ fontSize: "20px", color: "#aaa", cursor: "pointer", backgroundColor: "transparent", border: "none" }}>x</button>
        </div>
        {[
          { field: "requester_name", label: "Your name", placeholder: "Your first name is fine", type: "text", required: true },
          { field: "requester_email", label: "Your Cornell email", placeholder: "netid@cornell.edu", type: "email", required: true },
          { field: "requester_phone", label: "Your phone", placeholder: "So we can text you", type: "tel", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#c00" }}>*</span> : <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof RequestForm]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "11px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff" }} />
          </div>
        ))}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "8px" }}>Preferred meetup spot <span style={{ color: "#c00" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {supporter.locations.map((loc: string) => (
              <button key={loc} onClick={() => update("preferred_location", loc)} style={{ padding: "7px 12px", border: form.preferred_location === loc ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.preferred_location === loc ? "#1a1a1a" : "#fff", color: form.preferred_location === loc ? "#fff" : "#555", fontSize: "13px", cursor: "pointer" }}>{loc}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "8px" }}>When works for you <span style={{ color: "#c00" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {AVAILABILITY_OPTIONS.map((a: string) => (
              <button key={a} onClick={() => update("preferred_time", a)} style={{ padding: "7px 12px", border: form.preferred_time === a ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.preferred_time === a ? "#1a1a1a" : "#fff", color: form.preferred_time === a ? "#fff" : "#555", fontSize: "13px", cursor: "pointer" }}>{a}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#333", display: "block", marginBottom: "6px" }}>Anything you want them to know <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.message} onChange={e => update("message", e.target.value)} maxLength={300} placeholder="Whatever feels right to share." rows={3} style={{ width: "100%", padding: "11px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "14px", backgroundColor: "#fff", resize: "none" }} />
        </div>
        <div style={{ backgroundColor: "#f9f9f9", borderRadius: "10px", padding: "12px", marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>We will introduce you both over email within 24 hours. {supporter.name} has been vetted and approved by our team.</p>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ width: "100%", padding: "14px", backgroundColor: canSubmit && !loading ? "#1a1a1a" : "#ccc", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: canSubmit && !loading ? "pointer" : "default" }}>
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
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>&#10003;</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Application received</h2>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>We will review your application and reach out within a few days.</p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "28px" }}>Sign up to be someone that students can reach out to when they just want to talk, grab food, or not be alone.</p>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>Your info</p>
        {[
          { field: "name", label: "Full name", placeholder: "Your name", type: "text", required: true },
          { field: "email", label: "Cornell email", placeholder: "netid@cornell.edu", type: "email", required: true },
          { field: "phone", label: "Phone number", placeholder: "Your phone number", type: "tel", required: true },
          { field: "major", label: "Major", placeholder: "Your major", type: "text", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#c00" }}>*</span> : <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof typeof form] as string} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
          </div>
        ))}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>Year <span style={{ color: "#c00" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {YEARS.map(y => (
              <button key={y} onClick={() => update("year", y)} style={{ padding: "8px 14px", border: form.year === y ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.year === y ? "#1a1a1a" : "#fff", color: form.year === y ? "#fff" : "#1a1a1a", fontSize: "13px", cursor: "pointer" }}>{y}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Where you can meet <span style={{ color: "#c00" }}>*</span></p>
        <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "14px", backgroundColor: "#fff", marginBottom: "12px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {filteredLocations.map(loc => (
            <button key={loc} onClick={() => toggleArray("locations", loc)} style={{ padding: "8px 14px", border: form.locations.includes(loc) ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.locations.includes(loc) ? "#1a1a1a" : "#fff", color: form.locations.includes(loc) ? "#fff" : "#1a1a1a", fontSize: "13px", cursor: "pointer" }}>{loc}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Availability</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {AVAILABILITY.map(a => (
            <button key={a} onClick={() => toggleArray("availability", a)} style={{ padding: "8px 14px", border: form.availability.includes(a) ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.availability.includes(a) ? "#1a1a1a" : "#fff", color: form.availability.includes(a) ? "#fff" : "#1a1a1a", fontSize: "13px", cursor: "pointer" }}>{a}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Interests <span style={{ color: "#999", fontWeight: 400, textTransform: "none", fontSize: "12px" }}>(helps with matching)</span></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {INTERESTS.map(i => (
            <button key={i} onClick={() => toggleArray("interests", i)} style={{ padding: "8px 14px", border: form.interests.includes(i) ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.interests.includes(i) ? "#1a1a1a" : "#fff", color: form.interests.includes(i) ? "#fff" : "#1a1a1a", fontSize: "13px", cursor: "pointer" }}>{i}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>About you <span style={{ color: "#999", fontWeight: 400, textTransform: "none", fontSize: "12px" }}>(optional)</span></p>
        <textarea value={form.about} onChange={e => update("about", e.target.value)} maxLength={300} placeholder="A sentence or two. This is what students see when choosing who to reach out to." rows={4} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "14px", backgroundColor: "#fff", resize: "none", marginTop: "12px" }} />
        <div style={{ fontSize: "12px", color: "#ccc", textAlign: "right" }}>{form.about.length}/300</div>
      </section>

      <section style={{ marginBottom: "28px", backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "6px" }}>Reference <span style={{ color: "#c00" }}>*</span></p>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "20px" }}>We require one reference who can speak to your character. We will contact them before approving your application.</p>
        {[
          { field: "refName", label: "Reference name", placeholder: "Their full name", type: "text", required: true },
          { field: "refPhone", label: "Reference phone", placeholder: "Their phone number", type: "tel", required: true },
          { field: "refEmail", label: "Reference email", placeholder: "Their email", type: "email", required: true },
          { field: "refRelationship", label: "How do they know you", placeholder: "e.g. My RA, my friend, my professor", type: "text", required: false },
        ].map(f => (
          <div key={f.field} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>
              {f.label} {f.required ? <span style={{ color: "#c00" }}>*</span> : <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span>}
            </label>
            <input value={form[f.field as keyof typeof form] as string} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} type={f.type} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff" }} />
          </div>
        ))}
      </section>

      <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
        <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>By submitting you agree that CornellPulse may contact you and your reference. Your info will never be shared publicly.</p>
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", padding: "16px", backgroundColor: canSubmit ? "#1a1a1a" : "#ccc", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}>
        Submit application
      </button>
      {!canSubmit && <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "10px" }}>Fill in all required fields to submit.</p>}
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
      .then(data => { setSupporters(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allInterests = Array.from(new Set(supporters.flatMap(s => s.interests || [])))
  const filtered = supporters.filter(s => !interestFilter || (s.interests || []).includes(interestFilter))

  return (
    <div style={{ padding: "24px 20px 0" }}>
      {selectedSupporter && (
        <RequestModal
          supporter={selectedSupporter}
          onClose={() => setSelectedSupporter(null)}
          onSubmit={() => setSelectedSupporter(null)}
        />
      )}

      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>Peer Connect</h1>
      <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px", lineHeight: 1.5 }}>Connect with a Cornell student who wants to listen, grab food, or just be there.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button onClick={() => setTab("find")} style={{ flex: 1, padding: "10px", border: tab === "find" ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "10px", backgroundColor: tab === "find" ? "#1a1a1a" : "#fff", color: tab === "find" ? "#fff" : "#1a1a1a", fontSize: "14px", fontWeight: tab === "find" ? 600 : 400, cursor: "pointer" }}>
          Find a supporter
        </button>
        <button onClick={() => setTab("signup")} style={{ flex: 1, padding: "10px", border: tab === "signup" ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "10px", backgroundColor: tab === "signup" ? "#1a1a1a" : "#fff", color: tab === "signup" ? "#fff" : "#1a1a1a", fontSize: "14px", fontWeight: tab === "signup" ? 600 : 400, cursor: "pointer" }}>
          Become a supporter
        </button>
      </div>

      {tab === "find" && (
        <div>
          {allInterests.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                <button onClick={() => setInterestFilter("")} style={{ padding: "6px 12px", border: !interestFilter ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: !interestFilter ? "#1a1a1a" : "#fff", color: !interestFilter ? "#fff" : "#555", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>All</button>
                {allInterests.slice(0, 8).map(i => (
                  <button key={i} onClick={() => setInterestFilter(i === interestFilter ? "" : i)} style={{ padding: "6px 12px", border: interestFilter === i ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: interestFilter === i ? "#1a1a1a" : "#fff", color: interestFilter === i ? "#fff" : "#555", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{i}</button>
                ))}
              </div>
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: "48px 0" }}><p style={{ fontSize: "14px", color: "#aaa" }}>Loading supporters...</p></div>}

          {!loading && filtered.length === 0 && (
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>No supporters yet</p>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6, marginBottom: "20px" }}>We are building our network. Be the first to sign up.</p>
              <button onClick={() => setTab("signup")} style={{ padding: "12px 24px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Sign up as a supporter</button>
            </div>
          )}

          {!loading && filtered.map((s, i) => (
            <SupporterCard key={i} supporter={s} onRequest={setSelectedSupporter} />
          ))}

          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginTop: "8px", marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>All peer supporters have been vetted and approved. If you are in crisis please call 988 or Cornell Health at 607-255-5155.</p>
          </div>
        </div>
      )}

      {tab === "signup" && <SignupForm />}
    </div>
  )
}