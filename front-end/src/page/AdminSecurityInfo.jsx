import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiBarChart2, FiGrid, FiCalendar, FiCreditCard, FiUser } from 'react-icons/fi'
import { FaUserEdit, FaKey } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import SuccessMessage from '../components/SuccessMessage'
import { apiUrl } from '../config/api'

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***.com'
  const [name, domain] = email.split('@')
  return `${name.substring(0, 2)}***@${domain}`
}

const AdminSecurityInfo = () => {
  const navigate = useNavigate()
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [success, setSuccess] = useState(null)

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
      setAdminName(sessionData.adminName || 'Admin')
      setAdminEmail(sessionData.email || '')
      localStorage.setItem('adminId', sessionData.adminId)
    } else if (adminSession) {
      setAdminId(adminSession)
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

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, path: '/dashboard' },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid, path: '/field' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/booking' },
    { id: 'payment-qr', label: 'Payment QR', icon: FiCreditCard, path: '/admin/payment-qr' },
    { id: 'security-info', label: 'Security & Info', icon: FiUser, path: '/admin/security-info' },
  ]

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
        tabItems={tabItems}
      />

      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
          <h1 className="text-2xl font-black text-gray-800 mb-8">Security & Information</h1>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <FaUserEdit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Account Identity</h3>
                  <p className="text-xs text-gray-400">Verified identity details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="flex justify-between items-center border-b border-black-50 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Admin Name</p>
                    <p className="text-sm font-bold text-gray-700">{adminName || 'Admin'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-black-50 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Primary Email</p>
                    <p className="text-sm font-bold text-gray-700">{maskEmail(adminEmail)}</p>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gray-100 p-3 rounded-2xl text-gray-600">
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
                    isUpdatingPassword ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminSecurityInfo
