import { useState } from "react"
import { getPrivacyPreferences } from "../privacy/preferences"
import { ACTIVE_RESOURCES, RESOURCE_CATEGORIES, getResource, type ResourceRecord } from "../resources/registry.ts"

const CORAL = "#FF5A5F"
const CATS = ["All", ...RESOURCE_CATEGORIES] as const
const QUICK_FILTERS = ["24/7", "text", "lgbtq", "local"]
const crisisResource = getResource("988_lifeline")

function track(resourceId: string, action: string) {
  if (!getPrivacyPreferences().resourceAnalytics) return
  fetch((import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1") + "/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource_id: resourceId, action, consent_granted: true }),
  }).catch(() => {})
}

function callHref(resource: ResourceRecord) {
  return `tel:${resource.phone?.replace(/-/g, "")}`
}

function textHref(resource: ResourceRecord) {
  if (!resource.textAction) return undefined
  return `sms:${resource.textAction.number}?body=${encodeURIComponent(resource.textAction.prefilledText)}`
}

function verificationLabel(resource: ResourceRecord) {
  if (!resource.verificationDate) return "Verification pending"
  return `Last verified ${new Date(`${resource.verificationDate}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
}

export default function ResourcesPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All")
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState("")

  const filtered = ACTIVE_RESOURCES.filter(resource =>
    (cat === "All" || resource.category === cat) &&
    (quickFilter === "" || resource.tags.includes(quickFilter)) &&
    (search === "" || [resource.officialName, resource.description, resource.eligibility, resource.location, ...resource.tags].some(value => value.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 24px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "280px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Resources</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "4px" }}>Resources for different needs.</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "16px" }}>Review {ACTIVE_RESOURCES.length} verified resources, including eligibility and access details, before relying on a listing.</p>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input aria-label="Search resources" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search..." style={{ width: "100%", padding: "12px 14px 12px 40px", border: "none", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
          {CATS.map(category => <button key={category} onClick={() => setCat(category)} style={{ padding: "7px 14px", border: "none", borderRadius: "20px", backgroundColor: cat === category ? CORAL : "#ffffff", color: cat === category ? "#ffffff" : "#717171", fontSize: "13px", fontWeight: cat === category ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: cat === category ? "none" : "0 1px 4px rgba(0,0,0,0.08)" }}>{category}</button>)}
        </div>

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}>
          {QUICK_FILTERS.map(filter => <button key={filter} onClick={() => setQuickFilter(filter === quickFilter ? "" : filter)} style={{ padding: "5px 12px", border: `1.5px solid ${quickFilter === filter ? CORAL : "#ebebeb"}`, borderRadius: "20px", backgroundColor: quickFilter === filter ? "#FFF0F0" : "#ffffff", color: quickFilter === filter ? CORAL : "#717171", fontSize: "12px", fontWeight: quickFilter === filter ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, textTransform: "capitalize" }}>{filter === "24/7" ? "Available now" : filter}</button>)}
        </div>

        {cat === "All" && !search && (
          <div style={{ backgroundColor: CORAL, borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>Need crisis support?</p><p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Call or text 988 · 24/7</p></div>
            <a href={callHref(crisisResource)} onClick={() => track(crisisResource.id, "call")} style={{ backgroundColor: "#ffffff", color: CORAL, padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>Call 988</a>
          </div>
        )}

        {filtered.length === 0 && <p style={{ fontSize: "15px", color: "#b0b0b0", textAlign: "center", padding: "40px 0" }}>No results.</p>}

        {filtered.map(resource => (
          <article key={resource.id} style={{ borderRadius: "16px", padding: "18px", backgroundColor: "#ffffff", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: resource.category === "Crisis" ? `1.5px solid ${CORAL}` : "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{resource.officialName}</p>
              <span style={{ fontSize: "10px", fontWeight: 600, color: resource.category === "Crisis" ? CORAL : "#717171", backgroundColor: resource.category === "Crisis" ? "#FFF0F0" : "#f5f5f5", padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>{resource.category.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "10px" }}>{resource.description}</p>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "4px" }}><strong style={{ color: "#222222" }}>Eligibility:</strong> {resource.eligibility}</p>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "4px" }}><strong style={{ color: "#222222" }}>Cost:</strong> {resource.cost}</p>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "4px" }}><strong style={{ color: "#222222" }}>Location:</strong> {resource.location}</p>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "8px" }}><strong style={{ color: "#222222" }}>Hours:</strong> {resource.hours} ({resource.timezone})</p>
            <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "10px" }}>{resource.accessInstructions}</p>
            <p style={{ fontSize: "11px", color: resource.reviewStatus === "verified" ? "#00A699" : "#b07000", marginBottom: "12px" }}>{verificationLabel(resource)} · {resource.verifier}</p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {resource.phone && <a href={callHref(resource)} onClick={() => track(resource.id, "call")} style={{ padding: "10px 16px", backgroundColor: resource.category === "Crisis" ? CORAL : "#FFF0F0", color: resource.category === "Crisis" ? "#ffffff" : CORAL, borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>Call {resource.phone}</a>}
              {resource.textAction && <a href={textHref(resource)} onClick={() => track(resource.id, "text")} style={{ padding: "10px 16px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>Text {resource.textAction.number} · {resource.textAction.prefilledText}</a>}
              {resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={() => track(resource.id, "website")} style={{ padding: "10px 16px", border: "1.5px solid #ebebeb", color: "#717171", borderRadius: "10px", fontSize: "13px" }}>Visit</a>}
              <a href={resource.officialSourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 0", color: "#717171", fontSize: "12px", textDecoration: "underline" }}>Official source</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
