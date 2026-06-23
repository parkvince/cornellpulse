import { Routes, Route, useLocation, Link, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import HomePage from "./pages/HomePage"
import CheckInPage from "./pages/CheckInPage"
import ResourcesPage from "./pages/ResourcesPage"
import PeerPage from "./pages/PeerPage"
import AdminPage from "./pages/AdminPage"
import OnboardingPage from "./pages/OnboardingPage"

const CORAL = "#FF5A5F"

function BottomNav() {
  const location = useLocation()
  const hide = ["/admin", "/onboarding"].includes(location.pathname)
  if (hide) return null

  const tabs = [
    {
      path: "/",
      label: "Home",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? CORAL : "none"} stroke={active ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9" stroke={active ? CORAL : "#717171"}/>
        </svg>
      )
    },
    {
      path: "/checkin",
      label: "Check In",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      )
    },
    {
      path: "/peer",
      label: "Connect",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      )
    },
    {
      path: "/resources",
      label: "Resources",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? CORAL : "#717171"} strokeWidth="1.8">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      )
    },
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
      paddingBottom: "24px",
      paddingTop: "10px",
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <Link key={tab.path} to={tab.path} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            color: active ? CORAL : "#717171",
            fontSize: "10px",
            fontWeight: active ? 600 : 400,
            textDecoration: "none",
          }}>
            {tab.icon(active)}
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default function App() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    setOnboarded(!!localStorage.getItem("cornellpulse_onboarded"))
  }, [])

  if (onboarded === null) return null

  return (
    <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#fff8f7" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "90px" }}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={onboarded ? <HomePage /> : <Navigate to="/onboarding" />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/peer" element={<PeerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}