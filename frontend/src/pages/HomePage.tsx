import { Link } from "react-router-dom"
import { featureFlags } from "../config/featureFlags"
import { useEffect, useState } from "react"

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

export default function HomePage() {
  const [last, setLast] = useState<CheckIn | null>(null)

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")
      if (h.length > 0) setLast(h[0])
    } catch {}
  }, [])

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "CornellPulse",
        text: "A free anonymous mental health navigator for Cornell students.",
        url: window.location.origin,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.origin).then(() => {
        alert("Link copied to clipboard")
      }).catch(() => {})
    }
  }

  return (
    <div style={{ backgroundColor: "#fff8f7" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "280px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Cornell University</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "24px" }}>
          Find the right support, right now.
        </h1>
        <Link to="/checkin" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px 20px", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222" }}>Start a check-in</p>
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: CORAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </Link>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {last && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Last check-in</p>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "48px", fontWeight: 800, color: moodColor(last.mood), lineHeight: 1 }}>{last.mood}</span>
                  <span style={{ fontSize: "18px", color: "#b0b0b0" }}>/10</span>
                </div>
                <span style={{ fontSize: "12px", color: "#b0b0b0", backgroundColor: "#f5f5f5", padding: "4px 10px", borderRadius: "20px" }}>{timeAgo(last.date)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: moodColor(last.mood) }} />
                <p style={{ fontSize: "14px", fontWeight: 600, color: moodColor(last.mood) }}>{moodLabel(last.mood)}</p>
              </div>
              <p style={{ fontSize: "13px", color: "#717171" }}>{last.resource}</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em" }}>Resources</p>
            <Link to="/resources" style={{ fontSize: "13px", fontWeight: 600, color: CORAL }}>See all →</Link>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            {[
              { label: "CAPS Individual Therapy", sub: "One-on-one counseling" },
              { label: "Let's Talk Drop-In", sub: "No appointment needed" },
              { label: "EARS Peer Counseling", sub: "Sun-Thu 9pm-1am" },
              { label: "Cornell Health 24/7", sub: "Any time, any day" },
            ].map((r, idx) => (
              <Link key={r.label} to="/resources" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < 3 ? "1px solid #f5f5f5" : "none", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#222222", marginBottom: "1px" }}>{r.label}</p>
                    <p style={{ fontSize: "12px", color: "#717171" }}>{r.sub}</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Quick access</p>

          {featureFlags.peerConnect && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Link to="/peer" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", textDecoration: "none" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#222222", marginBottom: "3px" }}>Be a supporter</p>
              <p style={{ fontSize: "11px", color: "#717171" }}>Help other students</p>
            </Link>
            <Link to="/peer" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", textDecoration: "none" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#222222", marginBottom: "3px" }}>Talk to someone</p>
              <p style={{ fontSize: "11px", color: "#717171" }}>Find a peer supporter</p>
            </Link>
          </div>}

          <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", borderRadius: "20px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Crisis support</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Available 24/7</p>
              </div>
            </div>
            <a href="tel:988" style={{ backgroundColor: "#ffffff", color: CORAL, padding: "10px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 700 }}>Call 988</a>
          </div>

          <button onClick={handleShare} style={{ width: "100%", padding: "14px 20px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#222222" }}>Know someone who needs this?</p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#FFF0F0", padding: "8px 14px", borderRadius: "10px", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <span style={{ fontSize: "13px", fontWeight: 700, color: CORAL }}>Share</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
