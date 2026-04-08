import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/navbar"

import Home from "./components/home"
import Reserve from "./components/reserve"
import About from "./components/about"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import AdminDashboard from "./page/AdminDashboard"
import VenueDetail from "./components/VenueDetail"

function App() {
  const location = useLocation()
  const hideNavbarOn = ["/dashboard"]
  const showNavbar = !hideNavbarOn.includes(location.pathname)
  const isDashboard = location.pathname === "/dashboard"

  return (
    <div className={isDashboard ? "min-h-screen" : "min-h-screen flex flex-col"}>
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reserve" element={<Reserve />} />
        <Route path="/about" element={<About />} />
        <Route path="/venue/:id" element={<VenueDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App