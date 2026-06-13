import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

interface CheckIn {
  date: string
  mood: number
  distress_level: string
  resource: string
}

export default function HomePage() {
  const [history, setHistory] = useState<CheckIn[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cornellpulse_history")
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const lastCheckIn = history[0]

  function getMoodColor(mood: number) {
    if (mood >= 7) return "#1db954"
    if (mood >= 5) return "#f59b00"
    if (mood >= 3) return "#e85d04"
    return "#e63946"
  }

  function getMoodLabel(mood: number) {
    if (mood >= 7) return "Doing well"
    if (mood >= 5) return "Some stress"
    if (mood >= 3) return "High stress"
    return "Very high stress"
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Today"
    if (diff === 1) return "Yesterday"
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div style={{ padding: "0" }}>
      <div style={{ padding: "56px 24px 32px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Cornell University</p>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1, marginBottom: "14px", letterSpacing: "-0.02em" }}>
          Find the right support.
        </h1>
        <p style={{ fontSize: "15px", color: "#b3b3b3", lineHeight: 1.6, marginBottom: "32px" }}>
          Answer 4 quick questions. Get matched to the right Cornell resource. Anonymous, always.
        </p>
        <Link to="/checkin" style={{
          display: "block",
          backgroundColor: "#1db954",
          color: "#000000",
          padding: "16px 24px",
          borderRadius: "4px",
          fontWeight: 700,
          fontSize: "15px",
          textAlign: "center",
          letterSpacing: "0.04em",
          marginBottom: "12px",
        }}>
          CHECK IN NOW
        </Link>
        <p style={{ fontSize: "12px", color: "#535353", textAlign: "center" }}>
          No account. Nothing stored about you.
        </p>
      </div>

      {lastCheckIn && (
        <div style={{ padding: "0 24px 24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#b3b3b3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Last check-in</p>
          <div style={{ backgroundColor: "#181818", borderRadius: "8px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, color: getMoodColor(lastCheckIn.mood), letterSpacing: "-0.02em" }}>
                {lastCheckIn.mood}<span style={{ fontSize: "14px", color: "#535353", fontWeight: 400 }}>/10</span>
              </div>
              <div style={{ fontSize: "12px", color: "#535353" }}>{formatDate(lastCheckIn.date)}</div>
            </div>
            <div style={{ fontSize: "13px", color: getMoodColor(lastCheckIn.mood), fontWeight: 600, marginBottom: "4px" }}>
              {getMoodLabel(lastCheckIn.mood)}
            </div>
            <div style={{ fontSize: "12px", color: "#535353" }}>
              {lastCheckIn.resource}
            </div>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ padding: "0 24px 24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#b3b3b3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>History</p>
          <div style={{ backgroundColor: "#181818", borderRadius: "8px", overflow: "hidden" }}>
            {history.slice(0, 5).map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: i < Math.min(history.length, 5) - 1 ? "1px solid #282828" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getMoodColor(c.mood), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: getMoodColor(c.mood) }}>{c.mood}/10</div>
                    <div style={{ fontSize: "11px", color: "#535353" }}>{getMoodLabel(c.mood)}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#535353" }}>{formatDate(c.date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 24px 24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#b3b3b3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Quick access</p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <Link to="/peer" style={{ flex: 1, backgroundColor: "#181818", borderRadius: "8px", padding: "16px", textDecoration: "none" }}>
            <svg width="20" height="20" fill="none" stroke="#1db954" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: "10px" }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>Be a supporter</div>
            <div style={{ fontSize: "11px", color: "#535353" }}>Help other students</div>
          </Link>
          <Link to="/resources" style={{ flex: 1, backgroundColor: "#181818", borderRadius: "8px", padding: "16px", textDecoration: "none" }}>
            <svg width="20" height="20" fill="none" stroke="#1db954" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: "10px" }}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>All resources</div>
            <div style={{ fontSize: "11px", color: "#535353" }}>35+ options</div>
          </Link>
        </div>
        <div style={{ backgroundColor: "#181818", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>Crisis support</div>
            <div style={{ fontSize: "11px", color: "#535353" }}>Available 24/7</div>
          </div>
          <a href="tel:988" style={{ backgroundColor: "#e63946", color: "#ffffff", padding: "8px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em" }}>
            CALL 988
          </a>
        </div>
      </div>
    </div>
  )
}