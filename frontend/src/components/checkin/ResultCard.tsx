function getMoodColor(mood) {
  if (mood >= 7) return "#1db954"
  if (mood >= 5) return "#f59b00"
  if (mood >= 3) return "#e85d04"
  return "#e63946"
}

function ResourceItem(props) {
  const resource = props.resource
  const primary = props.primary
  return (
    <div style={{ borderRadius: "8px", padding: "20px", backgroundColor: primary ? "#1a1a1a" : "#181818", marginBottom: "8px", borderLeft: primary ? "3px solid #1db954" : "none" }}>
      {primary && <div style={{ fontSize: "10px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Best match</div>}
      <div style={{ fontWeight: 700, fontSize: "17px", marginBottom: "6px", color: "#ffffff" }}>{resource.name}</div>
      <div style={{ fontSize: "14px", color: "#b3b3b3", marginBottom: "16px", lineHeight: 1.5 }}>{resource.tagline}</div>
      {resource.phone && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", color: "#535353", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Phone</div>
          <a href={"tel:" + resource.phone} style={{ fontSize: "16px", fontWeight: 700, color: "#1db954", textDecoration: "none" }}>{resource.phone}</a>
        </div>
      )}
      {resource.hours && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", color: "#535353", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Hours</div>
          <div style={{ fontSize: "14px", color: "#b3b3b3" }}>{resource.hours}</div>
        </div>
      )}
      {resource.how_to_access && (
        <div style={{ marginBottom: "8px", backgroundColor: "#282828", borderRadius: "4px", padding: "12px" }}>
          <div style={{ fontSize: "10px", color: "#535353", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>How to access</div>
          <div style={{ fontSize: "13px", color: "#b3b3b3", lineHeight: 1.5 }}>{resource.how_to_access}</div>
        </div>
      )}
      {resource.url && (
        <div style={{ marginTop: "12px" }}>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#1db954", textDecoration: "underline" }}>Visit website</a>
        </div>
      )}
    </div>
  )
}

export default function ResultCard(props) {
  const tr = props.result.triage_result

  function saveToHistory() {
    try {
      const existing = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")
      const entry = { date: new Date().toISOString(), mood: props.moodScore || 5, distress_level: tr.distress_level, resource: tr.primary.name }
      const updated = [entry, ...existing].slice(0, 20)
      localStorage.setItem("cornellpulse_history", JSON.stringify(updated))
    } catch (e) {}
  }

  function handleRestart() {
    saveToHistory()
    props.onRestart()
  }

  return (
    <div style={{ padding: "48px 24px 24px" }}>
      {tr.crisis_flag && (
        <div style={{ backgroundColor: "#2d0a0a", border: "1px solid #e63946", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#e63946", marginBottom: "8px", letterSpacing: "0.02em" }}>Please reach out right now</div>
          <div style={{ fontSize: "14px", color: "#b3b3b3", lineHeight: 1.6, marginBottom: "16px" }}>Based on what you shared, we want to make sure you get support immediately.</div>
          <a href="tel:988" style={{ display: "block", backgroundColor: "#e63946", color: "#ffffff", padding: "14px", borderRadius: "4px", textAlign: "center", fontWeight: 700, fontSize: "15px", marginBottom: "8px", textDecoration: "none", letterSpacing: "0.04em" }}>CALL 988 NOW</a>
          <a href="sms:741741" style={{ display: "block", border: "1px solid #e63946", color: "#e63946", padding: "14px", borderRadius: "4px", textAlign: "center", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>Text HOME to 741741</a>
        </div>
      )}

      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Your results</p>
      <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.02em" }}>Here is what we recommend</h2>

      {tr.why && (
        <div style={{ fontSize: "14px", color: "#b3b3b3", marginBottom: "24px", lineHeight: 1.6, borderLeft: "3px solid #282828", paddingLeft: "14px" }}>
          {tr.why}
        </div>
      )}

      <ResourceItem resource={tr.primary} primary={true} />

      {tr.show_peer_connect && (
        <div style={{ borderRadius: "8px", padding: "20px", marginBottom: "8px", backgroundColor: "#181818" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>Want to talk to another student?</div>
          <div style={{ fontSize: "14px", color: "#b3b3b3", marginBottom: "16px", lineHeight: 1.5 }}>Sometimes the best thing is sitting with someone who gets it.</div>
          <a href="mailto:cornellpulse@gmail.com?subject=Peer Connect Request" style={{ display: "block", border: "1px solid #282828", color: "#ffffff", padding: "12px", borderRadius: "4px", textAlign: "center", fontWeight: 600, fontSize: "14px", textDecoration: "none", letterSpacing: "0.04em" }}>CONNECT ME WITH SOMEONE</a>
          <div style={{ fontSize: "11px", color: "#535353", textAlign: "center", marginTop: "8px" }}>Completely optional.</div>
        </div>
      )}

      {tr.secondary.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", color: "#535353", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", marginTop: "16px" }}>Other options</div>
          {tr.secondary.map(function(r) { return <ResourceItem key={r.resource_id} resource={r} /> })}
        </div>
      )}

      <button onClick={handleRestart} style={{ marginTop: "20px", width: "100%", padding: "16px", backgroundColor: "transparent", color: "#b3b3b3", border: "1px solid #282828", borderRadius: "4px", fontSize: "14px", cursor: "pointer", letterSpacing: "0.04em" }}>
        CHECK IN AGAIN
      </button>
      <p style={{ fontSize: "11px", color: "#535353", textAlign: "center", marginTop: "16px" }}>
        Your responses were not saved to our servers.
      </p>
    </div>
  )
}
