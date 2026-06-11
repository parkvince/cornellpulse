import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0)

  const slides = [
    {
      title: "Find the right support, right now.",
      body: "CornellPulse matches you to the right mental health resource at Cornell in under 90 seconds. Completely anonymous.",
      icon: (
        <svg width="64" height="64" fill="none" stroke="#1a1a1a" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 21C12 21 4 13.5 4 8a8 8 0 0116 0c0 5.5-8 13-8 13z"/>
          <circle cx="12" cy="8" r="2.5"/>
        </svg>
      ),
    },
    {
      title: "35+ Cornell and Ithaca resources.",
      body: "From CAPS therapy to peer counseling to outdoor stress relief -- we know every option and find the right one for you.",
      icon: (
        <svg width="64" height="64" fill="none" stroke="#1a1a1a" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      ),
    },
    {
      title: "Connect with a peer who gets it.",
      body: "Sometimes you just need another person. Connect with vetted Cornell students who want to grab food or just listen.",
      icon: (
        <svg width="64" height="64" fill="none" stroke="#1a1a1a" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      title: "Your privacy is protected.",
      body: "We never store your name, email, or any personal information. Every check-in is completely anonymous. Nothing is ever sold or shared.",
      icon: (
        <svg width="64" height="64" fill="none" stroke="#1a1a1a" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    },
  ]

  function finish() {
    localStorage.setItem("cornellpulse_onboarded", "true")
    window.location.href = "/"
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "48px 28px 40px", backgroundColor: "#fff" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: "100px", height: "100px", backgroundColor: "#f5f5f5", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" }}>
          {slides[slide].icon}
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#1a1a1a", marginBottom: "16px", lineHeight: 1.2 }}>
          {slides[slide].title}
        </h1>
        <p style={{ fontSize: "16px", color: "#666", lineHeight: 1.6, maxWidth: "320px" }}>
          {slides[slide].body}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "32px" }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === slide ? "20px" : "6px", height: "6px", borderRadius: "3px", backgroundColor: i === slide ? "#1a1a1a" : "#e0e0e0", transition: "width 0.3s ease" }} />
        ))}
      </div>

      {slide < slides.length - 1 ? (
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={finish} style={{ flex: 1, padding: "14px", backgroundColor: "#fff", color: "#aaa", border: "1px solid #e5e5e5", borderRadius: "12px", fontSize: "15px", cursor: "pointer" }}>
            Skip
          </button>
          <button onClick={() => setSlide(slide + 1)} style={{ flex: 2, padding: "14px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
            Next
          </button>
        </div>
      ) : (
        <button onClick={finish} style={{ width: "100%", padding: "16px", backgroundColor: "#1a1a1a", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
          Get started
        </button>
      )}
    </div>
  )
}