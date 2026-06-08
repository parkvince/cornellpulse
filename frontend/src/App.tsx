import { Routes, Route, useLocation, Link } from "react-router-dom"
import HomePage from "./pages/HomePage"
import CheckInPage from "./pages/CheckInPage"
import ResourcesPage from "./pages/ResourcesPage"
import PeerSignupPage from "./pages/PeerSignupPage"
import DisclaimerBanner from "./components/shared/DisclaimerBanner"

function BottomNav() {
  const location = useLocation()
  const tabs = [
    { path: "/", label: "Home", icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    )},
    { path: "/checkin", label: "Check In", icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/></svg>
    )},
    { path: "/peer", label: "Connect", icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
    )},
    { path: "/resources", label: "Resources", icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
    )},
  ]

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "430px",
      backgroundColor: "#ffffff",
      borderTop: "1px solid #ebebeb",
      display: "flex",
      zIndex: 100,
      paddingBottom: "20px",
      paddingTop: "8px",
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              color: active ? "#1a1a1a" : "#c0c0c0",
              fontSize: "10px",
              fontWeight: active ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default function App() {
  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f9f9f9" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/peer" element={<PeerSignupPage />} />
          <Route path="/admin" element={<div style={{ padding: "24px" }}>Admin access only.</div>} />
        </Routes>
        <DisclaimerBanner />
      </div>
      <BottomNav />
    </div>
  )
}