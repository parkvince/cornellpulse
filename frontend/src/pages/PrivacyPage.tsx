import { useState } from "react"
import { Link } from "react-router-dom"
import { clearCornellPulseDeviceData, getPrivacyPreferences, savePrivacyPreferences, type PrivacyPreferences } from "../privacy/preferences"

const CORAL = "#FF5A5F"
const CORAL_TEXT = "#8A292D"
const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "").trim()

const sections = [
  { title: "What stays on this device", body: "Structured unfinished choices are kept temporarily in this tab so Back and refresh work; optional free text is excluded from that draft and cleared after the local result is created. A result is not added to history automatically. If you explicitly save a next step, up to 20 plan summaries, mood numbers, local reminders, and follow-up answers can be kept. The default retention is 90 days and can be changed in History & Privacy. Results feedback stays only in the open page and is not saved or sent." },
  { title: "What a check-in sends", body: "Recommendations are generated on this device. Stress triggers, talk preference, and optional free text are not sent to the check-in API. Free text is not placed in local storage, session storage, history, analytics events, or an application database." },
  { title: "Optional aggregate contribution", body: "Off by default. If you opt in, a future check-in sends only the fixed event checkin_completed, an affirmative consent flag, and a random one-time ID in a request header. Mood, sleep, workload, college, free text, triggers, talk preference, and recommendations are not transmitted. The server adds one to a campus-wide UTC-day completion count kept for 30 days and retains a keyed hash of the one-time ID for two days. Turning this off stops future contributions. An earlier count cannot be linked back to you or removed individually, but it is deleted with its daily total after 30 days." },
  { title: "Optional resource analytics", body: "If you opt in, clicking a resource phone or website action sends the resource identifier and action type to the backend. These events have no CornellPulse account identifier and are deleted after 30 days by the automated retention sweep. Ordinary network and hosting logs may still contain technical metadata such as IP address, timestamp, path, and user agent; production operators must delete technical logs after 14 days." },
  { title: "Optional product measurement", body: "Off by default. If enabled, CornellPulse keeps only local counters for completed check-ins, resource-action types, successful contact, and repeat use. These counters do not contain resource IDs, raw answers, free text, names, emails, or phone numbers, and the current code does not upload them." },
  { title: "Peer Connect non-production sandbox", body: "Peer Connect currently runs only as an open non-production sandbox. Anyone can register, and Cornell identity verification is not implemented; every supporter profile is labeled as not verified. Supporter signup stores encrypted private email and phone information, a password hash, public profile fields, policy acceptance, and a server-generated supporter ID. Requester signup stores encrypted display name, email, optional phone, a password hash, and a server-generated requester ID. Approved sandbox supporter profiles become publicly visible without identity, reference, training, or administrator review. Connection requests store participant IDs, separate consent, an approved public-location ID, a safe meeting window, and an optional encrypted message. The relay opens after both people consent and rejects recognizable direct-contact details. This sandbox must not be enabled in production." },
  { title: "Retention and deletion limits", body: "The backend runs an hourly retention sweep. Daily completion counts are kept 30 days, contribution receipts two days, resource-click analytics 30 days, inactive legacy push-subscription rows 90 days, cached academic-calendar rows 365 days, and expired rate-limit buckets only through their active window. Administrator sessions and peer access tokens expire after 15 minutes by default. Peer requester, connection, relay, and notification records default to 90 days; supporter, block, report, moderation-note, audit, and status-history records default to 365 days. Peer field-level erasure runs when encryption is configured. Active connections must first end and active safety reports must reach a terminal outcome before manual deletion. Production technical logs must be limited to 14 days by hosting configuration. Application deletion does not erase provider logs, mailboxes, backups, legal-hold records, or external-service records, which require separate operator/provider controls." },
  { title: "Third parties and processors", body: "The deployment uses a hosting environment and PostgreSQL-compatible database. The operator must publish the selected hosting, database, monitoring, email, DNS/CDN, and backup providers before production. If peer email notifications are configured through Resend, templates send only a fixed message and server-generated record ID, not contact details, request messages, or report reasons. Provider acceptance does not confirm delivery or human review. The current application has no active Redis integration and no third-party browser analytics SDK. Following phone, SMS, map, or official-site links sends data directly to those outside services under their own practices." },
  { title: "Backups, logs, and restored data", body: "Application and infrastructure logs may contain IP address, time, method, path, status, user agent, and provider metadata; application error monitoring excludes request bodies and known sensitive fields. Production operators must configure and verify 14-day technical-log deletion. Backups require separate encryption, access, retention, restore, and deletion-tombstone procedures. Clearing the app or database does not immediately remove immutable/offline backup copies, and restored data must have deletion tombstones re-applied before service resumes. Those production controls have not been proven by local tests." },
]

