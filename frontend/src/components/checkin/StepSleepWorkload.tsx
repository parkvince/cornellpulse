const CORAL = "#FF5A5F"

interface Props {
  sleep: string; onSleepChange: (v: string) => void
  workload: string; onWorkloadChange: (v: string) => void
  onNext: () => void; onBack: () => void
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
      <p style={{ fontSize: "12px", fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step 2 of 4</p>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#222222", lineHeight: 1.2, marginBottom: "24px" }}>Sleep and workload</h2>

      <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Sleep last night</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
        {sleepOpts.map(o => (
          <button key={o.value} onClick={() => onSleepChange(o.value)} style={{ padding: "14px 10px", border: `2px solid ${sleep === o.value ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: sleep === o.value ? "#FFF0F0" : "#ffffff", fontSize: "13px", fontWeight: 600, color: sleep === o.value ? CORAL : "#222222", textAlign: "center" }}>
            {o.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "12px", fontWeight: 600, color: "#717171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Academic workload</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "36px" }}>
        {workloadOpts.map(o => (
          <button key={o.value} onClick={() => onWorkloadChange(o.value)} style={{ padding: "14px 16px", border: `2px solid ${workload === o.value ? CORAL : "#ebebeb"}`, borderRadius: "12px", backgroundColor: workload === o.value ? "#FFF0F0" : "#ffffff", textAlign: "left" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: workload === o.value ? CORAL : "#222222", marginBottom: "2px" }}>{o.label}</p>
            <p style={{ fontSize: "12px", color: workload === o.value ? "#FC642D" : "#717171" }}>{o.desc}</p>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", color: "#717171", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 600 }}>Back</button>
        <button onClick={onNext} disabled={!canNext} style={{ flex: 2, padding: "16px", backgroundColor: canNext ? CORAL : "#ebebeb", color: canNext ? "#ffffff" : "#b0b0b0", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}>Continue →</button>
      </div>
    </div>
  )
}