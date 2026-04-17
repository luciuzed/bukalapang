import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import pendingIcon from '../assets/pending.svg'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import LoadingOverlay from '../components/LoadingOverlay'
import ProfileSidebar from '../components/ProfileSidebar'
import SuccessMessage from '../components/SuccessMessage'
import ConfirmationModal from './ConfirmationModal'
import { apiUrl, API_BASE_URL } from '../config/api'

const getAccountId = (session) =>
  session?.id ?? session?.userId ?? session?.user_id ?? session?.accountId ?? null

const formatBookingDate = (value) => {
  if (!value) return '--'

  const raw = String(value).trim()
  const datePartMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!datePartMatch) return '--'

  const year = Number(datePartMatch[1])
  const month = Number(datePartMatch[2])
  const day = Number(datePartMatch[3])

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return '--'

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatSlotDatesFromTimeSlots = (timeSlots) => {
  if (!timeSlots) return ['--']

  const slotParts = String(timeSlots)
    .split(',')
    .map((slot) => slot.trim())
    .filter(Boolean)

  const seen = new Set()
  const formattedDates = []

  slotParts.forEach((slot) => {
    const dateMatch = slot.match(/(\d{4}-\d{2}-\d{2})/)
    if (!dateMatch) return

    const dateToken = dateMatch[1]
    if (seen.has(dateToken)) return

    const formatted = formatBookingDate(dateToken)
    if (formatted !== '--') {
      seen.add(dateToken)
      formattedDates.push(formatted)
    }
  })

  return formattedDates.length ? formattedDates : ['--']
}

const formatFieldLabel = (fieldName, category) => {
  if (!fieldName) return 'Booking'
  return category ? `${fieldName} (${category})` : fieldName
}

const formatTimeValue = (value) => {
  if (!value) return '--'

  const timeString = String(value).trim()
  const timeMatch = timeString.match(/(\d{2}:\d{2})/)
  return timeMatch ? timeMatch[1] : timeString
}

const formatTimeSlots = (timeSlots) => {
  if (!timeSlots) return ['--']

  const formattedSlots = String(timeSlots)
    .split(',')
    .map((slot) => slot.trim())
    .filter(Boolean)
    .map((slot) => {
      const [startTime, endTime] = slot.split(' - ')
      const formattedStart = formatTimeValue(startTime)
      const formattedEnd = formatTimeValue(endTime)

      return `${formattedStart} - ${formattedEnd}`
    })

  return formattedSlots.length ? formattedSlots : ['--']
}

const formatRupiahAmount = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '--'
  return numericValue.toLocaleString('id-ID')
}

