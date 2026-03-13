import React, { useState } from "react";
import "./home.css";
import Footer from "./footer";

const venueData = [
  // FUTSAL
  {
    id: 1, name: "Lapangan Futsal Merdeka", type: "Futsal", city: "Medan", price: "120.000",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"
  },
  {
    id: 2, name: "Arena Futsal Johor", type: "Futsal", city: "Medan", price: "100.000",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"
  },
  {
    id: 3, name: "Binjai Futsal Center", type: "Futsal", city: "Binjai", price: "90.000",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"
  },
  {
    id: 4, name: "Rambutan Futsal Arena", type: "Futsal", city: "Binjai", price: "85.000",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"
  },

  // BADMINTON
  {
    id: 5, name: "GOR Badminton Sejati", type: "Badminton", city: "Medan", price: "80.000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"
  },
  {
    id: 6, name: "Hall Tangkis Sunggal", type: "Badminton", city: "Medan", price: "75.000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"
  },
  {
    id: 7, name: "GOR Bulutangkis Idaman", type: "Badminton", city: "Binjai", price: "70.000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"
  },
  {
    id: 8, name: "Hall Badminton Binjai Barat", type: "Badminton", city: "Binjai", price: "65.000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"
  },

  // BASKET
  {
    id: 9, name: "Lapangan Basket Rajawali", type: "Basket", city: "Medan", price: "150.000",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"
  },
  {
    id: 10, name: "Arena Basket Cemara", type: "Basket", city: "Medan", price: "180.000",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"
  },
  {
    id: 11, name: "Lapangan Basket Pemuda", type: "Basket", city: "Binjai", price: "120.000",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"
  },
  {
    id: 12, name: "Binjai Basket Club", type: "Basket", city: "Binjai", price: "110.000",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"
  },

  // SEPAKBOLA
  {
    id: 13, name: "Stadion Teladan Mini", type: "Sepakbola", city: "Medan", price: "250.000",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"
  },
  {
    id: 14, name: "Lapangan Bola Polonia", type: "Sepakbola", city: "Medan", price: "200.000",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"
  },
  {
    id: 15, name: "Lapangan Bola Kebun Lada", type: "Sepakbola", city: "Binjai", price: "150.000",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"
  },
  {
    id: 16, name: "Stadion Binjai", type: "Sepakbola", city: "Binjai", price: "300.000",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"
  },

  // TENIS
  {
    id: 17, name: "Klub Tenis Jasdam", type: "Tenis", city: "Medan", price: "120.000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800"
  },
  {
    id: 18, name: "Tenis Indoor Setiabudi", type: "Tenis", city: "Medan", price: "150.000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800"
  },
  {
    id: 19, name: "Tenis Court Tandam", type: "Tenis", city: "Binjai", price: "90.000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800"
  },
  {
    id: 20, name: "Arena Tenis Binjai Utara", type: "Tenis", city: "Binjai", price: "100.000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800"
  },

  // VOLI
  {
    id: 21, name: "Lapangan Voli Maimun", type: "Voli", city: "Medan", price: "100.000",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"
  },
  {
    id: 22, name: "GOR Voli Amplas", type: "Voli", city: "Medan", price: "120.000",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"
  },
  {
    id: 23, name: "Lapangan Voli Berngam", type: "Voli", city: "Binjai", price: "80.000",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"
  },
  {
    id: 24, name: "GOR Voli Selesai", type: "Voli", city: "Binjai", price: "90.000",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"
  },

  // GOLF
  {
    id: 25, name: "Royal Sumatra Golf", type: "Golf", city: "Medan", price: "500.000",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"
  },
  {
    id: 26, name: "Tuntungan Golf Club", type: "Golf", city: "Medan", price: "400.000",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"
  },
  {
    id: 27, name: "Binjai Golf Residence", type: "Golf", city: "Binjai", price: "250.000",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"
  },
  {
    id: 28, name: "Kebun Golf Tandam", type: "Golf", city: "Binjai", price: "200.000",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"
  },

  // BASEBALL
  {
    id: 29, name: "Lapangan Baseball Helvetia", type: "Baseball", city: "Medan", price: "180.000",
    image: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800"
  },
  {
    id: 30, name: "Arena Baseball Polonia", type: "Baseball", city: "Medan", price: "200.000",
    image: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800"
  },
  {
    id: 31, name: "Lapangan Baseball Binjai", type: "Baseball", city: "Binjai", price: "120.000",
    image: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800"
  },
  {
    id: 32, name: "Binjai Super Baseball", type: "Baseball", city: "Binjai", price: "150.000",
    image: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800"
  },

  // RENANG
  {
    id: 33, name: "Kolam Renang Selayang", type: "Renang", city: "Medan", price: "50.000",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800"
  },
  {
    id: 34, name: "Tirta Ria Pool", type: "Renang", city: "Medan", price: "40.000",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800"
  },
  {
    id: 35, name: "Kolam Renang Tirta Binjai", type: "Renang", city: "Binjai", price: "35.000",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800"
  },
  {
    id: 36, name: "Waterboom Binjai Pool", type: "Renang", city: "Binjai", price: "60.000",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800"
  }
];

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchSport, setSearchSport] = useState("");

  const filteredVenues = venueData.filter((venue) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearchTerm = venue.name.toLowerCase().includes(searchLower) || 
                            venue.type.toLowerCase().includes(searchLower) ||
                            venue.city.toLowerCase().includes(searchLower);
    const matchCity = searchCity === "" || venue.city === searchCity;
    const matchSport = searchSport === "" || venue.type === searchSport;
    return matchSearchTerm && matchCity && matchSport;
  });

  const handleSearchClick = () => {
    const section = document.getElementById("reserve");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setSearchCity("");
    setSearchSport("");
  };

  return (
    <div className="home" id="home">

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>VENUE OLAHRAGA TERBAIK</h1>
          <p>
            Temukan dan booking venue olahraga terbaik pilihanmu
            dengan mudah, cepat, dan terpercaya melalui aplikasi kami.
          </p>

          {/* SEARCH BOX */}
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Cari Nama Venue" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={searchCity} onChange={(e) => setSearchCity(e.target.value)}>
              <option value="">Pilih Kota</option>
              <option value="Medan">Medan</option>
              <option value="Binjai">Binjai</option>
            </select>
            <select value={searchSport} onChange={(e) => setSearchSport(e.target.value)}>
              <option value="">Pilih Cabang Olahraga</option>
              <option value="Futsal">Futsal</option>
              <option value="Badminton">Badminton</option>
              <option value="Basket">Basket</option>
              <option value="Sepakbola">Sepakbola</option>
              <option value="Tenis">Tenis</option>
              <option value="Voli">Voli</option>
              <option value="Golf">Golf</option>
              <option value="Baseball">Baseball</option>
              <option value="Renang">Renang</option>
            </select>
            <button className="btn-search" onClick={handleSearchClick}>Cari Venue</button>
            <button className="btn-reset" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </section>

      {/* LIST VENUE */}
      <section className="venue-list" id="reserve">
        <div className="venue-content">
          <h2>Venue Tersedia</h2>

          <div className="filter-buttons">
            <button className={searchSport === "" ? "active" : ""} onClick={() => setSearchSport("")}>Semua</button>
            {["Futsal", "Badminton", "Basket", "Sepakbola", "Tenis", "Voli", "Golf", "Baseball", "Renang"].map(sport => (
              <button 
                key={sport} 
                className={searchSport === sport ? "active" : ""} 
                onClick={() => setSearchSport(sport)}
              >
                {sport}
              </button>
            ))}
          </div>

          <div className="card-container">
            {filteredVenues.length > 0 ? (
              filteredVenues.map((venue) => (
                <div className="card" key={venue.id}>
                  <img
                    src={venue.image}
                    alt={venue.name}
                  />
                  <h3>{venue.name}</h3>
                  <p className="card-city">📍 {venue.city}</p>
                  <p>Harga mulai Rp {venue.price} / jam</p>
                  <button>Booking Sekarang</button>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", width: "100%", gridColumn: "1 / -1", color: "#666" }}>
                Venue tidak ditemukan.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <div className="features-content">
          <h2>Mengapa Memilih BUKALAPANG?</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🏆</div>
              <h3>Venue Terpercaya</h3>
              <p>Semua venue telah diverifikasi dan siap untuk digunakan.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Pemesanan Cepat</h3>
              <p>Booking dalam hitungan menit tanpa ribet.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💰</div>
              <h3>Harga Terjangkau</h3>
              <p>Tarif kompetitif untuk semua jenis olahraga.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📍</div>
              <h3>Lokasi Strategis</h3>
              <p>Venue tersebar di seluruh Kota Medan.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default Home;