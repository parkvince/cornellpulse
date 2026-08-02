import { Routes, Route, useLocation, Link, Navigate } from "react-router-dom"
import { useState } from "react"
import HomePage from "./pages/HomePage"
import CheckInPage from "./pages/CheckInPage"
import ResourcesPage from "./pages/ResourcesPage"
import ResourceDetailPage from "./pages/ResourceDetailPage"
import PeerPage from "./pages/PeerPage"
import AdminPage from "./pages/AdminPage"
import OnboardingPage from "./pages/OnboardingPage"
import ProfilePage from "./pages/ProfilePage"
import PeerSignupPage from "./pages/PeerSignupPage"
import FeatureUnavailablePage from "./pages/FeatureUnavailablePage"
import NotFoundPage from "./pages/NotFoundPage"
import PrivacyPage from "./pages/PrivacyPage"
import { featureFlags } from "./config/featureFlags"
import EmergencyHelp from "./components/shared/EmergencyHelp"

const CORAL = "#FF5A5F"

function BottomNav() {
  const location = useLocation()
  const hide = ["/admin", "/onboarding"].includes(location.pathname)
  if (hide) return null

  const active = (path: string) => location.pathname === path || (path === "/resources" && location.pathname.startsWith("/resources/"))

  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", backgroundColor: "#ffffff", borderTop: "1px solid #ebebeb", display: "flex", alignItems: "center", zIndex: 100, paddingBottom: "24px", paddingTop: "8px" }}>

      <Link to="/" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active("/") ? CORAL : "#717171", fontSize: "10px", fontWeight: active("/") ? 600 : 400, textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active("/") ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M3 12L12 4l9 8"/>
          <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
        </svg>
        <span>Home</span>
      </Link>

      <Link to="/resources" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active("/resources") ? CORAL : "#717171", fontSize: "10px", fontWeight: active("/resources") ? 600 : 400, textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active("/resources") ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        <span>Resources</span>
      </Link>

      <Link to="/checkin" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: CORAL, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(255,90,95,0.4)", marginBottom: "2px", marginTop: "-20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 600, color: active("/checkin") ? CORAL : "#717171" }}>Check In</span>
      </Link>

      {featureFlags.peerConnect && <Link to="/peer" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active("/peer") ? CORAL : "#717171", fontSize: "10px", fontWeight: active("/peer") ? 600 : 400, textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active("/peer") ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <span>Connect</span>
      </Link>}

      <Link to="/profile" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: active("/profile") ? CORAL : "#717171", fontSize: "10px", fontWeight: active("/profile") ? 600 : 400, textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active("/profile") ? CORAL : "#717171"} strokeWidth="1.8">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-2a6 6 0 0112 0v2"/>
        </svg>
        <span>Profile</span>
      </Link>

    </div>
  )
}

export default function App() {
  const [onboarded] = useState(() => !!localStorage.getItem("cornellpulse_onboarded"))

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#fff8f7" }}>
      <div id="app-scroll-container" style={{ flex: 1, overflowY: "auto", paddingBottom: "90px", scrollPaddingBottom: "180px", WebkitOverflowScrolling: "touch" }}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={onboarded ? <HomePage /> : <Navigate to="/onboarding" />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
          <Route path="/peer" element={featureFlags.peerConnect ? <PeerPage /> : <FeatureUnavailablePage feature="Peer Connect" />} />
          <Route path="/peer/signup" element={featureFlags.supporterSignup ? <PeerSignupPage /> : <FeatureUnavailablePage feature="Supporter signup" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/admin" element={featureFlags.publicAdmin ? <AdminPage /> : <FeatureUnavailablePage feature="Admin" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <EmergencyHelp />
      <BottomNav />
    </div>
  )
}
