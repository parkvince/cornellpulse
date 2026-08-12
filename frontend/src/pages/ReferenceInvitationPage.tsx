import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { requestJson } from "../api/client"

const CORAL = "#FF5A5F"

export default function ReferenceInvitationPage() {
  const location = useLocation()
  const token = useMemo(() => new URLSearchParams(location.hash.replace(/^#/, "")).get("token") || "", [location.hash])
  const [decision, setDecision] = useState<"accept" | "decline" | null>(null)
  const [relationship, setRelationship] = useState("")
  const [statement, setStatement] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<"accepted" | "declined" | null>(null)
  const [error, setError] = useState("")

  const canSubmit = token.length >= 32 && decision === "decline"
    ? true
    : token.length >= 32 && decision === "accept" && relationship.trim().length >= 2 && statement.trim().length >= 20

  async function submitDecision() {
    if (!canSubmit || !decision) return
    setLoading(true)
    setError("")
    try {
      const payload = await requestJson<{ status: string }>("/peer/reference-invitations/respond", {
        method: "POST",
        body: decision === "accept"
          ? { token, consent: true, relationship: relationship.trim(), statement: statement.trim() }
          : { token, consent: false },
        idempotencyKey: token,
        validate: (value): value is { status: string } => !!value && typeof value === "object" && typeof (value as { status?: unknown }).status === "string",
      })
      if (payload.status !== (decision === "accept" ? "accepted" : "declined")) throw new Error("The server did not confirm this response.")
      setResult(decision === "accept" ? "accepted" : "declined")
      window.history.replaceState(null, "", location.pathname)
      setRelationship("")
      setStatement("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This invitation could not be updated.")
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#222222", marginBottom: "10px" }}>Invitation {result}</h1>
        <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6 }}>{result === "accepted" ? "Your encrypted response was recorded for administrator review. It is not shown publicly or to the applicant." : "No reference content was collected. The delivery address is removed from the active invitation record."}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#222222", marginBottom: "8px" }}>Reference consent invitation</h1>
      <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.6, marginBottom: "24px" }}>You were invited to provide a supporter reference. Opening this page did not give consent. You may decline without providing a name, phone number, relationship, or statement.</p>

      {!token && <div role="alert" style={{ backgroundColor: "#FFF0F0", color: "#8a292d", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px" }}>This invitation link is incomplete.</div>}
      {error && <div role="alert" style={{ backgroundColor: "#FFF0F0", color: "#8a292d", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 20px" }}>
        <legend style={{ fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "10px" }}>Your choice</legend>
        <label style={{ display: "flex", gap: "10px", padding: "12px", backgroundColor: "#ffffff", borderRadius: "12px", marginBottom: "8px", fontSize: "14px", color: "#222222" }}><input type="radio" name="reference-decision" checked={decision === "accept"} onChange={() => setDecision("accept")} />I consent to provide a reference response.</label>
        <label style={{ display: "flex", gap: "10px", padding: "12px", backgroundColor: "#ffffff", borderRadius: "12px", fontSize: "14px", color: "#222222" }}><input type="radio" name="reference-decision" checked={decision === "decline"} onChange={() => setDecision("decline")} />I decline. Do not collect reference content.</label>
      </fieldset>

      {decision === "accept" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <label htmlFor="reference-relationship" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>How you know the applicant</label>
          <input id="reference-relationship" value={relationship} onChange={event => setRelationship(event.target.value)} maxLength={100} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", marginBottom: "14px" }} />
          <label htmlFor="reference-statement" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#222222", marginBottom: "6px" }}>Reference statement</label>
          <textarea id="reference-statement" value={statement} onChange={event => setStatement(event.target.value)} maxLength={500} rows={5} style={{ width: "100%", padding: "12px 14px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "14px", resize: "vertical" }} />
          <p style={{ fontSize: "12px", color: "#717171", marginTop: "6px" }}>At least 20 characters. This encrypted response is available only to authorized administrators.</p>
        </div>
      )}

      <button onClick={submitDecision} disabled={!canSubmit || loading} style={{ width: "100%", padding: "15px", border: 0, borderRadius: "12px", backgroundColor: canSubmit && !loading ? CORAL : "#ebebeb", color: canSubmit && !loading ? "#ffffff" : "#717171", fontSize: "15px", fontWeight: 700 }}>{loading ? "Submitting..." : decision === "decline" ? "Decline invitation" : "Submit consented response"}</button>
    </div>
  )
}
