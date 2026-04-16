import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiBarChart2, FiCalendar, FiGrid, FiTrendingUp, FiCreditCard } from 'react-icons/fi'
import { FaShieldAlt } from 'react-icons/fa'
import LoadingOverlay from '../components/LoadingOverlay'
import Notification from '../components/Notification'
import Sidebar from '../components/Sidebar'
import SuccessMessage from '../components/SuccessMessage'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import { API_BASE_URL, apiUrl } from '../config/api'

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const LOCAL_UPLOAD_IMAGE_PATTERN = /^\/uploads\/.+\.(jpe?g|png)$/i

const resolveImageUrl = (imageUrl) => {
  if (typeof imageUrl !== 'string') return ''
  const normalized = imageUrl.trim()
  if (!LOCAL_UPLOAD_IMAGE_PATTERN.test(normalized)) return ''
  return `${BACKEND_BASE_URL}${normalized}`
}

const revenueColors = [
  'rgba(0, 110, 70, 0.95)',
  'rgba(0, 128, 76, 0.92)',
  'rgba(0, 145, 84, 0.88)',
  'rgba(0, 160, 92, 0.84)',
  'rgba(18, 175, 104, 0.80)',
  'rgba(60, 190, 120, 0.76)',
  'rgba(102, 205, 140, 0.72)',
  'rgba(150, 220, 170, 0.68)',
]

