import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const CORAL = "#FF5A5F"

interface CheckIn { date: string; mood: number; resource: string }

function moodColor(m: number) {
  if (m >= 7) return "#00A699"
  if (m >= 5) return "#FC642D"
  if (m >= 3) return "#FF5A5F"
  return "#c0392b"
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

export default function ProfilePage() {
  const [history, setHistory] = useState<CheckIn[]>([])
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")) } catch {}
  }, [])

  function clearHistory() {
    localStorage.removeItem("cornellpulse_history")
    sessionStorage.removeItem("cornellpulse_result_saved")
    setHistory([])
    setCleared(true)
  }

  function resetOnboarding() {
    localStorage.removeItem("cornellpulse_onboarded")
    window.location.href = "/onboarding"
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "280px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Your space</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "8px" }}>Profile</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>Everything here is stored only on your device. Nothing is ever sent to our servers.</p>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {history.length > 0 ? (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-in history</p>
              <button onClick={clearHistory} style={{ fontSize: "12px", color: CORAL, fontWeight: 600, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>Clear all</button>
            </div>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              {history.slice(0, 10).map((c, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < Math.min(history.length, 10) - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: moodColor(c.mood) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: moodColor(c.mood) }}>{c.mood}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: moodColor(c.mood), marginBottom: "2px" }}>{moodLabel(c.mood)}</p>
                      <p style={{ fontSize: "11px", color: "#717171" }}>{c.resource}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#b0b0b0" }}>{timeAgo(c.date)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "24px", backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px 20px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            {cleared ? (
              <>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>History cleared</p>
                <p style={{ fontSize: "13px", color: "#717171", marginBottom: "20px" }}>Your check-in history has been removed from this device.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>No check-ins yet</p>
                <p style={{ fontSize: "13px", color: "#717171", marginBottom: "20px" }}>Your check-in history will appear here after your first check-in.</p>
              </>
            )}
            <Link to="/checkin" style={{ display: "inline-block", backgroundColor: CORAL, color: "#ffffff", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Start a check-in</Link>
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Privacy</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Your data</p>
              <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>CornellPulse never stores your check-in answers on our servers. Everything stays on your device.</p>
            </div>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Anonymous aggregate data</p>
              <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>We collect only anonymous mood averages by college to understand campus wellness trends. Nothing is tied to you.</p>
            </div>
            <button onClick={resetOnboarding} style={{ width: "100%", padding: "16px 20px", textAlign: "left", backgroundColor: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#222222" }}>View intro again</p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>About</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "4px" }}>CornellPulse</p>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "10px" }}>Built independently by Cornell students. Not affiliated with or endorsed by Cornell University. Not a clinical service.</p>
            <p style={{ fontSize: "12px", color: "#b0b0b0" }}>In an emergency call 911 or Cornell Police at 607-255-1111.</p>
          </div>
        </div>
      </div>
    </div>
  )
}