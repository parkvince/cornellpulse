import { useState, useEffect } from "react"

const CORAL = "#FF5A5F"

function moodColor(m: number) {
  if (m >= 7) return "#00A699"
  if (m >= 5) return "#FC642D"
  if (m >= 3) return "#FF5A5F"
  return "#c0392b"
}

function ResourceItem(props: any) {
  const r = props.resource
  const primary = props.primary

  function saveResource() {
    const text = [r.name, r.tagline, r.phone ? "Phone: " + r.phone : null, r.hours ? "Hours: " + r.hours : null, r.how_to_access ? "How to access: " + r.how_to_access : null, r.url].filter(Boolean).join("\n")
    if (navigator.share) {
      navigator.share({ title: r.name, text: text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => { if (props.onSaved) props.onSaved() }).catch(() => {})
    }
  }

  return (
    <div style={{ borderRadius: "16px", padding: "20px", backgroundColor: primary ? CORAL : "#ffffff", marginBottom: "10px", boxShadow: primary ? "0 4px 20px rgba(255,90,95,0.3)" : "0 2px 12px rgba(0,0,0,0.06)", border: primary ? "none" : "1px solid #f0f0f0" }}>
      {primary && <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Best match for you</p>}
      <p style={{ fontWeight: 800, fontSize: primary ? "20px" : "16px", marginBottom: "6px", color: primary ? "#ffffff" : "#222222" }}>{r.name}</p>
      <p style={{ fontSize: "14px", color: primary ? "rgba(255,255,255,0.85)" : "#717171", marginBottom: "14px", lineHeight: 1.5 }}>{r.tagline}</p>

      {r.phone && (
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "10px", color: primary ? "rgba(255,255,255,0.6)" : "#b0b0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Phone</p>
          <a href={"tel:" + r.phone} style={{ fontSize: "18px", fontWeight: 800, color: primary ? "#ffffff" : CORAL }}>{r.phone}</a>
        </div>
      )}
      {r.hours && (
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "10px", color: primary ? "rgba(255,255,255,0.6)" : "#b0b0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Hours</p>
          <p style={{ fontSize: "14px", color: primary ? "rgba(255,255,255,0.85)" : "#717171" }}>{r.hours}</p>
        </div>
      )}
      {r.how_to_access && (
        <div style={{ backgroundColor: primary ? "rgba(0,0,0,0.1)" : "#fff8f7", borderRadius: "10px", padding: "12px", marginBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: primary ? "rgba(255,255,255,0.6)" : "#b0b0b0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>How to access</p>
          <p style={{ fontSize: "13px", color: primary ? "rgba(255,255,255,0.9)" : "#717171", lineHeight: 1.6 }}>{r.how_to_access}</p>
        </div>
      )}
      <div style={{ display: "flex", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: primary ? "#ffffff" : CORAL, fontWeight: 600, textDecoration: "underline" }}>Visit website</a>}
        {primary && <button onClick={saveResource} style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 600, backgroundColor: "transparent", border: "none", textDecoration: "underline", padding: 0, cursor: "pointer" }}>Save resource</button>}
      </div>
    </div>
  )
}

export default function ResultCard(props: any) {
  const tr = props.result.triage_result
  const [toast, setToast] = useState("")

  useEffect(() => {
    const saved = sessionStorage.getItem("cornellpulse_result_saved")
    if (saved) return
    try {
      const h = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")
      const entry = { date: new Date().toISOString(), mood: props.moodScore || 5, distress_level: tr.distress_level, resource: tr.primary.name }
      localStorage.setItem("cornellpulse_history", JSON.stringify([entry, ...h].slice(0, 20)))
      sessionStorage.setItem("cornellpulse_result_saved", "1")
    } catch {}
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const cleanTriggers = (props.triggers || []).filter((t: string) => t !== "nothing_specific").map((t: string) => t.replace(/_/g, " "))

  return (
    <div style={{ padding: "24px 20px" }}>
      {tr.crisis_flag && (
        <div style={{ backgroundColor: "#FFF0F0", border: "2px solid #FF5A5F", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 800, color: CORAL, marginBottom: "8px" }}>Please reach out right now</p>
          <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "16px" }}>Based on what you shared, we want to make sure you get support immediately.</p>
          <a href="tel:988" style={{ display: "block", backgroundColor: CORAL, color: "#fff", padding: "14px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>Call 988 now</a>
          <a href="sms:741741" style={{ display: "block", border: "2px solid " + CORAL, color: CORAL, padding: "12px", borderRadius: "12px", textAlign: "center", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Text HOME to 741741</a>
          <a href="tel:6072551111" style={{ display: "block", border: "2px solid " + CORAL, color: CORAL, padding: "12px", borderRadius: "12px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>Call Cornell Police 607-255-1111</a>
        </div>
      )}

      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Your results</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", marginBottom: "10px", letterSpacing: "-0.01em" }}>Here is what we recommend</h2>

      {cleanTriggers.length > 0 && !tr.crisis_flag && (
        <div style={{ backgroundColor: "#FFF0F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6 }}>
            It sounds like <strong style={{ color: CORAL }}>{cleanTriggers.slice(0, 2).join(" and ")}</strong> {cleanTriggers.length === 1 ? "is" : "are"} weighing on you right now. That is completely valid.
          </p>
        </div>
      )}

      {tr.why && <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px", lineHeight: 1.65 }}>{tr.why}</p>}

      <ResourceItem resource={tr.primary} primary={true} onSaved={() => showToast("Copied to clipboard")} />

      {tr.show_peer_connect && (
        <div style={{ borderRadius: "16px", padding: "20px", marginBottom: "10px", backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Want to talk to another student?</p>
          <p style={{ fontSize: "14px", color: "#717171", marginBottom: "16px", lineHeight: 1.5 }}>Sometimes the best thing is sitting with someone who gets it.</p>
          <a href="mailto:cornellpulse@gmail.com?subject=Peer Connect Request" style={{ display: "block", border: "2px solid " + CORAL, color: CORAL, padding: "12px", borderRadius: "12px", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>Connect me with someone</a>
          <p style={{ fontSize: "11px", color: "#b0b0b0", textAlign: "center", marginTop: "8px" }}>Completely optional.</p>
        </div>
      )}

      {tr.secondary.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Other options</p>
          {tr.secondary.map((r: any) => <ResourceItem key={r.resource_id} resource={r} />)}
        </div>
      )}

      <button onClick={() => { sessionStorage.removeItem("cornellpulse_result_saved"); props.onRestart() }} style={{ marginTop: "20px", width: "100%", padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Check in again</button>
      <p style={{ fontSize: "11px", color: "#b0b0b0", textAlign: "center", marginTop: "14px" }}>Your responses were not saved to our servers.</p>

      {toast && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", backgroundColor: CORAL, color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, zIndex: 300, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  )
}