import { Link, useParams } from "react-router-dom"
import { callHref, getAvailability, isResourceStale, textHref } from "../resources/directory.ts"
import { RESOURCE_BY_ID } from "../resources/registry.ts"
import { useOnlineStatus } from "../resources/useOnlineStatus.ts"
import { recordLocalMeasurement } from "../privacy/measurement.ts"
import { directionsHref } from "../checkin/resultPlan.ts"

const CORAL = "#FF5A5F"
const CORAL_TEXT = "#8A292D"
const CONTACT_EMAIL = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL?.trim() || ""

const LABELS: Record<string, string> = {
  required: "Appointment required",
  not_required: "No appointment required",
  varies: "Varies by service",
  phone: "Phone",
  text: "Text",
  online: "Online",
  in_person: "In person",
  campus: "Cornell campus",
  community: "Ithaca/community",
  national: "National",
}

function verifiedLabel(value: string | null): string {
  if (!value) return "Verification pending"
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
}

export default function ResourceDetailPage() {
  const { resourceId = "" } = useParams()
  const resource = RESOURCE_BY_ID.get(resourceId)
  const online = useOnlineStatus()

  if (!resource || resource.reviewStatus === "retired") {
    return (
      <div style={{ padding: "64px 20px 24px" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", color: "#222222", marginBottom: "8px" }}>Resource not found</h1>
          <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "18px" }}>This resource may have been removed or the link may be incorrect.</p>
          <Link to="/resources" style={{ color: CORAL_TEXT, fontSize: "14px", fontWeight: 700 }}>Browse source-checked resources</Link>
        </div>
      </div>
    )
  }

  const availability = getAvailability(resource)
  const availabilityText = availability === "open" ? "Open now" : availability === "closed" ? "Closed now" : "Check current schedule"
  const directions = directionsHref(resource)

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 28px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
        <Link to="/resources" style={{ display: "inline-block", color: "rgba(255,255,255,0.9)", fontSize: "13px", marginBottom: "14px" }}>← All resources</Link>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{resource.category}</p>
        <h1 style={{ fontSize: "27px", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, marginBottom: "8px" }}>{resource.officialName}</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.88)", lineHeight: 1.55 }}>{resource.description}</p>
      </div>

      <div style={{ padding: "18px 20px 0" }}>
        {!online && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "13px 15px", fontSize: "13px", lineHeight: 1.5, marginBottom: "12px" }}>You’re offline. Phone and SMS actions may still work, but web pages require a connection.</div>}
        {isResourceStale(resource) && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "13px 15px", fontSize: "13px", lineHeight: 1.5, marginBottom: "12px" }}>This listing has passed its required review deadline. Confirm details with the official source before relying on them.</div>}

        <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
          <p style={{ color: availability === "open" ? "#008577" : "#717171", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>{availabilityText} · {resource.hours} ({resource.timezone})</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "9px" }}><strong style={{ color: "#222222" }}>Cost:</strong> {resource.cost}</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "9px" }}><strong style={{ color: "#222222" }}>Eligibility:</strong> {resource.eligibility}</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "9px" }}><strong style={{ color: "#222222" }}>Appointment:</strong> {LABELS[resource.appointmentRequirement]}</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "9px" }}><strong style={{ color: "#222222" }}>How to access:</strong> {resource.modalities.map(value => LABELS[value]).join(", ")} · {LABELS[resource.scope]}</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6 }}><strong style={{ color: "#222222" }}>Location:</strong> {resource.location}</p>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", color: "#222222", marginBottom: "8px" }}>What happens next</h2>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.65, marginBottom: "10px" }}>{resource.whatHappensNext}</p>
          <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.65 }}>{resource.accessInstructions}</p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {callHref(resource) && <a href={callHref(resource)} onClick={() => recordLocalMeasurement("resource_action", "call")} style={{ padding: "11px 16px", backgroundColor: resource.category === "Crisis" ? CORAL : "#FFF0F0", color: resource.category === "Crisis" ? "#ffffff" : CORAL_TEXT, borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>Call {resource.phone}</a>}
          {textHref(resource) && <a href={textHref(resource)} onClick={() => recordLocalMeasurement("resource_action", "text")} style={{ padding: "11px 16px", backgroundColor: "#FFF0F0", color: CORAL_TEXT, borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>Text {resource.textAction?.number}</a>}
          {directions && <a href={directions} target="_blank" rel="noopener noreferrer" onClick={() => recordLocalMeasurement("resource_action", "directions")} style={{ padding: "11px 16px", border: "1.5px solid #ebebeb", color: "#686868", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>Directions</a>}
          {resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={() => recordLocalMeasurement("resource_action", "website")} style={{ padding: "11px 16px", border: "1.5px solid #ebebeb", color: "#717171", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>Visit service</a>}
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: "12px", color: "#717171", marginBottom: "4px" }}>Last verified {verifiedLabel(resource.verificationDate)} by {resource.verifier}.</p>
          <p style={{ fontSize: "12px", color: "#717171", marginBottom: "8px" }}>Next review due {verifiedLabel(resource.reviewDeadline)}. Owner: {resource.accountableOwner}. Second review: {resource.secondReviewStatus} ({resource.secondReviewer}).</p>
          <a href={resource.officialSourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => recordLocalMeasurement("resource_action", "website")} style={{ color: CORAL_TEXT, fontSize: "13px", fontWeight: 700, textDecoration: "underline" }}>Open official source</a>
          {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`CornellPulse resource correction: ${resource.id}`)}`} style={{ display: "inline-block", marginLeft: "14px", color: CORAL_TEXT, fontSize: "13px", fontWeight: 700, textDecoration: "underline" }}>Report a correction</a>}
        </div>

      </div>
    </div>
  )
}
