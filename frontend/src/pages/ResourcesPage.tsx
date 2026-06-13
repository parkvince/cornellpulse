import { useState } from "react"

const CATEGORIES = ["All", "Cornell", "Crisis", "Community", "Stress Relief", "Physical"]

const resources = [
  { category: "Cornell", name: "CAPS Individual Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "One-on-one counseling with a licensed therapist. Call to schedule an Access Appointment within 1-2 days.", location: "Gannett Health Center, 110 Ho Plaza", hours: "Mon-Fri 8:30am-4:30pm", tags: ["therapy", "counseling", "free"] },
  { category: "Cornell", name: "Let's Talk Drop-In", phone: null, url: "https://health.cornell.edu/services/mental-health-care/lets-talk", desc: "Informal 15-20 minute conversations with a CAPS counselor. No appointment, no paperwork.", location: "Various campus locations", hours: "Mon-Fri, varies by location", tags: ["drop-in", "free", "no appointment"] },
  { category: "Cornell", name: "EARS Peer Counseling", phone: "607-255-4050", url: "https://ears.cornell.edu", desc: "Confidential peer counseling with trained Cornell students. No judgment.", location: "305 Willard Straight Hall", hours: "Sun-Thu 9pm-1am", tags: ["peer", "free", "evening"] },
  { category: "Cornell", name: "Cornell Health 24/7 Line", phone: "607-255-5155", url: "https://health.cornell.edu", desc: "Talk to a health professional any time. Press 2 for after-hours mental health support.", location: "Phone only", hours: "24/7 including holidays", tags: ["24/7", "phone", "free"] },
  { category: "Cornell", name: "CAPS Group Therapy", phone: "607-255-5155", url: "https://health.cornell.edu/services/mental-health-care", desc: "Therapist-led groups for anxiety, grief, identity, relationships, and more.", location: "Gannett Health Center", hours: "Varies by group", tags: ["group", "free", "therapy"] },
  { category: "Cornell", name: "Headspace App", phone: null, url: "https://www.headspace.com/studentplan", desc: "Free meditation and sleep app for all Cornell students. Sign up with your Cornell email.", location: "Online / Mobile app", hours: "Always available", tags: ["app", "free", "meditation"] },
  { category: "Cornell", name: "Office of Diversity and Inclusion", phone: "607-255-4857", url: "https://diversity.cornell.edu", desc: "Counseling for students of color, LGBTQ+ students, first-gen students, and international students.", location: "626 Thurston Ave", hours: "Mon-Fri 8am-5pm", tags: ["identity", "diversity", "free"] },
  { category: "Cornell", name: "LGBT Resource Center", phone: "607-255-6482", url: "https://lgbtq.cornell.edu", desc: "Community, support, and resources for LGBTQ+ students.", location: "626 Thurston Ave", hours: "Mon-Fri 9am-5pm", tags: ["lgbtq", "identity", "free"] },
  { category: "Cornell", name: "Financial Aid Emergency Fund", phone: "607-255-5145", url: "https://finaid.cornell.edu/emergency-fund", desc: "Emergency grants for unexpected expenses. You do not need to pay them back.", location: "203 Day Hall", hours: "Mon-Fri 8am-5pm", tags: ["financial", "emergency", "free"] },
  { category: "Cornell", name: "Cornell Basic Needs", phone: null, url: "https://basicneeds.cornell.edu", desc: "Food pantry, emergency housing, and basic needs support. No questions asked.", location: "Multiple locations", hours: "Check website", tags: ["food", "housing", "emergency", "free"] },
  { category: "Cornell", name: "Cornell Sleep Health Program", phone: "607-255-5155", url: "https://health.cornell.edu/services/health-coaching", desc: "Evidence-based coaching for sleep problems. CBT techniques for insomnia.", location: "Gannett Health Center", hours: "Mon-Fri 8am-5pm", tags: ["sleep", "free", "coaching"] },
  { category: "Cornell", name: "Graduate Student Mental Health", phone: "607-255-5155", url: "https://gradschool.cornell.edu/student-life/health-and-wellness", desc: "CAPS counselors specializing in grad student concerns including advisor stress and dissertation anxiety.", location: "Gannett Health Center", hours: "Mon-Fri 8:30am-4:30pm", tags: ["graduate", "free", "therapy"] },
  { category: "Cornell", name: "University Advocate", phone: "607-255-4321", url: "https://advocate.cornell.edu", desc: "Free confidential support navigating Cornell policies and academic difficulties.", location: "160 Day Hall", hours: "Mon-Fri 9am-5pm", tags: ["advocacy", "academic", "free"] },
  { category: "Cornell", name: "Skorton Center for Health Initiatives", phone: "607-255-6074", url: "https://health.cornell.edu/about/skorton-center", desc: "Health coaching, wellness programs, and stress management workshops.", location: "Gannett Health Center", hours: "Mon-Fri 8am-5pm", tags: ["wellness", "coaching", "workshops"] },
  { category: "Crisis", name: "988 Suicide and Crisis Lifeline", phone: "988", url: "https://988lifeline.org", desc: "Call or text 988. Trained crisis counselor available within seconds. Free and confidential 24/7.", location: "Phone / Text", hours: "24/7", tags: ["crisis", "24/7", "free"] },
  { category: "Crisis", name: "Crisis Text Line", phone: "741741", url: "https://www.crisistextline.org", desc: "Text HOME to 741741. Free confidential crisis counseling by text, 24/7.", location: "Text only", hours: "24/7", tags: ["crisis", "text", "24/7", "free"] },
  { category: "Crisis", name: "Cornell Crisis Response", phone: "607-255-1111", url: null, desc: "Call Cornell Police and ask for the on-call mental health crisis manager.", location: "On campus", hours: "24/7", tags: ["crisis", "on-campus", "24/7"] },
  { category: "Crisis", name: "Cayuga Medical Center ER", phone: "607-274-4011", url: "https://www.cayugamed.org", desc: "Emergency psychiatric care at Ithaca's main hospital.", location: "101 Dates Drive, Ithaca", hours: "24/7", tags: ["crisis", "emergency", "hospital"] },
  { category: "Community", name: "Ithaca Crisis Line", phone: "607-272-1616", url: null, desc: "Local Ithaca crisis and emotional support line. Free and confidential.", location: "Phone only", hours: "24/7", tags: ["crisis", "local", "free"] },
  { category: "Community", name: "Cayuga Medical Behavioral Health", phone: "607-274-4300", url: "https://www.cayugamed.org/behavioral-health", desc: "Outpatient mental health services in Ithaca. Sliding scale fees available.", location: "17 Thornwood Drive, Ithaca", hours: "Mon-Fri 8am-5pm", tags: ["therapy", "local", "outpatient"] },
  { category: "Community", name: "Family and Children's Service", phone: "607-273-7494", url: "https://www.fcsith.org", desc: "Community counseling and mental health services. Sliding scale fees.", location: "127 W State St, Ithaca", hours: "Mon-Fri 8:30am-5pm", tags: ["counseling", "local"] },
  { category: "Community", name: "GLAAD Finger Lakes LGBTQ Center", phone: "607-277-0015", url: "https://flgbtqcenter.org", desc: "LGBTQ+ community center with support groups and counseling referrals.", location: "301 W State St, Ithaca", hours: "Mon-Fri noon-8pm, Sat noon-5pm", tags: ["lgbtq", "local", "community"] },
  { category: "Stress Relief", name: "Helen Newman Fitness Center", phone: null, url: "https://recreation.athletics.cornell.edu/facilities/helen-newman", desc: "Free for Cornell students. Cardio, weights, group fitness classes including yoga.", location: "Helen Newman Hall", hours: "Mon-Fri 6am-11pm, weekends 8am-9pm", tags: ["gym", "exercise", "free"] },
  { category: "Stress Relief", name: "Cornell Botanic Gardens", phone: null, url: "https://cornellbotanicgardens.org", desc: "Free, beautiful gardens on campus. Walking through nature genuinely clears your head.", location: "One Plantations Rd", hours: "Dawn to dusk daily", tags: ["nature", "walking", "free"] },
  { category: "Stress Relief", name: "Beebe Lake Trail", phone: null, url: null, desc: "A quiet trail loop around Beebe Lake on the north end of campus. One of the most calming walks at Cornell.", location: "North Campus, near Triphammer Falls", hours: "Always open", tags: ["nature", "walking", "free"] },
  { category: "Stress Relief", name: "Buttermilk Falls State Park", phone: "607-273-5761", url: "https://parks.ny.gov/parks/151", desc: "Stunning gorge and waterfalls 10 minutes from campus. Free entry.", location: "112 E Buttermilk Falls Rd", hours: "8am-dusk daily", tags: ["hiking", "nature", "free"] },
  { category: "Stress Relief", name: "Taughannock Falls State Park", phone: "607-387-6739", url: "https://parks.ny.gov/parks/149", desc: "A waterfall taller than Niagara. 20 minutes from campus.", location: "2221 Taughannock Park Rd, Trumansburg", hours: "8am-dusk daily", tags: ["hiking", "nature"] },
  { category: "Stress Relief", name: "Ithaca Farmer's Market", phone: null, url: "https://www.ithacamarket.com", desc: "Lively outdoor market by the lake. Good food, local vendors, live music.", location: "545 Third St, Ithaca", hours: "Sat 9am-3pm, Sun 10am-3pm (April-Dec)", tags: ["social", "food", "outdoor"] },
  { category: "Stress Relief", name: "Stewart Park", phone: null, url: null, desc: "Free lakeside park at the south end of Cayuga Lake. Great for sitting by the water.", location: "1 James L Gibbs Dr, Ithaca", hours: "Dawn to dusk", tags: ["nature", "outdoor", "free"] },
  { category: "Physical", name: "Cornell Health Primary Care", phone: "607-255-5155", url: "https://health.cornell.edu", desc: "General medical care including mental health medication management.", location: "110 Ho Plaza", hours: "Mon-Fri 8am-5pm", tags: ["medical", "free"] },
  { category: "Physical", name: "Cornell Yoga Classes", phone: null, url: "https://recreation.athletics.cornell.edu/group-fitness", desc: "Free yoga and mindfulness classes for Cornell students through campus recreation.", location: "Helen Newman Hall", hours: "Various times weekly", tags: ["yoga", "free", "mindfulness"] },
  { category: "Physical", name: "Intramural Sports", phone: null, url: "https://recreation.athletics.cornell.edu/intramurals", desc: "Join a casual sports team. Being part of a team is one of the best ways to combat loneliness.", location: "Campus athletic facilities", hours: "Evenings and weekends", tags: ["sports", "social", "free"] },
  { category: "Physical", name: "Cornell Outdoor Education", phone: "607-255-6415", url: "https://outdoor.cornell.edu", desc: "Outdoor trips, climbing wall, and adventure programs.", location: "Bartels Hall", hours: "Mon-Fri 9am-5pm", tags: ["outdoor", "adventure", "social"] },
]

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = resources.filter(r => {
    const matchCategory = activeCategory === "All" || r.category === activeCategory
    const matchSearch = search === "" || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCategory && matchSearch
  })

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ padding: "48px 20px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#1db954", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Resources</p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", marginBottom: "4px", letterSpacing: "-0.02em" }}>All resources</h1>
        <p style={{ fontSize: "14px", color: "#b3b3b3", marginBottom: "20px" }}>Cornell, Ithaca, and beyond.</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." style={{ width: "100%", padding: "12px 14px", border: "1px solid #282828", borderRadius: "4px", fontSize: "15px", backgroundColor: "#181818", color: "#ffffff", marginBottom: "16px", outline: "none" }} />
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "20px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "7px 14px", border: "none", borderRadius: "2px", backgroundColor: activeCategory === cat ? "#ffffff" : "#282828", color: activeCategory === cat ? "#000000" : "#b3b3b3", fontSize: "13px", fontWeight: activeCategory === cat ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: activeCategory === cat ? "0.02em" : "0" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: "15px", color: "#535353", textAlign: "center", padding: "40px 0" }}>No results found.</p>
        )}
        {filtered.map(r => (
          <div key={r.name} style={{ borderRadius: "8px", padding: "18px", backgroundColor: "#181818", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", flex: 1, paddingRight: "8px" }}>{r.name}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#535353", backgroundColor: "#282828", padding: "3px 8px", borderRadius: "2px", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.06em" }}>{r.category.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: "13px", color: "#b3b3b3", lineHeight: 1.5, marginBottom: "12px" }}>{r.desc}</div>
            {r.location && <div style={{ fontSize: "12px", color: "#535353", marginBottom: "2px" }}>{r.location}</div>}
            {r.hours && <div style={{ fontSize: "12px", color: "#535353", marginBottom: "12px" }}>{r.hours}</div>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {r.phone && (
                <a href={`tel:${r.phone}`} style={{ padding: "8px 14px", backgroundColor: "#1db954", color: "#000000", borderRadius: "4px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em" }}>
                  CALL {r.phone}
                </a>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", border: "1px solid #282828", color: "#b3b3b3", borderRadius: "4px", fontSize: "12px" }}>
                  Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}