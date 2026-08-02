import { useState } from "react"

const CORAL = "#FF5A5F"

const slides = [
  {
    tag: "Welcome",
    title: "Find the right support, right now.",
    body: "CornellPulse helps you explore support resources based on the choices you enter.",
    bg: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)",
  },
  {
    tag: "Resources",
    title: "35+ Cornell and Ithaca resources.",
    body: "Browse Cornell and Ithaca options, then decide which resources may fit what you need.",
    bg: "linear-gradient(135deg, #00A699 0%, #007A73 100%)",
  },
  {
    tag: "Connect",
    title: "Talk to a peer who gets it.",
    body: "Connect with vetted Cornell students who want to grab food, go for a walk, or just be there.",
    bg: "linear-gradient(135deg, #FC642D 0%, #FF5A5F 100%)",
  },
  {
    tag: "Privacy",
    title: "Clear choices about your data.",
    body: "Recommendations are generated on your device. Optional aggregate contribution and resource-click analytics are off until you choose to enable them.",
    bg: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)",
  },
  {
    tag: "Before you start",
    title: "A few things to know.",
    body: "",
    bg: "#ffffff",
    isDisclosure: true,
  },
]

export default function OnboardingPage() {
  const [i, setI] = useState(0)

  function finish() {
    localStorage.setItem("cornellpulse_onboarded", "true")
    window.location.href = "/"
  }

  const slide = slides[i]
  const isLight = slide.isDisclosure

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: slide.isDisclosure ? "#ffffff" : slide.bg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 28px 28px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: isLight ? CORAL : "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "20px", display: "block" }}>
          {slide.tag}
        </span>
        <h1 style={{ fontSize: "34px", fontWeight: 800, color: isLight ? "#222222" : "#ffffff", lineHeight: 1.1, marginBottom: "16px", letterSpacing: "-0.02em" }}>
          {slide.title}
        </h1>

        {slide.isDisclosure ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { heading: "Not a clinical assessment", body: "CornellPulse is a resource-navigation tool. It is not a diagnosis, therapy, medical advice, or a clinically validated screening tool." },
              { heading: "Not affiliated with Cornell University", body: "This app was built independently by Cornell students. It is not an official Cornell product." },
              { heading: "Know what is transmitted", body: "Check-in recommendations are generated on this device. Optional aggregate contribution and resource-click analytics are controlled from Privacy & Data and start off." },
              { heading: "In an emergency", body: "For an immediate medical or mental health emergency, call 911. On the Ithaca campus, Cornell Public Safety can be reached at 607-255-1111. This app cannot dispatch help." },
            ].map(item => (
              <div key={item.heading} style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "14px 16px", border: "1px solid #ebebeb" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#222222", marginBottom: "4px" }}>{item.heading}</p>
                <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55 }}>{item.body}</p>
              </div>
            ))}
            <a href="/privacy" style={{ color: CORAL, fontSize: "13px", fontWeight: 700, textAlign: "center", padding: "8px", textDecoration: "none" }}>Review Privacy &amp; Data choices</a>
          </div>
        ) : (
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.9)", lineHeight: 1.65 }}>{slide.body}</p>
        )}
      </div>

      <div style={{ padding: "0 28px 48px" }}>
        <div style={{ display: "flex", gap: "5px", marginBottom: "28px" }}>
          {slides.map((_, idx) => (
            <div key={idx} style={{ height: "3px", flex: idx === i ? 4 : 1, borderRadius: "2px", backgroundColor: idx <= i ? (isLight ? CORAL : "#ffffff") : (isLight ? "#ebebeb" : "rgba(255,255,255,0.3)"), transition: "flex 0.4s ease" }} />
          ))}
        </div>

        {i < slides.length - 1 ? (
          <div style={{ display: "flex", gap: "12px" }}>
            {i < slides.length - 2 && (
              <button onClick={finish} style={{ flex: 1, padding: "16px", backgroundColor: isLight ? "#f5f5f5" : "rgba(255,255,255,0.2)", color: isLight ? "#717171" : "rgba(255,255,255,0.8)", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Skip</button>
            )}
            <button onClick={() => setI(i + 1)} style={{ flex: 2, padding: "16px", backgroundColor: isLight ? CORAL : "#ffffff", color: isLight ? "#ffffff" : CORAL, border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}>Next</button>
          </div>
        ) : (
          <button onClick={finish} style={{ width: "100%", padding: "18px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700 }}>I understand, get started</button>
        )}
      </div>
    </div>
  )
}
