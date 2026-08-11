const CORAL = "#D70466"
interface Props { value: string; onChange: (v: string) => void; onSubmit: () => void; onBack: () => void; loading: boolean; error: string }

function keepVisible(element: HTMLElement) {
  window.setTimeout(() => {
    const appScroller = document.getElementById("app-scroll-container")
    if (!appScroller) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    const rect = element.getBoundingClientRect()
    const visibleHeight = Math.max(160, appScroller.clientHeight - 90)
    const desiredTop = Math.max(20, (visibleHeight - rect.height) / 2)
    appScroller.scrollTo({ top: Math.max(0, appScroller.scrollTop + rect.top - desiredTop), behavior: "smooth" })
  }, 250)
}

export default function StepText({ value, onChange, onSubmit, onBack, loading, error }: Props) {
  return (
    <section data-checkin-step="4" aria-labelledby="context-heading">
      <h2 id="context-heading" tabIndex={-1} style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "6px" }}>Anything else on your mind?</h2>
      <p id="context-privacy" style={{ fontSize: "14px", color: "#717171", marginBottom: "24px" }}>Optional. This text stays only in this page’s memory for the current recommendation. It is never added to the saved draft, history, or a request.</p>

      <label htmlFor="checkin-context" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#222222", marginBottom: "8px" }}>Additional context <span style={{ color: "#717171", fontWeight: 400 }}>(optional)</span></label>
      <textarea id="checkin-context" value={value} onChange={event => onChange(event.target.value)} onFocus={event => keepVisible(event.currentTarget)} aria-describedby="context-privacy context-count" maxLength={500} placeholder="Write only what you are comfortable keeping on this screen." rows={4} style={{ width: "100%", padding: "16px", border: "2px solid #ebebeb", borderRadius: "12px", fontSize: "16px", resize: "vertical", marginBottom: "6px", backgroundColor: "#ffffff", color: "#222222", fontFamily: "DM Sans, sans-serif", scrollMarginBottom: "180px" }} />
      <p id="context-count" aria-live="polite" style={{ fontSize: "12px", color: "#717171", textAlign: "right", marginBottom: "32px" }}>{value.length}/500 characters</p>

      {error && <p role="alert" style={{ color: "#c0392b", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
      <div className="checkin-actions" style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Back</button>
        <button type="button" onClick={onSubmit} disabled={loading} aria-busy={loading} style={{ flex: 2, padding: "16px", backgroundColor: loading ? "#ebebeb" : CORAL, color: loading ? "#717171" : "#ffffff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}>
          {loading ? "Preparing resources…" : "Find resources"}
        </button>
      </div>
    </section>
  )
}
