import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import CheckInPage from "./pages/CheckInPage"
import HeatmapPage from "./pages/HeatmapPage"
import ResourcesPage from "./pages/ResourcesPage"
import Navbar from "./components/shared/Navbar"
import DisclaimerBanner from "./components/shared/DisclaimerBanner"

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </main>
      <DisclaimerBanner />
    </div>
  )
}