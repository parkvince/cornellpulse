import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

const PINK = "#e8a0b4"

interface CheckIn { date: string; mood: number; resource: string }

function moodColor(m: number) {
  if (m >= 7) return "#e8a0b4"
  if (m >= 5) return "#f4c97a"
  if (m >= 3) return "#e8935a"
  return "#e63946"
}

function moodLabel(m: number) {
  if (m >= 7) return "Doing well"
  if (m >= 5) return "Some stress"
  if (m >= 3) return "High stress"
  return "Very high stress"
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function HomePage() {
  const [history, setHistory] = useState<CheckIn[]>([])

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")) } catch {}
  }, [])

  const last = history[0]

  return (
    <div>
      <div style={{ padding: "56px 24px 32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}>Cornell University</p>
        <h1 style={{ fontSize: "34px", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "14px" }}>
          Find the right support, right now.
        </h1>
        <p style={{ fontSize: "15px", color: "#a0a0a0", lineHeight: 1.65, marginBottom: "32px" }}>
          Answer 4 questions. Get matched to the right Cornell resource instantly. Always anonymous.
        </p>
        <Link to="/checkin" style={{ display: "block", backgroundColor: PINK, color: "#0f0f0f", padding: "18px 24px", borderRadius: "6px", fontWeight: 800, fontSize: "15px", textAlign: "center", letterSpacing: "0.05em", marginBottom: "10px" }}>
          CHECK IN NOW
        </Link>
        <p style={{ fontSize: "12px", color: "#4a4a4a", textAlign: "center" }}>No account needed. Nothing stored about you.</p>
      </div>

      {last && (
        <div style={{ padding: "0 24px 28px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Last check-in</p>
          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "48px", fontWeight: 800, color: moodColor(last.mood), letterSpacing: "-0.04em", lineHeight: 1 }}>{last.mood}</span>
                <span style={{ fontSize: "18px", color: "#4a4a4a" }}>/10</span>
              </div>
              <span style={{ fontSize: "12px", color: "#4a4a4a", marginTop: "6px" }}>{timeAgo(last.date)}</span>
            </div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: moodColor(last.mood), marginBottom: "4px" }}>{moodLabel(last.mood)}</p>
            <p style={{ fontSize: "12px", color: "#4a4a4a" }}>{last.resource}</p>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ padding: "0 24px 28px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>History</p>
          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", overflow: "hidden" }}>
            {history.slice(0, 5).map((c, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: idx < 4 && idx < history.length - 1 ? "1px solid #242424" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: moodColor(c.mood), flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: moodColor(c.mood) }}>{c.mood}/10</p>
                    <p style={{ fontSize: "11px", color: "#4a4a4a" }}>{moodLabel(c.mood)}</p>
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "#4a4a4a" }}>{timeAgo(c.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 24px 28px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Quick access</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <Link to="/peer" style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "18px 16px" }}>
            <svg width="20" height="20" fill="none" stroke={PINK} strokeWidth="1.8" viewBox="0 0 24 24" style={{ marginBottom: "12px" }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>Be a supporter</p>
            <p style={{ fontSize: "11px", color: "#4a4a4a" }}>Help other students</p>
          </Link>
          <Link to="/resources" style={{ backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "18px 16px" }}>
            <svg width="20" height="20" fill="none" stroke={PINK} strokeWidth="1.8" viewBox="0 0 24 24" style={{ marginBottom: "12px" }}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>All resources</p>
            <p style={{ fontSize: "11px", color: "#4a4a4a" }}>35+ options</p>
          </Link>
        </div>
        <div style={{ backgroundColor: "#1f1215", border: "1px solid #3a1a22", borderRadius: "10px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>Crisis support</p>
            <p style={{ fontSize: "11px", color: "#4a4a4a" }}>Available 24/7</p>
          </div>
          <a href="tel:988" style={{ backgroundColor: "#e63946", color: "#fff", padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.04em" }}>CALL 988</a>
        </div>
      </div>
    </div>
  )
}