export default function PrivacyPage() {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(() => getPrivacyPreferences())
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [cleared, setCleared] = useState(false)

  function updatePreference(field: keyof PrivacyPreferences, value: boolean) {
    const next = { ...preferences, [field]: value }
    setPreferences(next)
    savePrivacyPreferences(next)
    setSaved(true)
  }

  function clearDeviceData() {
    clearCornellPulseDeviceData()
    setPreferences({ aggregateContribution: false, resourceAnalytics: false, productMeasurement: false })
    setConfirmClear(false)
    setCleared(true)
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Privacy & Data</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: "8px" }}>Your choices and data</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>A factual summary of what CornellPulse stores, transmits, and cannot delete automatically. Policy version 2026-08-09.1; privacy/legal approval is pending.</p>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <section aria-labelledby="privacy-choices" style={{ marginBottom: "24px" }}>
          <p id="privacy-choices" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Optional contributions</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <label style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.aggregateContribution} onChange={event => updatePreference("aggregateContribution", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Contribute a campus completion count</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, finishing a check-in sends only a completion event, an affirmative consent flag, and a random one-time anti-duplicate ID. Mood, sleep, workload, college, triggers, recommendations, and written context are not sent. The daily count expires after 30 days and the anti-duplicate receipt after two days; a past contribution cannot be retrieved or deleted individually.</span></span>
            </label>
            <label style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.resourceAnalytics} onChange={event => updatePreference("resourceAnalytics", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Share resource-click analytics</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, phone-call and official-website actions send only the resource ID and action type. Rows expire after 30 days; technical network/hosting logs may separately retain IP, time, path, status, and user-agent metadata for up to 14 days.</span></span>
            </label>
            <label style={{ padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.productMeasurement} onChange={event => updatePreference("productMeasurement", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Keep privacy-minimized measurement on this device</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, local counters measure check-in completion, action types, successful contact, and repeat use. They are not uploaded.</span></span>
            </label>
          </div>
          {saved && <p role="status" style={{ fontSize: "12px", color: "#007A70", marginTop: "8px" }}>Preference saved on this device. Turning a choice off stops future optional collection.</p>}
        </section>

        <section aria-label="Data practices" style={{ marginBottom: "24px" }}>
          {sections.map(section => <div key={section.title} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "10px" }}><h2 style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>{section.title}</h2><p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6 }}>{section.body}</p></div>)}
        </section>

        <section aria-labelledby="privacy-controls" style={{ marginBottom: "24px" }}>
          <p id="privacy-controls" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Withdrawal and deletion</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>Clear local history, onboarding status, privacy preferences, the temporary structured check-in draft, and legacy draft keys from this device. The temporary draft does not contain optional written context. This does not delete server, email, backup, or provider records.</p>
            {confirmClear ? <div style={{ display: "flex", gap: "8px" }}><button onClick={clearDeviceData} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>Clear device data</button><button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600 }}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)} style={{ width: "100%", padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: CORAL_TEXT, fontSize: "13px", fontWeight: 700 }}>Clear data on this device</button>}
            {cleared && <p role="status" style={{ fontSize: "12px", color: "#007A70", marginTop: "8px" }}>CornellPulse device data cleared.</p>}
          </div>
        </section>

        <section aria-labelledby="privacy-contact" style={{ marginBottom: "24px" }}>
          <p id="privacy-contact" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Contact and server-data requests</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>For access, correction, withdrawal, or deletion requests involving supporter, requester, reference, connection, relay, or report records, use authenticated withdrawal controls where available or contact the deployment operator. The operator must verify that a request belongs to you. A completion contribution cannot be retrieved or deleted individually because the server stores no link to a person; turning consent off stops future contributions and the daily count expires after 30 days. Email, backups, provider logs, and external services require separate operator or provider action.</p>
            {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}?subject=CornellPulse privacy request`} style={{ display: "block", padding: "12px", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", textAlign: "center", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>Email {CONTACT_EMAIL}</a> : <p role="alert" style={{ fontSize: "13px", color: CORAL_TEXT, lineHeight: 1.5 }}>The operator contact is not configured. Identifiable-data features must remain disabled until a monitored contact address is provided.</p>}
          </div>
        </section>

        <Link to="/profile" style={{ display: "block", textAlign: "center", color: "#717171", fontSize: "13px", fontWeight: 600, padding: "8px", marginBottom: "16px", textDecoration: "none" }}>Back to History &amp; Privacy</Link>
      </div>
    </div>
  )
}
