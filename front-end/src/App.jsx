import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import Dashboard from "./page/Dashboard"
import ProfilePage from "./page/ProfilePage"

function App() {
  const location = useLocation()
  const fullWidthPages = ["/dashboard", "/profile"]
  const showNavbar = !fullWidthPages.includes(location.pathname)
  const isFullWidth = fullWidthPages.includes(location.pathname)
  const wrapperClass = isFullWidth ? "min-h-screen" : "container mx-auto px-10"

  return (
    <div className={wrapperClass}>
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<></>} />
        <Route path="/venue" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/venue/:id" element={<BookingDetailPage />} />
      </Routes>
    </div>
  )
}

export default App