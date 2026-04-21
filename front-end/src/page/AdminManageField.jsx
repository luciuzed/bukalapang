import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiBarChart2, FiBriefcase, FiGrid, FiEdit2, FiTrash2, FiX, FiCheck, FiTrendingUp, FiAward, FiUsers, FiCalendar } from 'react-icons/fi'
import { FaShieldAlt } from 'react-icons/fa'
import Cookies from 'js-cookie'
import LoadingOverlay from '../components/LoadingOverlay'
import Sidebar from '../components/Sidebar'
import ConfirmationModal from './ConfirmationModal'
import SuccessMessage from '../components/SuccessMessage'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import { API_BASE_URL, apiUrl } from '../config/api'

const MAX_DESCRIPTION_LENGTH = 1000
const FIELD_NAME_MAX_LENGTH = 80
const FIELD_ADDRESS_MAX_LENGTH = 200
const GOOGLE_MAPS_LINK_MAX_LENGTH = 500
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const LOCAL_UPLOAD_IMAGE_PATTERN = /^\/uploads\/.+\.(jpe?g|png)$/i
const LOCAL_QR_IMAGE_PATTERN = /^\/qr\/.+\.(jpe?g|png)$/i

const resolveImageUrl = (imageUrl) => {
  if (typeof imageUrl !== 'string') return ''
  const normalized = imageUrl.trim()
  if (!LOCAL_UPLOAD_IMAGE_PATTERN.test(normalized)) return ''
  return `${BACKEND_BASE_URL}${normalized}`
}

