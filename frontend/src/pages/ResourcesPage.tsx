import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getPrivacyPreferences } from "../privacy/preferences"
import { callHref, filterResources, getAvailability, isResourceStale, resourcePath, textHref, type ResourceFilters } from "../resources/directory.ts"
import { ACTIVE_RESOURCES, RESOURCE_CATEGORIES, getResource } from "../resources/registry.ts"
import { useOnlineStatus } from "../resources/useOnlineStatus.ts"
import { recordLocalMeasurement, type ResourceAction } from "../privacy/measurement.ts"
import { requestJson } from "../api/client"

const CORAL = "#C83C42"
const CATS = ["All", ...RESOURCE_CATEGORIES] as const
const crisisResource = getResource("988_lifeline")

const FILTER_GROUPS = [
  { key: "cost", label: "Cost", options: [["free", "Free"], ["paid", "Paid"], ["varies", "Varies"]] },
  { key: "urgency", label: "Urgency", options: [["emergency", "Emergency"], ["urgent", "Urgent support"], ["routine", "Routine"]] },
  { key: "eligibility", label: "Eligibility", options: [["anyone", "Anyone"], ["cornell_student", "Cornell students"], ["cornell_community", "Cornell community"]] },
  { key: "modality", label: "How to access", options: [["phone", "Phone"], ["text", "Text"], ["online", "Online"], ["in_person", "In person"]] },
  { key: "scope", label: "Where", options: [["campus", "Campus"], ["community", "Community"], ["national", "National"]] },
  { key: "appointment", label: "Appointment", options: [["required", "Required"], ["not_required", "Not required"], ["varies", "Varies"]] },
] as const

async function track(resourceId: string, action: string) {
  if (["call", "text", "book", "directions", "website", "details"].includes(action)) recordLocalMeasurement("resource_action", action as ResourceAction)
  if (!getPrivacyPreferences().resourceAnalytics) return
  if (action !== "call" && action !== "website") return
  await requestJson<{ status: "recorded" }>("/track-click", {
    method: "POST",
    body: { resource_id: resourceId, action, consent_granted: true },
    idempotencyKey: crypto.randomUUID(),
    validate: (value): value is { status: "recorded" } => !!value && typeof value === "object" && (value as { status?: unknown }).status === "recorded",
  })
}

function verifiedLabel(value: string | null): string {
  if (!value) return "Verification pending"
  return `Last verified ${new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}`
}

