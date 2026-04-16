import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaShieldAlt, FaChevronLeft } from 'react-icons/fa';
import { FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import LOGO from '../assets/header.svg';

const ProfileSidebar = ({ activeTab, setActiveTab, userName, userEmail, handleLogout }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div
        className={`md:hidden fixed top-4 z-50 transition-all duration-300 ${
          isOpen ? 'left-[calc(16rem-3.5rem)]' : 'left-4'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative flex items-center justify-center
            w-11 h-11 rounded-2xl
            bg-white/90 backdrop-blur-md
            shadow-lg shadow-black/10
            border border-white/30
            transition-all duration-300
            hover:scale-105 active:scale-95
          `}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 transition" />

          {/* Icon */}
          <div className="relative text-primary">
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </div>
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen overflow-hidden flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="px-6 pt-8 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-bold text-white/60 mb-6 uppercase cursor-pointer hover:text-white transition-colors"
          >
            <FaChevronLeft size={8} /> Back
          </button>
          <img src={LOGO} alt="MainYuk" className="h-10 w-30" />
        </div>

        {/* Navigation Section */}
        <nav className="px-3 pb-8 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('bookings'); setIsOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm font-bold transition cursor-pointer ${
              activeTab === 'bookings' 
                ? 'bg-white/20 text-white' 
                : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <FaCalendarCheck className="h-5 w-5" /> 
            <span>Manage Bookings</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('security'); setIsOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm font-bold transition cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-white/20 text-white' 
                : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <FaShieldAlt className="h-5 w-5" /> 
            <span>Security & Info</span>
          </button>
        </nav>

        {/* Bottom Section: User Info & Logout */}
        <div className="mt-auto px-3 pb-6">
          <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-4 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white tracking-wide truncate">
                {userName || 'Guest'}
              </p>
              <p className="text-[10px] text-white/70 truncate">
                {userEmail || 'User'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg cursor-pointer bg-white/15 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/20 hover:text-white active:scale-[0.98]"
          >
            <FiLogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ProfileSidebar;