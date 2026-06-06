import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div style={{ padding: "48px 24px 24px" }}>
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Cornell University
        </p>
        <h1 style={{ fontSize: "30px", fontWeight: "700", color: "#1a1a1a", lineHeight: 1.2, marginBottom: "16px" }}>
          Find the right support, right now.
        </h1>
        <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.6 }}>
          CornellPulse helps you figure out which mental health resource is right for what you are going through. Takes under 90 seconds. Completely anonymous.
        </p>
      </div>

      <Link to="/checkin" style={{
        display: "block",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        padding: "18px 24px",
        borderRadius: "12px",
        fontWeight: "700",
        fontSize: "17px",
        textAlign: "center",
        marginBottom: "12px",
      }}>
        Check in now
      </Link>

      <p style={{ fontSize: "13px", color: "#aaa", textAlign: "center", marginBottom: "40px" }}>
        No account needed. Nothing is stored about you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>How it works</p>
          <p style={{ fontSize: "15px", color: "#333", lineHeight: 1.5 }}>
            Answer 4 quick questions about how you are feeling. We match you to the right Cornell resource instantly.
          </p>
        </div>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>Your privacy</p>
          <p style={{ fontSize: "15px", color: "#333", lineHeight: 1.5 }}>
            We never store your answers, your text, or anything about you. Every check-in is completely anonymous.
          </p>
        </div>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", marginBottom: "6px" }}>8 resources available</p>
          <p style={{ fontSize: "15px", color: "#333", lineHeight: 1.5 }}>
            From CAPS therapy to peer counseling to crisis lines -- we know all of Cornell's options and find the right one for you.
          </p>
        </div>
      </div>
    </div>
  )
}