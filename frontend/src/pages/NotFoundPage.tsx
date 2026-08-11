import { Link } from "react-router-dom"

const CORAL = "#D70466"

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100%", padding: "40px 24px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff8f7", textAlign: "center" }}>
      <div>
        <p style={{ color: CORAL, fontSize: "52px", fontWeight: 800, lineHeight: 1 }}>404</p>
        <h1 style={{ margin: "12px 0 8px", color: "#222222", fontSize: "25px" }}>Page not found</h1>
        <p style={{ marginBottom: "24px", color: "#717171", fontSize: "14px" }}>The page you requested does not exist.</p>
        <Link to="/" style={{ display: "inline-block", padding: "14px 22px", borderRadius: "12px", backgroundColor: CORAL, color: "#ffffff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Go home</Link>
      </div>
    </div>
  )
}
