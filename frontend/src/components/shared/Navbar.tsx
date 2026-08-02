import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const location = useLocation()

  const links = [
    { path: "/", label: "Home" },
    { path: "/checkin", label: "Check In" },
    { path: "/heatmap", label: "Campus Map" },
    { path: "/resources", label: "Resources" },
    { path: "/profile", label: "History & Privacy" },
  ]

  return (
    <nav style={{
      borderBottom: "1px solid #e5e5e5",
      backgroundColor: "#ffffff",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "56px",
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "17px", color: "#1a1a1a" }}>
        <img src="/logo.png" alt="" width={24} height={24} />
        CornellPulse
      </Link>
      <div style={{ display: "flex", gap: "8px" }}>
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: location.pathname === link.path ? 600 : 400,
              color: location.pathname === link.path ? "#1a1a1a" : "#555",
              backgroundColor: location.pathname === link.path ? "#f0f0f0" : "transparent",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
