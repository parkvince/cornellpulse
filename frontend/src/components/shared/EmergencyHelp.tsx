import { useEffect, useRef, useState } from "react"
import { getResource } from "../../resources/registry.ts"

const CORAL = "#FF5A5F"
const CORAL_TEXT = "#8A292D"

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

      <a href={callHref(publicSafety)} style={{ display: "block", border: `2px solid ${CORAL}`, color: CORAL_TEXT, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call {publicSafety.officialName} · {publicSafety.phone}</a>
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
      <a href={callHref(crisis)} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL_TEXT, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call {crisis.phone}</a>
      <a href={textHref(crisis)} style={{ flex: 1, display: "block", backgroundColor: "#FFF0F0", color: CORAL_TEXT, padding: "10px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Text {crisis.textAction?.number}</a>
    </div>
  )
}

export default function EmergencyHelp() {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const opener = openerRef.current
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      ;(previouslyFocused || opener)?.focus()
    }
  }, [open])

  return (
    <>
      <button ref={openerRef} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} style={{ position: "absolute", top: "max(12px, env(safe-area-inset-top))", right: "14px", zIndex: 450, border: "1px solid rgba(255,255,255,0.6)", borderRadius: "999px", minHeight: "44px", padding: "7px 11px", backgroundColor: "rgba(255,255,255,0.94)", color: CORAL_TEXT, fontSize: "11px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>Immediate help</button>
      {open && (
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }} style={{ position: "absolute", inset: 0, zIndex: 500, backgroundColor: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="immediate-help-title" aria-describedby="immediate-help-description" style={{ width: "100%", maxHeight: "90%", overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
              <div><h2 id="immediate-help-title" style={{ fontSize: "20px", fontWeight: 800, color: "#222222", marginBottom: "4px" }}>Get immediate help</h2><p id="immediate-help-description" style={{ fontSize: "12px", color: "#595959", lineHeight: 1.5 }}>Choose based on what you need. CornellPulse cannot contact or dispatch help.</p></div>
              <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Close immediate help" style={{ border: "none", backgroundColor: "#f5f5f5", color: "#595959", width: "44px", height: "44px", borderRadius: "10px", fontSize: "18px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>
            <EmergencyActions />
          </section>
        </div>
      )}
    </>
  )
}
