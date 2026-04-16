import React, { useState } from "react";
import Footer from "../components/Footer";
import { FaPaperPlane, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

import img from "../assets/badmin.jpg";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Terima kasih! Pesan Anda telah terkirim.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      <main className="flex-grow flex flex-col lg:flex-row ">
        
        {/* LEFT SIDE: Image Section */}
        <div className="lg:w-1/2 relative min-h-[30vh] lg:min-h-screen scale-80">
          <img 
            src={img} 
            alt="Football Stadium" 
            className="absolute inset-0 w-full h-full object-cover rounded-4xl"
            />
          {/* Gradient overlay for text contrast */}
          <div className="absolute inset-0 bg-primary/50 lg:bg-gradient-to-r from-primary/80 via-black/40 to-transparent rounded-4xl"></div>
          
          <div className="relative h-full flex flex-col justify-center p-10 px-8 lg:px-20 lg:p-0 text-white z-10">
            <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
              Ayo Mulai<br />Main Bareng!
            </h2>
            <p className="text-base lg:text-lg text-gray-200 max-w-md mb-10 font-medium">
              Butuh bantuan dengan pemesanan atau ingin berpartner dengan MainYuk!? Tim kami siap membantu kapan saja.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-4 rounded-2xl text-white">
                  <FaPhoneAlt />
                </div>
                <p className="font-bold text-lg">+62 822-6750-2066</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-primary p-4 rounded-2xl text-white">
                  <FaEnvelope />
                </div>
                <p className="font-bold text-lg">mainyukapp@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form Section */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50/30">
          <div className="w-full max-w-lg bg-white p-8 lg:p-12 rounded-[40px] shadow-xl border border-gray-100">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Kirim Pesan</h1>
              <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nama anda"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 p-4 rounded-2xl text-sm transition-all outline-none"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="email@example.com"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 p-4 rounded-2xl text-sm transition-all outline-none"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pesan</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="Apa yang bisa kami bantu?"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 p-4 rounded-3xl text-sm transition-all outline-none resize-none"
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm cursor-pointer uppercase tracking-widest hover:bg-primary/80 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 mt-4"
              >
                Send Message <FaPaperPlane className="text-xs" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;