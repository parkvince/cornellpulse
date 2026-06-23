import { useState } from "react"

const CORAL = "#FF5A5F"
const CATS = ["All", "Cornell", "Crisis", "Community", "Stress Relief", "Physical"]
const QUICK_FILTERS = ["free", "24/7", "lgbtq", "local"]

const resources = [
  { cat: "Cornell", name: "CAPS Individual Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "One-on-one counseling with a licensed therapist. First appointment within 1-2 days.", loc: "Gannett Health Center, 110 Ho Plaza", hours: "Mon-Fri 8:30am-4:30pm", tags: ["therapy", "free"] },
  { cat: "Cornell", name: "Let's Talk Drop-In", phone: null, url: "https://health.cornell.edu/services/mental-health-care/lets-talk", desc: "Informal 15-20 min conversations with a CAPS counselor. No appointment needed.", loc: "Various campus locations", hours: "Mon-Fri, check website", tags: ["drop-in", "free"] },
  { cat: "Cornell", name: "EARS Peer Counseling", phone: "607-255-4050", url: "https://ears.cornell.edu", desc: "Confidential peer counseling with trained Cornell students. No judgment.", loc: "305 Willard Straight Hall", hours: "Sun-Thu 9pm-1am", tags: ["peer", "free", "evening"] },
  { cat: "Cornell", name: "Cornell Health 24/7", phone: "607-255-5155", url: "https://health.cornell.edu", desc: "Talk to a health professional any time. Press 2 for mental health support.", loc: "Phone only", hours: "24/7 including holidays", tags: ["24/7", "free"] },
  { cat: "Cornell", name: "CAPS Group Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "Therapist-led groups for anxiety, grief, identity, relationships, and more.", loc: "Gannett Health Center", hours: "Varies by group", tags: ["group", "free"] },
  { cat: "Cornell", name: "Headspace App", phone: null, url: "https://www.headspace.com/studentplan", desc: "Free meditation and sleep app for all Cornell students.", loc: "Online / Mobile", hours: "Always available", tags: ["app", "free", "meditation"] },
  { cat: "Cornell", name: "Office of Diversity and Inclusion", phone: "607-255-4857", url: "https://diversity.cornell.edu", desc: "Counseling for students of color, LGBTQ+, first-gen, and international students.", loc: "626 Thurston Ave", hours: "Mon-Fri 8am-5pm", tags: ["identity", "diversity", "free", "lgbtq"] },
  { cat: "Cornell", name: "LGBT Resource Center", phone: "607-255-6482", url: "https://lgbtq.cornell.edu", desc: "Community, support, and resources for LGBTQ+ students.", loc: "626 Thurston Ave", hours: "Mon-Fri 9am-5pm", tags: ["lgbtq", "free"] },
  { cat: "Cornell", name: "Financial Aid Emergency Fund", phone: "607-255-5145", url: "https://finaid.cornell.edu/emergency-fund", desc: "Emergency grants for unexpected expenses. You do not need to pay them back.", loc: "203 Day Hall", hours: "Mon-Fri 8am-5pm", tags: ["financial", "emergency", "free"] },
  { cat: "Cornell", name: "Basic Needs Support", phone: null, url: "https://basicneeds.cornell.edu", desc: "Food pantry, emergency housing, and basic needs support. No questions asked.", loc: "Multiple locations", hours: "Check website", tags: ["food", "housing", "free"] },
  { cat: "Cornell", name: "Sleep Health Program", phone: "607-255-5155", url: "https://health.cornell.edu/services/health-coaching", desc: "Evidence-based coaching for sleep problems. CBT techniques for insomnia.", loc: "Gannett Health Center", hours: "Mon-Fri 8am-5pm", tags: ["sleep", "free"] },
  { cat: "Cornell", name: "Graduate Student Mental Health", phone: "607-255-5155", url: "https://gradschool.cornell.edu/student-life/health-and-wellness", desc: "CAPS counselors specializing in grad student concerns including advisor stress.", loc: "Gannett Health Center", hours: "Mon-Fri 8:30am-4:30pm", tags: ["graduate", "free"] },
  { cat: "Cornell", name: "University Advocate", phone: "607-255-4321", url: "https://advocate.cornell.edu", desc: "Free confidential support navigating Cornell policies and academic difficulties.", loc: "160 Day Hall", hours: "Mon-Fri 9am-5pm", tags: ["advocacy", "free"] },
  { cat: "Cornell", name: "Skorton Center", phone: "607-255-6074", url: "https://health.cornell.edu/about/skorton-center", desc: "Health coaching, wellness programs, and stress management workshops.", loc: "Gannett Health Center", hours: "Mon-Fri 8am-5pm", tags: ["wellness", "workshops"] },
  { cat: "Crisis", name: "988 Suicide and Crisis Lifeline", phone: "988", url: "https://988lifeline.org", desc: "Call or text 988. Trained crisis counselor in seconds. Free, confidential, 24/7.", loc: "Phone / Text", hours: "24/7", tags: ["crisis", "24/7", "free"] },
  { cat: "Crisis", name: "Crisis Text Line", phone: "741741", url: "https://www.crisistextline.org", desc: "Text HOME to 741741. Free confidential crisis counseling by text, 24/7.", loc: "Text only", hours: "24/7", tags: ["crisis", "text", "free"] },
  { cat: "Crisis", name: "Cornell Crisis Response", phone: "607-255-1111", url: null, desc: "Call Cornell Police and ask for the on-call mental health crisis manager.", loc: "On campus", hours: "24/7", tags: ["crisis", "on-campus"] },
  { cat: "Crisis", name: "Cayuga Medical ER", phone: "607-274-4011", url: "https://www.cayugamed.org", desc: "Emergency psychiatric care at Ithaca's main hospital.", loc: "101 Dates Drive, Ithaca", hours: "24/7", tags: ["crisis", "emergency"] },
  { cat: "Community", name: "Ithaca Crisis Line", phone: "607-272-1616", url: null, desc: "Local Ithaca crisis and emotional support line. Free and confidential.", loc: "Phone only", hours: "24/7", tags: ["crisis", "local", "free"] },
  { cat: "Community", name: "Cayuga Medical Behavioral Health", phone: "607-274-4300", url: "https://www.cayugamed.org/behavioral-health", desc: "Outpatient mental health services. Sliding scale fees available.", loc: "17 Thornwood Drive, Ithaca", hours: "Mon-Fri 8am-5pm", tags: ["therapy", "local"] },
  { cat: "Community", name: "Family and Children's Service", phone: "607-273-7494", url: "https://www.fcsith.org", desc: "Community counseling with sliding scale fees.", loc: "127 W State St, Ithaca", hours: "Mon-Fri 8:30am-5pm", tags: ["counseling", "local"] },
  { cat: "Community", name: "GLAAD Finger Lakes LGBTQ Center", phone: "607-277-0015", url: "https://flgbtqcenter.org", desc: "LGBTQ+ community center with support groups and counseling referrals.", loc: "301 W State St, Ithaca", hours: "Mon-Fri noon-8pm", tags: ["lgbtq", "local"] },
  { cat: "Stress Relief", name: "Helen Newman Fitness Center", phone: null, url: "https://recreation.athletics.cornell.edu/facilities/helen-newman", desc: "Free for Cornell students. Cardio, weights, group fitness, yoga.", loc: "Helen Newman Hall", hours: "Mon-Fri 6am-11pm, weekends 8am-9pm", tags: ["gym", "free"] },
  { cat: "Stress Relief", name: "Cornell Botanic Gardens", phone: null, url: "https://cornellbotanicgardens.org", desc: "Free, beautiful gardens on campus. A walk here genuinely clears your head.", loc: "One Plantations Rd", hours: "Dawn to dusk", tags: ["nature", "free"] },
  { cat: "Stress Relief", name: "Beebe Lake Trail", phone: null, url: null, desc: "Quiet trail loop on the north end of campus. One of the most calming walks at Cornell.", loc: "North Campus, near Triphammer Falls", hours: "Always open", tags: ["nature", "free"] },
  { cat: "Stress Relief", name: "Buttermilk Falls State Park", phone: "607-273-5761", url: "https://parks.ny.gov/parks/151", desc: "Stunning gorge and waterfalls 10 minutes from campus. Free entry.", loc: "112 E Buttermilk Falls Rd", hours: "8am-dusk", tags: ["hiking", "free"] },
  { cat: "Stress Relief", name: "Taughannock Falls", phone: "607-387-6739", url: "https://parks.ny.gov/parks/149", desc: "A waterfall taller than Niagara. 20 minutes from campus.", loc: "2221 Taughannock Park Rd, Trumansburg", hours: "8am-dusk", tags: ["hiking"] },
  { cat: "Stress Relief", name: "Ithaca Farmer's Market", phone: null, url: "https://www.ithacamarket.com", desc: "Lively outdoor market by the lake. Great food, vendors, live music.", loc: "545 Third St, Ithaca", hours: "Sat 9am-3pm, Sun 10am-3pm (Apr-Dec)", tags: ["social", "food"] },
  { cat: "Stress Relief", name: "Stewart Park", phone: null, url: null, desc: "Free lakeside park on Cayuga Lake. Great for sitting by the water.", loc: "1 James L Gibbs Dr, Ithaca", hours: "Dawn to dusk", tags: ["nature", "free"] },
  { cat: "Physical", name: "Cornell Health Primary Care", phone: "607-255-5155", url: "https://health.cornell.edu", desc: "General medical care including mental health medication management.", loc: "110 Ho Plaza", hours: "Mon-Fri 8am-5pm", tags: ["medical", "free"] },
  { cat: "Physical", name: "Cornell Yoga Classes", phone: null, url: "https://recreation.athletics.cornell.edu/group-fitness", desc: "Free yoga and mindfulness classes through campus recreation.", loc: "Helen Newman Hall", hours: "Various times weekly", tags: ["yoga", "free", "mindfulness"] },
  { cat: "Physical", name: "Intramural Sports", phone: null, url: "https://recreation.athletics.cornell.edu/intramurals", desc: "Join a casual sports team. Great way to combat loneliness and build community.", loc: "Campus athletic facilities", hours: "Evenings and weekends", tags: ["sports", "social", "free"] },
  { cat: "Physical", name: "Cornell Outdoor Education", phone: "607-255-6415", url: "https://outdoor.cornell.edu", desc: "Outdoor trips, climbing wall, and adventure programs. Free or low cost.", loc: "Bartels Hall", hours: "Mon-Fri 9am-5pm", tags: ["outdoor", "adventure"] },
]

function track(resourceId: string, action: string) {
  fetch((import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1") + "/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource_id: resourceId, action }),
  }).catch(() => {})
}

