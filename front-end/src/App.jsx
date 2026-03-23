import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Navbar from "./components/Navbar"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import AdminDashboard from "./page/AdminDashboard"
import ProfilePage from "./page/ProfilePage"

// Protected route wrapper to redirect users based on role
const ProtectedRoute = ({ children, allowedRole }) => {
  const location = useLocation()
  const [isAuthorized, setIsAuthorized] = useState(null)

  useEffect(() => {
    const adminSession = Cookies.get('admin_session')
    const userSession = Cookies.get('user_session')

    if (allowedRole === 'admin') {
      // Only admin can access
      if (adminSession) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
      }
    } else if (allowedRole === 'user') {
      // Only regular user can access
      if (userSession && !adminSession) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
      }
    } else {
      setIsAuthorized(true)
    }
  }, [allowedRole, location.pathname])

  if (isAuthorized === null) {
    return null // Loading
  }

  if (!isAuthorized) {
    // Determine redirect path based on current session state
    const adminSession = Cookies.get('admin_session')
    const userSession = Cookies.get('user_session')

    if (adminSession) {
      return <Navigate to="/dashboard" replace />
    } else if (userSession) {
      return <Navigate to="/venue" replace />
    } else {
      return <Navigate to="/login" replace />
    }
  }

  return children
}

// Login guard - prevent logged-in users from accessing login page
const LoginGuard = ({ children }) => {
  const location = useLocation()
  const [canAccess, setCanAccess] = useState(null)

  useEffect(() => {
    const adminSession = Cookies.get('admin_session')
    const userSession = Cookies.get('user_session')

    // If user has any session, redirect them
    if (adminSession) {
      setCanAccess(false) // Admin user, redirect to dashboard
    } else if (userSession) {
      setCanAccess(false) // Regular user, redirect to venue
    } else {
      setCanAccess(true) // No session, allow access to login
    }
  }, [location.pathname])

  if (canAccess === null) {
    return null // Loading
  }

  if (!canAccess) {
    // Redirect based on session type
    const adminSession = Cookies.get('admin_session')
    const redirectPath = adminSession ? '/dashboard' : '/venue'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

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
        <Route 
          path="/venue" 
          element={
            <ProtectedRoute allowedRole="user">
              <BookingPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRole="user">
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/venue/:id" 
          element={
            <ProtectedRoute allowedRole="user">
              <BookingDetailPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App