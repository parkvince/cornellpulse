import { useState } from "react"

const PINK = "#e8a0b4"

const slides = [
  {
    tag: "Welcome",
    title: "Find the right support, right now.",
    body: "CornellPulse helps you figure out which mental health resource at Cornell is right for what you are going through. Takes under 90 seconds.",
  },
  {
    tag: "Resources",
    title: "35+ Cornell and Ithaca resources.",
    body: "From CAPS therapy to peer counseling to outdoor stress relief. We know every option and find the right one for you.",
  },
  {
    tag: "Connect",
    title: "Talk to a peer who gets it.",
    body: "Connect with vetted Cornell students who want to grab food, go for a walk, or just be there for you.",
  },
  {
    tag: "Privacy",
    title: "Completely anonymous. Always.",
    body: "We never collect your name, email, or any identifying information. Your check-in answers are used only to match you to a resource and are never stored.",
  },
  {
    tag: "Before you start",
    title: "A few things to know.",
    body: "",
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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "60px 28px 48px", backgroundColor: "#0f0f0f" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "20px", display: "block" }}>
          {slide.tag}
        </span>

        <h1 style={{ fontSize: "34px", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: "20px", letterSpacing: "-0.02em" }}>
          {slide.title}
        </h1>

        {slide.isDisclosure ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              {
                heading: "Not a clinical service",
                body: "CornellPulse is a resource navigation tool. It does not provide therapy, counseling, or medical advice, and it is not a substitute for professional mental health care.",
              },
              {
                heading: "Not affiliated with Cornell University",
                body: "This app was built independently by Cornell students. It is not an official Cornell product and is not endorsed by the university.",
              },
              {
                heading: "Your data stays on your device",
                body: "Your check-in responses are never stored on our servers. The only information we collect is anonymous aggregate data (mood scores by college) to understand campus wellness trends.",
              },
              {
                heading: "In an emergency",
                body: "If you are in immediate danger, call 911 or Cornell Police at 607-255-1111. This app is not monitored and cannot dispatch help.",
              },
            ].map(item => (
              <div key={item.heading} style={{ backgroundColor: "#1a1a1a", borderRadius: "8px", padding: "14px 16px" }}>
                <p style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{item.heading}</p>
                <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.55 }}>{item.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "16px", color: "#a0a0a0", lineHeight: 1.7 }}>{slide.body}</p>
        )}
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "32px", marginTop: "28px" }}>
        {slides.map((_, idx) => (
          <div key={idx} style={{ height: "3px", flex: idx === i ? 4 : 1, borderRadius: "2px", backgroundColor: idx <= i ? PINK : "#2a2a2a", transition: "flex 0.4s ease" }} />
        ))}
      </div>

      {i < slides.length - 1 ? (
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={finish} style={{ flex: 1, padding: "16px", backgroundColor: "transparent", color: "#4a4a4a", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em" }}>SKIP</button>
          <button onClick={() => setI(i + 1)} style={{ flex: 2, padding: "16px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
        </div>
      ) : (
        <button onClick={finish} style={{ width: "100%", padding: "18px", backgroundColor: PINK, color: "#0f0f0f", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>I UNDERSTAND, GET STARTED</button>
      )}
    </div>
  )
}