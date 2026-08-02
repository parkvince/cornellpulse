import { Link } from "react-router-dom"

const CORAL = "#FF5A5F"

export default function FeatureUnavailablePage({ feature }: { feature: string }) {
  return (
    <main style={{ minHeight: "100%", padding: "40px 24px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff8f7" }}>
      <div style={{ width: "100%", maxWidth: "360px", padding: "32px 24px", borderRadius: "24px", backgroundColor: "#ffffff", border: "1px solid #f0f0f0", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", textAlign: "center" }}>
        <div aria-hidden="true" style={{ width: "56px", height: "56px", margin: "0 auto 18px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F0", color: CORAL, fontSize: "24px" }}>↻</div>
        <p style={{ marginBottom: "8px", color: CORAL, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{feature}</p>
        <h1 style={{ marginBottom: "12px", color: "#222222", fontSize: "25px", lineHeight: 1.2 }}>Coming back after safety review</h1>
        <p style={{ marginBottom: "24px", color: "#717171", fontSize: "14px", lineHeight: 1.6 }}>This feature is temporarily unavailable while CornellPulse completes its safety and privacy review.</p>
        <Link to="/resources" style={{ display: "block", padding: "14px", borderRadius: "12px", backgroundColor: CORAL, color: "#ffffff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Browse support resources</Link>
        <Link to="/" style={{ display: "block", marginTop: "12px", padding: "8px", color: "#717171", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Back to home</Link>
      </div>
    </main>
  )
}
