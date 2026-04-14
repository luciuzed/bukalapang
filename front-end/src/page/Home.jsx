import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/navbar";

const SPORTS = ["Futsal","Badminton","Basket","Sepakbola","Tenis","Voli","Golf","Renang","Yoga","Biliar","Bowling","Boxing"];

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-white">
        <p className="text-[13px] font-semibold text-[#00A859] uppercase tracking-widest mb-4">Platform Venue Olahraga #1</p>
        <h1 className="text-[42px] sm:text-[56px] lg:text-[68px] font-extrabold text-gray-900 leading-tight max-w-200 mb-5">
          Temukan & Booking<br />
          <span className="text-[#00A859]">Venue Olahraga</span> Favoritmu
        </h1>
        <p className="text-[16px] sm:text-[18px] text-gray-500 max-w-140 mb-10 leading-relaxed">
          Ratusan venue terpercaya dari futsal hingga golf, tersebar di kota-kota besar Indonesia. Booking mudah, cepat, dan aman.
        </p>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-180 bg-white border border-gray-200 rounded-2xl p-3 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          <input
            type="text"
            placeholder="🔍  Cari nama venue..."
            className="flex-1 px-4 py-3 rounded-xl border-0 outline-none text-[15px] text-gray-800 placeholder:text-gray-400 bg-gray-50"
          />
          <select
            className="px-4 py-3 rounded-xl border-0 outline-none text-[15px] text-gray-700 bg-gray-50"
          >
            <option value="">Semua Kota</option>
            {["Medan","Binjai","Jakarta","Bandung","Surabaya","Bali"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="px-4 py-3 rounded-xl border-0 outline-none text-[15px] text-gray-700 bg-gray-50"
          >
            <option value="">Semua Olahraga</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            type="button"
            className="px-7 py-3 bg-[#00A859] hover:bg-[#008f4c] text-white text-[15px] font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            Cari Venue
          </button>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {["Futsal","Badminton","Basket","Sepakbola","Tenis"].map(s => (
            <button
              type="button"
              key={s}
              className="px-4 py-2 bg-gray-100 hover:bg-[#e6f7ef] text-gray-600 hover:text-[#00A859] text-[13px] font-semibold rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-275 mx-auto text-center">
          <p className="text-[13px] font-semibold text-[#00A859] uppercase tracking-widest mb-3">Cara Kerja</p>
          <h2 className="text-[32px] sm:text-[38px] font-extrabold text-gray-900 mb-14">Booking dalam 3 Langkah</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Cari Venue", desc: "Temukan venue olahraga favoritmu berdasarkan kota, jenis olahraga, atau nama tempat." },
              { step: "02", title: "Pilih Jadwal", desc: "Pilih slot waktu yang tersedia sesuai keinginanmu, kapan saja dan di mana saja." },
              { step: "03", title: "Konfirmasi", desc: "Selesaikan booking dan dapatkan konfirmasi instan. Tinggal datang dan main!" },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 text-left shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
                <span className="text-[42px] font-extrabold text-[#00A859]/20 leading-none">{item.step}</span>
                <h3 className="text-[18px] font-bold text-gray-900 mt-3 mb-2">{item.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-275 mx-auto text-center">
          <p className="text-[13px] font-semibold text-[#00A859] uppercase tracking-widest mb-3">Kenapa Kami</p>
          <h2 className="text-[32px] sm:text-[38px] font-extrabold text-gray-900 mb-14">Mengapa Memilih MAIN YUK!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏆", title: "Venue Terpercaya", desc: "Semua venue telah diverifikasi dan siap digunakan." },
              { icon: "⚡", title: "Booking Instan", desc: "Reservasi dalam hitungan menit, tanpa ribet." },
              { icon: "💰", title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi. Bayar sesuai yang tertera." },
              { icon: "📍", title: "Lokasi Lengkap", desc: "Venue tersebar di berbagai kota besar Indonesia." },
            ].map(f => (
              <div key={f.title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:bg-[#e6f7ef] transition-colors group">
                <span className="text-[36px] mb-4">{f.icon}</span>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2 group-hover:text-[#00A859] transition-colors">{f.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