const pieViewBoxSize = 260

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0)

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return '0%'
  }

  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}%` : `${rounded.toFixed(1)}%`
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const createPieSlicePath = (centerX, centerY, radius, startAngle, endAngle) => {
  const sweepAngle = endAngle - startAngle

  if (sweepAngle >= 360) {
    const topPoint = polarToCartesian(centerX, centerY, radius, startAngle)
    const oppositePoint = polarToCartesian(centerX, centerY, radius, startAngle + 180)

    return [
      `M ${topPoint.x} ${topPoint.y}`,
      `A ${radius} ${radius} 0 1 1 ${oppositePoint.x} ${oppositePoint.y}`,
      `A ${radius} ${radius} 0 1 1 ${topPoint.x} ${topPoint.y}`,
      'Z',
    ].join(' ')
  }

  const start = polarToCartesian(centerX, centerY, radius, endAngle)
  const end = polarToCartesian(centerX, centerY, radius, startAngle)
  const largeArcFlag = sweepAngle > 180 ? '1' : '0'

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

const getTooltipPosition = (centerX, centerY, radius, startAngle, endAngle) => {
  const midAngle = (startAngle + endAngle) / 2
  const tooltipRadius = radius * 0.68

  return polarToCartesian(centerX, centerY, tooltipRadius, midAngle)
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [fields, setFields] = useState([])
  const [bookings, setBookings] = useState([])
  const [weeklyPerformance, setWeeklyPerformance] = useState([])
  const [revenueSummary, setRevenueSummary] = useState({ totalRevenue: 0, venues: [] })
  const [hoveredRevenueVenueId, setHoveredRevenueVenueId] = useState(null)
  const [hoveredWeeklySlotIndex, setHoveredWeeklySlotIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending')
  const hasNotifications = pendingBookings.length > 0

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

  // Fetch fields and bookings when adminId is set
  useEffect(() => {
    if (adminId) {
      fetchFields()
      fetchBookings()
      fetchWeeklyPerformance()
      fetchRevenueSummary()
    }
  }, [adminId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiUrl(`/fields/${adminId}`))
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      } else {
        setError('Failed to fetch fields')
      }
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch(apiUrl(`/bookings/admin/${adminId}`))
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
        console.log('Fetched bookings:', data)
      } else {
        console.error('Failed to fetch bookings:', response.status)
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    }
  }

  const fetchWeeklyPerformance = async () => {
    try {
      const response = await fetch(apiUrl(`/bookings/admin/${adminId}/performance`))
      if (response.ok) {
        const data = await response.json()
        const counts = Array.isArray(data.daily)
          ? data.daily.map((item) => Number(item.bookedSlots) || 0)
          : []
        setWeeklyPerformance(counts)
      } else {
        console.error('Failed to fetch weekly performance:', response.status)
      }
    } catch (err) {
      console.error('Failed to fetch weekly performance:', err)
    }
  }

  const fetchRevenueSummary = async () => {
    try {
      const response = await fetch(apiUrl(`/bookings/admin/${adminId}/revenue`))
      if (response.ok) {
        const data = await response.json()
        setRevenueSummary({
          totalRevenue: Number(data.totalRevenue) || 0,
          venues: Array.isArray(data.venues) ? data.venues : [],
        })
      } else {
        console.error('Failed to fetch revenue summary:', response.status)
      }
    } catch (err) {
      console.error('Failed to fetch revenue summary:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

  const stats = {
    totalFields: fields.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeklySlotCounts = dayLabels.map((_, index) => weeklyPerformance[index] || 0)

  const highestDayCount = Math.max(...weeklySlotCounts, 0)
  const chartMax = Math.max(2, Math.ceil(highestDayCount / 2) * 2)
  const chartMid = chartMax / 2

  const revenueVenues = revenueSummary.venues.length > 0
    ? revenueSummary.venues
    : fields.map((field) => ({
        id: field.id,
        name: field.name,
        revenue: 0,
        percentage: 0,
      }))

  const totalRevenue = Number(revenueSummary.totalRevenue) || 0

  const revenueVenuesWithColors = revenueVenues.map((venue, index) => ({
    ...venue,
    color: revenueColors[index % revenueColors.length],
  }))

  const revenueSlices = revenueVenuesWithColors
    .filter((venue) => Number(venue.revenue) > 0)
    .reduce((slices, venue, index) => {
      const revenueValue = Number(venue.revenue) || 0
      const sliceAngle = totalRevenue > 0 ? (revenueValue / totalRevenue) * 360 : 0
      const startAngle = slices.length === 0 ? 0 : slices[slices.length - 1].endAngle
      const endAngle = startAngle + sliceAngle

      slices.push({
        ...venue,
        revenue: revenueValue,
        percentage: totalRevenue > 0 ? (revenueValue / totalRevenue) * 100 : 0,
        color: revenueColors[index % revenueColors.length],
        startAngle,
        endAngle,
      })

      return slices
    }, [])

  const hoveredRevenueSlice = revenueSlices.find((slice) => slice.id === hoveredRevenueVenueId) || null
  const hoveredRevenueTooltipPosition = hoveredRevenueSlice
    ? getTooltipPosition(
        pieViewBoxSize / 2,
        pieViewBoxSize / 2,
        98,
        hoveredRevenueSlice.startAngle,
        hoveredRevenueSlice.endAngle
      )
    : null

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, path: '/dashboard' },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid, path: '/field' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/booking' },
    { id: 'payment-qr', label: 'Payment QR', icon: FiCreditCard, path: '/admin/payment-qr' },
    { id: 'security-info', label: 'Security & Info', icon: FaShieldAlt, path: '/admin/security-info' },
  ]

  const handleNotificationClick = (bookingId) => {
    setShowNotifications(false)
    navigate(`/booking#booking-${bookingId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />
      <Sidebar
        activeTabId="dashboard"
        adminName={adminName}
        adminEmail={adminEmail}
        handleLogout={handleLogout}
        tabItems={tabItems}
      />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Alerts */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* DASHBOARD CONTENT */}
            <div className="space-y-8">
            <div className="relative mb-8">
              <div className="mb-3">
                <AdminSectionBreadcrumb label="Dashboard" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

              <div className="absolute right-0 top-0" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-transparent text-primary transition cursor-pointer hover:bg-gray-100"
                  aria-label="Notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 17a3 3 0 0 0 6 0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {hasNotifications && (
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                <Notification
                  isOpen={showNotifications}
                  pendingBookings={pendingBookings}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Your Venues
                    </p>
                    <FiGrid className="text-primary/40 h-5 w-5" />
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.totalFields}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Active & Inactive</p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Pending Bookings
                    </p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-primary/40 h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M5 22h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 2h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 22c0-4-3-6-5-8-2 2-5 4-5 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 2c0 4-3 6-5 8-2-2-5-4-5-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.pendingBookings}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Awaiting confirmation</p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Confirmed Bookings
                    </p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-primary/40 h-5 w-5"
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
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.confirmedBookings}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Completed bookings</p>
                </div>
              </div>

            {/* Additional Dashboard Sections */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance Overview */}
              <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm min-h-128 flex flex-col">
                <div className="flex items-center gap-4 mb-2">
                  <FiBarChart2 className="text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">Performance</h3>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="mb-4">
                    <span className="text-xs text-gray-400">Booked Slots This Week</span>
                  </div>
                  <div className="flex-1 min-h-0 rounded-xl border border-gray-50 p-4">
                    <div className="grid h-full min-h-0 grid-cols-[2.5rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] pt-2">
                      <div className="relative min-h-0">
                        <div className="absolute top-0 bottom-2 right-0 w-px bg-gray-300" />
                        <span className="absolute top-0 right-2 text-[10px] text-gray-400 font-semibold -translate-y-1/2">{chartMax}</span>
                        <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] text-gray-400 font-semibold">{chartMid}</span>
                        <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-semibold translate-y-1/2">0</span>
                      </div>

                      <div className="relative min-h-0 pb-1">
                        <div className="grid h-full grid-cols-7 gap-2 items-end">
                          {weeklySlotCounts.map((count, index) => {
                            const heightPercent = (count / chartMax) * 100
                            const barHeight = count === 0 ? 0 : Math.max(6, heightPercent)
                            const isHovered = hoveredWeeklySlotIndex === index

                            return (
                              <div
                                key={dayLabels[index]}
                                className="group h-full flex items-end justify-center"
                                onMouseEnter={() => setHoveredWeeklySlotIndex(index)}
                                onMouseLeave={() => setHoveredWeeklySlotIndex(null)}
                              >
                                <div
                                  className="relative flex w-6 sm:w-13 items-end justify-center rounded-t-md rounded-b-none bg-primary transition-all duration-200 group-hover:opacity-95"
                                  style={{ height: `${barHeight}%` }}
                                  aria-label={`${dayLabels[index]} bookings ${count}`}
                                />
                                {isHovered && (
                                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 shadow-lg">
                                    <span className="text-sm font-bold text-primary">{count}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        <div className="absolute inset-x-0 bottom-1 h-px bg-gray-300" />
                      </div>

                      <div />

                      <div className="grid grid-cols-7 gap-2 pt-2">
                        {weeklySlotCounts.map((count, index) => (
                          <div key={`${dayLabels[index]}-label`} className="flex flex-col items-center justify-start">
                            <span className="text-[10px] text-gray-500 font-bold leading-none">{dayLabels[index]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Overview */}
              <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm min-h-128 flex flex-col">
                <div className="flex items-center gap-4 mb-2">
                  <FiTrendingUp className="text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">Revenue</h3>
                </div>

                <div className="flex-1 grid gap-3 lg:grid-cols-[3fr_1fr] items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="relative w-full max-w-105 aspect-square">
                      {revenueSlices.length > 0 ? (
                        <>
                          <svg
                            viewBox={`0 0 ${pieViewBoxSize} ${pieViewBoxSize}`}
                            className="h-full w-full overflow-visible"
                            role="img"
                            aria-label="Revenue distribution pie chart"
                          >
                            <circle
                              cx={pieViewBoxSize / 2}
                              cy={pieViewBoxSize / 2}
                              r="98"
                              fill="#f3f7f5"
                            />
                            {revenueSlices.map((slice) => (
                              <path
                                key={slice.id}
                                d={createPieSlicePath(pieViewBoxSize / 2, pieViewBoxSize / 2, 98, slice.startAngle, slice.endAngle)}
                                fill={slice.color}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="cursor-pointer transition-all duration-200 hover:opacity-95"
                                onMouseEnter={() => setHoveredRevenueVenueId(slice.id)}
                                onMouseLeave={() => setHoveredRevenueVenueId(null)}
                              />
                            ))}
                          </svg>

                          {hoveredRevenueSlice && (
                            <div
                              className="pointer-events-none absolute z-10 rounded-2xl bg-white px-3 py-2 shadow-lg border border-green-100 transition-all duration-200"
                              style={{
                                left: `${(hoveredRevenueTooltipPosition.x / pieViewBoxSize) * 100}%`,
                                top: `${(hoveredRevenueTooltipPosition.y / pieViewBoxSize) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              <span className="text-sm font-bold text-primary">
                                {formatPercentage(hoveredRevenueSlice.percentage)}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-full w-full rounded-full border border-dashed border-green-100 bg-primary/20 flex items-center justify-center text-center px-8">
                          <div>
                            <p className="text-sm font-bold text-gray-700">No confirmed revenue yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-center">
                    <div className="space-y-3">
                      {revenueVenuesWithColors.length > 0 ? (
                        revenueVenuesWithColors.map((venue) => {
                          const percentage = totalRevenue > 0 ? (Number(venue.revenue) / totalRevenue) * 100 : 0

                          return (
                            <div
                              key={venue.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-sm shrink-0"
                                style={{ backgroundColor: venue.color }}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{venue.name}</p>
                                <p className="text-[11px] text-gray-500">{formatCurrency(venue.revenue)}</p>
                              </div>
                              <span className="text-sm font-bold text-primary">
                                {formatPercentage(percentage)}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          No venues found for this business.
                        </div>
                      )}
                    </div>

                    <div className="mt-6 rounded-xl bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</p>
                      <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Recent Venues */}
              {fields.length > 0 && (
                <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Venues</h3>
                </div>
                <div className="space-y-2">
                  {fields.slice(0, 3).map((field) => (
                    (() => {
                      const fieldImageUrl = field.image_url || field.imageUrl || ''

                      return (
                    <div key={field.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 shrink-0 bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden rounded-lg">
                          {fieldImageUrl ? (
                            <img src={resolveImageUrl(fieldImageUrl)} alt={field.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{field.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="bg-white/95 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-primary shadow-sm">
                              {field.category || 'Uncategorized'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 text-[10px] rounded-full uppercase tracking-widest ${field.is_active === 1 ? 'text-white bg-primary' : 'bg-red-600 text-white'}`}>
                        {field.is_active === 1 ? (
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
                            <span>Open</span>
                          </span>
                        ) : (
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
                            <span>Closed</span>
                          </span>
                        )}
                      </span>
                    </div>
                      )
                    })()
                  ))}
                </div>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* LOADING OVERLAY */}
      <LoadingOverlay show={loading} />
    </div>
  )
}

export default AdminDashboard
