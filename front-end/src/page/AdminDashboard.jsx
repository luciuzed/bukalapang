import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiBarChart2, FiBriefcase, FiGrid, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiTrendingUp, FiAward, FiUsers, FiCalendar } from 'react-icons/fi'
import LoadingOverlay from '../components/LoadingOverlay'
import Sidebar from '../components/Sidebar'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [fields, setFields] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    }
  }, [adminId])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/fields/${adminId}`)
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
      const response = await fetch(`http://localhost:5000/api/admin/${adminId}/bookings`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

  const stats = {
    totalFields: fields.length,
    totalSlots: fields.reduce((sum, field) => sum + (field.slots?.length || 0), 0),
    bookedSlots: fields.reduce(
      (sum, field) => sum + (field.slots?.filter((s) => s.is_booked)?.length || 0),
      0
    ),
  }

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, path: '/dashboard' },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid, path: '/field' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/booking' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      <Sidebar
        activeTabId="dashboard"
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
          {success && (
            <div className="mb-6 inline-block rounded-full bg-green-50 border border-green-300 text-green-700 px-5 py-2 text-sm font-semibold shadow-sm">
              {success}
            </div>
          )}

          {/* DASHBOARD CONTENT */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-8 tracking-tight">Dashboard</h1>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Your Venues
                    </p>
                    <FiBriefcase className="text-primary/40 h-5 w-5" />
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.totalFields}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Active & Inactive</p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Available Slots
                    </p>
                    <FiTrendingUp className="text-primary/40 h-5 w-5" />
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.totalSlots}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Total time slots</p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Bookings
                    </p>
                    <FiAward className="text-primary/40 h-5 w-5" />
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {stats.bookedSlots}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Confirmed bookings</p>
                </div>
              </div>
            </div>

            {/* Additional Dashboard Sections */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Actions */}
              <div className="rounded-2xl bg-linear-to-br from-primary/5 to-transparent p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <FiPlus className="text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/field')}
                    className="w-full text-left px-4 py-3 rounded-lg bg-white hover:bg-primary/5 transition border border-gray-100 text-sm font-medium text-gray-900"
                  >
                    Add New Venue
                  </button>
                  <button
                    onClick={() => navigate('/field')}
                    className="w-full text-left px-4 py-3 rounded-lg bg-white hover:bg-primary/5 transition border border-gray-100 text-sm font-medium text-gray-900"
                  >
                    View All Venues
                  </button>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="rounded-2xl bg-linear-to-br from-blue-50 to-transparent p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <FiTrendingUp className="text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Performance</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Booking Rate</span>
                      <span className="text-gray-900 font-bold">{stats.totalSlots > 0 ? Math.round((stats.bookedSlots / stats.totalSlots) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-400 to-blue-600 transition-all"
                        style={{ width: `${stats.totalSlots > 0 ? (stats.bookedSlots / stats.totalSlots) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Venues */}
            {fields.length > 0 && (
              <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FiUsers className="text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Venues</h3>
                </div>
                <div className="space-y-2">
                  {fields.slice(0, 3).map((field) => (
                    <div key={field.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{field.name}</p>
                        <p className="text-xs text-gray-500">{field.city} • {field.category}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${field.is_active === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {field.is_active === 1 ? '✓ Open' : '⊘ Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

      {/* LOADING OVERLAY */}
      <LoadingOverlay show={loading} />
    </div>
  )
}

export default AdminDashboard