export default function ResourcesPage() {
  const [cat, setCat] = useState("All")
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState("")

  const filtered = resources.filter(r =>
    (cat === "All" || r.cat === cat) &&
    (quickFilter === "" || r.tags.includes(quickFilter)) &&
    (search === "" || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search.toLowerCase())))
  )

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ background: "linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)", padding: "52px 20px 24px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Resources</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "4px" }}>Resources for every kind of moment.</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "16px" }}>Free, anonymous, ready when you are.</p>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", padding: "12px 14px 12px 40px", border: "none", borderRadius: "12px", fontSize: "15px", backgroundColor: "#ffffff", color: "#222222" }} />
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "7px 14px", border: "none", borderRadius: "20px", backgroundColor: cat === c ? CORAL : "#ffffff", color: cat === c ? "#ffffff" : "#717171", fontSize: "13px", fontWeight: cat === c ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: cat === c ? "none" : "0 1px 4px rgba(0,0,0,0.08)" }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}>
          {QUICK_FILTERS.map(f => (
            <button key={f} onClick={() => setQuickFilter(f === quickFilter ? "" : f)} style={{ padding: "5px 12px", border: `1.5px solid ${quickFilter === f ? CORAL : "#ebebeb"}`, borderRadius: "20px", backgroundColor: quickFilter === f ? "#FFF0F0" : "#ffffff", color: quickFilter === f ? CORAL : "#717171", fontSize: "12px", fontWeight: quickFilter === f ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, textTransform: "capitalize" }}>
              {f === "24/7" ? "Available now" : f}
            </button>
          ))}
        </div>

        {cat === "All" && !search && (
          <div style={{ backgroundColor: CORAL, borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>In crisis right now?</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Call 988 — 24/7 support</p>
            </div>
            <a href="tel:988" onClick={() => track("988", "call")} style={{ backgroundColor: "#ffffff", color: CORAL, padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              Call
            </a>
          </div>
        )}

        {filtered.length === 0 && <p style={{ fontSize: "15px", color: "#b0b0b0", textAlign: "center", padding: "40px 0" }}>No results.</p>}

        {filtered.map(r => (
          <div key={r.name} style={{ borderRadius: "16px", padding: "18px", backgroundColor: "#ffffff", marginBottom: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: r.cat === "Crisis" ? `1.5px solid ${CORAL}` : "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#222222", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{r.name}</p>
              <span style={{ fontSize: "10px", fontWeight: 600, color: r.cat === "Crisis" ? CORAL : "#717171", backgroundColor: r.cat === "Crisis" ? "#FFF0F0" : "#f5f5f5", padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>{r.cat.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: "13px", color: "#717171", lineHeight: 1.55, marginBottom: "10px" }}>{r.desc}</p>
            {r.loc && <p style={{ fontSize: "11px", color: "#b0b0b0", marginBottom: "2px" }}>{r.loc}</p>}
            {r.hours && <p style={{ fontSize: "11px", color: "#b0b0b0", marginBottom: "10px" }}>{r.hours}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {r.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ padding: "3px 8px", backgroundColor: "#FFF0F0", color: CORAL, borderRadius: "6px", fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {r.phone && (
                <a href={`tel:${r.phone}`} onClick={() => track(r.name, "call")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", backgroundColor: r.cat === "Crisis" ? CORAL : "#FFF0F0", color: r.cat === "Crisis" ? "#ffffff" : CORAL, borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.cat === "Crisis" ? "#fff" : CORAL} strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  Call {r.phone}
                </a>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => track(r.name, "website")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", border: "1.5px solid #ebebeb", color: "#717171", borderRadius: "10px", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Visit
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}