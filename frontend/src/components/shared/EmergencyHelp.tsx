import { useEffect, useRef, useState } from "react"

const CORAL = "#FF5A5F"

const emergencyContacts = {
  emergency: {
    label: "911",
    description: "Immediate threat to life or a medical, mental health, fire, or safety emergency.",
    href: "tel:911",
  },
  publicSafety: {
    label: "Cornell Public Safety / Cornell Police",
    description: "Campus emergency dispatch and public-safety response. From a cell phone on the Ithaca campus: 607-255-1111.",
    href: "tel:6072551111",
  },
  crisis: {
    label: "988 Suicide & Crisis Lifeline",
    description: "Call or text 988 for crisis support from a trained counselor, 24/7.",
    callHref: "tel:988",
    textHref: "sms:988?body=Hello%2C%20I%20need%20support.",
  },
  health: {
    label: "Cornell Health",
    description: "24/7 phone consultation for a physical or mental health concern; not emergency dispatch.",
    href: "tel:6072555155",
  },
} as const

export function EmergencyActions() {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <a href={emergencyContacts.emergency.href} style={{ display: "block", backgroundColor: CORAL, color: "#ffffff", padding: "12px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Call 911</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{emergencyContacts.emergency.description}</p>

      <a href={emergencyContacts.publicSafety.href} style={{ display: "block", border: `2px solid ${CORAL}`, color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call Cornell Public Safety · 607-255-1111</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{emergencyContacts.publicSafety.description}</p>

      <div style={{ display: "flex", gap: "8px" }}>
        <a href={emergencyContacts.crisis.callHref} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call 988</a>
        <a href={emergencyContacts.crisis.textHref} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Text 988</a>
      </div>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{emergencyContacts.crisis.description}</p>

      <a href={emergencyContacts.health.href} style={{ display: "block", border: "2px solid #ebebeb", color: "#222222", padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call Cornell Health · 607-255-5155</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{emergencyContacts.health.description}</p>
    </div>
  )
}

export default function EmergencyHelp() {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)} aria-haspopup="dialog" style={{ position: "absolute", top: "12px", right: "14px", zIndex: 450, border: "1px solid rgba(255,255,255,0.6)", borderRadius: "999px", padding: "7px 11px", backgroundColor: "rgba(255,255,255,0.94)", color: CORAL, fontSize: "11px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>Immediate help</button>
      {open && (
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }} style={{ position: "absolute", inset: 0, zIndex: 500, backgroundColor: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="immediate-help-title" style={{ width: "100%", maxHeight: "90%", overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
              <div><h2 id="immediate-help-title" style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "4px" }}>Get immediate help</h2><p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5 }}>Choose based on what you need. CornellPulse cannot contact or dispatch help.</p></div>
              <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Close immediate help" style={{ border: "none", backgroundColor: "#f5f5f5", color: "#717171", width: "32px", height: "32px", borderRadius: "10px", fontSize: "18px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>
            <EmergencyActions />
          </section>
        </div>
      )}
    </>
  )
}
