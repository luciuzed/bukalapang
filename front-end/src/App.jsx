import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Navbar from "./components/Navbar"

import LoginPage from "./page/LoginPage"
import BookingPage from "./page/BookingPage"
import BookingDetailPage from "./page/BookingDetailPage"
import AdminDashboard from "./page/AdminDashboard"
import AdminManageField from "./page/AdminManageField"
import AdminManageSlot from "./page/AdminManageSlot"
import AdminBooking from "./page/AdminBooking"
import AdminPaymentQr from "./page/AdminPaymentQr"
import AdminSecurityInfo from "./page/AdminSecurityInfo"
import UserBooking from "./page/UserBooking"
import UserSecurityInfo from "./page/UserSecurityInfo"
import Payment from "./page/Payment"
import Home from "./page/Home"
import About from "./page/About"
import Contact from "./page/Contact"


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
      return <Navigate to="/admin/dashboard" replace />
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
    const redirectPath = adminSession ? '/admin/dashboard' : '/venue'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

function App() {
  const location = useLocation()
  const fullWidthPages = ["/admin/dashboard", "/bookings", "/user/security-info", "/admin/manage-field", "/admin/manage-booking", "/admin/payment-method", "/admin/security-info", "/", "/contact"]
  const paymentPages = location.pathname.match(/^\/payment\//)
  const fieldManagePages = location.pathname.match(/^\/admin\/manage-field\/courts\/[^/]+$/)
  const showNavbar = !fullWidthPages.includes(location.pathname) && !paymentPages && !fieldManagePages
  const isHome = location.pathname === "/"
  const isContact = location.pathname === "/contact"
  const finalShowNavbar = showNavbar || isHome || isContact
  const isFullWidth = fullWidthPages.includes(location.pathname) || Boolean(fieldManagePages)
  const wrapperClass = isFullWidth ? "min-h-screen" : "container mx-auto px-10"

  return (
    <div className={wrapperClass}>
      {finalShowNavbar && (
        <div className={isFullWidth ? "container mx-auto px-10" : ""}>
            <Navbar />
        </div>
      )}   
      
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/about" element={<About />} /> */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/venue" element={<BookingPage />} 
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
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/manage-field" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageField />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/manage-field/courts/:fieldId"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageSlot />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/manage-booking" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminBooking />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/payment-method"
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
          path="/bookings"
          element={
            <ProtectedRoute allowedRole="user">
              <UserBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/security-info"
          element={
            <ProtectedRoute allowedRole="user">
              <UserSecurityInfo />
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