const resolveQrUrl = (imageUrl) => {
  if (typeof imageUrl !== 'string') return ''
  const normalized = imageUrl.trim()
  if (!LOCAL_QR_IMAGE_PATTERN.test(normalized)) return ''
  return `${BACKEND_BASE_URL}${normalized}`
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
  const [imageToDelete, setImageToDelete] = useState(false)
  const [qrToDelete, setQrToDelete] = useState(false)
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState(null)
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState('')
  const [pendingImageRemoved, setPendingImageRemoved] = useState(false)
  const [pendingQrFile, setPendingQrFile] = useState(null)
  const [pendingQrPreviewUrl, setPendingQrPreviewUrl] = useState('')
  const [pendingQrRemoved, setPendingQrRemoved] = useState(false)
  const [imageUploadTypeError, setImageUploadTypeError] = useState('')
  const [qrUploadTypeError, setQrUploadTypeError] = useState('')
  const [qrRequiredError, setQrRequiredError] = useState('')
  const imageFileInputRef = useRef(null)
  const qrFileInputRef = useRef(null)

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
  const qrPreviewUrl = watch('qrUrl')
  const displayedImagePreviewUrl = pendingImagePreviewUrl || (!pendingImageRemoved && imagePreviewUrl ? resolveImageUrl(imagePreviewUrl) : '')
  const displayedQrPreviewUrl = pendingQrPreviewUrl || (!pendingQrRemoved && qrPreviewUrl ? resolveQrUrl(qrPreviewUrl) : '')
  const isActiveChecked = Boolean(watch('isActive'))

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
    const currentImageUrl = String(data.imageUrl || '').trim()
    const currentQrUrl = String(data.qrUrl || '').trim()

    const wantsOpen = data.isActive === 'on' ? true : (data.isActive ? true : false)
    const uploadedImageUrls = []
    const uploadedQrUrls = []

    const uploadFileToStorage = async (file, endpoint) => {
      const base64Data = await readFileAsBase64(file)

      const response = await fetch(apiUrl(endpoint), {
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
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const uploadData = await response.json()
      return uploadData.imageUrl || ''
    }

    const rollbackUploads = async () => {
      for (const imageUrl of uploadedImageUrls.reverse()) {
        if (imageUrl && imageUrl.startsWith('/uploads/')) {
          await fetch(apiUrl('/uploads'), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          }).catch(() => {})
        }
      }

      for (const imageUrl of uploadedQrUrls.reverse()) {
        if (imageUrl && imageUrl.startsWith('/qr/')) {
          await fetch(apiUrl(`/payment-qr/admin/${adminId}`), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          }).catch(() => {})
        }
      }
    }

    try {
      setError('')
      setSuccess(null)

      let nextImageUrl = pendingImageRemoved ? '' : currentImageUrl
      let nextQrUrl = pendingQrRemoved ? '' : currentQrUrl

      if (pendingImageFile) {
        setIsUploadingImage(true)
        nextImageUrl = await uploadFileToStorage(pendingImageFile, '/uploads')
        uploadedImageUrls.push(nextImageUrl)
      }

      if (pendingQrFile) {
        setIsUploadingQr(true)
        nextQrUrl = await uploadFileToStorage(pendingQrFile, `/payment-qr/admin/${adminId}`)
        uploadedQrUrls.push(nextQrUrl)
      }

      if (!nextQrUrl) {
        setQrRequiredError('Payment QR is required')
        await rollbackUploads()
        return
      }

      const fieldData = {
        adminId,
        name: data.fieldName,
        category: data.category,
        description: data.description,
        address: data.address,
        city: data.city,
        imageUrl: nextImageUrl,
        qrUrl: nextQrUrl,
        isActive: wantsOpen,
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
        setImageUploadTypeError('')
        setQrUploadTypeError('')
        setQrRequiredError('')
        setPendingImageFile(null)
        setPendingImagePreviewUrl('')
        setPendingImageRemoved(false)
        setPendingQrFile(null)
        setPendingQrPreviewUrl('')
        setPendingQrRemoved(false)
        reset()
        setShowFieldForm(false)
        setEditingField(null)
        fetchFields()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save field')
        await rollbackUploads()
      }
    } catch (err) {
      setError('Cannot connect to server')
      await rollbackUploads()
    } finally {
      setIsUploadingImage(false)
      setIsUploadingQr(false)
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
    setValue('qrUrl', field.qr_url || '')
    setValue('isActive', field.is_active === 1 ? true : false)
    setValue('googleMapsLink', field.google_maps_link || '')
    setPendingImageFile(null)
    setPendingImagePreviewUrl('')
    setPendingImageRemoved(false)
    setPendingQrFile(null)
    setPendingQrPreviewUrl('')
    setPendingQrRemoved(false)
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
    setImageUploadTypeError('')
    setQrUploadTypeError('')
    setQrRequiredError('')
    setPendingImageFile(null)
    setPendingImagePreviewUrl('')
    setPendingImageRemoved(false)
    setPendingQrFile(null)
    setPendingQrPreviewUrl('')
    setPendingQrRemoved(false)
    reset()
  }

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
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

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }

      resolve(result)
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  const handleUploadImageClick = () => {
    setImageUploadTypeError('')
    imageFileInputRef.current?.click()
  }

  const handleDeleteImage = async () => {
    if (pendingImageFile) {
      setPendingImageFile(null)
      setPendingImagePreviewUrl('')
      setImageUploadTypeError('')
      showSuccessMessage('Image removed successfully')
      return
    }

    if (!imagePreviewUrl) {
      return
    }

    setImageUploadTypeError('')
    setPendingImageRemoved(true)
    setPendingImagePreviewUrl('')
    setValue('imageUrl', '', { shouldDirty: true })
    showSuccessMessage('Image removed successfully')
  }

  const openImageDeleteModal = () => {
    if (!displayedImagePreviewUrl) {
      return
    }

    setImageToDelete(true)
  }

  const closeImageDeleteModal = () => {
    if (isDeleteProcessing) return
    setImageToDelete(false)
  }

  const confirmImageDelete = async () => {
    setImageToDelete(false)
    await handleDeleteImage()
  }

  const handleDeleteQr = async () => {
    if (pendingQrFile) {
      setPendingQrFile(null)
      setPendingQrPreviewUrl('')
      setQrUploadTypeError('')
      setQrRequiredError('')
      showSuccessMessage('Payment QR removed successfully')
      return
    }

    if (!qrPreviewUrl) {
      return
    }

    setQrUploadTypeError('')
    setQrRequiredError('')
    setPendingQrRemoved(true)
    setPendingQrPreviewUrl('')
    setValue('qrUrl', '', { shouldDirty: true })
    showSuccessMessage('Payment QR removed successfully')
  }

  const openQrDeleteModal = () => {
    if (!displayedQrPreviewUrl) {
      return
    }

    setQrToDelete(true)
  }

  const closeQrDeleteModal = () => {
    if (isDeleteProcessing) return
    setQrToDelete(false)
  }

  const confirmQrDelete = async () => {
    setQrToDelete(false)
    await handleDeleteQr()
  }

  const handleUploadQrClick = () => {
    setQrRequiredError('')
    setQrUploadTypeError('')
    qrFileInputRef.current?.click()
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
      setImageUploadTypeError('only .jpg .jpeg and .png allowed')
      return
    }

    setImageUploadTypeError('')
    setError('')
    setPendingImageRemoved(false)

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setPendingImageFile(file)
      setPendingImagePreviewUrl(dataUrl)
      setError('')
    } catch (err) {
      setError('Failed to read image')
    }
  }

  const handleQrFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const fileName = file.name.toLowerCase()
    const isAllowedMime = file.type === 'image/jpeg' || file.type === 'image/png'
    const isAllowedExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')

    if (!isAllowedMime || !isAllowedExtension) {
      setQrUploadTypeError('only .jpg .jpeg and .png allowed')
      return
    }

    setQrUploadTypeError('')
    setError('')
    setPendingQrRemoved(false)

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setPendingQrFile(file)
      setPendingQrPreviewUrl(dataUrl)
      setError('')
      setQrRequiredError('')
    } catch (err) {
      setError('Failed to read payment QR')
    }
  }

  const openSlotManagementPage = (field) => {
    setError('')
    navigate(`/admin/manage-field/courts/${field.id}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

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

            {/* FIELDS MANAGEMENT */}
            <div>
            <div className="mb-3">
              <AdminSectionBreadcrumb label="Manage Fields" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Manage Fields</h1>
                <p className="text-gray-600 text-sm">All fields for your business</p>
              </div>
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
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="3" width="7" height="7"></rect>
                              <rect x="14" y="3" width="7" height="7"></rect>
                              <rect x="14" y="14" width="7" height="7"></rect>
                              <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 px-8">
                        <div className="flex items-center gap-6 mb-2">
                          <h3 className="text-lg font-bold">{field.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 text-[10px] rounded-full uppercase tracking-widest ${field.is_active === 1 ? 'text-white bg-primary' : 'bg-red-600 text-white'}`}
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
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer font-medium"
                          title="Manage time slots"
                        >
                          <FiCalendar className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-2.5 text-primary hover:bg-primary/10 rounded-lg transition cursor-pointer font-medium"
                          title="Edit field"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteFieldModal(field.id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer font-medium"
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
          </div>
        </main>

      {/* FIELD FORM MODAL */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFieldSubmit)}>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Name *</label>
                    <input
                      {...register('fieldName', {
                        required: 'Field name is required',
                        maxLength: {
                          value: FIELD_NAME_MAX_LENGTH,
                          message: `Field name must be ${FIELD_NAME_MAX_LENGTH} characters or fewer`,
                        },
                      })}
                      placeholder="e.g., Main Futsal Court"
                      maxLength={FIELD_NAME_MAX_LENGTH}
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
                      className={`w-full px-4 py-3 pr-10 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      <option value="Futsal">Futsal</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Biliard">Biliard</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs mt-1 ml-4">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Address *</label>
                    <input
                      {...register('address', {
                        required: 'Address is required',
                        maxLength: {
                          value: FIELD_ADDRESS_MAX_LENGTH,
                          message: `Address must be ${FIELD_ADDRESS_MAX_LENGTH} characters or fewer`,
                        },
                      })}
                      placeholder="e.g., Jl. Merdeka No. 1"
                      maxLength={FIELD_ADDRESS_MAX_LENGTH}
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
                      className={`w-full px-4 py-3 pr-10 border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] ${
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Google Maps Link</label>
                    <input
                      {...register('googleMapsLink', {
                        maxLength: {
                          value: GOOGLE_MAPS_LINK_MAX_LENGTH,
                          message: `Google Maps link must be ${GOOGLE_MAPS_LINK_MAX_LENGTH} characters or fewer`,
                        },
                      })}
                      placeholder="https://maps.google.com/..."
                      type="url"
                      maxLength={GOOGLE_MAPS_LINK_MAX_LENGTH}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px]"
                    />
                    {errors.googleMapsLink && (
                      <p className="text-red-500 text-xs mt-1 ml-4">{errors.googleMapsLink.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
                      id="isActiveToggle"
                    />
                    <label htmlFor="isActiveToggle" className="text-[13px] font-semibold text-gray-700 cursor-pointer flex-1 min-w-0">
                      Open for Bookings
                    </label>
                  </div>

                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <input {...register('imageUrl')} type="hidden" />
                    <div className="mb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Field Image</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUploadImageClick}
                        disabled={isUploadingImage}
                        className={`mt-3 w-full px-4 py-2 rounded-full text-[13px] font-semibold text-white transition ${
                          isUploadingImage
                            ? 'bg-primary/60 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/80'
                        }`}
                      >
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                    </div>
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    {imageUploadTypeError && (
                      <p className="mb-3 text-xs text-red-500">{imageUploadTypeError}</p>
                    )}
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-gray-200 bg-white">
                      {displayedImagePreviewUrl ? (
                        <>
                          <img
                            src={displayedImagePreviewUrl}
                            alt="Uploaded field preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={openImageDeleteModal}
                            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/90 text-white shadow-lg transition hover:bg-red-700"
                            aria-label="Delete image"
                          >
                            <FiTrash2 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                          No image uploaded yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <input {...register('qrUrl')} type="hidden" />
                    <div className="mb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment QR *</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUploadQrClick}
                        disabled={isUploadingQr}
                        className={`mt-3 w-full px-4 py-2 rounded-full text-[13px] font-semibold text-white transition ${
                          isUploadingQr
                            ? 'bg-primary/60 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/80'
                        }`}
                      >
                        {isUploadingQr ? 'Uploading...' : 'Upload QR'}
                      </button>
                    </div>
                    <input
                      ref={qrFileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      className="hidden"
                      onChange={handleQrFileChange}
                    />
                    {qrUploadTypeError && (
                      <p className="mb-3 text-xs text-red-500">{qrUploadTypeError}</p>
                    )}
                    {qrRequiredError && (
                      <p className="mb-3 text-xs text-red-500">{qrRequiredError}</p>
                    )}
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                      {displayedQrPreviewUrl ? (
                        <>
                          <img
                            src={displayedQrPreviewUrl}
                            alt="Uploaded payment QR preview"
                            className="h-full w-full object-contain bg-white"
                          />
                          <button
                            type="button"
                            onClick={openQrDeleteModal}
                            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/90 text-white shadow-lg transition hover:bg-red-700"
                            aria-label="Delete payment QR"
                          >
                            <FiTrash2 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                          No QR uploaded yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-8 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition cursor-pointer font-semibold text-[13px] text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-full hover:opacity-90 transition cursor-pointer flex items-center gap-2 font-semibold text-[13px]"
                  >
                    <FiCheck className="h-4 w-4" /> {editingField ? 'Update' : 'Create'}
                  </button>
                </div>
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

      <ConfirmationModal
        isOpen={imageToDelete}
        onClose={closeImageDeleteModal}
        onConfirm={confirmImageDelete}
        actionText="delete this image"
        isProcessing={isDeleteProcessing}
      />

      <ConfirmationModal
        isOpen={qrToDelete}
        onClose={closeQrDeleteModal}
        onConfirm={confirmQrDelete}
        actionText="delete this payment QR"
        isProcessing={isDeleteProcessing}
      />
    </div>
  )
}

export default AdminManageField