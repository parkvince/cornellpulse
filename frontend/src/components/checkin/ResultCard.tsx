import { useState } from "react"
import { Link } from "react-router-dom"
import type { QualifiedResourceOption, SafetyAssessment } from "../../checkin/localRecommendations"
import { bookingHref, directionsHref, prepareResultOptions, saveLocalPlan } from "../../checkin/resultPlan"
import { callHref, resourcePath, textHref } from "../../resources/directory.ts"
import { useOnlineStatus } from "../../resources/useOnlineStatus"
import { CrisisContactActions } from "../shared/EmergencyHelp"
import { loadLocalHistory } from "../../history/localHistory.ts"
import { recordLocalMeasurement, type ResourceAction } from "../../privacy/measurement.ts"

const CORAL = "#FF5A5F"
const CORAL_TEXT = "#8A292D"

function moodColor(mood: number) {
  if (mood >= 7) return "#007A70"
  if (mood >= 5) return "#A9461E"
  if (mood >= 3) return "#FF5A5F"
  return "#c0392b"
}

interface ResultCardProps {
  result: {
    safety: SafetyAssessment
    recommendation: {
      options: QualifiedResourceOption[]
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
  onlineOverride?: boolean
}

interface ResourceOptionProps {
  option: QualifiedResourceOption
  selected: boolean
  online: boolean
  onSelect: () => void
  onAction: (action: ResourceAction) => void
}

function ExternalAction(props: { href: string; label: string; online: boolean; onAction: () => void }) {
  const style = { fontSize: "12px", fontWeight: 700, padding: "9px 11px", borderRadius: "10px", textDecoration: "none", border: "1px solid #ebebeb" }
  if (!props.online) return <span aria-disabled="true" title="Requires an internet connection" style={{ ...style, color: "#717171", backgroundColor: "#f5f5f5" }}>{props.label}</span>
  return <a href={props.href} target="_blank" rel="noopener noreferrer" onClick={props.onAction} style={{ ...style, color: CORAL_TEXT, backgroundColor: "#ffffff" }}>{props.label}</a>
}

function ResourceOptionCard({ option, selected, online, onSelect, onAction }: ResourceOptionProps) {
  const resource = option.resource
  const call = callHref(resource)
  const text = textHref(resource)
  const book = bookingHref(resource)
  const directions = directionsHref(resource)

  return (
    <article style={{ borderRadius: "18px", padding: "18px", backgroundColor: "#ffffff", marginBottom: "12px", boxShadow: selected ? "0 6px 24px rgba(255,90,95,0.16)" : "0 2px 12px rgba(0,0,0,0.06)", border: selected ? `2px solid ${CORAL}` : "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "7px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#222222", lineHeight: 1.3 }}>{resource.officialName}</h3>
        {selected && <span style={{ backgroundColor: "#FFF0F0", color: CORAL_TEXT, borderRadius: "999px", padding: "4px 8px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>Your next step</span>}
      </div>
      <p style={{ fontSize: "13px", color: "#222222", lineHeight: 1.55, marginBottom: "9px" }}><strong>Why it may fit: </strong>{option.why}</p>
      <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "12px" }}>{resource.description}</p>

      <dl style={{ display: "grid", gridTemplateColumns: "minmax(72px, auto) 1fr", gap: "6px 10px", fontSize: "12px", lineHeight: 1.45, marginBottom: "13px" }}>
        <dt style={{ fontWeight: 700, color: "#222222" }}>Cost</dt><dd style={{ color: "#717171" }}>{resource.cost}</dd>
        <dt style={{ fontWeight: 700, color: "#222222" }}>Eligibility</dt><dd style={{ color: "#717171" }}>{resource.eligibility}</dd>
        <dt style={{ fontWeight: 700, color: "#222222" }}>Hours</dt><dd style={{ color: "#717171" }}>{resource.hours} ({resource.timezone})</dd>
        <dt style={{ fontWeight: 700, color: "#222222" }}>Last verified</dt><dd style={{ color: "#717171" }}>{resource.verificationDate} by {resource.verifier}</dd>
      </dl>

      <div aria-label={`Actions for ${resource.officialName}`} style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "13px" }}>
        {call && <a href={call} onClick={() => onAction("call")} style={{ fontSize: "12px", fontWeight: 700, padding: "9px 11px", borderRadius: "10px", backgroundColor: "#FFF0F0", color: CORAL_TEXT, textDecoration: "none" }}>Call</a>}
        {text && <a href={text} onClick={() => onAction("text")} style={{ fontSize: "12px", fontWeight: 700, padding: "9px 11px", borderRadius: "10px", backgroundColor: "#FFF0F0", color: CORAL_TEXT, textDecoration: "none" }}>Text</a>}
        {book && <ExternalAction href={book} label="Book / access" online={online} onAction={() => onAction("book")} />}
        {directions && <ExternalAction href={directions} label="Directions" online={online} onAction={() => onAction("directions")} />}
        <ExternalAction href={resource.officialSourceUrl} label="Official website" online={online} onAction={() => onAction("website")} />
        <Link to={resourcePath(resource)} onClick={() => onAction("details")} style={{ fontSize: "12px", fontWeight: 700, padding: "9px 11px", borderRadius: "10px", color: "#717171", textDecoration: "none", border: "1px solid #ebebeb" }}>Full details</Link>
      </div>

      <button type="button" aria-pressed={selected} onClick={onSelect} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: selected ? `2px solid ${CORAL}` : "2px solid #ebebeb", backgroundColor: selected ? "#FFF0F0" : "#ffffff", color: selected ? CORAL_TEXT : "#717171", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
        {selected ? "Chosen as my next step" : "Choose this as my next step"}
      </button>
    </article>
  )
}

export default function ResultCard(props: ResultCardProps) {
  const detectedOnline = useOnlineStatus()
  const online = props.onlineOverride ?? detectedOnline
  const safety = props.result.safety
  const options = prepareResultOptions(props.result.recommendation.options)
  const [selectedId, setSelectedId] = useState("")
  const [saveStatus, setSaveStatus] = useState("")
  const [feedback, setFeedback] = useState<"" | "helpful" | "not_helpful">("")
  const moodScore = props.moodScore
  const cleanTriggers = props.triggers.filter(trigger => trigger !== "nothing_specific").map(trigger => trigger.replace(/_/g, " "))

  function savePlan() {
    const selected = options.find(option => option.resource.id === selectedId)
    if (!selected) return
    try {
      const currentHistory = loadLocalHistory()
      const isRepeat = currentHistory.length > 0 && !currentHistory.some(entry => entry.id === props.checkinId)
      saveLocalPlan(props.checkinId, moodScore, selected.resource)
      if (isRepeat) recordLocalMeasurement("repeat_use")
      setSaveStatus("Plan saved on this device. It is available in your local check-in history.")
    } catch {
      setSaveStatus("This browser could not save the plan. Check storage permissions and try again.")
    }
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh", padding: "24px 20px 32px" }}>
      {safety.signal === "urgent" && (
        <div role="alert" style={{ backgroundColor: "#FFF0F0", border: "2px solid #FF5A5F", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "15px", fontWeight: 800, color: CORAL_TEXT, marginBottom: "8px" }}>Some words you entered may point to an immediate safety concern</p>
          <p style={{ fontSize: "14px", color: "#686868", lineHeight: 1.6 }}>This automated check can be wrong and is not a diagnosis or clinical assessment. Call 911 if you may act now or cannot stay safe. The options below are separate crisis pathways, not ordinary recommendations.</p>
        </div>
      )}

      {safety.signal === "check-in" && (
        <div role="status" style={{ backgroundColor: "#FFF0F0", border: "1.5px solid #FF5A5F", borderRadius: "16px", padding: "18px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: CORAL_TEXT, marginBottom: "6px" }}>Would immediate support be useful?</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6 }}>A low mood selection or ambiguous wording prompted this check-in. CornellPulse cannot determine whether you are in danger. The immediate-support options below are separate from ordinary resource suggestions.</p>
        </div>
      )}

      {!online && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "13px 15px", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>You’re offline. This plan and verified resource details remain available. Calling, texting, and saving may still work; booking, directions, and websites require a connection.</div>}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "16px", backgroundColor: moodColor(moodScore) + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "22px", fontWeight: 800, color: moodColor(moodScore) }}>{moodScore}</span>
        </div>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{safety.signal === "none" ? "Your results" : "Immediate support"}</p>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{safety.signal === "none" ? "Choose a next step that feels workable" : "Choose the support that fits right now"}</h2>
        </div>
      </div>

      {cleanTriggers.length > 0 && safety.signal === "none" && <p style={{ backgroundColor: "#FFF0F0", borderRadius: "12px", padding: "14px 16px", fontSize: "14px", color: "#222222", lineHeight: 1.6, marginBottom: "14px" }}>You selected <strong style={{ color: CORAL_TEXT }}>{cleanTriggers.slice(0, 2).join(" and ")}</strong>. Those choices help narrow these options but do not establish what support you need.</p>}
      <p style={{ fontSize: "14px", color: "#717171", marginBottom: "18px", lineHeight: 1.65 }}>{props.result.recommendation.why}</p>

      {options.length > 0 ? (
        <section aria-label="Qualified resource options">
          {options.map(option => <ResourceOptionCard key={option.resource.id} option={option} selected={selectedId === option.resource.id} online={online} onSelect={() => { setSelectedId(option.resource.id); setSaveStatus("") }} onAction={action => recordLocalMeasurement("resource_action", action)} />)}
        </section>
      ) : (
        <div role="alert" style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#222222", marginBottom: "7px" }}>No verified result options are available</h3>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "12px" }}>A resource record was missing or could not be verified. Browse the directory instead, or use the crisis contacts below if you need immediate support.</p>
          <Link to="/resources" style={{ display: "inline-block", color: CORAL_TEXT, fontSize: "13px", fontWeight: 800, marginBottom: "14px" }}>Browse verified resources</Link>
          <CrisisContactActions />
        </div>
      )}

      {selectedId && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px", margin: "16px 0 10px", border: "1px solid #f0f0f0" }}>
          <button type="button" onClick={savePlan} style={{ width: "100%", padding: "13px", backgroundColor: CORAL, color: "#ffffff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>Save this plan on this device</button>
          <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5, marginTop: "8px", textAlign: "center" }}>Saving stores the date, mood number, and chosen resource in local browser/app storage. It is not copied, shared, or sent.</p>
          {saveStatus && <p role="status" style={{ fontSize: "12px", color: saveStatus.startsWith("Plan saved") ? "#00796f" : "#b42318", lineHeight: 1.5, marginTop: "8px", textAlign: "center" }}>{saveStatus}</p>}
        </div>
      )}

      {!feedback ? (
        <div style={{ marginTop: "18px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "4px", textAlign: "center" }}>Were these options useful?</p>
          <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.45, marginBottom: "12px", textAlign: "center" }}>Your answer stays only in this open page’s memory. It is not saved or sent.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => setFeedback("helpful")} style={{ flex: 1, padding: "12px", backgroundColor: "#FFF0F0", color: CORAL_TEXT, border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Yes</button>
            <button type="button" onClick={() => setFeedback("not_helpful")} style={{ flex: 1, padding: "12px", backgroundColor: "#f5f5f5", color: "#686868", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Not really</button>
          </div>
        </div>
      ) : <p role="status" style={{ margin: "14px 0", backgroundColor: feedback === "helpful" ? "#FFF0F0" : "#f9f9f9", borderRadius: "14px", padding: "14px", fontSize: "13px", color: "#717171", textAlign: "center" }}>{feedback === "helpful" ? "Thanks. This feedback remains only on this page." : "Thanks. This feedback remains only on this page. You can also browse all verified resources."}</p>}

      <p role="status" style={{ fontSize: "12px", color: "#717171", textAlign: "center", margin: "12px 0 8px" }}>{props.aggregateNotice}</p>
      <button type="button" onClick={props.onDelete} style={{ width: "100%", padding: "12px", backgroundColor: "transparent", color: CORAL_TEXT, border: "2px solid #ebebeb", borderRadius: "14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "8px" }}>Delete this check-in</button>
      <button type="button" onClick={props.onRestart} style={{ marginTop: "4px", width: "100%", padding: "16px", backgroundColor: "#f5f5f5", color: "#686868", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Check in again</button>
      <Link to="/" style={{ display: "block", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#717171", marginTop: "12px", padding: "8px", textDecoration: "none" }}>← Back to home</Link>
      <p style={{ fontSize: "11px", color: "#717171", textAlign: "center", marginTop: "6px" }}>Options were generated on this device. If you enabled the optional contribution, only a completion event was sent—not your answers or college.</p>
    </div>
  )
}
