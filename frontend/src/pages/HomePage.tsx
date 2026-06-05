import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px", color: "#1a1a1a" }}>
        Find the right support, right now.
      </h1>
      <p style={{ fontSize: "17px", color: "#444", marginBottom: "40px", lineHeight: 1.6 }}>
        CornellPulse helps you figure out which mental health resource at Cornell is right for what you are going through.
        It takes under 90 seconds and your responses are completely anonymous.
      </p>
      <Link
        to="/checkin"
        style={{
          display: "inline-block",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "16px",
        }}
      >
        Check in now
      </Link>
      <p style={{ marginTop: "16px", fontSize: "13px", color: "#888" }}>
        No account needed. Nothing is stored about you.
      </p>
    </div>
  )
}