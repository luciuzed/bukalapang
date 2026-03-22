import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaShieldAlt, FaSignOutAlt, FaUserEdit, FaKey } from 'react-icons/fa';
import Cookies from 'js-cookie';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [user, setUser] = useState({ name: "Guest", email: "guest@example.com" });

  useEffect(() => {
    const session = Cookies.get('user_session');
        if (session) {
        const parsedData = JSON.parse(session);
        console.log("Cookie Data:", parsedData); // Check your console to see if 'name' is there!
        setUser(parsedData);
        }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <div className="w-72 bg-white border-r min-h-screen p-6 hidden md:block">
        <div className="mb-10 px-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Manajemen</p>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'bookings' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-50 '
              }`}
            >
              <FaCalendarCheck /> Kelola Pemesanan
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

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'bookings' ? <BookingsList user={user} /> : <SecuritySection user={user} />}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: BOOKINGS LIST ---
const BookingsList = ({ user }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-black text-gray-800">Pesanan Saya</h1>
      <button className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-100">+ Buat Pesanan Baru</button>
    </div>

    {/* Search & Filter Bar */}
    <div className="flex flex-wrap gap-4 mb-6">
      <input 
        type="text" 
        placeholder="Cari berdasarkan ID Pesanan..." 
        className="flex-1 min-w-[300px] bg-white border border-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
      />
      <select className="bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium">
        <option>Upcoming</option>
        <option>Completed</option>
      </select>
    </div>

    {/* Booking Card */}
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
       <div className="absolute top-6 right-6 bg-orange-400 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
        Pending
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800">#480494 {user.name.toUpperCase()}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Tanggal</span>
          <span className="font-bold text-gray-700">27 Maret 2026</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Waktu</span>
          <span className="font-bold text-gray-700">09:00 - 10:00</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Jenis Tiket</span>
          <span className="font-bold text-gray-700">Petak Enam Hall (#Lapangan D)</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t flex justify-end gap-4">
        <button className="text-gray-800 font-bold text-sm hover:underline">Pesan Lagi</button>
        <button className="text-red-600 font-black text-sm hover:underline">Bayar Sekarang</button>
      </div>
    </div>
  </div>
);

// --- SUB-COMPONENT: SECURITY ---
const SecuritySection = ({ user }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
    <h1 className="text-2xl font-black text-gray-800 mb-8">Security & Information</h1>
    
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-2xl text-gray-600"><FaUserEdit size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-800">Ubah Informasi Dasar</h3>
            <p className="text-xs text-gray-400">Email dan nama tampilan Anda</p>
          </div>
        </div>
        <div className="space-y-4">
          <input type="text" defaultValue={user.name} className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" placeholder="Nama Lengkap" />
          <input type="email" defaultValue={user.email} className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" placeholder="Email Address" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-2xl text-gray-600"><FaKey size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-800">Ubah Kata Sandi</h3>
            <p className="text-xs text-gray-400">Pastikan sandi Anda kuat dan unik</p>
          </div>
        </div>
        <div className="space-y-4">
          <input type="password" title="Old Password" placeholder="Kata Sandi Lama" className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" />
          <input type="password" title="New Password" placeholder="Kata Sandi Baru" className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" />
          <button className="w-full py-4 bg-gray-800 text-white rounded-xl font-bold mt-2">Update Credentials</button>
        </div>
      </div>
    </div>
  </div>
);

export default ProfilePage;