const fetchBookingHistory = async (accountId, signal) => {
  const response = await fetch(`${API_BASE_URL}/bookings/user/${encodeURIComponent(accountId)}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch booking history')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

const formatBookingStatus = (status) => {
  const normalizedStatus = (status || '').toLowerCase()

  switch (normalizedStatus) {
    case 'confirmed':
      return { label: 'Confirmed', badgeClass: 'bg-primary', icon: 'check' }
    case 'pending':
      return { label: 'Pending', badgeClass: 'bg-[#ff8904]', icon: 'pending' }
    case 'cancelled':
      return { label: 'Rejected', badgeClass: 'bg-red-600', icon: 'x' }
    case 'failed':
      return { label: 'Cancelled', badgeClass: 'bg-red-600', icon: 'x' }
    case 'unpaid':
      return { label: 'Unpaid', badgeClass: 'bg-[#ff8904]', icon: null }
    default:
      return {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
        badgeClass: 'bg-gray-400',
        icon: null,
      }
  }
}

const StatusBadgeIcon = ({ icon, className = 'w-3.5 h-3.5 shrink-0' }) => {
  if (icon === 'check') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
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
    )
  }

  if (icon === 'x') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
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
    )
  }

  if (icon === 'pending') {
    return (
      <img src={pendingIcon} alt="" aria-hidden="true" className={className} />
    )
  }

  return null
}

const BookingCard = ({ booking, displayName, statusInfo, navigate, onRequestCancel }) => {
  const renderWrappedValue = (value) => {
    if (!Array.isArray(value)) {
      return <span className="font-bold text-gray-700 flex-1 min-w-0">{value || '--'}</span>
    }

    return (
      <span className="font-bold text-gray-700 flex-1 min-w-0 flex flex-wrap content-start gap-x-6 gap-y-1">
        {value.map((item, index) => (
          <span key={`${item}-${index}`} className="whitespace-nowrap shrink-0">{item}</span>
        ))}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className={`absolute top-6 right-6 inline-flex items-center gap-1.5 font-bold px-4 py-1.5 text-[10px] rounded-full shrink-0 uppercase tracking-widest ${statusInfo.badgeClass} text-white`}>
        <StatusBadgeIcon icon={statusInfo.icon} />
        <span className="leading-none">{statusInfo.label}</span>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800">#{booking.id} {displayName}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Booking Date</span>
          <span className="font-bold text-gray-700">{formatBookingDate(booking.booking_date)}</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Date</span>
          {renderWrappedValue(formatSlotDatesFromTimeSlots(booking.time_slots))}
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Venue</span>
          <span className="font-bold text-gray-700">{formatFieldLabel(booking.field_name)}</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Time</span>
          <div className="flex-1 min-w-0">
            {renderWrappedValue(formatTimeSlots(booking.time_slots))}
            <div className="mt-4 text-base font-bold text-primary">Rp {formatRupiahAmount(booking.total_amount)}</div>
          </div>
        </div>
      </div>

      {booking.status === 'unpaid' && Boolean(booking.payment_id) && (
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onRequestCancel(booking.id)}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl cursor-pointer hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <StatusBadgeIcon icon="x" className="w-4 h-4 shrink-0" />
            Cancel
          </button>

          <button
            type="button"
            onClick={() => navigate(`/payment/${booking.payment_id}`)}
            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl cursor-pointer hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <StatusBadgeIcon icon="check" className="w-4 h-4 shrink-0" />
            Confirm Payment
          </button>
        </div>
      )}
    </div>
  )
}

const BookingsList = ({ user, bookings, loadingBookings, navigate, onRequestCancel, statusFilter, setStatusFilter }) => {
  const [venueQuery, setVenueQuery] = useState('')
  const displayName = (user.name || 'Guest').toUpperCase()

  if (loadingBookings) {
    return <LoadingOverlay show />
  }

  const filteredBookings = bookings.filter((booking) => {
    const venueName = String(booking.field_name || booking.venue_name || booking.venue || '')
    const matchesVenue = venueQuery.trim()
      ? venueName.toLowerCase().includes(venueQuery.trim().toLowerCase())
      : true
    const matchesStatus = statusFilter === 'all'
      ? true
      : (booking.status || '').toLowerCase() === statusFilter

    return matchesVenue && matchesStatus
  })

  return (
    <div>
      <div className="mb-5">
        <AdminSectionBreadcrumb label="Booking History" />
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-800">My Bookings</h1>
        <button
          type="button"
          onClick={() => navigate('/venue')}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:opacity-90 transition font-semibold text-sm cursor-pointer"
        >
          <span className="text-white font-black text-base leading-none">+</span> Add Booking
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Venue..."
          value={venueQuery}
          onChange={(event) => setVenueQuery(event.target.value)}
          className="flex-1 min-w-75 bg-white border border-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Rejected</option>
          <option value="failed">Cancelled</option>
        </select>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusInfo = formatBookingStatus(booking.status)
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                displayName={displayName}
                statusInfo={statusInfo}
                navigate={navigate}
                onRequestCancel={onRequestCancel}
              />
            )
          })}
        </div>
      ) : (
        <div className="py-10 text-center text-gray-500 font-medium">
          No matching bookings found
        </div>
      )}
    </div>
  )
}

const UserBooking = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@example.com' })
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [isCancelProcessing, setIsCancelProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    Cookies.remove('user_session')
    navigate('/login')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const requestedStatus = params.get('status')

    if (requestedStatus === 'all' || requestedStatus === 'unpaid' || requestedStatus === 'pending' || requestedStatus === 'confirmed' || requestedStatus === 'cancelled' || requestedStatus === 'failed') {
      setStatusFilter(requestedStatus)
    }
  }, [location.search])

  useEffect(() => {
    const session = Cookies.get('user_session')

    if (!session) {
      setLoadingBookings(false)
      return
    }

    try {
      const parsedData = JSON.parse(session)
      setUser(parsedData)
    } catch (error) {
      console.error('Failed to parse user session:', error)
      setLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    const accountId = getAccountId(user)

    if (!accountId) {
      setBookings([])
      setLoadingBookings(false)
      return
    }

    const controller = new AbortController()

    const fetchBookings = async () => {
      try {
        setLoadingBookings(true)
        const response = await fetch(`${API_BASE_URL}/bookings/user/${encodeURIComponent(accountId)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch booking history')
        }

        const data = await response.json()
        setBookings(Array.isArray(data) ? data : [])
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to load booking history:', error)
          setBookings([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBookings(false)
        }
      }
    }

    fetchBookings()

    return () => controller.abort()
  }, [user])

  const refreshBookings = async () => {
    const accountId = getAccountId(user)
    if (!accountId) return

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/user/${encodeURIComponent(accountId)}`)
      if (!response.ok) return
      const data = await response.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (refreshError) {
      console.error('Failed to refresh booking history:', refreshError)
    }
  }

  const openCancelModal = (bookingId) => {
    setError('')
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
      setError('')

      const response = await fetch(apiUrl(`/bookings/${bookingToCancel}/cancel`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'user' }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error || 'Failed to cancel booking')
        return
      }

      setSuccess({ id: Date.now(), message: 'Booking marked as failed successfully' })
      setBookingToCancel(null)
      await refreshBookings()
    } catch (cancelError) {
      console.error('Cancel booking error:', cancelError)
      setError('Unable to connect to server')
    } finally {
      setIsCancelProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuccessMessage message={success?.message} triggerKey={success?.id} onClose={() => setSuccess(null)} />
      <ProfileSidebar userName={user.name} userEmail={user.email} handleLogout={handleLogout} />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <BookingsList
            user={user}
            bookings={bookings}
            loadingBookings={loadingBookings}
            navigate={navigate}
            onRequestCancel={openCancelModal}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={bookingToCancel !== null}
        onClose={closeCancelModal}
        onConfirm={handleCancelBooking}
        actionText="mark this booking as failed"
        confirmLabel="Confirm"
        returnLabel="Return"
        isProcessing={isCancelProcessing}
      />
    </div>
  )
}

export default UserBooking
