import { useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import IMAGE_RING from '../assets/ring.jpg'
import IMAGE_PADEL from '../assets/padel.jpg'
import IMAGE_BILIARD from '../assets/biliard.jpg'
import IMAGE_TENNIS from '../assets/tennis.jpg'

import { FaUser, FaLock, FaPhoneAlt, FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const images = [IMAGE_RING, IMAGE_PADEL, IMAGE_BILIARD, IMAGE_TENNIS]

  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [images.length])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm()

  const handleLogin = async (formData) => {
    setError('');

    console.log("Sending to server:", { email: formData.email, password: formData.password }) //debug
    const url = role === "User" ? "login" : "login-business";

    try {
      const response = await fetch(`http://localhost:5000/api/${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        const name = data.user?.name || data.admin?.name || 'User'
        if (role === "User") {
          navigate("/venue")
        } else {
          navigate("/dashboard")
        }
        return
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
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

    try {
      const response = await fetch(`http://localhost:5000/api/${url}`, {
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

      if (response.ok) {
        if (role === "User") {
          navigate("/home")
        } else {
          navigate("/dashboard")
        }
        return
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
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
    } else {
      await handleLogin(data)
    }
  }

  const handleModeSwitch = () => {
    setMode(mode === "login" ? "register" : "login")
    setRole("User")
    setShowPassword(false)
    setShowConfirmPassword(false)
    setError("")
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
    alert("Forgot password functionality - implement your logic here");
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

  return (
    <div className="w-full min-h-screen-80px flex flex-col lg:flex-row">

      {/* LEFT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center px-6 lg:px-10">
        
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col pt-5"
        >

          {/* option */}
          {mode === "login" && (
            <div className="w-full flex justify-center">
              <div className="w-3/4 flex mb-5 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => handleRoleChange("User")}
                  className={`flex-1 pb-3 font-semibold ${
                    role === "User"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-400"
                  }`}
                >
                  User
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("Business")}
                  className={`flex-1 pb-3 font-semibold ${
                    role === "Business"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-400"
                  }`}
                >
                  Business
                </button>
              </div>
            </div>
          )}

          {/* title */}
          <h1
            className={`font-semibold text-5xl mx-5 justify-center items-center flex ${
              mode === "login" ? "mt-10" : "mt-0"
            } ${
              mode === "login" ? "mb-15" : "mb-5"
            }`} 
          >
            {mode === "login" ? "Welcome Back!" : "Create Account"}
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
                    onClick={() => setRole("Admin")}
                    className={`px-6 py-2 rounded-full border ${
                      role === "Admin"
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    Admin
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
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

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
                    className="text-sm text-primary hover:text-primary-dark hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="w-full flex justify-center">
              <div className="w-3/4 flex gap-4 mb-4">

                <div className={`w-1/2 ${errors.password ? 'mb-0' : ''}`}>
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

                <div className={`w-1/2 ${errors.confirmPassword ? 'mb-0' : ''}`}>
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
                : "Already have an account? Login"}
            </button>
          </div>
        </form>
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
                className="w-full h-full flex-shrink-0 object-cover"
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