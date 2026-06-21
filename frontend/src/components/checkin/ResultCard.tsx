import { useState } from "react"

const PINK = "#e8a0b4"

function moodColor(m) {
  if (m >= 7) return "#e8a0b4"
  if (m >= 5) return "#f4c97a"
  if (m >= 3) return "#e8935a"
  return "#e63946"
}

function ResourceItem(props) {
  const r = props.resource
  const primary = props.primary

  function saveResource() {
    const text = [
      r.name,
      r.tagline,
      r.phone ? "Phone: " + r.phone : null,
      r.hours ? "Hours: " + r.hours : null,
      r.how_to_access ? "How to access: " + r.how_to_access : null,
      r.url ? r.url : null,
    ].filter(Boolean).join("\n")

    if (navigator.share) {
      navigator.share({ title: r.name, text: text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        if (props.onSaved) props.onSaved()
      }).catch(() => {})
    }
  }

  return (
    <div style={{ borderRadius: "12px", padding: primary ? "24px 20px" : "20px", backgroundColor: primary ? "#e8a0b4" : "#1a1a1a", marginBottom: "10px" }}>
      {primary && <p style={{ fontSize: "10px", fontWeight: 800, color: "#0f0f0f", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px", opacity: 0.65 }}>Best match for you</p>}
      <p style={{ fontWeight: 800, fontSize: primary ? "20px" : "17px", marginBottom: "6px", color: primary ? "#0f0f0f" : "#fff" }}>{r.name}</p>
      <p style={{ fontSize: "14px", color: primary ? "#1a1a1a" : "#a0a0a0", marginBottom: "16px", lineHeight: 1.5, opacity: primary ? 0.85 : 1 }}>{r.tagline}</p>
      {r.phone && (
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "10px", color: primary ? "#0f0f0f" : "#4a4a4a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", opacity: primary ? 0.6 : 1 }}>Phone</p>
          <a href={"tel:" + r.phone} style={{ fontSize: "18px", fontWeight: 800, color: primary ? "#0f0f0f" : "#e8a0b4" }}>{r.phone}</a>
        </div>
      )}
      {r.hours && (
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "10px", color: primary ? "#0f0f0f" : "#4a4a4a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", opacity: primary ? 0.6 : 1 }}>Hours</p>
          <p style={{ fontSize: "14px", color: primary ? "#1a1a1a" : "#a0a0a0", opacity: primary ? 0.85 : 1 }}>{r.hours}</p>
        </div>
      )}
      {r.how_to_access && (
        <div style={{ backgroundColor: primary ? "rgba(15,15,15,0.1)" : "#242424", borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: primary ? "#0f0f0f" : "#4a4a4a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", opacity: primary ? 0.6 : 1 }}>How to access</p>
          <p style={{ fontSize: "13px", color: primary ? "#1a1a1a" : "#a0a0a0", lineHeight: 1.6, opacity: primary ? 0.9 : 1 }}>{r.how_to_access}</p>
        </div>
      )}
      <div style={{ display: "flex", gap: "14px", marginTop: "14px", flexWrap: "wrap" }}>
        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: primary ? "#0f0f0f" : "#e8a0b4", fontWeight: primary ? 700 : 400, textDecoration: "underline" }}>Visit website</a>}
        {primary && (
          <button onClick={saveResource} style={{ fontSize: "13px", color: "#0f0f0f", fontWeight: 700, backgroundColor: "transparent", border: "none", textDecoration: "underline", padding: 0 }}>
            Save resource
          </button>
        )}
      </div>
    </div>
  )
}

export default function ResultCard(props) {
  const tr = props.result.triage_result
  const [toast, setToast] = useState("")

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  function save() {
    try {
      const h = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")
      localStorage.setItem("cornellpulse_history", JSON.stringify([{ date: new Date().toISOString(), mood: props.moodScore || 5, distress_level: tr.distress_level, resource: tr.primary.name }, ...h].slice(0, 20)))
    } catch {}
  }

  return (
    <div>
      {tr.crisis_flag && (
        <div style={{ backgroundColor: "#1f0a0b", border: "1px solid #e63946", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 800, color: "#e63946", marginBottom: "8px" }}>Please reach out right now</p>
          <p style={{ fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "16px" }}>Based on what you shared, we want to make sure you get support immediately. You do not have to be alone with this.</p>
          <a href="tel:988" style={{ display: "block", backgroundColor: "#e63946", color: "#fff", padding: "16px", borderRadius: "6px", textAlign: "center", fontWeight: 800, fontSize: "15px", marginBottom: "8px", letterSpacing: "0.04em" }}>CALL 988 NOW</a>
          <a href="sms:741741" style={{ display: "block", border: "1px solid #e63946", color: "#e63946", padding: "14px", borderRadius: "6px", textAlign: "center", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Text HOME to 741741</a>
          <a href="tel:6072551111" style={{ display: "block", border: "1px solid #e63946", color: "#e63946", padding: "14px", borderRadius: "6px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>Call Cornell Police 607-255-1111</a>
        </div>
      )}

      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>Your results</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "10px" }}>Here is what we recommend</h2>

      {props.triggers && props.triggers.length > 0 && !tr.crisis_flag && (
        <p style={{ fontSize: "15px", color: "#fff", lineHeight: 1.6, marginBottom: "8px" }}>
          It sounds like <strong style={{ color: "#e8a0b4", fontWeight: 700 }}>{props.triggers.slice(0, 2).join(" and ").toLowerCase()}</strong> {props.triggers.length === 1 ? "is" : "are"} weighing on you right now. That is completely valid.
        </p>
      )}
      {tr.why && <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "24px", lineHeight: 1.65 }}>{tr.why}</p>}

      <ResourceItem resource={tr.primary} primary={true} onSaved={() => showToast("Copied to clipboard")} />

      {tr.show_peer_connect && (
        <div style={{ borderRadius: "10px", padding: "20px", marginBottom: "8px", backgroundColor: "#1a1a1a" }}>
          <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>Want to talk to another student?</p>
          <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "16px", lineHeight: 1.5 }}>Sometimes the best thing is sitting with someone who gets it.</p>
          <a href="mailto:cornellpulse@gmail.com?subject=Peer Connect Request" style={{ display: "block", border: "1px solid #2a2a2a", color: "#fff", padding: "14px", borderRadius: "6px", textAlign: "center", fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em" }}>CONNECT ME WITH SOMEONE</a>
          <p style={{ fontSize: "11px", color: "#4a4a4a", textAlign: "center", marginTop: "8px" }}>Completely optional.</p>
        </div>
        )
      }

      {tr.secondary.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Other options</p>
          {tr.secondary.map(function(r) { return <ResourceItem key={r.resource_id} resource={r} /> })}
        </div>
      )}

      <button onClick={function() { save(); props.onRestart() }} style={{ marginTop: "20px", width: "100%", padding: "18px", backgroundColor: "transparent", color: "#a0a0a0", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px", letterSpacing: "0.04em" }}>CHECK IN AGAIN</button>
      <p style={{ fontSize: "11px", color: "#4a4a4a", textAlign: "center", marginTop: "14px" }}>Your responses were not saved to our servers.</p>

      {toast && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#e8a0b4", color: "#0f0f0f", padding: "12px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, zIndex: 300, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  )
}

