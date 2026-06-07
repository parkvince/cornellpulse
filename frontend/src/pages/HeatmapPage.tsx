import { useEffect, useState } from "react"

const COLLEGES = [
  { id: "engineering", label: "Engineering" },
  { id: "arts_sciences", label: "Arts & Sciences" },
  { id: "dyson", label: "Dyson" },
  { id: "ilr", label: "ILR" },
  { id: "cals", label: "CALS" },
  { id: "aap", label: "AAP" },
  { id: "vet", label: "Vet" },
  { id: "graduate", label: "Graduate" },
  { id: "professional", label: "Professional" },
]

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

function getMoodColor(mood) {
  if (mood === null) return "#f0f0f0"
  if (mood >= 7) return "#c8e6c9"
  if (mood >= 5) return "#fff9c4"
  if (mood >= 3) return "#ffccbc"
  return "#ffcdd2"
}

function getMoodLabel(mood) {
  if (mood === null) return "No data yet"
  if (mood >= 7) return "Doing well"
  if (mood >= 5) return "Moderate stress"
  if (mood >= 3) return "High stress"
  return "Very high stress"
}

function getMoodTextColor(mood) {
  if (mood === null) return "#aaa"
  if (mood >= 7) return "#2e7d32"
  if (mood >= 5) return "#f57f17"
  if (mood >= 3) return "#bf360c"
  return "#b71c1c"
}

export default function HeatmapPage() {
  const [data, setData] = useState({})
  const [summary, setSummary] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [heatmapRes, summaryRes] = await Promise.all([
          fetch(API_URL + "/heatmap/24h"),
          fetch(API_URL + "/campus/summary"),
        ])
        const heatmapData = await heatmapRes.json()
        const summaryData = await summaryRes.json()
        setData(heatmapData)
        setSummary(summaryData)
      } catch (e) {
        console.error("Failed to fetch heatmap data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const selectedData = selected ? data[selected] : null
  const selectedCollege = COLLEGES.find(function(c) { return c.id === selected })

  return (
    <div style={{ padding: "24px 20px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>Campus Wellness Map</h1>
      <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>Last 24 hours. Updates every 30 seconds.</p>
      {summary && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Campus average</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>{summary.avg_mood !== null ? summary.avg_mood + " / 10" : "N/A"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Check-ins today</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>{summary.count}</p>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        {COLLEGES.map(function(college) {
          const collegeData = data[college.id]
          const mood = collegeData ? collegeData.avg_mood : null
          const isSelected = selected === college.id
          return (
            <button key={college.id} onClick={function() { setSelected(isSelected ? null : college.id) }} style={{ backgroundColor: getMoodColor(mood), border: isSelected ? "2px solid #1a1a1a" : "2px solid transparent", borderRadius: "12px", padding: "14px 16px", width: "calc(50% - 5px)", textAlign: "left", cursor: "pointer" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>{college.label}</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: getMoodTextColor(mood) }}>{mood !== null ? mood : "--"}</p>
              <p style={{ fontSize: "11px", color: getMoodTextColor(mood) }}>{getMoodLabel(mood)}</p>
            </button>
          )
        })}
      </div>
      {selected && selectedData && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#888", marginBottom: "8px" }}>{selectedCollege ? selectedCollege.label : ""}</p>
          {selectedData.avg_mood !== null ? (
            <div>
              <p style={{ fontSize: "32px", fontWeight: 700, color: getMoodTextColor(selectedData.avg_mood), marginBottom: "4px" }}>{selectedData.avg_mood} / 10</p>
              <p style={{ fontSize: "14px", color: "#888", marginBottom: "12px" }}>{getMoodLabel(selectedData.avg_mood)}</p>
              <p style={{ fontSize: "13px", color: "#aaa" }}>Based on {selectedData.count} check-ins in the last 24 hours</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "15px", color: "#888", marginBottom: "8px" }}>Not enough data yet.</p>
              <p style={{ fontSize: "13px", color: "#aaa" }}>At least 10 check-ins needed. Currently {selectedData.count || 0}.</p>
            </div>
          )}
        </div>
      )}
      <div style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "16px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", marginBottom: "10px" }}>Legend</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { color: "#c8e6c9", label: "Doing well (7-10)", text: "#2e7d32" },
            { color: "#fff9c4", label: "Moderate stress (5-6)", text: "#f57f17" },
            { color: "#ffccbc", label: "High stress (3-4)", text: "#bf360c" },
            { color: "#ffcdd2", label: "Very high stress (1-2)", text: "#b71c1c" },
            { color: "#f0f0f0", label: "No data yet", text: "#aaa" },
          ].map(function(item) {
            return (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", backgroundColor: item.color, borderRadius: "4px", flexShrink: 0, border: "1px solid #e5e5e5" }} />
                <p style={{ fontSize: "12px", color: item.text }}>{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
