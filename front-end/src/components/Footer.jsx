import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20 px-6 mt-20">
      <div className="max-w-[1100px] mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="text-[28px] font-bold text-[#00A859] mb-3">MAINYUK!</h3>
            <p className="text-gray-300 text-[14px] leading-relaxed">Platform pemesanan venue olahraga terdepan di Indonesia</p>
          </div>
          
          <div>
            <h4 className="text-[18px] font-bold text-white mb-4">Produk</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-[#00A859] text-[14px] transition-colors">Cari Venue</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#00A859] text-[14px] transition-colors">Booking Lapangan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#00A859] text-[14px] transition-colors">Daftar Sebagai Penyedia</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#00A859] text-[14px] transition-colors">Blog & Tips</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[18px] font-bold text-white mb-4">Kontak Kami</h4>
            <p className="text-gray-300 text-[13px] mb-3">📧 info@mainyuk.com</p>
            <p className="text-gray-300 text-[13px] mb-3">📞 +62 812 3456 7890</p>
            <p className="text-gray-300 text-[13px]">📍 Jl. Olahraga No. 123, Medan, Indonesia</p>
          </div>
          
          <div>
            <h4 className="text-[18px] font-bold text-white mb-4">Ikuti Kami</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 bg-[#00A859]/20 hover:bg-[#00A859] rounded-full flex items-center justify-center transition-colors text-[#00A859] hover:text-white">f</a>
              <a href="#" className="w-10 h-10 bg-[#00A859]/20 hover:bg-[#00A859] rounded-full flex items-center justify-center transition-colors text-[#00A859] hover:text-white">📷</a>
              <a href="#" className="w-10 h-10 bg-[#00A859]/20 hover:bg-[#00A859] rounded-full flex items-center justify-center transition-colors text-[#00A859] hover:text-white">𝕏</a>
            </div>
            <p className="text-gray-400 text-[12px]">Subscribe untuk update terbaru</p>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <ul className="flex flex-wrap gap-6 justify-center">
            <li><a href="#" className="text-gray-400 hover:text-[#00A859] text-[13px] transition-colors">Kebijakan Privasi</a></li>
            <li><a href="#" className="text-gray-400 hover:text-[#00A859] text-[13px] transition-colors">Syarat & Ketentuan</a></li>
            <li><a href="#" className="text-gray-400 hover:text-[#00A859] text-[13px] transition-colors">FAQ</a></li>
            <li><a href="#" className="text-gray-400 hover:text-[#00A859] text-[13px] transition-colors">Hubungi Kami</a></li>
          </ul>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-[13px] mb-2">&copy; 2026 MAINYUK!. All rights reserved.</p>
          <p className="text-gray-500 text-[12px]">Dibuat oleh Vincent, Alvaro Caesar, Edbert Luciuz</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;