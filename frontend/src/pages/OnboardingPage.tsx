import { useState } from "react"

const PINK = "#e8a0b4"
const PINK_DARK = "#d4697f"

const slides = [
  { tag: "Welcome", title: "Find the right support, right now.", body: "CornellPulse matches you to the right mental health resource at Cornell in under 90 seconds." },
  { tag: "Resources", title: "35+ Cornell and Ithaca resources.", body: "From CAPS therapy to peer counseling to outdoor stress relief. We know every option and find the right one for you." },
  { tag: "Connect", title: "Talk to a peer who gets it.", body: "Connect with vetted Cornell students who want to grab food, go for a walk, or just be there." },
  { tag: "Privacy", title: "Completely anonymous. Always.", body: "We never store your name, email, or any personal information. Nothing is ever sold or shared." },
]

export default function OnboardingPage() {
  const [i, setI] = useState(0)

  function finish() {
    localStorage.setItem("cornellpulse_onboarded", "true")
    window.location.href = "/"
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "60px 28px 48px", backgroundColor: "#0f0f0f" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "20px", display: "block" }}>
          {slides[i].tag}
        </span>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: "20px", letterSpacing: "-0.03em" }}>
          {slides[i].title}
        </h1>
        <p style={{ fontSize: "16px", color: "#a0a0a0", lineHeight: 1.7 }}>
          {slides[i].body}
        </p>
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "36px" }}>
        {slides.map((_, idx) => (
          <div key={idx} style={{ height: "3px", flex: idx === i ? 4 : 1, borderRadius: "2px", backgroundColor: idx <= i ? PINK : "#2a2a2a", transition: "flex 0.4s ease, background 0.3s" }} />
        ))}
      </div>

      {i < slides.length - 1 ? (
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={finish} style={{ flex: 1, padding: "16px", backgroundColor: "transparent", color: "#4a4a4a", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em" }}>SKIP</button>
          <button onClick={() => setI(i + 1)} style={{ flex: 2, padding: "16px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
        </div>
      ) : (
        <button onClick={finish} style={{ width: "100%", padding: "18px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>GET STARTED</button>
      )}
    </div>
  )
}