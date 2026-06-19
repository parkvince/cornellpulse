import { useState, useEffect } from "react"

const PINK = "#e8a0b4"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

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

function gridBtn(selected: boolean): React.CSSProperties {
  return {
    padding: "12px 8px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: selected ? PINK : "#1a1a1a",
    color: selected ? "#0f0f0f" : "#a0a0a0",
    fontSize: "13px",
    fontWeight: 600,
    width: "100%",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    textAlign: "center",
  }
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
          Available: {supporter.availability.slice(0, 3).join(", ")}{supporter.availability.length > 3 ? ` +${supporter.availability.length - 3} more` : ""}
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

  const emailValid = isCornellEmail(form.requester_email)
  const canSubmit = form.requester_name && emailValid && form.preferred_location && form.preferred_time

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

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
            Your name <span style={{ color: "#e63946" }}>*</span>
          </label>
          <input value={form.requester_name} onChange={e => update("requester_name", e.target.value)} placeholder="Your first name is fine" style={{ width: "100%", padding: "12px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
            Your Cornell email <span style={{ color: "#e63946" }}>*</span>
          </label>
          <input value={form.requester_email} onChange={e => update("requester_email", e.target.value)} placeholder="netid@cornell.edu" type="email" style={{ width: "100%", padding: "12px 14px", border: form.requester_email && !emailValid ? "1px solid #e63946" : "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
          {form.requester_email && !emailValid && <p style={{ fontSize: "12px", color: "#e63946", marginTop: "6px" }}>Must be a valid @cornell.edu email.</p>}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
            Your phone <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span>
          </label>
          <input value={form.requester_phone} onChange={e => update("requester_phone", e.target.value)} placeholder="So we can text you" type="tel" style={{ width: "100%", padding: "12px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Preferred meetup spot <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {supporter.locations.map((loc: string) => (
              <button key={loc} onClick={() => update("preferred_location", loc)} style={gridBtn(form.preferred_location === loc)}>{loc}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>When works for you <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {supporter.availability.map((a: string) => (
              <button key={a} onClick={() => update("preferred_time", a)} style={gridBtn(form.preferred_time === a)}>{a}</button>
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
  const [majorSearch, setMajorSearch] = useState("")
  const [showMajorList, setShowMajorList] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", year: "", majors: [] as string[],
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

  function addMajor(m: string) {
    if (form.majors.includes(m)) return
    if (form.majors.length >= 2) return
    update("majors", [...form.majors, m])
    setMajorSearch("")
    setShowMajorList(false)
  }

  function removeMajor(m: string) {
    update("majors", form.majors.filter(x => x !== m))
  }

  const filteredMajors = majorSearch
    ? MAJORS.filter(m => m.toLowerCase().includes(majorSearch.toLowerCase()) && !form.majors.includes(m)).slice(0, 8)
    : []

  const filteredLocations = LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))

  const emailValid = isCornellEmail(form.email)
  const refEmailValid = isCornellEmail(form.refEmail)

const sameEmail = form.email.trim().toLowerCase() === form.refEmail.trim().toLowerCase() && form.email !== ""
const sameName = form.name.trim().toLowerCase() === form.refName.trim().toLowerCase() && form.name !== ""
const samePhone = form.phone.trim() === form.refPhone.trim() && form.phone !== ""
const selfReference = sameEmail || sameName || samePhone

const canSubmit = form.name && emailValid && form.phone && form.year && form.locations.length > 0 && form.refName && form.refPhone && refEmailValid && !selfReference
  async function handleSubmit() {
    try {
      await fetch(`${API_URL}/peer-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, major: form.majors.join(", ") }),
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

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Full name <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Cornell email <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.email} onChange={e => update("email", e.target.value)} placeholder="netid@cornell.edu" type="email" style={{ width: "100%", padding: "13px 14px", border: form.email && !emailValid ? "1px solid #e63946" : "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff" }} />
          {form.email && !emailValid && <p style={{ fontSize: "12px", color: "#e63946", marginTop: "6px" }}>Must be a valid @cornell.edu email.</p>}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Phone number <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Your phone number" type="tel" style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "8px" }}>Year <span style={{ color: "#e63946" }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {YEARS.map((y, idx) => (
              <button key={y} onClick={() => update("year", y)} style={{ ...gridBtn(form.year === y), gridColumn: idx === YEARS.length - 1 ? "1 / -1" : "auto" }}>{y}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "14px", position: "relative" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>
            Major <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(up to 2)</span>
          </label>
          {form.majors.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {form.majors.map(m => (
                <span key={m} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", backgroundColor: PINK, color: "#0f0f0f", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                  {m}
                  <button onClick={() => removeMajor(m)} style={{ background: "transparent", border: "none", color: "#0f0f0f", fontSize: "13px", fontWeight: 800, lineHeight: 1, padding: 0 }}>x</button>
                </span>
              ))}
            </div>
          )}
          {form.majors.length < 2 && (
            <input
              value={majorSearch}
              onChange={e => { setMajorSearch(e.target.value); setShowMajorList(true) }}
              onFocus={() => setShowMajorList(true)}
              placeholder="Search majors..."
              style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff" }}
            />
          )}
          {showMajorList && filteredMajors.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#242424", borderRadius: "8px", marginTop: "4px", zIndex: 10, maxHeight: "220px", overflowY: "auto", border: "1px solid #2a2a2a" }}>
              {filteredMajors.map(m => (
                <button key={m} onClick={() => addMajor(m)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", color: "#fff", fontSize: "14px", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #1a1a1a" }}>{m}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Where you can meet <span style={{ color: "#e63946" }}>*</span></p>
        <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." style={{ width: "100%", padding: "11px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "14px", backgroundColor: "#1a1a1a", color: "#fff", marginBottom: "10px", marginTop: "10px" }} />
        <div style={{ maxHeight: "260px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", paddingRight: "2px" }}>
          {filteredLocations.map(loc => (
            <button key={loc} onClick={() => toggleArray("locations", loc)} style={gridBtn(form.locations.includes(loc))}>{loc}</button>
          ))}
        </div>
        {form.locations.length > 0 && (
          <p style={{ fontSize: "12px", color: "#4a4a4a", marginTop: "10px" }}>{form.locations.length} location{form.locations.length !== 1 ? "s" : ""} selected</p>
        )}
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Which days work</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "20px" }}>
          {DAYS.map((d, idx) => (
            <button key={d} onClick={() => toggleArray("availability", d)} style={{ ...gridBtn(form.availability.includes(d)), gridColumn: idx === DAYS.length - 1 ? "1 / -1" : "auto" }}>{d}</button>
          ))}
        </div>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>What times work</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {TIME_BLOCKS.map(t => (
            <button key={t} onClick={() => toggleArray("availability", t)} style={gridBtn(form.availability.includes(t))}>{t}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Interests <span style={{ color: "#4a4a4a", fontWeight: 400, textTransform: "none", fontSize: "11px" }}>(helps with matching)</span></p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
          {INTERESTS.map(i => (
            <button key={i} onClick={() => toggleArray("interests", i)} style={gridBtn(form.interests.includes(i))}>{i}</button>
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
        <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "20px" }}>We require one reference who can speak to your character. We will contact them before approving your application. Reference email must also be a Cornell email.</p>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Reference name <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.refName} onChange={e => update("refName", e.target.value)} placeholder="Their full name" style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Reference phone <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.refPhone} onChange={e => update("refPhone", e.target.value)} placeholder="Their phone number" type="tel" style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>Reference Cornell email <span style={{ color: "#e63946" }}>*</span></label>
          <input value={form.refEmail} onChange={e => update("refEmail", e.target.value)} placeholder="netid@cornell.edu" type="email" style={{ width: "100%", padding: "13px 14px", border: form.refEmail && !refEmailValid ? "1px solid #e63946" : "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
          {form.refEmail && !refEmailValid && <p style={{ fontSize: "12px", color: "#e63946", marginTop: "6px" }}>Must be a valid @cornell.edu email.</p>}
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: 600, color: "#a0a0a0", display: "block", marginBottom: "6px" }}>How do they know you <span style={{ color: "#4a4a4a", fontWeight: 400 }}>(optional)</span></label>
          <input value={form.refRelationship} onChange={e => update("refRelationship", e.target.value)} placeholder="e.g. My RA, my friend, my professor" style={{ width: "100%", padding: "13px 14px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#242424", color: "#fff" }} />
        </div>
      </section>

      <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
        <p style={{ fontSize: "12px", color: "#4a4a4a", lineHeight: 1.6 }}>By submitting you agree that CornellPulse may contact you and your reference. Your info will never be shared publicly.</p>
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", padding: "18px", backgroundColor: canSubmit ? PINK : "#1a1a1a", color: canSubmit ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.04em" }}>
        Submit application
      </button>
      {selfReference && <p style={{ fontSize: "12px", color: "#e63946", textAlign: "center", marginTop: "10px" }}>Your reference must be a different person from you.</p>}
      {!canSubmit && !selfReference && <p style={{ fontSize: "12px", color: "#4a4a4a", textAlign: "center", marginTop: "10px" }}>Fill in all required fields with valid Cornell emails to submit.</p>}
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

          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
            <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>How peer connect works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { step: "1", text: "Browse students below who have signed up to listen, grab food, or just hang out." },
                { step: "2", text: "Tap a supporter and fill out a short request. Takes about 30 seconds." },
                { step: "3", text: "We reach out to both of you within 24 hours and make the introduction over email." },
              ].map(item => (
                <div key={item.step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: PINK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f0f0f" }}>{item.step}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.55, paddingTop: "2px" }}>{item.text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setTab("signup")} style={{ width: "100%", marginTop: "16px", padding: "12px", border: "1px solid #2a2a2a", borderRadius: "8px", backgroundColor: "transparent", color: PINK, fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em" }}>
              BECOME A SUPPORTER
            </button>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "48px 0" }}><p style={{ fontSize: "14px", color: "#4a4a4a" }}>Loading supporters...</p></div>}

          {!loading && filtered.length === 0 && (
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "24px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>No supporters yet</p>
              <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6 }}>We are building our network. Be the first to sign up and help other students.</p>
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