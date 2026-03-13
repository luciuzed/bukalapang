import React, { useEffect } from "react";
import "./home.css";
import Footer from "./footer";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <section id="about" className="about" style={{ paddingTop: "120px", flex: 1 }}>
        <div className="about-content">
          <h2>Tentang BUKALAPANG</h2>
          <p>
            BUKALAPANG adalah platform inovatif yang didedikasikan untuk memudahkan masyarakat Kota Medan dalam mencari dan memesan venue olahraga.
            Kami hadir sebagai solusi modern untuk para pecinta olahraga yang ingin menikmati aktivitas fisik tanpa harus repot mencari tempat yang tepat.
          </p>
          <p>
            Dengan koleksi venue yang beragam, mulai dari lapangan futsal hingga kolam renang, BUKALAPANG menawarkan kemudahan akses ke berbagai fasilitas olahraga berkualitas.
            Sistem pemesanan online kami dirancang untuk memberikan pengalaman yang cepat, aman, dan user-friendly, sehingga Anda dapat fokus pada hal yang paling penting: menikmati olahraga Anda.
          </p>
          <p>
            Kami berkomitmen untuk mendukung gaya hidup sehat di Kota Medan dengan menyediakan platform yang menghubungkan pengguna dengan venue olahraga terbaik.
            Tim kami terus berinovasi untuk memberikan layanan terbaik dan memastikan kepuasan pelanggan.
          </p>
          <div className="creators">
            <h3>Dibuat Oleh:</h3>
            <ul>
              <li>Vincent</li>
              <li>Alvaro Caesar</li>
              <li>Edbert Luciuz</li>
            </ul>
          </div>
          <div className="about-stats">
            <div className="stat">
              <h3>100+</h3>
              <p>Venue Tersedia</p>
            </div>
            <div className="stat">
              <h3>9</h3>
              <p>Jenis Olahraga</p>
            </div>
            <div className="stat">
              <h3>24/7</h3>
              <p>Dukungan</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;
