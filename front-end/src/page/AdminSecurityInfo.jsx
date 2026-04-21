import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiBarChart2, FiGrid, FiCalendar } from 'react-icons/fi'
import { FaUserEdit, FaKey, FaShieldAlt } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import SuccessMessage from '../components/SuccessMessage'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import { apiUrl } from '../config/api'

const PASSWORD_MAX_LENGTH = 72

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***.com'
  const [name, domain] = email.split('@')
  return `${name.substring(0, 2)}***@${domain}`
}

const formatCreatedAt = (createdAt) => {
  if (!createdAt) return 'Not available'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const AdminSecurityInfo = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminNumber, setAdminNumber] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminCreatedAt, setAdminCreatedAt] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    const adminCookie = Cookies.get('admin_session')
    const adminSession = JSON.parse(localStorage.getItem('adminId') || 'null')

    if (!adminSession && !adminCookie) {
      navigate('/login')
      return
    }

    let isActive = true

    const loadAdminProfile = async () => {
      try {
        let sessionData = null

        if (adminCookie) {
          try {
            sessionData = JSON.parse(adminCookie)
          } catch (error) {
            console.error('Failed to parse admin session:', error)
          }
        }

        if (sessionData) {
          setAdminId(sessionData.adminId ?? null)
          setAdminName(sessionData.adminName || 'Admin')
          setAdminNumber(sessionData.adminNumber || sessionData.phone || '')
          setAdminEmail(sessionData.email || '')
          setAdminCreatedAt(sessionData.createdAt || sessionData.created_at || '')

          if (sessionData.adminId) {
            localStorage.setItem('adminId', sessionData.adminId)
          }
        } else if (adminSession) {
          setAdminId(adminSession)
        }

        const lookupParams = new URLSearchParams()
        if (sessionData?.email) {
          lookupParams.set('email', sessionData.email)
        } else if (sessionData?.adminId || adminSession) {
          lookupParams.set('adminId', String(sessionData?.adminId || adminSession))
        }

        if (!lookupParams.toString()) {
          return
        }

        const response = await fetch(apiUrl(`/admin/profile?${lookupParams.toString()}`))
        const data = await response.json()

        if (!response.ok) {
          return
        }

        if (!isActive || !data?.admin) {
          return
        }

        setAdminId(data.admin.adminId ?? sessionData?.adminId ?? adminSession ?? null)
        setAdminName(data.admin.adminName || sessionData?.adminName || 'Admin')
        setAdminNumber(data.admin.adminNumber || sessionData?.adminNumber || sessionData?.phone || '')
        setAdminEmail(data.admin.email || sessionData?.email || '')
        setAdminCreatedAt(data.admin.createdAt || sessionData?.createdAt || sessionData?.created_at || '')
      } catch (error) {
        console.error('Failed to load admin profile:', error)
      } finally {
        if (isActive) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadAdminProfile()

    return () => {
      isActive = false
    }
  }, [navigate])

  const handlePasswordUpdate = async () => {
    setCurrentPasswordError('')
    setGeneralError('')

    if (!currentPassword || !newPassword) {
      setGeneralError('Please fill in current and new password')
      return
    }

    if (newPassword.length < 6) {
      setGeneralError('New password must be at least 6 characters')
      return
    }

    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      setGeneralError(`New password must be ${PASSWORD_MAX_LENGTH} characters or fewer`)
      return
    }

    if (currentPassword === newPassword) {
      setGeneralError('New password must be different from current password')
      return
    }

    if (!adminId) {
      setGeneralError('Admin session not found. Please login again')
      return
    }

    try {
      setIsUpdatingPassword(true)
      const response = await fetch(apiUrl('/admin/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data?.field === 'currentPassword') {
          setCurrentPasswordError(data.error || 'Current password is incorrect')
          return
        }

        setGeneralError(data?.error || 'Failed to update password')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setSuccess({ id: Date.now(), message: data?.message || 'Password updated successfully' })
    } catch (err) {
      setGeneralError('Cannot connect to server')
    } finally {
      setIsUpdatingPassword(false)
    }
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
        activeTabId="security-info"
        adminName={adminName}
        adminEmail={adminEmail}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="w-full max-w-none">
            <div className="mb-3">
              <AdminSectionBreadcrumb label="Security & Info" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-8">Security & Information</h1>

            <div className="space-y-6">
              <div className="w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <FaUserEdit size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Account Information</h3>
                    <p className="text-xs text-gray-400">Verified account details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Admin Name</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : adminName || 'Admin'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Primary Email</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : maskEmail(adminEmail)}
                      </p>
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                      Verified
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Phone Number</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : adminNumber || 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Member Since</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : formatCreatedAt(adminCreatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <FaKey size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Credentials</h3>
                    <p className="text-xs text-gray-400">Update your account password</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    maxLength={PASSWORD_MAX_LENGTH}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      if (currentPasswordError) setCurrentPasswordError('')
                    }}
                    className={`w-full bg-gray-50 border focus:border-primary/20 focus:bg-white p-4 rounded-xl text-sm transition-all outline-none ${
                      currentPasswordError ? 'border-red-500' : 'border-transparent'
                    }`}
                  />
                  {currentPasswordError && (
                    <p className="text-red-500 text-sm mt-1 ml-1">{currentPasswordError}</p>
                  )}
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    maxLength={PASSWORD_MAX_LENGTH}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white p-4 rounded-xl text-sm transition-all outline-none"
                  />
                  {generalError && (
                    <p className="text-red-500 text-sm mt-1 ml-1">{generalError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                    className={`w-full py-4 text-white rounded-2xl font-bold mt-2 transition-all active:scale-[0.98] ${
                      isUpdatingPassword ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary cursor-pointer hover:bg-primary/90'
                    }`}
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminSecurityInfo
