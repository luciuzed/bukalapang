import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiUser } from 'react-icons/fi'
import LOGO from '../assets/header.svg'

const Sidebar = ({ activeTabId, adminName, adminEmail, handleLogout, tabItems }) => {
  const navigate = useNavigate()

  return (
    <aside className="w-64 h-screen bg-primary text-white flex flex-col sticky top-0 overflow-hidden">
      <div className="px-6 pt-8 pb-6">
        <img src={LOGO} alt="MainYuk" className="h-10 w-30" />
      </div>

      <nav className="px-3 pb-8 space-y-1 flex-1 overflow-y-auto">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm font-bold transition cursor-pointer ${
              tab.id === activeTabId
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-6">
        <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25">
            <FiUser className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white tracking-wide">{adminName}</p>
            <p className="text-xs text-white/70 truncate">{adminEmail}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-3 text-sm font-semibold text-white/90 transition cursor-pointer hover:bg-white/20 hover:text-white"
        >
          <FiLogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
