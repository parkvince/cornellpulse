import { useState } from "react"

const LOCATIONS = [
  "Libe Cafe",
  "Terrace Restaurant",
  "Trillium",
  "Temple of Zeus",
  "Olin Library",
  "Mann Library",
  "Uris Library",
  "Duffield Hall Atrium",
  "Physical Sciences Building",
  "CTB (Collegetown Bagels)",
  "Gimme Coffee",
  "Agora Restaurant",
  "Okenshields",
  "RPCC Dining",
  "104West Dining",
  "Cafe Jennie",
  "Statler Hotel Lobby",
  "Ho Plaza",
  "Other (anywhere works for me)",
]

const INTERESTS = [
  "Music",
  "Sports",
  "Gaming",
  "Reading",
  "Film",
  "Cooking",
  "Hiking",
  "Art",
  "Politics",
  "Tech",
  "Finance",
  "Fashion",
  "Travel",
  "Fitness",
  "Photography",
  "Writing",
  "Volunteering",
  "Research",
]

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD", "Other"]

const AVAILABILITY = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend afternoons",
  "Weekend evenings",
]

export default function PeerSignupPage() {
  const [submitted, setSubmitted] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    year: "",
    major: "",
    locations: [] as string[],
    availability: [] as string[],
    interests: [] as string[],
    about: "",
    refName: "",
    refPhone: "",
    refEmail: "",
    refRelationship: "",
  })

  function update(field: string, value: any) {
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

  const filteredLocations = LOCATIONS.filter(l =>
    l.toLowerCase().includes(locationSearch.toLowerCase())
  )

  async function handleSubmit() {
    try {
      await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1") + "/peer-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } catch (e) {
      console.error("Submit failed", e)
    }
    setSubmitted(true)
  }

  const canSubmit = form.name && form.email && form.phone && form.year && form.locations.length > 0 && form.refName && form.refPhone && form.refEmail

  if (submitted) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>?</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>Thanks for signing up</h2>
        <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.6, marginBottom: "24px" }}>
          We will review your application and reach out to you and your reference within a few days. We really appreciate you being willing to show up for other students.
        </p>
        <p style={{ fontSize: "13px", color: "#aaa" }}>You can close this page.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 20px 40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>Be a peer supporter</h1>
      <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "32px" }}>
        Sometimes all someone needs is another person to sit with them. Sign up to be someone that students can reach out to when they just want to talk, grab food, or not be alone.
      </p>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>Your info</p>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Full name <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Cornell email <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.email} onChange={e => update("email", e.target.value)} placeholder="yournetid@cornell.edu" type="email" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Phone number <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Your phone number" type="tel" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Year <span style={{ color: "#c00" }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {YEARS.map(y => (
              <button key={y} onClick={() => update("year", y)} style={{ padding: "8px 14px", border: form.year === y ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: form.year === y ? "#1a1a1a" : "#fff", color: form.year === y ? "#fff" : "#1a1a1a", fontSize: "13px", fontWeight: form.year === y ? 600 : 400, cursor: "pointer" }}>{y}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Major <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></label>
          <input value={form.major} onChange={e => update("major", e.target.value)} placeholder="Your major" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Where you are comfortable meeting <span style={{ color: "#c00" }}>*</span></p>
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "14px" }}>Select all that apply. You can search below.</p>
        <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "14px", backgroundColor: "#fff", color: "#1a1a1a", marginBottom: "12px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {filteredLocations.map(loc => {
            const selected = form.locations.includes(loc)
            return (
              <button key={loc} onClick={() => toggleArray("locations", loc)} style={{ padding: "8px 14px", border: selected ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: selected ? "#1a1a1a" : "#fff", color: selected ? "#fff" : "#1a1a1a", fontSize: "13px", fontWeight: selected ? 600 : 400, cursor: "pointer" }}>{loc}</button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>When are you generally available</p>
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "14px" }}>Select all that apply.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {AVAILABILITY.map(a => {
            const selected = form.availability.includes(a)
            return (
              <button key={a} onClick={() => toggleArray("availability", a)} style={{ padding: "8px 14px", border: selected ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: selected ? "#1a1a1a" : "#fff", color: selected ? "#fff" : "#1a1a1a", fontSize: "13px", fontWeight: selected ? 600 : 400, cursor: "pointer" }}>{a}</button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Interests <span style={{ color: "#999", fontWeight: 400, textTransform: "none", fontSize: "12px" }}>(optional, helps with matching)</span></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
          {INTERESTS.map(i => {
            const selected = form.interests.includes(i)
            return (
              <button key={i} onClick={() => toggleArray("interests", i)} style={{ padding: "8px 14px", border: selected ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: selected ? "#1a1a1a" : "#fff", color: selected ? "#fff" : "#1a1a1a", fontSize: "13px", fontWeight: selected ? 600 : 400, cursor: "pointer" }}>{i}</button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>About you <span style={{ color: "#999", fontWeight: 400, textTransform: "none", fontSize: "12px" }}>(optional)</span></p>
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px" }}>A sentence or two about yourself. This may be shown to students looking to connect.</p>
        <textarea value={form.about} onChange={e => update("about", e.target.value)} maxLength={300} placeholder="e.g. Junior in CS, originally from NYC. I know what it feels like to be overwhelmed at Cornell and I am always down to grab food or just talk." rows={4} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a", resize: "none" }} />
        <div style={{ fontSize: "12px", color: "#ccc", textAlign: "right" }}>{form.about.length}/300</div>
      </div>

      <div style={{ marginBottom: "32px", backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "6px" }}>Reference <span style={{ color: "#c00" }}>*</span></p>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "20px" }}>
          We require one reference from someone who knows you well -- a friend, RA, professor, or anyone who can speak to your character. We will reach out to them before approving you. This is how we make sure our peer supporters are the right people for this role.
        </p>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Reference name <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.refName} onChange={e => update("refName", e.target.value)} placeholder="Their full name" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Reference phone <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.refPhone} onChange={e => update("refPhone", e.target.value)} placeholder="Their phone number" type="tel" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Reference email <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.refEmail} onChange={e => update("refEmail", e.target.value)} placeholder="Their email address" type="email" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>

        <div style={{ marginBottom: "0" }}>
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>How do they know you <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></label>
          <input value={form.refRelationship} onChange={e => update("refRelationship", e.target.value)} placeholder="e.g. My RA, my professor, my friend" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
        </div>
      </div>

      <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>
          By submitting this form you agree that CornellPulse may contact you and your reference. Your information will never be shared publicly. You can opt out at any time by emailing us.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ width: "100%", padding: "16px", backgroundColor: canSubmit ? "#1a1a1a" : "#ccc", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}
      >
        Submit application
      </button>
      {!canSubmit && (
        <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "10px" }}>Fill in all required fields to submit.</p>
      )}
    </div>
  )
}
