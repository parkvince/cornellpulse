import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { featureFlags } from "../../config/featureFlags"
import type { Resource, SafetyAssessment } from "../../checkin/localRecommendations"
import { EmergencyActions } from "../shared/EmergencyHelp"

const CORAL = "#FF5A5F"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

function moodColor(m: number) {
  if (m >= 7) return "#00A699"
  if (m >= 5) return "#FC642D"
  if (m >= 3) return "#FF5A5F"
  return "#c0392b"
}

interface PeerSupporter {
  name: string
  year: string
  major?: string
  about?: string
  interests?: string[]
}

function PeerConnectSuggestion() {
  const navigate = useNavigate()
  const [supporter, setSupporter] = useState<PeerSupporter | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/peer-supporters`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const random = data[Math.floor(Math.random() * data.length)]
          setSupporter(random)
        }
      })
      .catch(() => {})
  }, [])

  const AVATAR_COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#7B68EE", "#20B2AA"]
  const color = supporter ? AVATAR_COLORS[supporter.name.charCodeAt(0) % AVATAR_COLORS.length] : CORAL

  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "10px", backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
      <div style={{ padding: "18px 18px 14px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "4px" }}>Want to talk to another student?</p>
        <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Sometimes the best thing is sitting with someone who gets it.</p>
      </div>

      {supporter && (
        <div style={{ margin: "0 18px 14px", backgroundColor: "#fff8f7", borderRadius: "12px", padding: "14px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Suggested for you</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color }}>{supporter.name.charAt(0)}</span>
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222" }}>{supporter.name}</p>
              <p style={{ fontSize: "12px", color: "#717171" }}>{supporter.year}{supporter.major ? ` · ${supporter.major}` : ""}</p>
            </div>
          </div>
          {supporter.about && <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, marginBottom: "10px" }}>{supporter.about}</p>}
          {supporter.interests && supporter.interests.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {supporter.interests.slice(0, 3).map((i: string) => (
                <span key={i} style={{ padding: "3px 8px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>{i}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", padding: "0 18px 18px" }}>
        <button onClick={() => navigate("/peer")} style={{ flex: 2, padding: "13px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          {supporter ? `Meet ${supporter.name.split(" ")[0]}` : "Find a supporter"}
        </button>
        <button onClick={() => navigate("/peer")} style={{ flex: 1, padding: "13px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          See all
        </button>
      </div>
    </div>
  )
}

interface ResourceItemProps {
  resource: Resource
  primary?: boolean
  onSaved?: () => void
}

function ResourceItem(props: ResourceItemProps) {
  const r = props.resource
  const primary = props.primary

  function saveResource() {
    const text = [r.name, r.tagline, r.phone ? "Phone: " + r.phone : null, r.hours ? "Hours: " + r.hours : null, r.how_to_access, r.url].filter(Boolean).join("\n")
    if (navigator.share) {
      navigator.share({ title: r.name, text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => { if (props.onSaved) props.onSaved() }).catch(() => {})
    }
  }

  if (primary) {
    return (
      <div style={{ borderRadius: "20px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 8px 32px rgba(255,90,95,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "24px 20px 20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>One option to explore</p>
          <p style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "6px" }}>{r.name}</p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: "16px" }}>{r.tagline}</p>
          {r.phone && (
            <a href={"tel:" + r.phone} style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#ffffff", color: CORAL, padding: "10px 18px", borderRadius: "12px", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              {r.phone}
            </a>
          )}
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "16px 20px" }}>
          {r.hours && <p style={{ fontSize: "13px", color: "#717171", marginBottom: "8px" }}><span style={{ fontWeight: 600, color: "#222222" }}>Hours: </span>{r.hours}</p>}
          {r.how_to_access && <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "10px" }}>{r.how_to_access}</p>}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: CORAL, fontWeight: 600, textDecoration: "underline" }}>Visit website</a>}
            <button onClick={saveResource} style={{ fontSize: "13px", color: "#717171", backgroundColor: "transparent", border: "none", textDecoration: "underline", padding: 0, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: "16px", padding: "18px", backgroundColor: "#ffffff", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "4px" }}>{r.name}</p>
      <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5, marginBottom: "10px" }}>{r.tagline}</p>
      {r.phone && <a href={"tel:" + r.phone} style={{ fontSize: "14px", fontWeight: 700, color: CORAL, display: "block", marginBottom: "6px" }}>{r.phone}</a>}
      {r.hours && <p style={{ fontSize: "12px", color: "#b0b0b0", marginBottom: "8px" }}>{r.hours}</p>}
      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: CORAL, fontWeight: 600, textDecoration: "underline" }}>Visit website</a>}
    </div>
  )
}

interface ResultCardProps {
  result: {
    safety: SafetyAssessment
    recommendation: {
      primary: Resource
      secondary: Resource[]
      why: string
      show_peer_connect: boolean
    }
  }
  moodScore: number
  triggers: string[]
  wantsToTalk: boolean | null
  checkinId: string
  aggregateNotice: string
  onRestart: () => void
  onDelete: () => void
}

export default function ResultCard(props: ResultCardProps) {
  const tr = props.result.recommendation
  const safety = props.result.safety
  const [toast, setToast] = useState("")
  const [feedback, setFeedback] = useState("")
  const moodScore = props.moodScore || 5

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("cornellpulse_history") || "[]")
      if (h.some((entry: { id?: string }) => entry.id === props.checkinId)) return
      const entry = { id: props.checkinId, date: new Date().toISOString(), mood: moodScore, resource: tr.primary.name }
      localStorage.setItem("cornellpulse_history", JSON.stringify([entry, ...h].slice(0, 20)))
    } catch {
      return
    }
  }, [moodScore, props.checkinId, tr.primary.name])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const cleanTriggers = (props.triggers || []).filter((t: string) => t !== "nothing_specific").map((t: string) => t.replace(/_/g, " "))

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh", padding: "24px 20px 32px" }}>
      {safety.signal === "urgent" && (
        <div style={{ backgroundColor: "#FFF0F0", border: "2px solid #FF5A5F", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 800, color: CORAL, marginBottom: "8px" }}>Some words you entered may point to an immediate safety concern</p>
          <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "16px" }}>This automated check can be wrong and is not a diagnosis or clinical assessment. If you may act now or cannot stay safe, call 911. Otherwise, 988 can provide crisis support.</p>
          <EmergencyActions />
        </div>
      )}

      {safety.signal === "check-in" && (
        <div style={{ backgroundColor: "#FFF0F0", border: "1.5px solid #FF5A5F", borderRadius: "16px", padding: "18px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: CORAL, marginBottom: "6px" }}>Would immediate support be useful?</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "12px" }}>A low mood selection or ambiguous wording prompted this check-in. The system cannot determine whether you are in danger. Call or text 988 for crisis support, or call 911 if there is an immediate safety threat.</p>
          <div style={{ display: "flex", gap: "8px" }}><a href="tel:988" style={{ flex: 1, backgroundColor: CORAL, color: "#ffffff", padding: "10px", borderRadius: "10px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Call 988</a><a href="sms:988?body=Hello%2C%20I%20need%20support." style={{ flex: 1, backgroundColor: "#ffffff", color: CORAL, padding: "10px", borderRadius: "10px", textAlign: "center", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Text 988</a></div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "16px", backgroundColor: moodColor(moodScore) + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "22px", fontWeight: 800, color: moodColor(moodScore) }}>{moodScore}</span>
        </div>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Your results</p>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", letterSpacing: "-0.01em" }}>Resources you may want to explore</h2>
        </div>
      </div>

      {cleanTriggers.length > 0 && (
        <div style={{ backgroundColor: "#FFF0F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "#222222", lineHeight: 1.6 }}>
            You selected <strong style={{ color: CORAL }}>{cleanTriggers.slice(0, 2).join(" and ")}</strong>. These choices help narrow the resource list, but they are not a clinical assessment.
          </p>
        </div>
      )}

      {tr.why && <p style={{ fontSize: "14px", color: "#717171", marginBottom: "20px", lineHeight: 1.65 }}>{tr.why}</p>}

      <ResourceItem resource={tr.primary} primary={true} onSaved={() => showToast("Copied to clipboard")} />

      {featureFlags.peerConnect && (tr.show_peer_connect || props.wantsToTalk) && (
        <PeerConnectSuggestion />
      )}

      {tr.secondary.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Other resources to explore</p>
          {tr.secondary.map(r => <ResourceItem key={r.resource_id} resource={r} />)}
        </div>
      )}

      {!feedback && (
        <div style={{ marginTop: "20px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "12px", textAlign: "center" }}>Were these resource options useful?</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setFeedback("helpful")} style={{ flex: 1, padding: "12px", backgroundColor: "#FFF0F0", color: CORAL, border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
              Yes
            </button>
            <button onClick={() => setFeedback("not_helpful")} style={{ flex: 1, padding: "12px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
              Not really
            </button>
          </div>
        </div>
      )}

      {feedback === "helpful" && (
        <div style={{ marginTop: "10px", backgroundColor: "#FFF0F0", borderRadius: "16px", padding: "16px", textAlign: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: CORAL }}>Glad it helped</p>
          <p style={{ fontSize: "12px", color: "#717171", marginTop: "4px" }}>Thank you for the feedback.</p>
        </div>
      )}

      {feedback === "not_helpful" && (
        <div style={{ marginTop: "10px", backgroundColor: "#f9f9f9", borderRadius: "16px", padding: "16px", marginBottom: "10px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>Sorry about that. Try one of these instead:</p>
          <Link to="/resources" style={{ display: "block", padding: "12px", border: "2px solid #ebebeb", borderRadius: "12px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: CORAL, marginBottom: "8px" }}>Browse all resources</Link>
          {featureFlags.peerConnect && <Link to="/peer" style={{ display: "block", padding: "12px", border: "2px solid #ebebeb", borderRadius: "12px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: "#717171" }}>Talk to a peer supporter</Link>}
        </div>
      )}

      <p role="status" style={{ fontSize: "12px", color: "#717171", textAlign: "center", margin: "12px 0 8px" }}>{props.aggregateNotice}</p>
      <button onClick={props.onDelete} style={{ width: "100%", padding: "12px", backgroundColor: "transparent", color: CORAL, border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "8px" }}>
        Delete this check-in
      </button>
      <button onClick={props.onRestart} style={{ marginTop: "4px", width: "100%", padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
        Check in again
      </button>
      <Link to="/" style={{ display: "block", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#717171", marginTop: "12px", padding: "8px", textDecoration: "none" }}>← Back to home</Link>
      <p style={{ fontSize: "11px", color: "#b0b0b0", textAlign: "center", marginTop: "6px" }}>Your recommendation was generated on this device. Only an optional four-field aggregate is sent when you have enabled that choice.</p>

      {toast && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", backgroundColor: CORAL, color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, zIndex: 300, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  )
}
