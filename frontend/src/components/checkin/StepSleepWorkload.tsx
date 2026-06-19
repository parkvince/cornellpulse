const PINK = "#e8a0b4"

interface Props {
  sleep: string
  onSleepChange: (v: string) => void
  workload: string
  onWorkloadChange: (v: string) => void
  onNext: () => void
  onBack: () => void
}

const sleepOpts = [
  { value: "under_4", label: "Under 4 hours" },
  { value: "4_to_6", label: "4 to 6 hours" },
  { value: "6_to_8", label: "6 to 8 hours" },
  { value: "over_8", label: "More than 8 hours" },
]

const workloadOpts = [
  { value: "light", label: "Light", desc: "Keeping up without much stress" },
  { value: "moderate", label: "Moderate", desc: "Busy but manageable" },
  { value: "heavy", label: "Heavy", desc: "Struggling to keep up" },
  { value: "unbearable", label: "Unbearable", desc: "Cannot keep up at all" },
]

export default function StepSleepWorkload({ sleep, onSleepChange, workload, onWorkloadChange, onNext, onBack }: Props) {
  const canNext = sleep && workload

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>Step 2 of 4</p>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "28px" }}>Sleep and workload</h2>

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Sleep last night</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "24px" }}>
        {sleepOpts.map(o => (
          <button key={o.value} onClick={() => onSleepChange(o.value)} style={{ padding: "14px 10px", border: "none", borderRadius: "8px", backgroundColor: sleep === o.value ? PINK : "#1a1a1a", fontSize: "13px", fontWeight: 600, color: sleep === o.value ? "#0f0f0f" : "#fff", textAlign: "center" }}>
            {o.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Academic workload</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "40px" }}>
        {workloadOpts.map(o => (
          <button key={o.value} onClick={() => onWorkloadChange(o.value)} style={{ padding: "14px 16px", border: "none", borderRadius: "8px", backgroundColor: workload === o.value ? PINK : "#1a1a1a", textAlign: "left" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: workload === o.value ? "#0f0f0f" : "#fff", marginBottom: "2px" }}>{o.label}</p>
            <p style={{ fontSize: "12px", color: workload === o.value ? "#0f0f0f" : "#4a4a4a" }}>{o.desc}</p>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "18px", backgroundColor: "transparent", color: "#a0a0a0", border: "1px solid #2a2a2a", borderRadius: "6px", fontSize: "14px" }}>Back</button>
        <button onClick={onNext} disabled={!canNext} style={{ flex: 2, padding: "18px", backgroundColor: canNext ? PINK : "#1a1a1a", color: canNext ? "#0f0f0f" : "#4a4a4a", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.05em" }}>NEXT</button>
      </div>
    </div>
  )
}