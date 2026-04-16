import { useEffect, useRef, useState } from 'react'
import { useForm } from "react-hook-form"
import { useNavigate, useLocation } from "react-router-dom"
import LoadingOverlay from '../components/LoadingOverlay'
import IMAGE_RING from '../assets/ring.jpg'
import IMAGE_PADEL from '../assets/padel.jpg'
import IMAGE_BILIARD from '../assets/biliard.jpg'
import IMAGE_TENNIS from '../assets/tennis.jpg'
import { apiUrl } from '../config/api'

import Cookies from 'js-cookie';
import { FaUser, FaLock, FaPhoneAlt, FaEye, FaEyeSlash, FaChevronLeft, FaEnvelope } from "react-icons/fa";

const PasswordInput = ({ placeholder, showPassword, setShowPassword, error, ...props }) => {
  return (
    <div className="relative w-full">
      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...props}
        className={`w-full pl-12 pr-12 py-3 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {showPassword ? (
        <FaEye
          onClick={() => setShowPassword(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
        />
      ) : (
        <FaEyeSlash
          onClick={() => setShowPassword(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
        />
      )}
    </div>
  )
}

const LoginPage = () => {
  const [role, setRole] = useState('User')
  const [error, setError] = useState('');
  const [mode, setMode] = useState("login")
  const [showOtpUI, setShowOtpUI] = useState(false)
  const [showResetUI, setShowResetUI] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', ''])
  const [otpRemaining, setOtpRemaining] = useState(60)
  const [otpTimerCycle, setOtpTimerCycle] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingRegisterData, setPendingRegisterData] = useState(null)
  const [pendingLoginRoute, setPendingLoginRoute] = useState(null)
  const [pendingOtpInfo, setPendingOtpInfo] = useState(null)
  const [pendingResetInfo, setPendingResetInfo] = useState(null)
  const [otpStatus, setOtpStatus] = useState('')
  const otpRefs = useRef([])
  const otpVerifyInFlight = useRef(false)
  const [showPassword, setShowPassword] = useState(false)
  const prevShowOtp = useRef(showOtpUI)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const images = [IMAGE_RING, IMAGE_PADEL, IMAGE_BILIARD, IMAGE_TENNIS]

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [images.length])

  useEffect(() => {
    if (prevShowOtp.current && !showOtpUI) {
      setError('')
      setOtpStatus('')
    }
    prevShowOtp.current = showOtpUI
  }, [showOtpUI])

  useEffect(() => {
    if (!showOtpUI) return
    setOtpRemaining(60)

    if (otpRefs.current[0]) {
      otpRefs.current[0].focus()
    }

    const interval = setInterval(() => {
      setOtpRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showOtpUI, otpTimerCycle])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError: setFieldError,
    clearErrors,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    if (location.state?.initialMode) {
      const newMode = location.state.initialMode;
      
      setMode(newMode);
      
      setError("");
      setOtpStatus('');
      setRole("User");
      setShowOtpUI(false);
      setShowResetUI(false);
      setPendingOtpInfo(null);
      setPendingResetInfo(null);
      reset(); 
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, reset]);

  const resetAuthMessages = () => {
    setError('')
    setOtpStatus('')
    clearErrors()
  }

  const handleLogin = async (formData) => {
    setError('');
    setIsLoading(true)
    const url = role === "User" ? "login" : "login-business";

    try {
      const response = await fetch(apiUrl(`/${url}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (response.ok && data.otpNeeded) {
        const targetRoute = role === "User" ? "/venue" : "/dashboard"
        setPendingOtpInfo({ email: formData.email, role, redirect: targetRoute })
        setPendingLoginRoute(targetRoute)
        setOtpCode(['', '', '', ''])
        setOtpTimerCycle((prev) => prev + 1)
        setShowOtpUI(true)
        setError('')
        return
      } else if (response.ok) {
        Cookies.set('user_session', JSON.stringify(data.user), { expires: 7 });
        const targetRoute = role === "User" ? "/venue" : "/dashboard"
        navigate(targetRoute)
        return
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setIsLoading(false)
    }
  };
  const handleRegister = async (formData) => {
    setError('');

    const url = role === "User" ? "register" : "register-business";

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        return setError("Please fill in all fields");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setIsLoading(true)
    try {
      const response = await fetch(apiUrl(`/${url}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.fullName, 
          email: formData.email, 
          password: formData.password,
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (response.ok && data.otpNeeded) {
        const targetRoute = role === "User" ? "/home" : "/dashboard"
        setPendingOtpInfo({ email: formData.email, role, name: formData.fullName, phone: formData.phone, redirect: targetRoute })
        setOtpCode(['', '', '', ''])
        setOtpTimerCycle((prev) => prev + 1)
        setShowOtpUI(true)
        setPendingRegisterData(null)
        setError('')
        return
      } else if (response.ok) {
        Cookies.set('user_session', JSON.stringify(data.user), { expires: 7 });
        const targetRoute = role === "User" ? "/home" : "/dashboard"
        navigate(targetRoute)
        setError('')
        return
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setIsLoading(false)
    }
  };

  const onSubmit = async (data) => {
    if (mode === "register") {
      if (!role) {
        setError("Please select a role")
        return
      }
      
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match")
        return
      }
      
      await handleRegister(data)
      return
    }

    if (mode === 'forgot') {
      await handleForgotPasswordSubmit(data)
      return
    }

    await handleLogin(data)
  }

  const handleModeSwitch = () => {
    if (mode === 'forgot') {
      setMode('login')
    } else {
      setMode(mode === "login" ? "register" : "login")
    }
    setRole("User")
    setShowOtpUI(false)
    setShowResetUI(false)
    setPendingRegisterData(null)
    setPendingLoginRoute(null)
    setPendingOtpInfo(null)
    setPendingResetInfo(null)
    setOtpCode(['', '', '', ''])
    setShowPassword(false)
    setShowConfirmPassword(false)
    resetAuthMessages()
    reset()
  }

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    if (mode === "login") {
      setValue("password", "")
      setShowPassword(false)
    }
  }

  const handleForgotPassword = () => {
    setMode('forgot')
    setShowOtpUI(false)
    setShowResetUI(false)
    setPendingOtpInfo(null)
    setPendingResetInfo(null)
    setPendingLoginRoute(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setOtpCode(['', '', '', ''])
    setOtpRemaining(60)
    resetAuthMessages()
    setValue('password', '')
    setValue('confirmPassword', '')
  }

  const handleOtpBackToAuth = () => {
    setShowOtpUI(false)
    setPendingOtpInfo(null)
    resetAuthMessages()
    setOtpRemaining(60)
  }

  const handleResetBackToAuth = () => {
    setShowResetUI(false)
    setPendingResetInfo(null)
    setMode('forgot')
    resetAuthMessages()
    setShowPassword(false)
    setShowConfirmPassword(false)
    setValue('newPassword', '')
    setValue('confirmNewPassword', '')
  }

  const handleResendOtp = async () => {
    if (!pendingOtpInfo) {
      setError('No pending OTP information for resend')
      setOtpStatus('')
      return
    }

    setOtpStatus('')
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl('/resend-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingOtpInfo.email, role: pendingOtpInfo.role }),
      })

      const data = await response.json()
      if (response.ok) {
        setError('')
        setOtpStatus('OTP resent successfully')
        setOtpCode(['', '', '', ''])
        setOtpTimerCycle((prev) => prev + 1)
      } else {
        setOtpStatus('')
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (err) {
      setOtpStatus('')
      setError('Cannot connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const validatePhoneNumber = (value) => {
    if (!value.startsWith('0') && !value.startsWith('+62')) {
      return "Phone number must start with 0 or +62";
    }
    
    let cleaned = value.replace(/[^\d+]/g, '')
    
    if (cleaned.startsWith('+62')) {
      if (cleaned.length < 10 || cleaned.length > 15) {
        return "Phone number must be between 10-15 digits"
      }
    } else if (cleaned.startsWith('0')) {
      if (cleaned.length < 10 || cleaned.length > 13) {
        return "Phone number must be between 10-13 digits"
      }
    }
    
    return true
  }

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) return

    setOtpCode((prev) => {
      const next = [...prev]
      next[index] = cleaned.slice(0, 1)

      if (index === 3 && next.join('').length === 4) {
        setTimeout(() => {
          submitOtpVerification(next.join(''))
        }, 100)
      }

      return next
    })

    const nextInput = otpRefs.current[index + 1]
    if (nextInput) {
      nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (otpCode[index] === '') {
        const prevInput = otpRefs.current[index - 1]
        if (prevInput) {
          prevInput.focus()
          setOtpCode((prev) => {
            const next = [...prev]
            next[index - 1] = ''
            return next
          })
        }
      } else {
        setOtpCode((prev) => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      }
      event.preventDefault()
    }

    if (event.key.length === 1 && /\D/.test(event.key)) {
      event.preventDefault()
    }
  }

  const submitOtpVerification = async (pinValue = null) => {
    if (otpVerifyInFlight.current) {
      return
    }

    const pin = pinValue || otpCode.join('')
    if (pin.length < 4) {
      setOtpStatus('')
      setError('Please enter the full 4-digit OTP')
      return
    }

    setOtpStatus('')
    setError('')

    if (otpRemaining <= 0) {
      setOtpStatus('')
      setError('OTP expired. Please request a new code.')
      return
    }

    if (!pendingOtpInfo) {
      setOtpStatus('')
      setError('No pending OTP request. Please login/register again.')
      return
    }

    otpVerifyInFlight.current = true
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl('/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingOtpInfo.email,
          role: pendingOtpInfo.role,
          otp: pin,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        if (pendingOtpInfo?.flow === 'forgot-password') {
          setPendingResetInfo({
            email: pendingOtpInfo.email,
            role: pendingOtpInfo.role,
            resetToken: data.resetToken,
          })
          setShowOtpUI(false)
          setPendingOtpInfo(null)
          setOtpCode(['', '', '', ''])
          setOtpStatus('')
          setError('')
          setMode('forgot')
          setShowResetUI(true)
          return
        }

        const userPayload = data.user || { email: pendingOtpInfo.email, role: pendingOtpInfo.role, name: pendingOtpInfo.name, phone: pendingOtpInfo.phone  };
        
        // Set appropriate cookie based on role
        if (userPayload.role === 'Business') {
          Cookies.set('admin_session', JSON.stringify({
            adminId: userPayload.id,
            adminName: userPayload.name,
            email: userPayload.email,
            phone: userPayload.phone
          }), { expires: 7 });
        } else {
          Cookies.set('user_session', JSON.stringify(userPayload), { expires: 7 });
        }
        
        setShowOtpUI(false)
        setOtpCode(['', '', '', ''])
        setPendingOtpInfo(null)
        setOtpStatus('')
        setError('')
        navigate(data.redirect || pendingOtpInfo.redirect)
      } else {
        setOtpStatus('')
        setError(data.error || data.message || 'OTP verification failed')
      }
    } catch (err) {
      setOtpStatus('')
      setError('Cannot connect to server')
    } finally {
      otpVerifyInFlight.current = false
      setIsLoading(false)
    }
  }

  const handleOtpVerify = () => {
    submitOtpVerification()
  }

  const renderRoleSelector = (disabled = false) => (
    <div className="w-full flex justify-center">
      <div className="w-3/4 flex mb-5 border-b border-gray-200">
        <button
          type="button"
          onClick={() => !disabled && handleRoleChange('User')}
          disabled={disabled}
          className={`flex-1 pb-3 font-semibold cursor-pointer ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${
            role === 'User'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400'
          }`}
        >
          User
        </button>

        <button
          type="button"
          onClick={() => !disabled && handleRoleChange('Business')}
          disabled={disabled}
          className={`flex-1 pb-3 font-semibold cursor-pointer ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${
            role === 'Business'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400'
          }`}
        >
          Business
        </button>
      </div>
    </div>
  )

  const handleForgotPasswordSubmit = async (formData) => {
    setError('')
    setOtpStatus('')
    setIsLoading(true)

    try {
      const response = await fetch(apiUrl('/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          role,
        }),
      })

      const data = await response.json()

      if (response.ok && data.otpNeeded) {
        setPendingOtpInfo({
          email: formData.email,
          role: data.role || role,
          flow: 'forgot-password',
        })
        setPendingResetInfo(null)
        setOtpCode(['', '', '', ''])
        setOtpTimerCycle((prev) => prev + 1)
        setShowResetUI(false)
        setShowOtpUI(true)
        return
      }

      if (response.status === 404 && data.field === 'email') {
        setFieldError('email', { type: 'manual', message: data.error || 'Email does not exist' })
        return
      }

      setError(data.error || 'Failed to start password reset')
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (formData) => {
    setError('')
    setOtpStatus('')
    clearErrors(['newPassword', 'confirmNewPassword'])

    if (!formData.newPassword) {
      setFieldError('newPassword', { type: 'manual', message: 'New password is required' })
      return
    }

    if (String(formData.newPassword).length < 6) {
      setFieldError('newPassword', { type: 'manual', message: 'Minimum 6 characters' })
      return
    }

    if (!formData.confirmNewPassword) {
      setFieldError('confirmNewPassword', { type: 'manual', message: 'Please confirm your new password' })
      return
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setFieldError('confirmNewPassword', { type: 'manual', message: 'Passwords do not match' })
      return
    }

    if (!pendingResetInfo?.resetToken) {
      setError('Reset session not found. Please request a new OTP.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(apiUrl('/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: pendingResetInfo.resetToken,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmNewPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOtpStatus('Password updated successfully. You can now log in.')
        setShowResetUI(false)
        setPendingResetInfo(null)
        setPendingOtpInfo(null)
        setShowPassword(false)
        setShowConfirmPassword(false)
        setRole(role)
        setMode('login')
        reset({ email: pendingResetInfo.email })
        return
      }

      if (data.field === 'newPassword') {
        setFieldError('newPassword', { type: 'manual', message: data.error || 'Invalid password' })
        return
      }

      if (data.field === 'confirmPassword') {
        setFieldError('confirmNewPassword', { type: 'manual', message: data.error || 'Passwords do not match' })
        return
      }

      setError(data.error || 'Failed to reset password')
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen-80px flex flex-col lg:flex-row relative">
      <LoadingOverlay show={isLoading} />

      {/* LEFT SIDE */}
      <div className={`w-full lg:w-1/2 flex ${showOtpUI || showResetUI ? 'items-start' : 'items-center'} sm:px-6 lg:px-16`}>
        {showOtpUI ? (
          <div className="w-full flex flex-col ">
            <button
                type="button"
                onClick={handleOtpBackToAuth}
                className="flex w-fit items-center gap-2 text-xs font-bold text-gray-400 mb-6 pt-10 cursor-pointer uppercase hover:text-black"
              >
              <FaChevronLeft /> Back
            </button>
            <div className="mx-5 mt-10 mb-8">
              <h2 className="text-4xl font-semibold text-center">Verify OTP</h2>
              <p className="text-center text-gray-500 mt-2">
                Enter the 4-digit code sent to your email to continue.
              </p>
            </div>

            <div className="w-full flex justify-center mb-6">
              <div className="flex justify-center gap-3 sm:w-3/4 sm:justify-between">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-14 h-14 text-center text-xl border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                ))}
              </div>
            </div>

            <div className="w-full flex justify-center mt-4">
              <p className={`text-lg text-center font-bold ${otpRemaining > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {otpRemaining > 0
                  ? `${String(Math.floor(otpRemaining / 60)).padStart(2, '0')} : ${String(otpRemaining % 60).padStart(2, '0')}`
                  : '00 : 00'}
              </p>
            </div>

            <div className="w-full flex justify-center mt-5">
              <button
                type="button"
                onClick={handleOtpVerify}
                className="w-3/4 bg-primary text-white py-3 rounded-full font-semibold cursor-pointer hover:opacity-90 transition"
                disabled={otpRemaining <= 0 || isLoading}
              >
                Verify OTP
              </button>
            </div>

            <div className="w-full flex justify-center mt-3 text-center text-sm text-gray-500">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-gray-500 cursor-pointer hover:text-primary hover:underline"
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </div>

            <div className="w-full flex justify-center mt-4 text-center text-sm">
              {otpStatus && (
                <p className="text-green-600 font-medium">{otpStatus}</p>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

          </div>
        ) : showResetUI ? (
          <form
            onSubmit={handleSubmit(handleResetPasswordSubmit)}
            className="w-full flex flex-col"
          >
            <button
              type="button"
              onClick={handleResetBackToAuth}
              className="flex w-fit items-center gap-2 text-xs font-bold cursor-pointer text-gray-400 mb-6 pt-10 uppercase hover:text-black"
            >
              <FaChevronLeft /> Back
            </button>

            <h1 className="font-semibold text-5xl mx-5 justify-center items-center flex mt-0 mb-5">
              Reset Password
            </h1>

            <div className="w-full flex justify-center">
              <div className={`w-3/4 ${errors.newPassword ? 'mb-2' : 'mb-4'}`}>
                <PasswordInput
                  placeholder="New Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  error={errors.newPassword}
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters"
                    }
                  })}
                />

                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1 ml-5">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full flex justify-center">
              <div className={`w-3/4 ${errors.confirmNewPassword ? 'mb-2' : 'mb-4'}`}>
                <PasswordInput
                  placeholder="Confirm New Password"
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  error={errors.confirmNewPassword}
                  {...register("confirmNewPassword", {
                    required: "Please confirm your new password",
                    validate: (value) =>
                      value === watch("newPassword") || "Passwords do not match"
                  })}
                />

                {errors.confirmNewPassword && (
                  <p className="text-red-500 text-sm mt-1 ml-5">
                    {errors.confirmNewPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-3/4 bg-primary text-white py-3 rounded-full font-semibold cursor-pointer hover:opacity-90 transition"
              >
                Continue
              </button>
            </div>

            {otpStatus && (
              <p className="text-green-600 font-medium text-center mt-4">{otpStatus}</p>
            )}

            {error && (
              <p className="text-red-500 text-center mt-4">{error}</p>
            )}
          </form>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col pt-5"
          >

          {/* option */}
          {(mode === "login" || mode === "forgot") && renderRoleSelector(false)}

          {/* title */}
          <h1
            className={`font-semibold text-5xl mx-5 justify-center items-center flex ${
              mode === "register" ? "mt-0" : "mt-10"
            } ${
              mode === "register" ? "mb-5" : "mb-15"
            }`} 
          >
            {mode === "login" ? "Welcome Back!" : mode === "register" ? "Create Account" : "Reset Password"}
          </h1>
        
        
          {mode === "register" && (
            <div className="w-full flex flex-col items-center">
              {/* roles selection */}
              <div className="w-3/4">
                <p className="mb-2 font-semibold">Register as:</p>

                <div className="flex gap-4 mb-4">

                  <button
                    type="button"
                    onClick={() => setRole("User")}
                    className={`px-6 py-2 rounded-full border ${
                      role === "User"
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    User
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("Business")}
                    className={`px-6 py-2 rounded-full border ${
                      role === "Business"
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    Business
                  </button>

                </div>
                {!role && (
                  <p className="text-red-500 text-sm">Please select a role</p>
                )}
              </div>
              {/* register name input */}
              <div className={`w-3/4 ${errors.fullName ? 'mb-2' : 'mb-4'}`}>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    placeholder="Full Name"
                    {...register("fullName", {
                      required: "Full name is required",
                      minLength: {
                        value: 3,
                        message: "Minimum 3 characters"
                      }
                    })}
                    className={`w-full pl-12 pr-4 py-3 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>

                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1 ml-5">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

            </div>
          )}

          <div className="w-full flex justify-center">
            <div className={`w-3/4 ${errors.email ? 'mb-2' : 'mb-4'}`}>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  placeholder="Email Address"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/i,
                      message: "Invalid email"
                    }
                  })}
                  className={`w-full pl-12 pr-4 py-3 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>

              {mode === "forgot"}

              {errors.email && (
                <p className="text-red-500 text-sm mt-1 ml-5">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {mode === "register" && (
            <div className="w-full flex justify-center">
              <div className={`w-3/4 ${errors.phone ? 'mb-2' : 'mb-4'}`}>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="tel"
                    placeholder="Phone Number"
                    {...register("phone", {
                      required: "Phone number is required",
                      validate: validatePhoneNumber, 
                      onChange: (e) => {
                        let value = e.target.value
                        if (value.startsWith("0")) {
                          value = "+62" + value.slice(1)
                          e.target.value = value
                        }
                        value = value.replace(/[^\d+]/g, '')
                        e.target.value = value
                      }
                    })}
                    className={`w-full pl-12 pr-4 py-3 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>

                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 ml-5">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="w-full flex justify-center">
              <div className={`w-3/4 ${errors.password ? 'mb-2' : 'mb-4'}`}>
                <PasswordInput
                  placeholder="Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  error={errors.password}
                  {...register("password", {
                    required: "Password is required"
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 ml-5">
                    {errors.password.message}
                  </p>
                )}
                
                {/* Forgot Password Link */}
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:text-primary-dark cursor-pointer hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="w-full flex justify-center">
              <div className="w-3/4 flex flex-col sm:flex-row gap-4 mb-4">

                <div className={`w-full sm:w-1/2 ${errors.password ? 'mb-0' : ''}`}>
                  <PasswordInput
                    placeholder="Password"
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    error={errors.password}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Minimum 6 characters"
                      }
                    })}
                  />

                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 ml-5">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className={`w-full sm:w-1/2 ${errors.confirmPassword ? 'mb-0' : ''}`}>
                  <PasswordInput
                    placeholder="Confirm Password"
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    error={errors.confirmPassword}
                    {...register("confirmPassword", {
                      required: "Confirm password is required",
                      validate: (value) =>
                        value === watch("password") || "Passwords do not match"
                    })}
                  />

                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 ml-5">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}
          {otpStatus && (
            <p className="text-green-600 font-medium text-center mb-4">{otpStatus}</p>
          )}
          <div className=""><p className="text-red-500 text-center mb-4">{error}</p></div>
          <div className="flex justify-center">
            <button
              type="submit"
            className="w-3/4 bg-primary text-white py-3 rounded-full font-semibold cursor-pointer hover:opacity-90 transition"
            >
              Continue
            </button>
          </div>

          <div className="w-full flex justify-center mt-4">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              {mode === "login"
                ? "Don’t have an account? Register"
                : mode === "forgot"
                  ? "Back to Login"
                  : "Already have an account? Login"}
            </button>
          </div>
        </form>
        )}
      </div>        
      {/* right */}
      <div className="hidden lg:flex w-1/2 justify-center items-center py-5 lg:h-[80vh]">
        <div className="w-3/4 h-full max-h-[70vh] overflow-hidden rounded-xl bg-gray-100 relative">
          <div
            className="h-full flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full shrink-0 object-cover"
              />
            ))}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <span
                key={`dot-${idx}`}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  idx === activeSlide ? 'bg-white scale-125' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

export default LoginPage