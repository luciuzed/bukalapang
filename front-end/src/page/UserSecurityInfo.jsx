import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import ProfileSidebar from '../components/ProfileSidebar'
import { apiUrl } from '../config/api'
import { FaUserEdit, FaKey } from 'react-icons/fa';

const PASSWORD_MAX_LENGTH = 72

const getAccountId = (session) =>
  session?.id ?? session?.userId ?? session?.user_id ?? session?.accountId ?? null

const UserSecurityInfo = () => {
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@example.com' })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const session = Cookies.get('user_session')

    if (!session) {
      return
    }

    try {
      setUser(JSON.parse(session))
    } catch (error) {
      console.error('Failed to parse user session:', error)
    }
  }, [])

  const handleLogout = () => {
    Cookies.remove('user_session')
    navigate('/login')
  }

  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '***@***.com'
    const [name, domain] = email.split('@')
    return `${name.substring(0, 2)}***@${domain}`
  }

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

    const userId = getAccountId(user)
    if (!userId) {
      setGeneralError('User session not found. Please login again')
      return
    }

    try {
      setIsUpdatingPassword(true)
      const response = await fetch(apiUrl('/user/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
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
    } catch (error) {
      setGeneralError('Cannot connect to server')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProfileSidebar
        userName={user.name}
        userEmail={user.email}
        handleLogout={handleLogout}
      />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            {success && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm font-medium">
                {success.message}
              </div>
            )}

            <div className="mb-5">
              <AdminSectionBreadcrumb label="Security & Info" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-8">Security & Information</h1>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><FaUserEdit size={20} /></div>
                  <div>
                    <h3 className="font-bold text-gray-800">Account Identity</h3>
                    <p className="text-xs text-gray-400">Verified identity details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Full Name</p>
                      <p className="text-sm font-bold text-gray-700">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Primary Email</p>
                      <p className="text-sm font-bold text-gray-700">{maskEmail(user.email)}</p>
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><FaKey size={20} /></div>
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
                    <p className="text-red-500 text-sm -mt-2 ml-1">{currentPasswordError}</p>
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
                    <p className="text-red-500 text-sm -mt-2 ml-1">{generalError}</p>
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
      </div>
    </div>
  )
}

export default UserSecurityInfo
