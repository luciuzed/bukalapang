import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaShieldAlt, FaChevronLeft } from 'react-icons/fa';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 h-screen hidden md:block">
      <div className="w-72 bg-white border-r border-gray-200 h-full p-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 uppercase hover:text-black"
          >
            <FaChevronLeft /> Back
          </button>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Management</p>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'bookings' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-50 '
              }`}
            >
              <FaCalendarCheck /> Manage Bookings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'security' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <FaShieldAlt /> Security & Info
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
