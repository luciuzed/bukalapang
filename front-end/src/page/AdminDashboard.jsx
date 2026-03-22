import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiBarChart2, FiBriefcase, FiGrid, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiTrendingUp, FiAward, FiUsers, FiUser } from 'react-icons/fi'
import Cookies from 'js-cookie'
import LOGO from '../assets/logo.svg'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')
  const [showFieldForm, setShowFieldForm] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

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

  // Fetch fields when adminId is set
  useEffect(() => {
    if (adminId) {
      fetchFields()
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

  const handleFieldSubmit = async (data) => {
    try {
      setError('')
      setSuccess('')

      const fieldData = {
        adminId,
        name: data.fieldName,
        category: data.category,
        description: data.description,
        address: data.address,
        city: data.city,
        imageUrl: data.imageUrl,
        isActive: data.isActive === 'on' ? true : (data.isActive ? true : false),
        googleMapsLink: data.googleMapsLink,
      }

      const url = editingField
        ? `http://localhost:5000/api/fields/${editingField.id}`
        : 'http://localhost:5000/api/fields'

      const method = editingField ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      })

      if (response.ok) {
        setSuccess(editingField ? 'Field updated successfully' : 'Field created successfully')
        reset()
        setShowFieldForm(false)
        setEditingField(null)
        fetchFields()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save field')
      }
    } catch (err) {
      setError('Cannot connect to server')
    }
  }

  const handleEditField = (field) => {
    setEditingField(field)
    setValue('fieldName', field.name)
    setValue('category', field.category)
    setValue('description', field.description)
    setValue('address', field.address)
    setValue('city', field.city)
    setValue('imageUrl', field.image_url)
    setValue('isActive', field.is_active === 1 ? true : false)
    setValue('googleMapsLink', field.google_maps_link || '')
    setShowFieldForm(true)
  }

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to permanently delete this field? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/fields/${fieldId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      })

      if (response.ok) {
        setSuccess('✓ Field removed')
        fetchFields()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove field')
      }
    } catch (err) {
      setError('Cannot connect to server')
    }
  }

  const handleCloseForm = () => {
    setShowFieldForm(false)
    setEditingField(null)
    reset()
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
    { id: 'stats', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-64 min-h-screen bg-primary text-white flex flex-col">
          <div className="px-6 pt-8 pb-6">
            <img src={LOGO} alt="MainYuk" className="h-10 w-10" />
          </div>

          <nav className="px-3 pb-8 space-y-1">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/15'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-6 pb-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-4 backdrop-blur-sm border border-white/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25">
                <FiUser className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white uppercase tracking-wide">{adminName}</p>
                <p className="text-xs text-white/70 truncate">{adminEmail}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
            >
              <FiLogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 md:p-10">
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

          {/* DASHBOARD TAB */}
          {activeTab === 'stats' && (
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
                <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-transparent p-6 border border-primary/10">
                  <div className="flex items-center gap-2 mb-4">
                    <FiPlus className="text-primary" />
                    <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveTab('fields')
                        setTimeout(() => {
                          setEditingField(null)
                          reset()
                          setShowFieldForm(true)
                        }, 0)
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-white hover:bg-primary/5 transition border border-gray-100 text-sm font-medium text-gray-900"
                    >
                      Add New Venue
                    </button>
                    <button
                      onClick={() => setActiveTab('fields')}
                      className="w-full text-left px-4 py-3 rounded-lg bg-white hover:bg-primary/5 transition border border-gray-100 text-sm font-medium text-gray-900"
                    >
                      View All Venues
                    </button>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-transparent p-6 border border-blue-100">
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
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
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
          )}

          {/* FIELDS TAB */}
          {activeTab === 'fields' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Manage Fields</h1>
                <button
                  onClick={() => {
                    setEditingField(null)
                    reset()
                    setShowFieldForm(true)
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:opacity-90 transition font-semibold text-sm"
                >
                  <FiPlus className="h-4 w-4" /> Add Field
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading fields...</div>
              ) : fields.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium">No fields yet. Create your first field!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={`bg-white rounded-2xl shadow-sm border transition ${field.is_active === 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'} hover:shadow-md overflow-hidden`}
                    >
                      <div className="flex items-start justify-between">
                        {/* Field Image */}
                        <div className="h-40 w-40 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                          {field.image_url ? (
                            <img src={field.image_url} alt={field.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <FiBriefcase className="h-16 w-16 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Field Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-bold">{field.name}</h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${field.is_active === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {field.is_active === 1 ? '✓ Open' : '⊘ Closed'}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>
                              <span className="font-semibold text-gray-900">Category:</span> <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{field.category}</span>
                            </p>
                            <p>
                              <span className="font-semibold text-gray-900">Address:</span> {field.address}
                            </p>
                            {field.city && (
                              <p>
                                <span className="font-semibold text-gray-900">City:</span> {field.city}
                              </p>
                            )}
                            {field.description && (
                              <p>
                                <span className="font-semibold text-gray-900">Description:</span> {field.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pr-6 flex-shrink-0 self-start pt-6">
                          <button
                            onClick={() => handleEditField(field)}
                            className="p-2.5 text-primary hover:bg-primary/10 rounded-lg transition font-medium"
                            title="Edit field"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                            title="Delete field"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FIELD FORM MODAL */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFieldSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Field Name *</label>
                <input
                  {...register('fieldName', { required: 'Field name is required' })}
                  placeholder="e.g., Main Futsal Court"
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm ${
                    errors.fieldName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fieldName && (
                  <p className="text-red-500 text-sm mt-1 ml-4">{errors.fieldName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  <option value="Futsal">Futsal</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1 ml-4">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Address *</label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  placeholder="e.g., Jl. Merdeka No. 1"
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1 ml-4">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">City *</label>
                <select
                  {...register('city', { required: 'City is required' })}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a city</option>
                  <option value="Medan">Medan</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Pekanbaru">Pekanbaru</option>
                </select>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1 ml-4">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Add details about your field..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Google Maps Link</label>
                <input
                  {...register('googleMapsLink')}
                  placeholder="https://maps.google.com/..."
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Image URL</label>
                <input
                  {...register('imageUrl')}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  id="isActiveToggle"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1">
                  {editingField ? (
                    <>Open for Bookings</>
                  ) : (
                    <>Open for Bookings</>
                  )}
                </label>
                <span className="text-xs font-medium text-gray-500">
                  {editingField ? (
                    editingField.is_active === 1 ? '✓ Open' : '✗ Closed'
                  ) : (
                    '✓ Open'
                  )}
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition font-semibold text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:opacity-90 transition flex items-center gap-2 font-semibold text-sm"
                >
                  <FiCheck className="h-4 w-4" /> {editingField ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
