import React, { useEffect } from "react";
import Footer from "../components/Footer";

const About = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 max-w-275 mx-auto w-full px-6 pt-10 pb-20">

        <div className="mb-12 text-center">
          <p className="text-[13px] font-semibold text-[#00A859] uppercase tracking-widest mb-3">Tentang Kami</p>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-gray-900 mb-4">Tentang MAIN YUK!</h1>
          <p className="text-[16px] text-gray-500 max-w-150 mx-auto leading-relaxed">
            Platform pemesanan venue olahraga terdepan yang menghubungkan para pecinta olahraga dengan venue terbaik di Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {[
            { value: "100+", label: "Venue Tersedia" },
            { value: "13",   label: "Jenis Olahraga" },
            { value: "24/7", label: "Dukungan" },
          ].map(s => (
            <div key={s.label} className="text-center p-8 bg-gray-50 rounded-2xl">
              <p className="text-[48px] font-extrabold text-[#00A859] leading-none mb-2">{s.value}</p>
              <p className="text-[14px] font-semibold text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="max-w-190 mx-auto space-y-6 mb-16">
          <p className="text-[15px] text-gray-600 leading-relaxed">
            MAIN YUK! adalah platform inovatif yang didedikasikan untuk memudahkan masyarakat dalam mencari dan memesan venue olahraga. Kami hadir sebagai solusi modern untuk para pecinta olahraga yang ingin menikmati aktivitas fisik tanpa harus repot mencari tempat.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Dengan koleksi venue yang beragam, mulai dari lapangan futsal hingga kolam renang, MAIN YUK! menawarkan kemudahan akses ke berbagai fasilitas olahraga berkualitas di seluruh Indonesia.
          </p>
        </div>

        <div className="text-center">
          <p className="text-[13px] font-semibold text-[#00A859] uppercase tracking-widest mb-4">Tim Kami</p>
          <h2 className="text-[24px] font-extrabold text-gray-900 mb-8">Dibuat Oleh</h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {["Vincent", "Alvaro Caesar", "Edbert Luciuz"].map(name => (
              <div key={name} className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl min-w-40">
                <div className="w-14 h-14 bg-[#00A859] rounded-full flex items-center justify-center text-white text-[20px] font-extrabold">
                  {name[0]}
                </div>
                <p className="text-[15px] font-bold text-gray-900 text-center">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
