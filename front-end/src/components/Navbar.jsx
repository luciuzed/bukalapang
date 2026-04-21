import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom"
import logo from '../assets/logo.svg'
import { FaBars, FaTimes, FaCalendarCheck, FaShieldAlt } from "react-icons/fa"
import { FiBarChart2, FiCalendar, FiGrid, FiShield, FiLogOut } from "react-icons/fi"
import { MdAccountCircle } from "react-icons/md"
import Cookies from 'js-cookie'
import Notification from './Notification'
import { apiUrl } from '../config/api'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isCardExiting, setIsCardExiting] = useState(false)
  const [isCardEntering, setIsCardEntering] = useState(true)
  const [pendingBookings, setPendingBookings] = useState([])
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Update user/admin on route change
  useEffect(() => {
    const userSession = Cookies.get('user_session')
    const adminSession = Cookies.get('admin_session')
    
    
    if (userSession) {
      setUser(JSON.parse(userSession))
      setAdmin(null)
    } else if (adminSession) {
      setAdmin(JSON.parse(adminSession))
      setUser(null)
    } else {
      setUser(null)
      setAdmin(null)
    }
  }, [location])

  const fetchPendingBookings = async () => {
    if (!admin?.adminId) {
      setPendingBookings([])
      return
    }

    try {
      const response = await fetch(apiUrl(`/bookings/admin/${admin.adminId}`))
      if (!response.ok) {
        setPendingBookings([])
        return
      }

      const data = await response.json()
      setPendingBookings(Array.isArray(data) ? data.filter((booking) => booking.status === 'pending') : [])
    } catch (error) {
      setPendingBookings([])
    }
  }

  useEffect(() => {
    fetchPendingBookings()

    if (!admin?.adminId) {
      return undefined
    }

    const interval = setInterval(() => {
      fetchPendingBookings()
    }, 30000)

    return () => clearInterval(interval)
  }, [admin?.adminId, location.pathname])

  // Trigger fade-in animation when dropdown appears
  useEffect(() => {
    if (showDropdown && isCardEntering) {
      const timer = setTimeout(() => {
        setIsCardEntering(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showDropdown, isCardEntering])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      const clickedInsideNotifications = notificationRef.current && notificationRef.current.contains(e.target)

      if (!clickedInsideDropdown && !clickedInsideNotifications) {
        setIsCardExiting(true)
        setTimeout(() => {
          setShowDropdown(false)
          setIsCardExiting(false)
          setIsCardEntering(true)
          setShowNotifications(false)
        }, 300)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    Cookies.remove('user_session')
    Cookies.remove('admin_session')
    setUser(null)
    setAdmin(null)
    setIsCardExiting(true)
    setTimeout(() => {
      setShowDropdown(false)
      setIsCardExiting(false)
      setIsCardEntering(true)
    }, 300)
    navigate('/')
  }

  const handleToggleDropdown = () => {
    setShowNotifications(false)

    if (showDropdown) {
      setIsCardExiting(true)
      setTimeout(() => {
        setShowDropdown(false)
        setIsCardExiting(false)
        setIsCardEntering(true)
      }, 300)
    } else {
      setShowDropdown(true)
      setIsCardExiting(false)
      setIsCardEntering(true)
    }
  }

  const handleToggleNotifications = () => {
    setShowDropdown(false)
    setShowNotifications((prev) => !prev)
  }

  const handleNotificationClick = (bookingId) => {
    setShowNotifications(false)
    navigate(`/admin/manage-booking#booking-${bookingId}`)
  }

  const navItemClass = ({ isActive }) =>
    `relative px-3 py-1 transition-all duration-300 ${
      isActive ? 'text-[#009966] font-bold' : 'text-[#009966]/80'
    }`

  return (
    <div className="navbar py-5 flex items-center justify-between relative">

      {/* Logo */}
      <img src={logo} alt="Logo" className="h-15" />

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-center gap-15 font-bold absolute left-1/2 -translate-x-1/2">
        <li className="relative">
          <NavLink to="/" className={navItemClass} end>
            {({ isActive }) => (
              <>
                Home
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
        <li className="relative">
          <NavLink to="/venue" className={navItemClass}>
            {({ isActive }) => (
              <>
                Venue
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
        {/* <li className="relative">
          <NavLink to="/about" className={navItemClass}>
            {({ isActive }) => (
              <>
                About
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li> */}
        <li className="relative">
          <NavLink to="/contact" className={navItemClass}>
            {({ isActive }) => (
              <>
                Contact
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
      </ul>

      {/* RIGHT SECTION */}
      <div className="hidden md:block relative" ref={dropdownRef}>
        {user || admin ? (
          <div className="relative flex items-center gap-2">
            {admin && (
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer text-primary"
                  aria-label="Admin notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 17a3 3 0 0 0 6 0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {pendingBookings.length > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                <Notification
                  isOpen={showNotifications}
                  pendingBookings={pendingBookings}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            )}
            
            {/* Modern Icon Button */}
            <button
              onClick={handleToggleDropdown}
              className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <MdAccountCircle size={40} className="text-primary" />
            </button>

            {/* Dropdown in Navbar.jsx */}
            {showDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  width: '256px',
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  zIndex: 50,
                  border: '1px solid #e5e7eb',
                  opacity: isCardEntering || isCardExiting ? 0 : 1,
                  transform: isCardEntering || isCardExiting ? 'translateY(-10px)' : 'translateY(0)',
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
                }}
              >
                
                {/* Profile Info Header */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-[15px] font-bold text-gray-800 truncate mb-1.5">{admin ? admin.adminName : user?.name || "User"}</p>
                  <p className="text-xs font-normal text-gray-500 truncate">{admin ? admin.email : user?.email || "user@example.com"}</p>
                </div>

                <div className="pt-3 space-y-3">
                  {/* Regular User Options */}
                  {user && (
                    <>
                      <Link to="/bookings" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FaCalendarCheck className="h-3.75 w-3.75 text-gray-500" /> Manage Bookings
                        </div>
                      </Link>
                      <Link to="/user/security-info" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FaShieldAlt className="h-3.75 w-3.75 text-gray-500" /> Security & Info
                        </div>
                      </Link>
                    </>
                  )}

                  {/* Admin Options */}
                  {admin && (
                    <>
                      <Link to="/admin/dashboard" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FiBarChart2 className="h-3.75 w-3.75 text-gray-500" /> Dashboard
                        </div>
                      </Link>
                      <Link to="/admin/manage-field" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FiGrid className="h-3.75 w-3.75 text-gray-500" /> Manage Fields
                        </div>
                      </Link>
                      <Link to="/admin/manage-booking" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FiCalendar className="h-3.75 w-3.75 text-gray-500" /> Manage Bookings
                        </div>
                      </Link>
                      <Link to="/admin/security-info" onClick={() => {
                        setIsCardExiting(true)
                        setTimeout(() => {
                          setShowDropdown(false)
                          setIsCardExiting(false)
                          setIsCardEntering(true)
                        }, 300)
                      }}>
                            <div className="p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm font-bold text-gray-500 transition-colors">
                              <FaShieldAlt className="h-3.75 w-3.75 text-gray-500" /> Security & Info
                        </div>
                      </Link>
                    </>
                  )}

                  <div
                    onClick={handleLogout}
                        className="p-3 hover:bg-red-50 hover:rounded-lg flex items-center gap-3 text-sm font-bold text-red-500 cursor-pointer transition-colors border-t border-gray-200 mt-3"
                  >
                        <FiLogOut className="h-3.75 w-3.75 text-red-500" /> Log Out
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" state={{ initialMode: "register" }}>
              <span className="text-primary font-semibold cursor-pointer hover:underline  ">
                Sign Up
              </span>
            </Link>

            <div className="h-6 w-px bg-gray-300" /> 

            <Link to="/login" state={{ initialMode: "login" }}>
              <button className="bg-primary text-white font-semibold px-4 py-2 rounded-full cursor-pointer hover:opacity-90 transition">
                Login
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Button */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white shadow-md flex flex-col items-center gap-6 py-6 md:hidden z-50">

          <NavLink to="/" onClick={() => setIsOpen(false)}>Home</NavLink>
          <NavLink to="/venue" onClick={() => setIsOpen(false)}>Venue</NavLink>
          {/* <NavLink to="/about" onClick={() => setIsOpen(false)}>About</NavLink> */}
          <NavLink to="/contact" onClick={() => setIsOpen(false)}>Contact</NavLink>


          {user ? (
            <>
              <div className="flex items-center gap-2">
                <MdAccountCircle size={28} className="text-primary" />
                <span>{user.name}</span>
              </div>
              <Link to="/bookings" onClick={() => setIsOpen(false)}>
                Manage Bookings
              </Link>
              <Link to="/user/security-info" onClick={() => setIsOpen(false)}>
                Security & Info
              </Link>
            </>
          ) : admin ? (
            <>
              <div className="flex items-center gap-2">
                <MdAccountCircle size={28} className="text-primary" />
                <span>{admin.adminName}</span>
              </div>

              <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-500 font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <button className="bg-primary text-white px-4 py-2 rounded-full">
                Sign Up
              </button>
            </Link>
          )}

        </div>
      )}
    </div>
  )
}

export default Navbar