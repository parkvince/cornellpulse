import { useState } from "react"

const PINK = "#e8a0b4"
const CATS = ["All", "Cornell", "Crisis", "Community", "Stress Relief", "Physical"]

const resources = [
  { cat: "Cornell", name: "CAPS Individual Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "One-on-one counseling with a licensed therapist. Access Appointment within 1-2 days.", loc: "Gannett Health Center, 110 Ho Plaza", hours: "Mon-Fri 8:30am-4:30pm", tags: ["therapy", "free"] },
  { cat: "Cornell", name: "Let's Talk Drop-In", phone: null, url: "https://health.cornell.edu/services/mental-health-care/lets-talk", desc: "Informal 15-20 min conversations with a CAPS counselor. No appointment needed.", loc: "Various campus locations", hours: "Mon-Fri, check website", tags: ["drop-in", "free"] },
  { cat: "Cornell", name: "EARS Peer Counseling", phone: "607-255-4050", url: "https://ears.cornell.edu", desc: "Confidential peer counseling with trained Cornell students. No judgment.", loc: "305 Willard Straight Hall", hours: "Sun-Thu 9pm-1am", tags: ["peer", "free", "evening"] },
  { cat: "Cornell", name: "Cornell Health 24/7", phone: "607-255-5155", url: "https://health.cornell.edu", desc: "Talk to a health professional any time. Press 2 for mental health support.", loc: "Phone only", hours: "24/7 including holidays", tags: ["24/7", "free"] },
  { cat: "Cornell", name: "CAPS Group Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "Therapist-led groups for anxiety, grief, identity, relationships, and more.", loc: "Gannett Health Center", hours: "Varies by group", tags: ["group", "free"] },
  { cat: "Cornell", name: "Headspace App", phone: null, url: "https://www.headspace.com/studentplan", desc: "Free meditation and sleep app for all Cornell students.", loc: "Online / Mobile", hours: "Always available", tags: ["app", "free", "meditation"] },
  { cat: "Cornell", name: "Office of Diversity and Inclusion", phone: "607-255-4857", url: "https://diversity.cornell.edu", desc: "Counseling for students of color, LGBTQ+, first-gen, and international students.", loc: "626 Thurston Ave", hours: "Mon-Fri 8am-5pm", tags: ["identity", "diversity", "free"] },
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

export default function ResourcesPage() {
  const [cat, setCat] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = resources.filter(r =>
    (cat === "All" || r.cat === cat) &&
    (search === "" || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search.toLowerCase())))
  )

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ padding: "52px 20px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>Resources</p>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "4px" }}>All resources</h1>
        <p style={{ fontSize: "14px", color: "#a0a0a0", marginBottom: "20px" }}>Cornell, Ithaca, and beyond.</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", padding: "14px 16px", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "15px", backgroundColor: "#1a1a1a", color: "#fff", marginBottom: "16px" }} />
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "20px" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "8px 16px", border: "none", borderRadius: "20px", backgroundColor: cat === c ? PINK : "#1a1a1a", color: cat === c ? "#0f0f0f" : "#a0a0a0", fontSize: "13px", fontWeight: cat === c ? 800 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 && <p style={{ fontSize: "15px", color: "#4a4a4a", textAlign: "center", padding: "40px 0" }}>No results.</p>}
        {filtered.map(r => (
          <div key={r.name} style={{ borderRadius: "10px", padding: "18px", backgroundColor: "#1a1a1a", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{r.name}</p>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#4a4a4a", backgroundColor: "#242424", padding: "3px 8px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.08em" }}>{r.cat.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.55, marginBottom: "12px" }}>{r.desc}</p>
            {r.loc && <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "2px" }}>{r.loc}</p>}
            {r.hours && <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "12px" }}>{r.hours}</p>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {r.phone && <a href={`tel:${r.phone}`} style={{ padding: "9px 16px", backgroundColor: PINK, color: "#0f0f0f", borderRadius: "20px", fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em" }}>CALL {r.phone}</a>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 16px", border: "1px solid #2a2a2a", color: "#a0a0a0", borderRadius: "20px", fontSize: "12px" }}>Website</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}