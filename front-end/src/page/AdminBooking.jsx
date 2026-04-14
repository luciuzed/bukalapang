import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiBarChart2, FiBriefcase, FiGrid, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiTrendingUp, FiAward, FiUsers, FiCalendar, FiCreditCard } from 'react-icons/fi'
import Cookies from 'js-cookie'
import LoadingOverlay from '../components/LoadingOverlay'
import Sidebar from '../components/Sidebar'
import ConfirmationModal from './ConfirmationModal'
import SuccessMessage from '../components/SuccessMessage'
import { apiUrl } from '../config/api'

const AdminBooking = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [isCancelProcessing, setIsCancelProcessing] = useState(false)

  const showSuccessMessage = (message) => setSuccess({ id: Date.now(), message })

  // Check admin session on mount
  useEffect(() => {
    const adminCookie = Cookies.get('admin_session')
    const adminSession = JSON.parse(localStorage.getItem('adminId') || 'null')

    if (!adminSession && !adminCookie) {
      navigate('/login')
      return
    }

    // Always prefer cookie data as it has all the info
    if (adminCookie) {
      const sessionData = JSON.parse(adminCookie)
      setAdminId(sessionData.adminId)
      setAdminName(sessionData.adminName)
      setAdminEmail(sessionData.email)
      localStorage.setItem('adminId', sessionData.adminId)
    } else if (adminSession) {
      setAdminId(adminSession)
    }
  }, [navigate])

  // Fetch bookings when adminId is set
  useEffect(() => {
    if (adminId) {
      fetchBookings()
    }
  }, [adminId])

  useEffect(() => {
    if (loading || !location.hash) return

    const targetId = location.hash.slice(1)
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading, location.hash, bookings])

  const fetchBookings = async () => {
    try {
      const response = await fetch(apiUrl(`/bookings/admin/${adminId}`))
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        setError('Failed to load bookings')
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

  const handleConfirmBooking = async (bookingId) => {
    try {
      setSuccess(null)
      setError('')
      const response = await fetch(apiUrl(`/bookings/${bookingId}/confirm`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        showSuccessMessage('Booking confirmed successfully')
        fetchBookings()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to confirm booking')
      }
    } catch (err) {
      console.error('Confirm error:', err)
      setError('Unable to connect to server')
    }
  }

  const openCancelModal = (bookingId) => {
    setBookingToCancel(bookingId)
  }

  const closeCancelModal = () => {
    if (isCancelProcessing) return
    setBookingToCancel(null)
  }

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return

    try {
      setIsCancelProcessing(true)
      setSuccess(null)
      setError('')
      const response = await fetch(apiUrl(`/bookings/${bookingToCancel}/cancel`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        showSuccessMessage('Booking cancelled successfully')
        fetchBookings()
        setBookingToCancel(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to cancel booking')
      }
    } catch (err) {
      console.error('Cancel error:', err)
      setError('Unable to connect to server')
    } finally {
      setIsCancelProcessing(false)
    }
  }

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, path: '/dashboard' },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid, path: '/field' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/booking' },
    { id: 'payment-qr', label: 'Payment QR', icon: FiCreditCard, path: '/admin/payment-qr' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />
      <Sidebar
        activeTabId="bookings"
        adminName={adminName}
        adminEmail={adminEmail}
        handleLogout={handleLogout}
        tabItems={tabItems}
      />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 md:p-10 overflow-y-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {/* BOOKINGS MANAGEMENT */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight">Bookings</h1>
              <p className="text-gray-600 text-sm">All bookings for your fields</p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-medium">No bookings yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    id={`booking-${booking.id}`}
                    className={`bg-white rounded-2xl shadow-sm border transition hover:shadow-md overflow-hidden ${
                      booking.status === 'pending' ? 'border-gray-300' :
                      'border-gray-200'
                    }`}
                  >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{booking.field_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Booking ID: #{booking.id}</p>
                      </div>
                        <span className={`inline-flex items-center gap-1.5 font-bold px-4 py-1.5 text-[10px] rounded-full shrink-0 uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-primary text-white' :
                          booking.status === 'pending' ? 'bg-[#ff8904] text-white' :
                          'bg-red-500 text-white'}`}>

                          {booking.status === 'confirmed' && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 13l4 4L19 7"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>Confirmed</span>
                            </span>
                          )}
                          
                          {booking.status === 'pending' && (
                              <>
                                  <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="12" 
                                      height="12" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2.5" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                  >
                                      <path d="M5 22h14" />
                                      <path d="M5 2h14" />
                                      <path d="M17 22c0-4-3-6-5-8-2 2-5 4-5 8" />
                                      <path d="M17 2c0 4-3 6-5 8-2-2-5-4-5-8" />
                                  </svg>
                                  <span>Pending</span>
                              </>
                          )}

                          {booking.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M6 6l12 12M18 6l-12 12"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>Cancelled</span>
                            </span>
                          )}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-900 font-semibold mt-1">{booking.user_name}</p>
                        <p className="text-gray-500 text-xs mt-3">{booking.user_email}</p>
                        {booking.user_phone && (
                          <p className="text-gray-500 text-xs mt-1">{booking.user_phone}</p>
                        )}
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium mb-2">Time Slots</p>
                          <div className="flex flex-wrap gap-2">
                            {booking.time_slots.split(',').map((slot, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-gray-100 text-black text-xs font-mono rounded-full border border-gray-200"
                              >
                                {slot.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      <div>
                        <p className="text-gray-600 font-medium">Booking Date</p>
                        <p className="text-gray-900 font-semibold mt-1">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Amount</p>
                        <p className="text-primary font-bold text-lg mt-1">
                          Rp {parseInt(booking.total_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => openCancelModal(booking.id)}
                          className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-700 transition inline-flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-4 h-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 6l12 12M18 6l-12 12"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary transition flex items-center gap-2"
                        >
                          <FiCheck size={16} />
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </main>

      {/* LOADING OVERLAY */}
      <LoadingOverlay show={loading} />

      <ConfirmationModal
        isOpen={bookingToCancel !== null}
        onClose={closeCancelModal}
        onConfirm={handleCancelBooking}
        actionText="cancel this booking"
        isProcessing={isCancelProcessing}
      />
    </div>
  )
}

export default AdminBooking