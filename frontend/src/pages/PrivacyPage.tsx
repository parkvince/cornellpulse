import { useState } from "react"
import { Link } from "react-router-dom"
import { clearCornellPulseDeviceData, getPrivacyPreferences, savePrivacyPreferences, type PrivacyPreferences } from "../privacy/preferences"

const CORAL = "#FF5A5F"
const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "").trim()

const sections = [
  { title: "What stays on this device", body: "Your unfinished check-in draft is kept in session storage. Up to 20 result summaries, your onboarding status, and these privacy choices are kept in local storage. They remain until you clear them, clear browser/app data, or uninstall the app." },
  { title: "What a check-in sends", body: "When you submit, the API receives mood, sleep and workload categories, selected stress triggers, whether you want to talk, optional free text, college category, and a random submission token. The API uses those fields to generate resource suggestions. Raw check-in answers are not intentionally written to a check-in database table, but they are transmitted and processed on the server." },
  { title: "Optional aggregate contribution", body: "If you opt in, numeric check-in measures, college category, distress category, and the recommended resource are added to hourly aggregate totals. The random submission token is kept in Redis for 30 minutes to prevent duplicates. Existing aggregate totals cannot be separated back into an individual contribution, so withdrawing stops future contributions but cannot remove earlier totals." },
  { title: "Optional resource analytics", body: "If you opt in, clicking a resource phone or website action sends the resource identifier and action type to the backend. These events are stored without an account identifier, but ordinary network and hosting logs may still contain technical metadata such as IP address, timestamp, path, and user agent." },
  { title: "Peer and supporter information", body: "If Peer Connect is enabled, supporter applications store name, Cornell email, phone, year, major, locations, availability, interests, profile text, and reference name/contact/relationship. Connection requests store requester contact details, meeting preferences, and messages. Safety reports store the supporter name, reason, and optional reporter email. Administrators can review, update status, and delete these records." },
  { title: "Retention and deletion limits", body: "Redis deduplication keys expire after 30 minutes and administrator session cookies after 15 minutes by default. The current code does not automatically expire database aggregates, resource-click events, supporter applications, connection requests, reports, provider logs, or email copies. Those records remain until an authorized operator or service provider deletes them. Database deletion does not automatically erase copies already sent through email, backups, or provider logs." },
  { title: "Third parties", body: "The deployment uses a hosting environment, PostgreSQL-compatible database, Redis, and Resend for configured peer-workflow emails. Following phone numbers or external links sends data directly to those outside services under their own practices. CornellPulse does not currently include a third-party browser analytics SDK." },
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
    setPreferences({ aggregateContribution: false, resourceAnalytics: false })
    setConfirmClear(false)
    setCleared(true)
  }

  return (
    <div style={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 24px 40px", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px" }}>
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
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Contribute to campus aggregates</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, future check-ins update hourly aggregate totals.</span></span>
            </label>
            <label style={{ padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.resourceAnalytics} onChange={event => updatePreference("resourceAnalytics", event.target.checked)} style={{ marginTop: "3px", accentColor: CORAL }} />
              <span><span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#222222", marginBottom: "4px" }}>Share resource-click analytics</span><span style={{ display: "block", fontSize: "13px", color: "#717171", lineHeight: 1.5 }}>Off by default. When on, future phone and website clicks send the resource and action type.</span></span>
            </label>
          </div>
          {saved && <p role="status" style={{ fontSize: "12px", color: "#00A699", marginTop: "8px" }}>Preference saved on this device. Turning a choice off stops future optional collection.</p>}
        </section>

        <section aria-label="Data practices" style={{ marginBottom: "24px" }}>
          {sections.map(section => <div key={section.title} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "10px" }}><h2 style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>{section.title}</h2><p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6 }}>{section.body}</p></div>)}
        </section>

        <section aria-labelledby="privacy-controls" style={{ marginBottom: "24px" }}>
          <p id="privacy-controls" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Withdrawal and deletion</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>Clear local history, drafts, onboarding status, and privacy preferences from this device. This does not delete server, email, backup, or provider records.</p>
            {confirmClear ? <div style={{ display: "flex", gap: "8px" }}><button onClick={clearDeviceData} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>Clear device data</button><button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: "#717171", fontSize: "13px", fontWeight: 600 }}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)} style={{ width: "100%", padding: "12px", border: "2px solid #ebebeb", borderRadius: "10px", backgroundColor: "transparent", color: CORAL, fontSize: "13px", fontWeight: 700 }}>Clear data on this device</button>}
            {cleared && <p role="status" style={{ fontSize: "12px", color: "#00A699", marginTop: "8px" }}>CornellPulse device data cleared.</p>}
          </div>
        </section>

        <section aria-labelledby="privacy-contact" style={{ marginBottom: "24px" }}>
          <p id="privacy-contact" style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Contact and server-data requests</p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.6, marginBottom: "14px" }}>For access, correction, withdrawal, or deletion requests involving supporter, reference, connection, or report records, contact the deployment operator. Because CornellPulse has no user accounts, you may need to provide enough information to locate and verify the record. Aggregate contributions and records already copied into email, backups, or provider logs may not be individually retrievable or fully deletable.</p>
            {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}?subject=CornellPulse privacy request`} style={{ display: "block", padding: "12px", borderRadius: "10px", backgroundColor: CORAL, color: "#ffffff", textAlign: "center", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>Email {CONTACT_EMAIL}</a> : <p role="alert" style={{ fontSize: "13px", color: CORAL, lineHeight: 1.5 }}>The operator contact is not configured. Identifiable-data features must remain disabled until a monitored contact address is provided.</p>}
          </div>
        </section>

        <Link to="/profile" style={{ display: "block", textAlign: "center", color: "#717171", fontSize: "13px", fontWeight: 600, padding: "8px", marginBottom: "16px", textDecoration: "none" }}>Back to profile</Link>
      </div>
    </div>
  )
}
