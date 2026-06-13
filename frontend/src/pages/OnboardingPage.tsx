import { useState } from "react"

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0)

  const slides = [
    {
      label: "WELCOME",
      title: "Find the right support, right now.",
      body: "CornellPulse matches you to the right mental health resource at Cornell in under 90 seconds.",
      color: "#1db954",
    },
    {
      label: "RESOURCES",
      title: "35+ Cornell and Ithaca resources.",
      body: "From CAPS therapy to peer counseling to outdoor stress relief. We know every option.",
      color: "#1db954",
    },
    {
      label: "CONNECT",
      title: "Talk to a peer who gets it.",
      body: "Connect with vetted Cornell students who want to grab food or just be there for you.",
      color: "#1db954",
    },
    {
      label: "PRIVACY",
      title: "Completely anonymous. Always.",
      body: "We never store your name, email, or any personal information. Nothing is ever sold or shared.",
      color: "#1db954",
    },
  ]

  function finish() {
    localStorage.setItem("cornellpulse_onboarded", "true")
    window.location.href = "/"
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "64px 28px 48px", backgroundColor: "#121212" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px" }}>
          {slides[slide].label}
        </p>
        <h1 style={{ fontSize: "34px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1, marginBottom: "20px", letterSpacing: "-0.02em" }}>
          {slides[slide].title}
        </h1>
        <p style={{ fontSize: "16px", color: "#b3b3b3", lineHeight: 1.6 }}>
          {slides[slide].body}
        </p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
        {slides.map((_, i) => (
          <div key={i} style={{ height: "3px", flex: i === slide ? 3 : 1, borderRadius: "2px", backgroundColor: i <= slide ? "#1db954" : "#282828", transition: "flex 0.3s ease" }} />
        ))}
      </div>

      {slide < slides.length - 1 ? (
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={finish} style={{ flex: 1, padding: "14px", backgroundColor: "transparent", color: "#535353", border: "1px solid #282828", borderRadius: "4px", fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>
            SKIP
          </button>
          <button onClick={() => setSlide(slide + 1)} style={{ flex: 2, padding: "14px", backgroundColor: "#1db954", color: "#000000", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
            NEXT
          </button>
        </div>
      ) : (
        <button onClick={finish} style={{ width: "100%", padding: "16px", backgroundColor: "#1db954", color: "#000000", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
          GET STARTED
        </button>
      )}
    </div>
  )
}