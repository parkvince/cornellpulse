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
    if (mood >= 7) return "#2e7d32"
    if (mood >= 5) return "#f57f17"
    if (mood >= 3) return "#bf360c"
    return "#b71c1c"
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
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "48px 24px 32px", backgroundColor: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Cornell University</p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: "12px" }}>
          Find the right support, right now.
        </h1>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6, marginBottom: "28px" }}>
          Answer 4 quick questions. Get matched to the right Cornell resource instantly. Completely anonymous.
        </p>
        <Link to="/checkin" style={{
          display: "block",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "17px 24px",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "16px",
          textAlign: "center",
          marginBottom: "10px",
        }}>
          Check in now
        </Link>
        <p style={{ fontSize: "12px", color: "#bbb", textAlign: "center" }}>
          No account needed. Nothing is stored about you.
        </p>
      </div>

      {lastCheckIn && (
        <div style={{ padding: "20px 20px 0" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Last check-in</p>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: getMoodColor(lastCheckIn.mood) }}>
                {lastCheckIn.mood}<span style={{ fontSize: "14px", color: "#aaa", fontWeight: 400 }}>/10</span>
              </div>
              <div style={{ fontSize: "12px", color: "#aaa" }}>{formatDate(lastCheckIn.date)}</div>
            </div>
            <div style={{ fontSize: "13px", color: getMoodColor(lastCheckIn.mood), fontWeight: 500, marginBottom: "4px" }}>
              {getMoodLabel(lastCheckIn.mood)}
            </div>
            <div style={{ fontSize: "13px", color: "#888" }}>
              Matched to: {lastCheckIn.resource}
            </div>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ padding: "0 20px 0" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Recent history</p>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
            {history.slice(0, 5).map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < Math.min(history.length, 5) - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getMoodColor(c.mood), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: getMoodColor(c.mood) }}>{c.mood}/10</div>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>{getMoodLabel(c.mood)}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#bbb" }}>{formatDate(c.date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Quick access</p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <Link to="/peer" style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", textDecoration: "none" }}>
            <div style={{ marginBottom: "6px" }}>
              <svg width="20" height="20" fill="none" stroke="#1a1a1a" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>Be a supporter</div>
            <div style={{ fontSize: "12px", color: "#888" }}>Help other students</div>
          </Link>
          <Link to="/resources" style={{ flex: 1, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px", textDecoration: "none" }}>
            <div style={{ marginBottom: "6px" }}>
              <svg width="20" height="20" fill="none" stroke="#1a1a1a" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>All resources</div>
            <div style={{ fontSize: "12px", color: "#888" }}>35+ Cornell and Ithaca</div>
          </Link>
        </div>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>Crisis support</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Available 24/7</div>
            </div>
            <a href="tel:988" style={{ backgroundColor: "#1a1a1a", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
              Call 988
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
