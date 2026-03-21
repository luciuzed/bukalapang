import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiBarChart2, FiBriefcase, FiGrid, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import Cookies from 'js-cookie'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
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
    const adminSession = JSON.parse(localStorage.getItem('adminId') || 'null')
    const adminCookie = Cookies.get('admin_session')

    if (!adminSession && !adminCookie) {
      navigate('/login')
      return
    }

    if (adminSession) {
      setAdminId(adminSession)
    } else if (adminCookie) {
      const sessionData = JSON.parse(adminCookie)
      setAdminId(sessionData.adminId)
      setAdminName(sessionData.adminName)
      localStorage.setItem('adminId', sessionData.adminId)
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
    setShowFieldForm(true)
  }

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/fields/${fieldId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      })

      if (response.ok) {
        setSuccess('Field deleted successfully')
        fetchFields()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete field')
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
        <aside className="w-64 min-h-screen bg-emerald-900 text-white flex flex-col">
          <div className="px-6 pt-8 pb-6">
            <p className="text-lg font-semibold">MainYuk!</p>
          </div>

          <nav className="px-3 pb-8 space-y-1">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-6 pb-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/30 text-sm font-semibold text-white">
                {adminName
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{adminName}</p>
                <p className="text-xs text-emerald-200">Administrator</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-white/15"
            >
              <FiLogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-10">
          {/* Alerts */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-100 border border-green-400 text-green-700 px-4 py-3">
              {success}
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'stats' && (
            <div>
              <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Fields
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {stats.totalFields}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Slots
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {stats.totalSlots}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Booked Slots
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {stats.bookedSlots}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FIELDS TAB */}
          {activeTab === 'fields' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold">Manage Fields</h1>
                <button
                  onClick={() => {
                    setEditingField(null)
                    reset()
                    setShowFieldForm(true)
                  }}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  <FiPlus /> Add Field
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading fields...</div>
              ) : fields.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-gray-500">No fields yet. Create your first field!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{field.name}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-semibold">Category:</span> {field.category}
                            </p>
                            <p>
                              <span className="font-semibold">Address:</span> {field.address}
                            </p>
                            {field.city && (
                              <p>
                                <span className="font-semibold">City:</span> {field.city}
                              </p>
                            )}
                            {field.description && (
                              <p>
                                <span className="font-semibold">Description:</span>{' '}
                                {field.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditField(field)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <FiTrash2 />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {editingField ? 'Edit Field' : 'Create New Field'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFieldSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field Name *</label>
                <input
                  {...register('fieldName', { required: 'Field name is required' })}
                  placeholder="e.g., Main Futsal Court"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors.fieldName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fieldName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Futsal">Futsal</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  placeholder="e.g., Jl. Merdeka No. 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  {...register('city')}
                  placeholder="e.g., Jakarta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Add details about your field..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  {...register('imageUrl')}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <FiCheck /> {editingField ? 'Update' : 'Create'}
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
