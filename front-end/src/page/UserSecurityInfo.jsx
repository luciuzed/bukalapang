import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import AdminSectionBreadcrumb from '../components/AdminSectionBreadcrumb'
import SuccessMessage from '../components/SuccessMessage'
import ProfileSidebar from '../components/ProfileSidebar'
import { apiUrl } from '../config/api'
import { FaUserEdit, FaKey } from 'react-icons/fa'

const PASSWORD_MAX_LENGTH = 72

const getAccountId = (session) =>
  session?.id ?? session?.userId ?? session?.user_id ?? session?.accountId ?? null

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

const UserSecurityInfo = () => {
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState('')
  const [userNumber, setUserNumber] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userCreatedAt, setUserCreatedAt] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userCookie = Cookies.get('user_session')

    if (!userCookie) {
      navigate('/login')
      return
    }

    let isActive = true

    const loadUserProfile = async () => {
      try {
        let sessionData = null

        if (userCookie) {
          try {
            sessionData = JSON.parse(userCookie)
          } catch (error) {
            console.error('Failed to parse user session:', error)
          }
        }

        const sessionUserId = getAccountId(sessionData)

        if (sessionData) {
          setUserId(sessionUserId)
          setUserName(sessionData.name || sessionData.userName || 'Guest')
          setUserNumber(sessionData.phone || sessionData.number || '')
          setUserEmail(sessionData.email || '')
          setUserCreatedAt(sessionData.createdAt || sessionData.created_at || '')
        }

        const lookupParams = new URLSearchParams()
        if (sessionData?.email) {
          lookupParams.set('email', sessionData.email)
        } else if (sessionUserId) {
          lookupParams.set('userId', String(sessionUserId))
        }

        if (!lookupParams.toString()) {
          return
        }

        const response = await fetch(apiUrl(`/user/profile?${lookupParams.toString()}`))
        const data = await response.json()

        if (!response.ok) {
          return
        }

        if (!isActive || !data?.user) {
          return
        }

        setUserId(data.user.userId ?? sessionUserId ?? null)
        setUserName(data.user.userName || sessionData?.name || sessionData?.userName || 'Guest')
        setUserNumber(data.user.userNumber || sessionData?.phone || sessionData?.number || '')
        setUserEmail(data.user.email || sessionData?.email || '')
        setUserCreatedAt(data.user.createdAt || sessionData?.createdAt || sessionData?.created_at || '')
      } catch (error) {
        console.error('Failed to load user profile:', error)
      } finally {
        if (isActive) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadUserProfile()

    return () => {
      isActive = false
    }
  }, [])

  const handleLogout = () => {
    Cookies.remove('user_session')
    navigate('/login')
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

    if (!userId) {
      setGeneralError('User session not found. Please login again')
      return
    }

    try {
      setIsUpdatingPassword(true)
      setSuccess(null)
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
      setSuccess({
        id: Date.now(),
        message: data?.message || 'Password updated successfully. You can now sign in with your new password.',
      })
    } catch (error) {
      setGeneralError('Cannot connect to server')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />
      <ProfileSidebar
        userName={userName}
        userEmail={userEmail}
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
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">User Name</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : userName || 'Guest'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Primary Email</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : maskEmail(userEmail)}
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
                        {isLoadingProfile ? 'Loading...' : userNumber || 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Member Since</p>
                      <p className="text-sm font-bold text-gray-700">
                        {isLoadingProfile ? 'Loading...' : formatCreatedAt(userCreatedAt)}
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

export default UserSecurityInfo
