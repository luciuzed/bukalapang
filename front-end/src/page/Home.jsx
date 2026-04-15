import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import bolaImg from "../assets/bola.jpg";
import heroImg from "../assets/hero-bg.jpg";

import { 
  FaSearch, 
  FaCheckCircle, 
  FaBolt, 
  FaTag, 
  FaArrowRight 
} from "react-icons/fa";

const useScrollReveal = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 } // Trigger earlier for a snappier feel
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};
import Navbar from "../components/Navbar";

const SPORTS = ["Futsal","Badminton","Basket","Sepakbola","Tenis","Voli","Golf","Renang","Yoga","Biliar","Bowling","Boxing"];

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroRef, heroVisible] = useScrollReveal();
  const [stepsRef, stepsVisible] = useScrollReveal();
  const [whyRef, whyVisible] = useScrollReveal();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/venue?search=${searchQuery}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      
      <section ref={heroRef} className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg}
            className="w-full h-full object-cover opacity-40" 
            alt="hero-bg"
          />
          <div className="absolute inset-0 bg-linear-to-b from-white from-1% via-white/60 via-10% to-white to-90%"></div>
        </div>

        <div className={`relative z-10 transition-all duration-700 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Platform Venue Olahraga #1</p>
          </div>

          <h1 className="text-[44px] sm:text-[64px] lg:text-[80px] font-black text-gray-900 leading-[1.1] max-w-4xl mb-6 tracking-tight">
            Temukan & Booking<br />
            <span className="text-primary">Venue Olahraga</span> Favoritmu
          </h1>

          <p className="text-gray-500 text-sm sm:text-lg max-w-2xl mx-auto mb-10 font-medium">
            Ratusan venue terpercaya dari futsal hingga biliar. Booking mudah, cepat, dan aman.
          </p>

          <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-100 rounded-2xl p-2 shadow-2xl shadow-gray-200/50">
              <div className="grow flex items-center px-4">
                <FaSearch className="text-gray-300 text-sm mr-3" />
                <input 
                  type="text" 
                  placeholder="Cari nama venue atau jenis olahraga..." 
                  className="w-full py-3 text-[15px] focus:outline-none placeholder:text-gray-400 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                Cari <FaArrowRight className="text-[10px]" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section ref={stepsRef} className="bg-gray-50/50 py-24 px-6 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-500 ${stepsVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">Workflow</h4>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Booking dalam 3 Langkah</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Cari Venue", desc: "Temukan venue favoritmu berdasarkan lokasi atau jenis olahraga." },
              { step: "02", title: "Pilih Jadwal", desc: "Pilih slot waktu yang tersedia sesuai keinginanmu secara real-time." },
              { step: "03", title: "Konfirmasi", desc: "Dapatkan konfirmasi instan. Tinggal datang dan mulai bermain!" },
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500"
                style={{ transitionDelay: `${idx * 100}ms`, opacity: stepsVisible ? 1 : 0, transform: stepsVisible ? 'translateY(0)' : 'translateY(15px)' }}
              >
                <span className="text-4xl font-black text-primary mb-6 block">{item.step}</span>
                <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={whyRef} className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-700 ${whyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">Fitur Unggulan</h4>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-10 leading-tight">Mengapa Memilih<br /> MAIN YUK!</h2>
              <div className="space-y-8">
                {[
                  { icon: <FaCheckCircle />, title: "Venue Terpercaya", desc: "Fasilitas terverifikasi dengan kualitas lapangan standar profesional." },
                  { icon: <FaBolt />, title: "Booking Instan", desc: "Sistem otomatis yang memastikan slot anda aman dalam hitungan detik." },
                  { icon: <FaTag />, title: "Harga Transparan", desc: "Tidak ada biaya admin tambahan saat melakukan checkout." },
                ].map((f, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="mt-1 text-primary text-2xl">{f.icon}</div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{f.title}</h3>
                        <p className="text-gray-500 text-sm max-w-md leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`relative transition-all duration-700 delay-200 ${whyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <img 
                src={bolaImg} 
                className="relative rounded-4xl w-full h-137.5 object-cover" 
                alt="Sports Ball" 
              />
            </div>
          </div>
        </div>
      </section>

      
      <Footer />
    </div>
  );
};

export default Home;