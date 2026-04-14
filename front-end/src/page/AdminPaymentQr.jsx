import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiBarChart2, FiGrid, FiCalendar, FiCreditCard } from 'react-icons/fi'
import Sidebar from '../components/Sidebar'
import SuccessMessage from '../components/SuccessMessage'
import { API_BASE_URL, apiUrl } from '../config/api'

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${BACKEND_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
}

const AdminPaymentQr = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadTypeError, setUploadTypeError] = useState('')
  const [success, setSuccess] = useState(null)

  const showSuccessMessage = (message) => {
    setSuccess({ id: Date.now(), message })
  }

  useEffect(() => {
    const adminCookie = Cookies.get('admin_session')
    const adminSession = JSON.parse(localStorage.getItem('adminId') || 'null')

    if (!adminSession && !adminCookie) {
      navigate('/login')
      return
    }

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

  useEffect(() => {
    if (!adminId) return

    const fetchPaymentQr = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(apiUrl(`/payment-qr/admin/${adminId}`))

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch payment QR')
          return
        }

        const data = await response.json()
        setImageUrl(data.imageUrl || '')
      } catch (err) {
        setError('Cannot connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentQr()
  }, [adminId])

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

  const handleUploadButtonClick = () => {
    setUploadTypeError('')
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const fileName = file.name.toLowerCase()
    const isAllowedMime = file.type === 'image/jpeg' || file.type === 'image/png'
    const isAllowedExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')

    if (!isAllowedMime || !isAllowedExtension) {
      setUploadTypeError('only .jpg .jpeg and .png allowed')
      return
    }

    setUploadTypeError('')
    setError('')
    setIsUploading(true)

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

      const response = await fetch(apiUrl(`/payment-qr/admin/${adminId}`), {
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
          setError(errorData.error || 'Failed to upload payment QR')
        }
        return
      }

      const data = await response.json()
      setImageUrl(data.imageUrl || '')
      showSuccessMessage('Payment QR uploaded successfully')
    } catch (err) {
      setError('Failed to upload payment QR')
    } finally {
      setIsUploading(false)
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
        activeTabId="payment-qr"
        adminName={adminName}
        adminEmail={adminEmail}
        handleLogout={handleLogout}
        tabItems={tabItems}
      />

      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Payment</h1>
            <p className="text-gray-600 text-sm mt-1">Upload the QR users will scan to pay for bookings on your venues.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading payment QR...</div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleUploadButtonClick}
                  disabled={isUploading}
                  className={`w-full px-4 py-3 rounded-full text-[13px] font-semibold text-white transition ${
                    isUploading ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload QR'}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {uploadTypeError && (
                  <p className="mt-2 text-xs text-red-500 text-center">{uploadTypeError}</p>
                )}

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Current QR
                  </p>

                  <div className="w-full h-72 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={resolveImageUrl(imageUrl)}
                        alt="Payment QR"
                        className="h-full w-full object-contain bg-white"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No QR uploaded yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPaymentQr
