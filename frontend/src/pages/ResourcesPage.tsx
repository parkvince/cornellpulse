import { useState } from "react"

const CATEGORIES = ["All", "Cornell", "Crisis", "Community", "Stress Relief", "Physical"]

const resources = [
  // Cornell Official
  {
    category: "Cornell",
    name: "CAPS Individual Therapy",
    phone: "607-255-5155",
    url: "https://health.cornell.edu/services/mental-health-care",
    desc: "One-on-one counseling with a licensed therapist. Call to schedule an Access Appointment within 1-2 days.",
    location: "Gannett Health Center, 110 Ho Plaza",
    hours: "Mon-Fri 8:30am-4:30pm",
    tags: ["therapy", "counseling", "free"],
  },
  {
    category: "Cornell",
    name: "Let's Talk Drop-In",
    phone: null,
    url: "https://health.cornell.edu/services/mental-health-care/lets-talk",
    desc: "Informal 15-20 minute conversations with a CAPS counselor. No appointment, no paperwork.",
    location: "Various campus locations, check website",
    hours: "Mon-Fri, varies by location",
    tags: ["drop-in", "free", "no appointment"],
  },
  {
    category: "Cornell",
    name: "EARS Peer Counseling",
    phone: "607-255-4050",
    url: "https://ears.cornell.edu",
    desc: "Confidential peer counseling with trained Cornell students. No judgment, just someone who gets it.",
    location: "305 Willard Straight Hall",
    hours: "Sun-Thu 9pm-1am",
    tags: ["peer", "free", "evening"],
  },
  {
    category: "Cornell",
    name: "Cornell Health 24/7 Line",
    phone: "607-255-5155",
    url: "https://health.cornell.edu",
    desc: "Talk to a health professional any time. Press 2 for after-hours mental health support.",
    location: "Phone only",
    hours: "24/7 including holidays",
    tags: ["24/7", "phone", "free"],
  },
  {
    category: "Cornell",
    name: "CAPS Group Therapy",
    phone: "607-255-5155",
    url: "https://health.cornell.edu/services/mental-health-care",
    desc: "Therapist-led groups for anxiety, grief, identity, relationships, and more. Free and confidential.",
    location: "Gannett Health Center",
    hours: "Varies by group",
    tags: ["group", "free", "therapy"],
  },
  {
    category: "Cornell",
    name: "Headspace App",
    phone: null,
    url: "https://www.headspace.com/studentplan",
    desc: "Free meditation and sleep app for all Cornell students. Sign up with your Cornell email.",
    location: "Online / Mobile app",
    hours: "Always available",
    tags: ["app", "free", "meditation", "sleep"],
  },
  {
    category: "Cornell",
    name: "Office of Diversity and Inclusion",
    phone: "607-255-4857",
    url: "https://diversity.cornell.edu",
    desc: "Counseling and support for students of color, LGBTQ+ students, first-gen students, and international students.",
    location: "626 Thurston Ave",
    hours: "Mon-Fri 8am-5pm",
    tags: ["identity", "diversity", "free"],
  },
  {
    category: "Cornell",
    name: "LGBT Resource Center",
    phone: "607-255-6482",
    url: "https://lgbtq.cornell.edu",
    desc: "Community, support, and resources for LGBTQ+ students. Individual support and referrals to affirming counselors.",
    location: "626 Thurston Ave",
    hours: "Mon-Fri 9am-5pm",
    tags: ["lgbtq", "identity", "free"],
  },
  {
    category: "Cornell",
    name: "Financial Aid Emergency Fund",
    phone: "607-255-5145",
    url: "https://finaid.cornell.edu/emergency-fund",
    desc: "Emergency grants for unexpected expenses. You do not need to pay them back.",
    location: "203 Day Hall",
    hours: "Mon-Fri 8am-5pm",
    tags: ["financial", "emergency", "free"],
  },
  {
    category: "Cornell",
    name: "Cornell Basic Needs",
    phone: null,
    url: "https://basicneeds.cornell.edu",
    desc: "Food pantry, emergency housing, and basic needs support for students. No questions asked.",
    location: "Multiple locations",
    hours: "Check website",
    tags: ["food", "housing", "emergency", "free"],
  },
  {
    category: "Cornell",
    name: "Cornell Sleep Health Program",
    phone: "607-255-5155",
    url: "https://health.cornell.edu/services/health-coaching",
    desc: "Evidence-based coaching for sleep problems. CBT techniques for insomnia and sleep disruption.",
    location: "Gannett Health Center",
    hours: "Mon-Fri 8am-5pm",
    tags: ["sleep", "free", "coaching"],
  },
  {
    category: "Cornell",
    name: "Graduate Student Mental Health",
    phone: "607-255-5155",
    url: "https://gradschool.cornell.edu/student-life/health-and-wellness",
    desc: "CAPS counselors specializing in grad student concerns -- advisor stress, dissertation anxiety, imposter syndrome.",
    location: "Gannett Health Center",
    hours: "Mon-Fri 8:30am-4:30pm",
    tags: ["graduate", "free", "therapy"],
  },
  {
    category: "Cornell",
    name: "University Advocate",
    phone: "607-255-4321",
    url: "https://advocate.cornell.edu",
    desc: "Free confidential support navigating Cornell policies, academic difficulties, and conflicts with faculty.",
    location: "160 Day Hall",
    hours: "Mon-Fri 9am-5pm",
    tags: ["advocacy", "academic", "free"],
  },
  {
    category: "Cornell",
    name: "Skorton Center for Health Initiatives",
    phone: "607-255-6074",
    url: "https://health.cornell.edu/about/skorton-center",
    desc: "Health coaching, wellness programs, and stress management workshops for Cornell students.",
    location: "Gannett Health Center",
    hours: "Mon-Fri 8am-5pm",
    tags: ["wellness", "coaching", "workshops", "free"],
  },
  {
    category: "Cornell",
    name: "CU Sober",
    phone: null,
    url: "https://health.cornell.edu/resources/health-topics/alcohol-other-drugs",
    desc: "Support for students navigating alcohol or substance concerns. Confidential and non-judgmental.",
    location: "Gannett Health Center",
    hours: "Mon-Fri 8:30am-4:30pm",
    tags: ["substance", "alcohol", "free"],
  },

  // Crisis
  {
    category: "Crisis",
    name: "988 Suicide and Crisis Lifeline",
    phone: "988",
    url: "https://988lifeline.org",
    desc: "Call or text 988. Trained crisis counselor available within seconds. Free and confidential 24/7.",
    location: "Phone / Text",
    hours: "24/7",
    tags: ["crisis", "24/7", "free"],
  },
  {
    category: "Crisis",
    name: "Crisis Text Line",
    phone: "741741",
    url: "https://www.crisistextline.org",
    desc: "Text HOME to 741741. Free confidential crisis counseling by text, 24/7.",
    location: "Text only",
    hours: "24/7",
    tags: ["crisis", "text", "24/7", "free"],
  },
  {
    category: "Crisis",
    name: "Cornell Crisis Response",
    phone: "607-255-1111",
    url: null,
    desc: "Call Cornell Police and ask for the on-call mental health crisis manager. They can send someone to you on campus.",
    location: "On campus",
    hours: "24/7",
    tags: ["crisis", "on-campus", "24/7"],
  },
  {
    category: "Crisis",
    name: "Cayuga Medical Center ER",
    phone: "607-274-4011",
    url: "https://www.cayugamed.org",
    desc: "Emergency psychiatric care at Ithaca's main hospital if you need immediate in-person help.",
    location: "101 Dates Drive, Ithaca",
    hours: "24/7",
    tags: ["crisis", "emergency", "hospital"],
  },

  // Community Ithaca
  {
    category: "Community",
    name: "Ithaca Crisis Line",
    phone: "607-272-1616",
    url: null,
    desc: "Local Ithaca crisis and emotional support line. Free and confidential. Staffed by trained volunteers.",
    location: "Phone only",
    hours: "24/7",
    tags: ["crisis", "local", "free"],
  },
  {
    category: "Community",
    name: "Suicide Prevention and Crisis Service of Tompkins County",
    phone: "607-272-1616",
    url: "https://www.spcs.org",
    desc: "Local mental health crisis services, counseling, and community support programs.",
    location: "Ithaca, NY",
    hours: "24/7 crisis line, office hours Mon-Fri",
    tags: ["crisis", "local", "counseling"],
  },
  {
    category: "Community",
    name: "Cayuga Medical Behavioral Health",
    phone: "607-274-4300",
    url: "https://www.cayugamed.org/behavioral-health",
    desc: "Outpatient mental health services in Ithaca. Sliding scale fees available for students not covered by insurance.",
    location: "17 Thornwood Drive, Ithaca",
    hours: "Mon-Fri 8am-5pm",
    tags: ["therapy", "local", "outpatient"],
  },
  {
    category: "Community",
    name: "Family and Children's Service of Ithaca",
    phone: "607-273-7494",
    url: "https://www.fcsith.org",
    desc: "Community counseling and mental health services. Sliding scale fees. Open to Cornell students.",
    location: "127 W State St, Ithaca",
    hours: "Mon-Fri 8:30am-5pm",
    tags: ["counseling", "local", "sliding scale"],
  },
  {
    category: "Community",
    name: "GLAAD Finger Lakes LGBTQ Center",
    phone: "607-277-0015",
    url: "https://flgbtqcenter.org",
    desc: "LGBTQ+ community center in Ithaca offering support groups, counseling referrals, and community events.",
    location: "301 W State St, Ithaca",
    hours: "Mon-Fri noon-8pm, Sat noon-5pm",
    tags: ["lgbtq", "local", "community"],
  },

  // Stress Relief Places
  {
    category: "Stress Relief",
    name: "Helen Newman Fitness Center",
    phone: null,
    url: "https://recreation.athletics.cornell.edu/facilities/helen-newman",
    desc: "Free for Cornell students. Cardio machines, weights, group fitness classes. Exercise is one of the most effective stress relievers.",
    location: "Helen Newman Hall",
    hours: "Mon-Fri 6am-11pm, weekends 8am-9pm",
    tags: ["gym", "exercise", "free", "on-campus"],
  },
  {
    category: "Stress Relief",
    name: "Noyes Community Recreation Center",
    phone: null,
    url: "https://recreation.athletics.cornell.edu/facilities/noyes",
    desc: "Pool, fitness center, and recreation space. Free for Cornell students. Great for swimming laps to decompress.",
    location: "Noyes Community Center",
    hours: "Mon-Fri 6am-11pm, weekends 8am-9pm",
    tags: ["gym", "pool", "exercise", "free", "on-campus"],
  },
  {
    category: "Stress Relief",
    name: "Bartels Hall Fitness Center",
    phone: null,
    url: "https://recreation.athletics.cornell.edu/facilities/bartels",
    desc: "Another free campus gym with cardio, weights, and courts. Less crowded than Helen Newman.",
    location: "Bartels Hall",
    hours: "Mon-Fri 6am-11pm, weekends 8am-9pm",
    tags: ["gym", "exercise", "free", "on-campus"],
  },
  {
    category: "Stress Relief",
    name: "Cornell Botanic Gardens",
    phone: null,
    url: "https://cornellbotanicgardens.org",
    desc: "Free, beautiful gardens on campus. Walking through nature has real mental health benefits. Great for clearing your head.",
    location: "One Plantations Rd, Ithaca",
    hours: "Dawn to dusk daily",
    tags: ["nature", "walking", "free", "outdoor"],
  },
  {
    category: "Stress Relief",
    name: "Beebe Lake Trail",
    phone: null,
    url: null,
    desc: "A quiet trail loop around Beebe Lake on the north end of campus. One of the most calming walks at Cornell.",
    location: "North Campus, near Triphammer Falls",
    hours: "Always open",
    tags: ["nature", "walking", "free", "outdoor"],
  },
  {
    category: "Stress Relief",
    name: "Buttermilk Falls State Park",
    phone: "607-273-5761",
    url: "https://parks.ny.gov/parks/151",
    desc: "Stunning gorge and waterfalls just 10 minutes from campus. Hiking here genuinely resets your brain. Free entry.",
    location: "112 E Buttermilk Falls Rd, Ithaca",
    hours: "8am-dusk daily",
    tags: ["hiking", "nature", "free", "off-campus"],
  },
  {
    category: "Stress Relief",
    name: "Robert H. Treman State Park",
    phone: "607-273-3440",
    url: "https://parks.ny.gov/parks/135",
    desc: "Lucifer Falls and miles of gorge trails. A 15 minute drive from campus. One of the most beautiful places in Ithaca.",
    location: "105 Enfield Falls Rd, Ithaca",
    hours: "8am-dusk daily",
    tags: ["hiking", "nature", "off-campus"],
  },
  {
    category: "Stress Relief",
    name: "Taughannock Falls State Park",
    phone: "607-387-6739",
    url: "https://parks.ny.gov/parks/149",
    desc: "A waterfall taller than Niagara. 20 minutes from campus. Short hike with incredible payoff.",
    location: "2221 Taughannock Park Rd, Trumansburg",
    hours: "8am-dusk daily",
    tags: ["hiking", "nature", "off-campus"],
  },
  {
    category: "Stress Relief",
    name: "Cornell Orchards",
    phone: null,
    url: "https://cornellbotanicgardens.org/explore/natural-areas/cornell-orchards",
    desc: "Apple orchards and open fields right on campus. A peaceful spot to walk or just sit outside.",
    location: "Dryden Rd, Ithaca",
    hours: "Always open",
    tags: ["nature", "outdoor", "free", "on-campus"],
  },
  {
    category: "Stress Relief",
    name: "Ithaca Farmer's Market",
    phone: null,
    url: "https://www.ithacamarket.com",
    desc: "A lively outdoor market by the lake. Good food, local vendors, live music. A great way to get off campus and feel human again.",
    location: "545 Third St, Ithaca",
    hours: "Sat 9am-3pm, Sun 10am-3pm (April-December)",
    tags: ["social", "food", "off-campus", "outdoor"],
  },
  {
    category: "Stress Relief",
    name: "Ithaca Commons",
    phone: null,
    url: null,
    desc: "Downtown Ithaca pedestrian mall with shops, cafes, and restaurants. A good place to take a break from campus.",
    location: "100 block of E State St, Ithaca",
    hours: "Always open outdoors, shops vary",
    tags: ["social", "off-campus", "food"],
  },
  {
    category: "Stress Relief",
    name: "Stewart Park",
    phone: null,
    url: null,
    desc: "Free lakeside park at the south end of Cayuga Lake. Great for sitting by the water, flying a kite, or just doing nothing.",
    location: "1 James L Gibbs Dr, Ithaca",
    hours: "Dawn to dusk",
    tags: ["nature", "outdoor", "free", "off-campus"],
  },

  // Physical Health
  {
    category: "Physical",
    name: "Cornell Health Primary Care",
    phone: "607-255-5155",
    url: "https://health.cornell.edu",
    desc: "General medical care including mental health medication management. Free or low cost for Cornell students.",
    location: "110 Ho Plaza",
    hours: "Mon-Fri 8am-5pm",
    tags: ["medical", "free", "on-campus"],
  },
  {
    category: "Physical",
    name: "Cornell Yoga Classes",
    phone: null,
    url: "https://recreation.athletics.cornell.edu/group-fitness",
    desc: "Free yoga and mindfulness classes for Cornell students through campus recreation. Great for anxiety and sleep.",
    location: "Helen Newman Hall and other locations",
    hours: "Various times throughout the week",
    tags: ["yoga", "free", "on-campus", "mindfulness"],
  },
  {
    category: "Physical",
    name: "Intramural Sports",
    phone: null,
    url: "https://recreation.athletics.cornell.edu/intramurals",
    desc: "Join a casual sports team. Being part of a team is one of the best ways to combat loneliness and build community.",
    location: "Campus athletic facilities",
    hours: "Evenings and weekends",
    tags: ["sports", "social", "free", "on-campus"],
  },
  {
    category: "Physical",
    name: "Cornell Outdoor Education",
    phone: "607-255-6415",
    url: "https://outdoor.cornell.edu",
    desc: "Outdoor trips, climbing wall, and adventure programs. A great way to get outside and meet people.",
    location: "Bartels Hall",
    hours: "Mon-Fri 9am-5pm",
    tags: ["outdoor", "adventure", "social", "on-campus"],
  },
]

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = resources.filter(r => {
    const matchCategory = activeCategory === "All" || r.category === activeCategory
    const matchSearch = search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCategory && matchSearch
  })

  return (
    <div style={{ paddingBottom: "24px" }}>
      <div style={{ padding: "24px 20px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>Resources</h1>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>
          Cornell, Ithaca, and beyond. All free or low cost.
        </p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resources..."
          style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", backgroundColor: "#fff", color: "#1a1a1a", marginBottom: "16px" }}
        />
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "20px" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ padding: "7px 14px", border: activeCategory === cat ? "2px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", backgroundColor: activeCategory === cat ? "#1a1a1a" : "#fff", color: activeCategory === cat ? "#fff" : "#555", fontSize: "13px", fontWeight: activeCategory === cat ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: "15px", color: "#aaa", textAlign: "center", padding: "40px 0" }}>No results found.</p>
        )}
        {filtered.map(r => (
          <div key={r.name} style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "18px", backgroundColor: "#fff", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", flex: 1, paddingRight: "8px" }}>{r.name}</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", backgroundColor: "#f0f0f0", padding: "3px 8px", borderRadius: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>{r.category}</div>
            </div>
            <div style={{ fontSize: "14px", color: "#555", lineHeight: 1.5, marginBottom: "12px" }}>{r.desc}</div>
            {r.location && (
              <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600 }}>Location: </span>{r.location}
              </div>
            )}
            {r.hours && (
              <div style={{ fontSize: "12px", color: "#999", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600 }}>Hours: </span>{r.hours}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {r.phone && (
                <a href={`tel:${r.phone}`} style={{ padding: "8px 14px", backgroundColor: "#1a1a1a", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                  Call {r.phone}
                </a>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", border: "1px solid #e5e5e5", color: "#1a1a1a", borderRadius: "8px", fontSize: "13px", backgroundColor: "#fafafa" }}>
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