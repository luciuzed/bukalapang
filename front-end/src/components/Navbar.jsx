import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from "react-router-dom"
import logo from '../assets/logo.svg'
import { FaBars, FaTimes, FaUserEdit, FaSignOutAlt } from "react-icons/fa"
import { MdAccountCircle } from "react-icons/md"
import Cookies from 'js-cookie'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
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
    setShowDropdown(false)
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
      <ul className="hidden md:flex items-center gap-15 font-bold">
        <li className="relative">
          <NavLink to="/" className={navItemClass} end>
            {({ isActive }) => (
              <>
                Home
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-[2px] bg-[#009966] transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
        <li className="relative">
          <NavLink to="/venue" className={navItemClass}>
            {({ isActive }) => (
              <>
                Venue
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-[2px] bg-[#009966] transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
        <li className="relative">
          <NavLink to="/contact" className={navItemClass}>
            {({ isActive }) => (
              <>
                Contact
                <span className={`absolute left-1/2 -translate-x-1/2 -bottom-2 h-[2px] bg-[#009966] transition-all duration-300 ${isActive ? 'w-3/4' : 'w-0'}`} />
              </>
            )}
          </NavLink>
        </li>
      </ul>

      {/* RIGHT SECTION */}
      <div className="hidden md:block relative" ref={dropdownRef}>
        {user || admin ? (
          <div className="relative">
            
            {/* Modern Icon Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <MdAccountCircle size={40} className="text-primary" />
            </button>

            {/* Dropdown in Navbar.jsx */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-3 z-50 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                
                {/* Profile Info Header */}
                <div className="px-5 py-3 border-b border-gray-200">
                  <p className="text-sm font-black text-gray-800 truncate">{admin ? admin.adminName : user?.name || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{admin ? admin.email : user?.email || "user@example.com"}</p>
                </div>

                <div className="py-2">
                  {user && (
                    <Link to="/profile" onClick={() => setShowDropdown(false)}>
                      <div className="px-5 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-600 transition-colors">
                        <FaUserEdit className="text-gray-400" /> Profile
                      </div>
                    </Link>
                  )}
                  {admin && (
                    <Link to="/dashboard" onClick={() => setShowDropdown(false)}>
                      <div className="px-5 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-600 transition-colors">
                        <FaUserEdit className="text-gray-400" /> Dashboard
                      </div>
                    </Link>
                  )}

                  <div
                    onClick={handleLogout}
                    className="px-5 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-500 cursor-pointer transition-colors"
                  >
                    <FaSignOutAlt /> Logout
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <Link to="/login">
            <button className="bg-primary text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition">
              Sign Up
            </button>
          </Link>
        )}
      </div>

      {/* Mobile Button */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white shadow-md flex flex-col items-center gap-6 py-6 md:hidden z-50">

          <NavLink to="/" onClick={() => setIsOpen(false)}>Home</NavLink>
          <NavLink to="/venue" onClick={() => setIsOpen(false)}>Venue</NavLink>
          <NavLink to="/contact" onClick={() => setIsOpen(false)}>Contact</NavLink>

          {user ? (
            <>
              <div className="flex items-center gap-2">
                <MdAccountCircle size={28} className="text-primary" />
                <span>{user.name}</span>
              </div>

              <Link to="/profile" onClick={() => setIsOpen(false)}>
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-500 font-semibold"
              >
                Logout
              </button>
            </>
          ) : admin ? (
            <>
              <div className="flex items-center gap-2">
                <MdAccountCircle size={28} className="text-primary" />
                <span>{admin.adminName}</span>
              </div>

              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
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