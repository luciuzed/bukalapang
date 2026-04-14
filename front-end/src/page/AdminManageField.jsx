import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiBarChart2, FiBriefcase, FiGrid, FiEdit2, FiTrash2, FiX, FiCheck, FiTrendingUp, FiAward, FiUsers, FiCalendar, FiCreditCard } from 'react-icons/fi'
import Cookies from 'js-cookie'
import LoadingOverlay from '../components/LoadingOverlay'
import Sidebar from '../components/Sidebar'
import ConfirmationModal from './ConfirmationModal'
import SuccessMessage from '../components/SuccessMessage'
import { API_BASE_URL, apiUrl } from '../config/api'

const MAX_DESCRIPTION_LENGTH = 160
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${BACKEND_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
}

const AdminManageField = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFieldForm, setShowFieldForm] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [fieldToDelete, setFieldToDelete] = useState(null)
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadTypeError, setUploadTypeError] = useState('')
  const fileInputRef = useRef(null)

  const showSuccessMessage = (message) => {
    setSuccess({ id: Date.now(), message })
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  const imagePreviewUrl = watch('imageUrl')

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

  const handleFieldSubmit = async (data) => {
    try {
      setError('')
      setSuccess(null)

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
        ? apiUrl(`/fields/${editingField.id}`)
        : apiUrl('/fields')

      const method = editingField ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      })

      if (response.ok) {
        showSuccessMessage(editingField ? 'Field updated successfully' : 'Field created successfully')
        setError('')
        reset()
        setShowFieldForm(false)
        setEditingField(null)
        fetchFields()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save field')
      }
    } catch (err) {
      setError('Cannot connect to server')
    }
  }

  const handleEditField = (field) => {
    setError('')
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

  const openDeleteFieldModal = (fieldId) => {
    setFieldToDelete(fieldId)
  }

  const closeDeleteFieldModal = () => {
    if (isDeleteProcessing) return
    setFieldToDelete(null)
  }

  const handleDeleteField = async () => {
    if (!fieldToDelete) return

    try {
      setIsDeleteProcessing(true)
      const response = await fetch(apiUrl(`/fields/${fieldToDelete}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      })

      if (response.ok) {
        showSuccessMessage('Field removed')
        setError('')
        setFieldToDelete(null)
        fetchFields()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove field')
      }
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setIsDeleteProcessing(false)
    }
  }

  const handleCloseForm = () => {
    setShowFieldForm(false)
    setEditingField(null)
    setUploadTypeError('')
    reset()
  }

  const handleUploadImageClick = () => {
    setUploadTypeError('')
    fileInputRef.current?.click()
  }

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const fileName = file.name.toLowerCase()
    const isAllowedMime = file.type === 'image/jpeg' || file.type === 'image/png'
    const isAllowedExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')

    if (!isAllowedMime || !isAllowedExtension) {
      setUploadTypeError('only .jpg .jpeg and .png allowed')
      return
    }

    setUploadTypeError('')
    setError('')
    setIsUploadingImage(true)
    const previousImageUrl = imagePreviewUrl

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          const result = reader.result
          if (typeof result !== 'string') {
            reject(new Error('Failed to read file'))
            return
          }

          const commaIndex = result.indexOf(',')
          resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const response = await fetch(apiUrl('/uploads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64Data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if ((errorData.error || '').toLowerCase() === 'only .jpg .jpeg and .png allowed') {
          setUploadTypeError('only .jpg .jpeg and .png allowed')
        } else {
          setError(errorData.error || 'Failed to upload image')
        }
        return
      }

      const uploadData = await response.json()

      if (
        previousImageUrl &&
        previousImageUrl.startsWith('/uploads/') &&
        previousImageUrl !== uploadData.imageUrl
      ) {
        await fetch(apiUrl('/uploads'), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: previousImageUrl }),
        })
      }

      setValue('imageUrl', uploadData.imageUrl, { shouldDirty: true })
      showSuccessMessage('Image uploaded successfully')
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const openSlotManagementPage = (field) => {
    setError('')
    navigate(`/field/manage/${field.id}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
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
        activeTabId="fields"
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

          {/* FIELDS MANAGEMENT */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Manage Fields</h1>
              <button
                onClick={() => {
                  setError('')
                  setEditingField(null)
                  reset()
                  setShowFieldForm(true)
                }}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:opacity-90 transition font-semibold text-sm"
              >
                <span className="text-white font-black text-base leading-none">+</span> Add Field
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
                    className={`bg-white rounded-2xl shadow-sm border transition ${field.is_active === 0 ? 'border-gray-200 bg-gray-100/70' : 'border-gray-100'} hover:shadow-md overflow-hidden`}
                  >
                    <div className="flex items-start justify-between p-4">
                      <div className="h-32 w-32 shrink-0 bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden rounded-xl ml-2">

                        {field.image_url ? (
                          <img
                            src={resolveImageUrl(field.image_url)}
                            alt={field.name}
                            className={`h-full w-full object-cover ${field.is_active === 0 ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <FiBriefcase className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 px-8">
                        <div className="flex items-center gap-6 mb-2">
                          <h3 className="text-lg font-bold">{field.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 text-[10px] rounded-full uppercase tracking-widest ${field.is_active === 1 ? 'text-white bg-primary' : 'bg-red-500 text-white'}`}
                          >
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
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="text-xs font-bold text-gray-400 uppercase">Category:</span> <span className="inline-block bg-gray-100 text-gray-700 px-3 py-0.5 rounded-full text-xs font-medium ml-1">{field.category}</span>
                          </p>
                          <p>
                            <span className="text-xs font-bold text-gray-400 uppercase">Address:</span>  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-0.5 rounded-full text-xs font-medium ml-1">{field.address}</span>
                          </p>
                          {field.city && <p><span className="text-xs font-bold text-gray-400 uppercase">City:</span>  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-0.5 rounded-full text-xs font-medium ml-1">{field.city}</span>
                          </p>}
                        </div>
                      </div>

                      <div className="flex gap-2 pr-4 shrink-0">
                        <button
                          onClick={() => openSlotManagementPage(field)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                          title="Manage time slots"
                        >
                          <FiCalendar className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-2.5 text-primary hover:bg-primary/10 rounded-lg transition font-medium"
                          title="Edit field"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteFieldModal(field.id)}
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
        </main>

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
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Name *</label>
                <input
                  {...register('fieldName', { required: 'Field name is required' })}
                  placeholder="e.g., Main Futsal Court"
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
                    errors.fieldName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fieldName && (
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.fieldName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Category *</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
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
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Address *</label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  placeholder="e.g., Jl. Merdeka No. 1"
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">City *</label>
                <select
                  {...register('city', { required: 'City is required' })}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
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
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                <textarea
                  {...register('description', {
                    maxLength: {
                      value: MAX_DESCRIPTION_LENGTH,
                      message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
                    },
                  })}
                  placeholder="Add details about your field..."
                  rows="3"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] resize-none"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Field Image</label>
                <input {...register('imageUrl')} type="hidden" />
                <button
                  type="button"
                  onClick={handleUploadImageClick}
                  disabled={isUploadingImage}
                  className={`w-full px-4 py-3 rounded-full text-[13px] font-semibold text-white transition ${
                    isUploadingImage
                      ? 'bg-primary/60 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/80'
                  }`}
                >
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                {uploadTypeError && (
                  <p className="mt-2 text-xs text-red-500 text-center">{uploadTypeError}</p>
                )}
                {imagePreviewUrl && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Preview</p>
                    <div className="w-full h-52 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={resolveImageUrl(imagePreviewUrl)}
                        alt="Uploaded field preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Google Maps Link</label>
                <input
                  {...register('googleMapsLink')}
                  placeholder="https://maps.google.com/..."
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px]"
                />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  id="isActiveToggle"
                />
                <label htmlFor="isActiveToggle" className="text-[13px] font-semibold text-gray-700 cursor-pointer flex-1">
                  {editingField ? (
                    <>Open for Bookings</>
                  ) : (
                    <>Open for Bookings</>
                  )}
                </label>
                <span className="text-xs font-medium text-gray-500">
                  {editingField ? (
                    editingField.is_active === 1 ? (
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
                    )
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
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Open</span>
                    </span>
                  )}
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition font-semibold text-[13px] text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:opacity-90 transition flex items-center gap-2 font-semibold text-[13px]"
                >
                  <FiCheck className="h-4 w-4" /> {editingField ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      <LoadingOverlay show={loading} />

      <ConfirmationModal
        isOpen={fieldToDelete !== null}
        onClose={closeDeleteFieldModal}
        onConfirm={handleDeleteField}
        actionText="delete this field"
        isProcessing={isDeleteProcessing}
      />
    </div>
  )
}

export default AdminManageField