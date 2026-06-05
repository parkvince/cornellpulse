interface ResourceResult {
  resource_id: string
  name: string
  tagline: string
  phone: string | null
  url: string | null
  hours: string | null
  how_to_access: string | null
}

interface TriageResult {
  primary: ResourceResult
  secondary: ResourceResult[]
  crisis_flag: boolean
  distress_level: string
}

interface CheckInResponse {
  triage_result: TriageResult
  aggregate_updated: boolean
}

interface Props {
  result: CheckInResponse
  onRestart: () => void
}

interface ItemProps {
  resource: ResourceResult
  primary?: boolean
}

function ResourceItem(props: ItemProps) {
  const resource = props.resource
  const primary = props.primary
  return (
    <div style={{ border: primary ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "8px", padding: "20px", backgroundColor: primary ? "#fff" : "#fafafa", marginBottom: "12px" }}>
      {primary && <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "8px" }}>Recommended for you</div>}
      <div style={{ fontWeight: 600, fontSize: "17px", marginBottom: "6px" }}>{resource.name}</div>
      <div style={{ fontSize: "14px", color: "#555", marginBottom: "12px" }}>{resource.tagline}</div>
      {resource.phone && <div style={{ fontSize: "14px", marginBottom: "4px" }}><span style={{ color: "#888" }}>Phone: </span>{resource.phone}</div>}
      {resource.hours && <div style={{ fontSize: "14px", marginBottom: "4px" }}><span style={{ color: "#888" }}>Hours: </span>{resource.hours}</div>}
      {resource.how_to_access && <div style={{ fontSize: "14px", marginBottom: "4px" }}><span style={{ color: "#888" }}>Access: </span>{resource.how_to_access}</div>}
      {resource.url && <div style={{ marginTop: "8px" }}><a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "#1a1a1a", textDecoration: "underline" }}>Visit website</a></div>}
    </div>
  )
}

export default function ResultCard(props: Props) {
  const tr = props.result.triage_result
  return (
    <div>
      {tr.crisis_flag && (
        <div style={{ backgroundColor: "#fff3f3", border: "1px solid #fcc", borderRadius: "8px", padding: "16px", marginBottom: "24px", fontSize: "14px", color: "#900" }}>
          If you are in crisis right now, please call or text 988, or call Cornell Police at 607-255-1111.
        </div>
      )}
      <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "6px" }}>Here is what we recommend</h2>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "28px" }}>Based on what you shared, these resources are the best fit for you right now.</p>
      <ResourceItem resource={tr.primary} primary={true} />
      {tr.secondary.length > 0 && (
        <div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px", marginTop: "8px" }}>Other options that may help</div>
          {tr.secondary.map(function(r) { return <ResourceItem key={r.resource_id} resource={r} /> })}
        </div>
      )}
      <button onClick={props.onRestart} style={{ marginTop: "16px", width: "100%", padding: "14px", backgroundColor: "#fff", color: "#1a1a1a", border: "1px solid #e5e5e5", borderRadius: "8px", fontSize: "15px" }}>Start over</button>
      <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", marginTop: "16px" }}>Your responses were not saved. Nothing about you was recorded.</p>
    </div>
  )
}
