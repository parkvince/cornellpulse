import { useEffect, useRef, useState } from "react"
import { getResource } from "../../resources/registry.ts"

const CORAL = "#FF5A5F"

const emergency = getResource("emergency_911")
const publicSafety = getResource("cornell_public_safety")
const crisis = getResource("988_lifeline")
const health = getResource("cornell_health_247")

function callHref(resource: typeof emergency): string {
  return `tel:${resource.phone?.replace(/-/g, "")}`
}

function textHref(resource: typeof crisis): string {
  if (!resource.textAction) throw new Error(`${resource.id} has no text action`)
  return `sms:${resource.textAction.number}?body=${encodeURIComponent(resource.textAction.prefilledText)}`
}

export function EmergencyActions() {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <a href={callHref(emergency)} style={{ display: "block", backgroundColor: CORAL, color: "#ffffff", padding: "12px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Call {emergency.phone}</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{emergency.description}</p>

      <a href={callHref(publicSafety)} style={{ display: "block", border: `2px solid ${CORAL}`, color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call {publicSafety.officialName} · {publicSafety.phone}</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{publicSafety.description}</p>

      <CrisisContactActions />
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{crisis.description}</p>

      <a href={callHref(health)} style={{ display: "block", border: "2px solid #ebebeb", color: "#222222", padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call {health.officialName} · {health.phone}</a>
      <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.45 }}>{health.description}</p>
    </div>
  )
}

export function CrisisContactActions() {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <a href={callHref(crisis)} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call {crisis.phone}</a>
      <a href={textHref(crisis)} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Text {crisis.textAction?.number}</a>
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
