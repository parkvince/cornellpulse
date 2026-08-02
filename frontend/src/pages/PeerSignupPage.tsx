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
    password: "",
    year: "",
    major: "",
    locations: [] as string[],
    availability: [] as string[],
    interests: [] as string[],
    about: "",
    policyAccepted: false,
  })

  function update(field: string, value: string | string[] | boolean) {
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
      const response = await fetch(apiUrl + "/peer-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: form.name, email: form.email, phone: form.phone, password: form.password, year: form.year, major: form.major, locations: form.locations, availability: form.availability, interests: form.interests, about: form.about }),
      })
      if (!response.ok) return
      const draft = await response.json() as { supporter_id: string; access_token: string }
      const submitResponse = await fetch(`${apiUrl}/peer-signups/${draft.supporter_id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${draft.access_token}` },
        body: JSON.stringify({ policy_version: "2026-08-02", role_scope_accepted: true, conduct_standards_accepted: true, crisis_boundaries_accepted: true, public_meeting_rules_accepted: true, reporting_policy_accepted: true, withdrawal_controls_acknowledged: true }),
      })
      if (!submitResponse.ok) return
    } catch (e) {
      console.error("Submit failed", e)
      return
    }
    setSubmitted(true)
  }

  const canSubmit = form.name && form.email && form.phone && form.password.length >= 12 && form.year && form.locations.length > 0 && form.policyAccepted

  if (submitted) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>?</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>Thanks for signing up</h2>
        <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.6, marginBottom: "24px" }}>
          Your application is submitted, but it is not approved. Cornell identity verification, a consent-based reference invitation, current training requirements, and administrator review must be completed before any public profile can appear.
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
          <label style={{ fontSize: "14px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}>Password <span style={{ color: "#c00" }}>*</span></label>
          <input value={form.password} onChange={e => update("password", e.target.value)} placeholder="At least 12 characters" type="password" autoComplete="new-password" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a" }} />
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

      <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>Role and conduct acknowledgement</p>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "12px" }}>Supporters offer informal peer presence and resource navigation—not therapy, diagnosis, crisis response, transportation, or guaranteed confidentiality. Public, well-lit meeting rules, conduct standards, crisis escalation, reporting, training, and withdrawal requirements apply.</p>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#333", lineHeight: 1.5 }}><input type="checkbox" checked={form.policyAccepted} onChange={event => update("policyAccepted", event.target.checked)} />I reviewed and accept the current supporter policy. I understand that identity verification, a consent-based reference invitation, training evidence, and administrator review are still required before approval.</label>
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
