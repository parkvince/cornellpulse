function getMoodColor(mood) {
  if (mood >= 7) return "#2e7d32"
  if (mood >= 5) return "#f57f17"
  if (mood >= 3) return "#bf360c"
  return "#b71c1c"
}

function ResourceItem(props) {
  const resource = props.resource
  const primary = props.primary
  return (
    <div style={{ border: primary ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "12px", padding: "20px", backgroundColor: primary ? "#fff" : "#fafafa", marginBottom: "12px" }}>
      {primary && <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Best match for you</div>}
      <div style={{ fontWeight: 700, fontSize: "17px", marginBottom: "6px", color: "#1a1a1a" }}>{resource.name}</div>
      <div style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.5 }}>{resource.tagline}</div>
      {resource.phone && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Phone</div>
          <a href={"tel:" + resource.phone} style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", textDecoration: "none" }}>{resource.phone}</a>
        </div>
      )}
      {resource.hours && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Hours</div>
          <div style={{ fontSize: "14px", color: "#444" }}>{resource.hours}</div>
        </div>
      )}
      {resource.how_to_access && (
        <div style={{ marginBottom: "8px", backgroundColor: "#f9f9f9", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>How to access</div>
          <div style={{ fontSize: "14px", color: "#333", lineHeight: 1.5 }}>{resource.how_to_access}</div>
        </div>
      )}
      {resource.url && (
        <div style={{ marginTop: "12px" }}>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "#1a1a1a", textDecoration: "underline" }}>Visit website</a>
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
      const entry = {
        date: new Date().toISOString(),
        mood: props.moodScore || 5,
        distress_level: tr.distress_level,
        resource: tr.primary.name,
      }
      const updated = [entry, ...existing].slice(0, 20)
      localStorage.setItem("cornellpulse_history", JSON.stringify(updated))
    } catch (e) {}
  }

  function handleRestart() {
    saveToHistory()
    props.onRestart()
  }

  return (
    <div style={{ padding: "24px 20px" }}>
      {tr.crisis_flag && (
        <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#c00", marginBottom: "8px" }}>Please reach out right now</div>
          <div style={{ fontSize: "14px", color: "#900", lineHeight: 1.6, marginBottom: "16px" }}>Based on what you shared, we want to make sure you get support immediately. You do not have to feel this way alone.</div>
          <a href="tel:988" style={{ display: "block", backgroundColor: "#c00", color: "#fff", padding: "14px", borderRadius: "8px", textAlign: "center", fontWeight: 700, fontSize: "16px", marginBottom: "8px", textDecoration: "none" }}>Call 988 now</a>
          <a href="sms:741741" style={{ display: "block", border: "1px solid #c00", color: "#c00", padding: "14px", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "15px", textDecoration: "none" }}>Text HOME to 741741</a>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "2px" }}>Here is what we recommend</h2>
          <p style={{ fontSize: "13px", color: "#888" }}>Based on what you shared</p>
        </div>
      </div>

      {tr.why && (
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "20px", lineHeight: 1.6, backgroundColor: "#f9f9f9", padding: "14px", borderRadius: "10px", borderLeft: "3px solid #1a1a1a" }}>
          {tr.why}
        </div>
      )}

      <ResourceItem resource={tr.primary} primary={true} />

      {tr.show_peer_connect && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px", marginBottom: "12px", backgroundColor: "#fff" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>Want to talk to another student?</div>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px", lineHeight: 1.5 }}>Sometimes the best thing is sitting with someone who gets it. We can connect you with a Cornell student who wants to grab food or coffee and listen.</div>
          <a href="mailto:cornellpulse@gmail.com?subject=Peer Connect Request" style={{ display: "block", border: "1px solid #1a1a1a", color: "#1a1a1a", padding: "12px", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>Connect me with someone</a>
          <div style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "8px" }}>Completely optional. No pressure at all.</div>
        </div>
      )}

      {tr.secondary.length > 0 && (
        <div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px", marginTop: "8px" }}>Other options that may help</div>
          {tr.secondary.map(function(r) { return <ResourceItem key={r.resource_id} resource={r} /> })}
        </div>
      )}

      <button onClick={handleRestart} style={{ marginTop: "16px", width: "100%", padding: "14px", backgroundColor: "#fff", color: "#1a1a1a", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", cursor: "pointer" }}>
        Check in again
      </button>
      <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "16px" }}>
        Your responses were not saved to our servers. Nothing about you was recorded.
      </p>
    </div>
  )
}
