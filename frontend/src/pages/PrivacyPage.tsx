import { useState } from "react"
import { Link } from "react-router-dom"
import { clearCornellPulseDeviceData, getPrivacyPreferences, savePrivacyPreferences, type PrivacyPreferences } from "../privacy/preferences"

const CORAL = "#C83C42"
const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "").trim()

const sections = [
  { title: "What stays on this device", body: "Structured unfinished choices are kept temporarily in this tab so Back and refresh work; optional free text is excluded from that draft and cleared after the local result is created. A result is not added to history automatically. If you explicitly save a next step, up to 20 plan summaries, mood numbers, local reminders, and follow-up answers can be kept. The default retention is 90 days and can be changed in History & Privacy. Results feedback stays only in the open page and is not saved or sent." },
  { title: "What a check-in sends", body: "Recommendations are generated on this device. Stress triggers, talk preference, and optional free text are not sent to the check-in API. Free text is not placed in local storage, session storage, history, analytics events, or an application database." },
  { title: "Optional aggregate contribution", body: "Off by default. If you opt in, a future check-in sends mood score, sleep category, workload category, and college category to hourly combined totals, plus a random one-time ID in a request header to prevent duplicate counting. The server retains only a keyed hash of that ID for two days. It does not send free text, triggers, talk preference, a recommendation, a distress category, or a persistent device/session identifier. Existing combined totals cannot be separated back into an individual contribution, so withdrawing stops future contributions but cannot remove earlier totals." },
  { title: "Optional resource analytics", body: "If you opt in, clicking a resource phone or website action sends the resource identifier and action type to the backend. These events are stored without an account identifier, but ordinary network and hosting logs may still contain technical metadata such as IP address, timestamp, path, and user agent." },
  { title: "Optional product measurement", body: "Off by default. If enabled, CornellPulse keeps only local counters for completed check-ins, resource-action types, successful contact, and repeat use. These counters do not contain resource IDs, raw answers, free text, names, emails, or phone numbers, and the current code does not upload them." },
  { title: "Peer and supporter information", body: "Peer Connect and supporter signup remain disabled during safety review. If later enabled, public supporter profiles use an immutable ID and limited profile fields; they do not include private phone numbers, email addresses, identity evidence, references, training records, credentials, review decisions, or request content. A connection uses separate requester and supporter opt-in. It stores an encrypted approved public-location ID, safe meeting window, and optional contact-free note, but does not copy either person's contact information. An encrypted in-app relay opens only after both consent and rejects recognizable direct-contact details. Safety report reasons, moderation notes, and resolution summaries are encrypted; the report queue omits the reason, and moderators cannot read relay messages or bulk-export peer records. A reference invitation uses only an encrypted delivery email and does not collect a phone number. Audit records use IDs and allowlisted operational metadata rather than contact details or user-written content." },
  { title: "Retention and deletion limits", body: "Administrator sessions and peer access tokens expire after 15 minutes by default. The peer backend assigns default retention windows of 90 days to requester, connection, relay, and notification records and 365 days to supporter, block, report, moderation-note, audit, and status-history records. Active connections must first end, and active safety reports must first reach a terminal outcome, before administrator deletion can redact their private content. Actual erasure depends on the operator scheduling the protected retention purge. Application deletion does not automatically erase provider logs, mailboxes, or backup copies, which follow separate operator and provider schedules." },
  { title: "Third parties", body: "The deployment uses a hosting environment and PostgreSQL-compatible database. If peer email notifications are configured through Resend, the redesigned templates send only a fixed message and server-generated record ID, not contact details, request messages, or report reasons. CornellPulse records whether a request was skipped, failed, or accepted by the provider; provider acceptance does not confirm delivery or human review. The current application has no active Redis integration. Following phone numbers or external links sends data directly to those outside services under their own practices. CornellPulse does not currently include a third-party browser analytics SDK." },
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
      <div style={{ background: "linear-gradient(135deg, #C83C42 0%, #A9461E 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Privacy & Data</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: "8px" }}>Your choices and data</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>A factual summary of what CornellPulse stores, transmits, and cannot delete automatically.</p>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <section aria-labelledby="privacy-choices" style={{ marginBottom: "24px" }}>
          <p id="privacy-choices" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Optional contributions</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <label style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.aggregateContribution} onChange={event => updatePreference("aggregateContribution", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Contribute to campus aggregates</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, future check-ins send only mood, sleep, workload, and college categories to hourly combined totals.</span></span>
            </label>
            <label style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.resourceAnalytics} onChange={event => updatePreference("resourceAnalytics", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Share resource-click analytics</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, future phone and website clicks send the resource and action type.</span></span>
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
            {confirmClear ? <div style={{ display: "flex", gap: "8px" }}><button onClick={clearDeviceData} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>Clear device data</button><button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600 }}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)} style={{ width: "100%", padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: CORAL, fontSize: "13px", fontWeight: 700 }}>Clear data on this device</button>}
            {cleared && <p role="status" style={{ fontSize: "12px", color: "#007A70", marginTop: "8px" }}>CornellPulse device data cleared.</p>}
          </div>
        </section>

        <section aria-labelledby="privacy-contact" style={{ marginBottom: "24px" }}>
          <p id="privacy-contact" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Contact and server-data requests</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>For access, correction, withdrawal, or deletion requests involving supporter, requester, reference, connection, relay, or report records, use the authenticated withdrawal controls where available or contact the deployment operator. The operator must verify that a request belongs to you before acting. Aggregate contributions and records already copied into email, backups, or provider logs may not be individually retrievable or fully deletable.</p>
            {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}?subject=CornellPulse privacy request`} style={{ display: "block", padding: "12px", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", textAlign: "center", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>Email {CONTACT_EMAIL}</a> : <p role="alert" style={{ fontSize: "13px", color: CORAL, lineHeight: 1.5 }}>The operator contact is not configured. Identifiable-data features must remain disabled until a monitored contact address is provided.</p>}
          </div>
        </section>

        <Link to="/profile" style={{ display: "block", textAlign: "center", color: "#717171", fontSize: "13px", fontWeight: 600, padding: "8px", marginBottom: "16px", textDecoration: "none" }}>Back to History &amp; Privacy</Link>
      </div>
    </div>
  )
}
