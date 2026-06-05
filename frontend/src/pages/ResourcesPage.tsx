const resources = [
  { name: "CAPS Individual Therapy", phone: "607-255-5155", desc: "One-on-one counseling with a licensed therapist. Call to schedule an Access Appointment." },
  { name: "Let's Talk Drop-In", phone: null, desc: "Informal same-day consultations with a counselor. No appointment needed. Check the website for daily locations." },
  { name: "EARS Peer Counseling", phone: "607-255-4050", desc: "Talk with a trained fellow Cornell student. Available Sun-Thu 9pm-1am during the semester." },
  { name: "Cornell Health 24/7 Phone", phone: "607-255-5155", desc: "Talk to a health professional any time. Press 2 for after-hours mental health support." },
  { name: "Crisis Text Line", phone: "Text HOME to 741741", desc: "Free, confidential crisis counseling by text, 24/7." },
  { name: "988 Suicide and Crisis Lifeline", phone: "988", desc: "Call or text 988 any time for immediate crisis support." },
]

export default function ResourcesPage() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px" }}>Cornell Mental Health Resources</h1>
      <p style={{ color: "#555", marginBottom: "32px", fontSize: "15px" }}>
        All resources below are free for enrolled Cornell students.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {resources.map(r => (
          <div key={r.name} style={{
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            padding: "20px",
            backgroundColor: "#fff",
          }}>
            <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "6px" }}>{r.name}</div>
            {r.phone && (
              <div style={{ fontSize: "14px", color: "#444", marginBottom: "6px" }}>{r.phone}</div>
            )}
            <div style={{ fontSize: "14px", color: "#666" }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}