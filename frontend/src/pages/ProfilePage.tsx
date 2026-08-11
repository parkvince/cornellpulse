import { useState } from "react"
import { Link } from "react-router-dom"
import {
  clearLocalHistory,
  deletePlanEntry,
  exportLocalHistory,
  getHistoryRetention,
  loadLocalHistory,
  MAX_HISTORY_ENTRIES,
  reminderIsDue,
  setHistoryRetention,
  updatePlanEntry,
  type FitOutcome,
  type LocalPlanEntry,
  type RetentionDays,
} from "../history/localHistory.ts"
import { recordLocalMeasurement } from "../privacy/measurement.ts"
import { ACTIVE_RESOURCES, getResource } from "../resources/registry.ts"

const CORAL = "#D70466"
const emergency = getResource("emergency_911")
const publicSafety = getResource("cornell_public_safety")

function moodColor(mood: number) {
  if (mood >= 7) return "#007A70"
  if (mood >= 5) return "#A9461E"
  if (mood >= 3) return "#D70466"
  return "#c0392b"
}

function localDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function localDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function toDateTimeInput(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const secondaryButton = { padding: "9px 11px", border: "1.5px solid #ebebeb", borderRadius: "10px", backgroundColor: "#ffffff", color: "#717171", fontSize: "12px", fontWeight: 700, cursor: "pointer" } as const

export default function ProfilePage() {
  const [history, setHistory] = useState<LocalPlanEntry[]>(loadLocalHistory)
  const [retention, setRetention] = useState<RetentionDays>(getHistoryRetention)
  const [status, setStatus] = useState("")
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingDelete, setPendingDelete] = useState("")
  const [replacing, setReplacing] = useState("")
  const [replacementId, setReplacementId] = useState("")
  const trend = history.slice(0, 7).reverse()

  function update(id: string, changes: Parameters<typeof updatePlanEntry>[1], message: string) {
    setHistory(updatePlanEntry(id, changes))
    setStatus(message)
  }

  function setContacted(entry: LocalPlanEntry, contacted: boolean) {
    if (contacted && entry.contacted !== "contacted") recordLocalMeasurement("successful_contact")
    update(entry.id, { contacted: contacted ? "contacted" : "not_contacted" }, "Follow-up saved only on this device.")
  }

  function replacePlan(entry: LocalPlanEntry) {
    const replacement = ACTIVE_RESOURCES.find(resource => resource.id === replacementId)
    if (!replacement) return
    update(entry.id, { resourceId: replacement.id, resource: replacement.officialName, status: "saved", reminderAt: undefined, contacted: undefined, fit: undefined }, "Next step replaced on this device.")
    setReplacing("")
    setReplacementId("")
  }

  function deleteEntry(id: string) {
    setHistory(deletePlanEntry(id))
    setPendingDelete("")
    setStatus("Plan deleted from this device.")
  }

  function clearHistory() {
    clearLocalHistory()
    setHistory([])
    setConfirmClear(false)
    setStatus("Local history cleared.")
  }

  function changeRetention(value: string) {
    const next: RetentionDays = value === "forever" ? null : Number(value) as 30 | 90 | 365
    setRetention(next)
    setHistory(setHistoryRetention(next))
    setStatus("Retention setting saved. Entries outside the selected period were removed.")
  }

  function downloadExport() {
    const blob = new Blob([exportLocalHistory(history)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `cornellpulse-local-history-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus("Local history export created. It was not uploaded.")
  }

  function resetOnboarding() {
    localStorage.removeItem("cornellpulse_onboarded")
    window.location.href = "/onboarding"
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FF385C 52%, #E31C5F 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", minHeight: "250px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Your device</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "8px" }}>History &amp; Privacy</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>Review saved plans and mood trends locally. Raw check-in answers are not added to this history or uploaded for these features.</p>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {status && <p role="status" style={{ backgroundColor: "#e9f8f5", color: "#00796f", borderRadius: "12px", padding: "11px 13px", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>{status}</p>}

        <section aria-labelledby="mood-trend-heading" style={{ marginBottom: "24px" }}>
          <p id="mood-trend-heading" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Local mood trend</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            {trend.length > 0 ? <>
              <div role="img" aria-label={`Recent local mood scores, oldest to newest: ${trend.map(entry => entry.mood).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", height: "112px", gap: "8px", borderBottom: "1px solid #ebebeb", padding: "0 4px" }}>
                {trend.map(entry => <div key={entry.id} title={`${entry.mood} out of 10 on ${localDate(entry.date)}`} style={{ flex: 1, height: `${Math.max(12, entry.mood * 10)}%`, backgroundColor: moodColor(entry.mood), borderRadius: "7px 7px 0 0", minWidth: "12px" }} />)}
              </div>
              <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5, marginTop: "10px" }}>Up to seven saved mood numbers, shown oldest to newest. This chart is generated on this device and is not a clinical assessment.</p>
            </> : <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Save a next-step plan after a check-in to start a private local trend.</p>}
          </div>
        </section>

        <section aria-labelledby="saved-plans-heading" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p id="saved-plans-heading" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em" }}>Saved next steps</p>
            <span style={{ fontSize: "11px", color: "#717171" }}>{history.length}/{MAX_HISTORY_ENTRIES}</span>
          </div>

          {history.length === 0 ? <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>No saved plans</p>
            <p style={{ fontSize: "13px", color: "#717171", marginBottom: "18px" }}>A plan appears only after you choose and save a next step.</p>
            <Link to="/checkin" style={{ display: "inline-block", backgroundColor: CORAL, color: "#ffffff", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Start a check-in</Link>
          </div> : history.map(entry => <article key={entry.id} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "10px", border: reminderIsDue(entry) ? `1.5px solid ${CORAL}` : "1px solid transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
              <div><p style={{ fontSize: "15px", fontWeight: 800, color: "#222222", lineHeight: 1.35 }}>{entry.resource}</p><p style={{ fontSize: "11px", color: "#717171", marginTop: "3px" }}>{localDate(entry.date)} · mood {entry.mood}/10</p></div>
              <span style={{ backgroundColor: entry.status === "saved" ? "#FFF0F0" : "#f5f5f5", color: entry.status === "saved" ? CORAL : "#717171", borderRadius: "999px", padding: "4px 8px", height: "fit-content", fontSize: "10px", fontWeight: 800, textTransform: "capitalize" }}>{entry.status}</span>
            </div>

            {entry.reminderAt && <p role={reminderIsDue(entry) ? "status" : undefined} style={{ fontSize: "12px", color: reminderIsDue(entry) ? CORAL : "#717171", marginBottom: "10px" }}>{reminderIsDue(entry) ? "Reminder due: " : "Local reminder: "}{localDateTime(entry.reminderAt)}</p>}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "12px" }}>
              <button type="button" onClick={() => update(entry.id, { status: "completed", reminderAt: undefined }, "Next step marked complete.")} style={secondaryButton}>Complete</button>
              <button type="button" onClick={() => update(entry.id, { status: "dismissed", reminderAt: undefined }, "Next step dismissed.")} style={secondaryButton}>Dismiss</button>
              <button type="button" aria-expanded={replacing === entry.id} onClick={() => { setReplacing(replacing === entry.id ? "" : entry.id); setReplacementId("") }} style={secondaryButton}>Replace</button>
              <button type="button" onClick={() => setPendingDelete(entry.id)} style={{ ...secondaryButton, color: CORAL }}>Delete</button>
            </div>

            {replacing === entry.id && <div style={{ backgroundColor: "#fff8f7", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
              <label htmlFor={`replace-${entry.id}`} style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Choose a replacement</label>
              <select id={`replace-${entry.id}`} value={replacementId} onChange={event => setReplacementId(event.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #ebebeb", borderRadius: "10px", backgroundColor: "#ffffff", marginBottom: "8px" }}><option value="">Select a verified resource</option>{ACTIVE_RESOURCES.filter(resource => resource.id !== entry.resourceId).map(resource => <option key={resource.id} value={resource.id}>{resource.officialName}</option>)}</select>
              <button type="button" disabled={!replacementId} onClick={() => replacePlan(entry)} style={{ width: "100%", padding: "10px", border: "none", borderRadius: "10px", backgroundColor: replacementId ? CORAL : "#d8d8d8", color: "#ffffff", fontSize: "12px", fontWeight: 700 }}>Save replacement</button>
            </div>}

            {pendingDelete === entry.id && <div role="alert" style={{ backgroundColor: "#FFF0F0", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}><p style={{ fontSize: "12px", color: "#222222", marginBottom: "8px" }}>Delete this saved plan from this device?</p><div style={{ display: "flex", gap: "7px" }}><button type="button" onClick={() => deleteEntry(entry.id)} style={{ ...secondaryButton, flex: 1, backgroundColor: CORAL, color: "#ffffff", border: "none" }}>Delete plan</button><button type="button" onClick={() => setPendingDelete("")} style={{ ...secondaryButton, flex: 1 }}>Cancel</button></div></div>}

            <label htmlFor={`reminder-${entry.id}`} style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#222222", marginBottom: "5px" }}>Optional local reminder</label>
            <div style={{ display: "flex", gap: "7px", marginBottom: "13px" }}><input id={`reminder-${entry.id}`} type="datetime-local" value={toDateTimeInput(entry.reminderAt)} onChange={event => update(entry.id, { reminderAt: event.target.value ? new Date(event.target.value).toISOString() : undefined, status: "saved" }, event.target.value ? "Local reminder saved. CornellPulse does not send notifications." : "Reminder removed.")} style={{ flex: 1, minWidth: 0, padding: "9px", border: "1px solid #ebebeb", borderRadius: "10px", fontSize: "12px" }} />{entry.reminderAt && <button type="button" onClick={() => update(entry.id, { reminderAt: undefined }, "Reminder removed.")} style={secondaryButton}>Remove</button>}</div>
            <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.45, marginTop: "-7px", marginBottom: "13px" }}>Shown only when you open CornellPulse on this device; no push notification is scheduled.</p>

            <fieldset style={{ border: "none", padding: 0, margin: "0 0 12px" }}><legend style={{ fontSize: "12px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Did you contact this resource?</legend><div style={{ display: "flex", gap: "7px" }}><button type="button" aria-pressed={entry.contacted === "contacted"} onClick={() => setContacted(entry, true)} style={secondaryButton}>Yes</button><button type="button" aria-pressed={entry.contacted === "not_contacted"} onClick={() => setContacted(entry, false)} style={secondaryButton}>Not yet</button></div></fieldset>
            {entry.contacted === "contacted" && <fieldset style={{ border: "none", padding: 0, margin: 0 }}><legend style={{ fontSize: "12px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Did it feel like a fit?</legend><div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>{([['fit', 'Yes'], ['unsure', 'Not sure'], ['not_fit', 'No']] as [FitOutcome, string][]).map(([value, label]) => <button key={value} type="button" aria-pressed={entry.fit === value} onClick={() => update(entry.id, { fit: value }, "Follow-up saved only on this device.")} style={secondaryButton}>{label}</button>)}</div></fieldset>}
          </article>)}
        </section>

        <section aria-labelledby="history-controls-heading" style={{ marginBottom: "24px" }}>
          <p id="history-controls-heading" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Retention &amp; controls</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <label htmlFor="history-retention" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Keep local history for</label>
            <select id="history-retention" value={retention === null ? "forever" : retention} onChange={event => changeRetention(event.target.value)} style={{ width: "100%", padding: "11px", border: "1px solid #ebebeb", borderRadius: "10px", backgroundColor: "#ffffff", marginBottom: "8px" }}><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option><option value="forever">Until I delete it</option></select>
            <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5, marginBottom: "13px" }}>Default: 90 days. At most {MAX_HISTORY_ENTRIES} plans are kept. Changing to a shorter period deletes older entries immediately.</p>
            <button type="button" onClick={downloadExport} disabled={history.length === 0} style={{ width: "100%", padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: history.length ? CORAL : "#717171", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Export local history as JSON</button>
            {confirmClear ? <div style={{ display: "flex", gap: "8px" }}><button type="button" onClick={clearHistory} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>Clear all history</button><button type="button" onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600 }}>Cancel</button></div> : <button type="button" onClick={() => setConfirmClear(true)} disabled={history.length === 0} style={{ width: "100%", padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: history.length ? CORAL : "#717171", fontSize: "13px", fontWeight: 700 }}>Clear local history</button>}
          </div>
        </section>

        <section aria-labelledby="privacy-heading" style={{ marginBottom: "24px" }}>
          <p id="privacy-heading" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Privacy</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}><p style={{ fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Device-only follow-up</p><p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Plans, reminders, mood numbers, and follow-up answers stay in this browser or app storage. Local reminders appear only when CornellPulse is opened.</p></div>
            <Link to="/privacy" style={{ width: "100%", padding: "16px 20px", backgroundColor: "transparent", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}><p style={{ fontSize: "14px", fontWeight: 600, color: "#222222" }}>Privacy &amp; Data controls</p><span aria-hidden="true">›</span></Link>
            <button type="button" onClick={resetOnboarding} style={{ width: "100%", padding: "16px 20px", textAlign: "left", backgroundColor: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}><p style={{ fontSize: "14px", fontWeight: 600, color: "#222222" }}>View intro again</p><span aria-hidden="true">›</span></button>
          </div>
        </section>

        <div style={{ marginBottom: "24px", backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}><div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}><img src="/logo.png" alt="" width={20} height={20} /><p style={{ fontSize: "14px", fontWeight: 700, color: "#222222" }}>CornellPulse</p></div><p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "10px" }}>No account is created. CornellPulse is not a diagnosis or clinically validated assessment.</p><p style={{ fontSize: "12px", color: "#717171" }}>For an immediate emergency call {emergency.phone}. On the Ithaca campus, call {publicSafety.officialName} at {publicSafety.phone}.</p></div>
      </div>
    </div>
  )
}
