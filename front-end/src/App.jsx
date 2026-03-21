import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import AdminDashboard from "./page/AdminDashboard"

function App() {
  const location = useLocation()
  const hideNavbarOn = ["/dashboard"]
  const showNavbar = !hideNavbarOn.includes(location.pathname)
  const isDashboard = location.pathname === "/dashboard"
  const wrapperClass = isDashboard ? "min-h-screen" : "container mx-auto px-10"

  return (
    <div className={wrapperClass}>
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<></>} />
        <Route path="/venue" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/venue/:id" element={<BookingDetailPage />} />
      </Routes>
    </div>
  )
}

export default App