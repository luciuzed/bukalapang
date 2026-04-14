import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Navbar from "./components/navbar"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import AdminDashboard from "./page/AdminDashboard"
import AdminManageField from "./page/AdminManageField"
import AdminManageSlot from "./page/AdminManageSlot"
import AdminBooking from "./page/AdminBooking"
import AdminPaymentQr from "./page/AdminPaymentQr"
import AdminSecurityInfo from "./page/AdminSecurityInfo"
import ProfilePage from "./page/ProfilePage"
import Payment from "./page/Payment"
import Home from "./page/Home"
import About from "./page/About"

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
  const fullWidthPages = ["/dashboard", "/profile", "/field", "/booking", "/admin/payment-qr", "/admin/security-info"]
  const paymentPages = location.pathname.match(/^\/payment\//)
  const fieldManagePages = location.pathname.match(/^\/field\/manage\/[^/]+$/)
  const showNavbar = !fullWidthPages.includes(location.pathname) && !paymentPages && !fieldManagePages
  const isFullWidth = fullWidthPages.includes(location.pathname) || Boolean(fieldManagePages)
  const wrapperClass = isFullWidth ? "min-h-screen" : "container mx-auto px-10"

  return (
    <div className={wrapperClass}>
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route 
          path="/venue" 
          element={<BookingPage />} 
        />
        <Route 
          path="/venues" 
          element={<BookingPage />} 
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
          path="/field" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageField />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/field/manage/:fieldId"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageSlot />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/booking" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminBooking />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/payment-qr"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPaymentQr />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-info"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminSecurityInfo />
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
          element={<BookingDetailPage />} 
        />
        <Route 
          path="/venues/:id" 
          element={<BookingDetailPage />} 
        />
        <Route 
          path="/payment" 
          element={<Navigate to="/venue" replace />} 
        />
        <Route 
          path="/payment/:paymentId" 
          element={
            <ProtectedRoute allowedRole="user">
              <Payment />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App