export default function ResourcesPage() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<ResourceFilters>({})
  const [loading, setLoading] = useState(true)
  const [analyticsNotice, setAnalyticsNotice] = useState("")
  const online = useOnlineStatus()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLoading(false))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const now = new Date()
  const filtered = filterResources(ACTIVE_RESOURCES, search, filters, now)
  const staleCount = ACTIVE_RESOURCES.filter(resource => isResourceStale(resource, now)).length
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const category = filters.category || "All"

  function updateFilter(key: keyof ResourceFilters, value: string) {
    setFilters(current => ({ ...current, [key]: value || undefined }))
  }

  function clearFilters() {
    setSearch("")
    setFilters({})
  }

  function trackAction(resourceId: string, action: string) {
    void track(resourceId, action).catch(() => setAnalyticsNotice("The resource action still opened, but optional analytics could not be recorded."))
  }

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ background: "linear-gradient(135deg, #C83C42 0%, #A9461E 100%)", padding: "52px 20px 24px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "280px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Resources</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "4px" }}>Resources for different needs.</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "16px" }}>Review {ACTIVE_RESOURCES.length} source-checked resources and choose based on cost, access, and what happens next. Independent second review is pending.</p>
        <div style={{ position: "relative" }}>
          <svg aria-hidden="true" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input aria-label="Search resources" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by need, service, or location..." style={{ width: "100%", padding: "12px 14px 12px 40px", border: "none", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        {!online && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "12px 14px", fontSize: "13px", lineHeight: 1.5, marginBottom: "12px" }}>You’re offline. The verified directory is still available, and phone or SMS actions may work, but official web pages need a connection.</div>}
        {analyticsNotice && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "12px 14px", fontSize: "13px", lineHeight: 1.5, marginBottom: "12px" }}>{analyticsNotice}</div>}
        {staleCount > 0 && <div role="status" style={{ backgroundColor: "#fff4d6", color: "#765500", borderRadius: "14px", padding: "12px 14px", fontSize: "13px", lineHeight: 1.5, marginBottom: "12px" }}>{staleCount} {staleCount === 1 ? "listing has" : "listings have"} passed the required review deadline. Confirm details on the official source.</div>}

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }} aria-label="Resource categories">
          {CATS.map(value => <button key={value} onClick={() => updateFilter("category", value === "All" ? "" : value)} aria-pressed={category === value} style={{ padding: "7px 14px", border: "none", borderRadius: "20px", backgroundColor: category === value ? CORAL : "#ffffff", color: category === value ? "#ffffff" : "#717171", fontSize: "13px", fontWeight: category === value ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: category === value ? "none" : "0 1px 4px rgba(0,0,0,0.08)" }}>{value}</button>)}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button onClick={() => setFilters(current => ({ ...current, openNow: !current.openNow || undefined }))} aria-pressed={!!filters.openNow} style={{ padding: "8px 13px", border: `1.5px solid ${filters.openNow ? CORAL : "#ebebeb"}`, borderRadius: "20px", backgroundColor: filters.openNow ? "#FFF0F0" : "#ffffff", color: filters.openNow ? CORAL : "#717171", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Open now</button>
          <details style={{ flex: 1 }}>
            <summary style={{ listStyle: "none", padding: "8px 13px", border: "1.5px solid #ebebeb", borderRadius: "20px", backgroundColor: "#ffffff", color: "#717171", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}>More filters{activeFilterCount > (filters.openNow ? 1 : 0) + (filters.category ? 1 : 0) ? ` · ${activeFilterCount}` : ""}</summary>
            <div style={{ marginTop: "8px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {FILTER_GROUPS.map(group => (
                <label key={group.key} style={{ fontSize: "11px", color: "#717171", fontWeight: 600 }}>
                  {group.label}
                  <select value={String(filters[group.key] || "")} onChange={event => updateFilter(group.key, event.target.value)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "8px", border: "1px solid #ebebeb", borderRadius: "8px", color: "#222222", backgroundColor: "#ffffff", fontSize: "12px" }}>
                    <option value="">Any</option>
                    {group.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </details>
          {(activeFilterCount > 0 || search) && <button onClick={clearFilters} style={{ border: "none", background: "transparent", color: CORAL, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Clear</button>}
        </div>

        {category === "All" && !search && !filters.openNow && (
          <div style={{ backgroundColor: CORAL, borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div><p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>Need crisis support?</p><p style={{ fontSize: "12px", color: "#ffffff" }}>Call or text 988 · 24/7</p></div>
            <div style={{ display: "flex", gap: "6px" }}>
              <a href={callHref(crisisResource)} onClick={() => trackAction(crisisResource.id, "call")} style={{ backgroundColor: "#ffffff", color: CORAL, padding: "8px 11px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>Call</a>
              <a href={textHref(crisisResource)} onClick={() => trackAction(crisisResource.id, "text")} style={{ backgroundColor: "#ffffff", color: CORAL, padding: "8px 11px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>Text</a>
            </div>
          </div>
        )}

        {loading && <div role="status" style={{ fontSize: "14px", color: "#717171", textAlign: "center", padding: "36px 0" }}>Loading source-checked resources…</div>}
        {!loading && ACTIVE_RESOURCES.length === 0 && <div role="status" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", textAlign: "center", color: "#717171" }}>No verified resources are available. Use the emergency actions above if you need immediate help.</div>}
        {!loading && ACTIVE_RESOURCES.length > 0 && filtered.length === 0 && <div role="status" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", textAlign: "center", marginTop: "8px" }}><p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>No resources match those choices</p><p style={{ fontSize: "13px", color: "#717171", marginBottom: "14px" }}>Try removing a filter or searching for a broader need.</p><button onClick={clearFilters} style={{ border: "none", backgroundColor: "#FFF0F0", color: CORAL, padding: "9px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Clear filters</button></div>}

        {!loading && filtered.map(resource => {
          const availability = getAvailability(resource, now)
          return (
            <article key={resource.id} style={{ borderRadius: "16px", padding: "18px", backgroundColor: "#ffffff", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: resource.category === "Crisis" ? `1.5px solid ${CORAL}` : "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{resource.officialName}</p>
                <span style={{ fontSize: "10px", fontWeight: 600, color: availability === "open" ? "#00685F" : "#595959", backgroundColor: availability === "open" ? "#e8f7f4" : "#f5f5f5", padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap" }}>{availability === "open" ? "OPEN NOW" : availability === "closed" ? "CLOSED" : "CHECK HOURS"}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "9px" }}>{resource.description}</p>
              <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "4px" }}><strong style={{ color: "#222222" }}>Cost:</strong> {resource.cost}</p>
              <p style={{ fontSize: "12px", color: "#717171", lineHeight: 1.5, marginBottom: "9px" }}><strong style={{ color: "#222222" }}>Access:</strong> {resource.modalities.map(value => value.replace("_", " ")).join(", ")}</p>
              <p style={{ fontSize: "11px", color: isResourceStale(resource, now) ? "#b07000" : "#008577", marginBottom: "12px" }}>{verifiedLabel(resource.verificationDate)}</p>
              <Link to={resourcePath(resource)} onClick={() => trackAction(resource.id, "details")} style={{ display: "block", padding: "10px 14px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "10px", fontSize: "13px", fontWeight: 700, textAlign: "center" }}>View details and actions</Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
