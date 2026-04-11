import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "./Footer";

export const venueData = [
  { id: 1,  name: "Lapangan Futsal Merdeka",    type: "Futsal",    city: "Medan",    price: "120.000", image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800" },
  { id: 2,  name: "Arena Futsal Johor",          type: "Futsal",    city: "Medan",    price: "100.000", image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800" },
  { id: 3,  name: "Binjai Futsal Center",        type: "Futsal",    city: "Binjai",   price: "90.000",  image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800" },
  { id: 4,  name: "Rambutan Futsal Arena",       type: "Futsal",    city: "Binjai",   price: "85.000",  image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800" },
  { id: 5,  name: "GOR Badminton Sejati",        type: "Badminton", city: "Medan",    price: "80.000",  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800" },
  { id: 6,  name: "Hall Tangkis Sunggal",        type: "Badminton", city: "Medan",    price: "75.000",  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800" },
  { id: 7,  name: "GOR Bulutangkis Idaman",      type: "Badminton", city: "Binjai",   price: "70.000",  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800" },
  { id: 8,  name: "Hall Badminton Binjai Barat", type: "Badminton", city: "Binjai",   price: "65.000",  image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800" },
  { id: 9,  name: "Lapangan Basket Rajawali",    type: "Basket",    city: "Medan",    price: "150.000", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800" },
  { id: 10, name: "Arena Basket Cemara",         type: "Basket",    city: "Medan",    price: "180.000", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800" },
  { id: 11, name: "Lapangan Basket Pemuda",      type: "Basket",    city: "Binjai",   price: "120.000", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800" },
  { id: 12, name: "Binjai Basket Club",          type: "Basket",    city: "Binjai",   price: "110.000", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800" },
  { id: 13, name: "Stadion Teladan Mini",        type: "Sepakbola", city: "Medan",    price: "250.000", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800" },
  { id: 14, name: "Lapangan Bola Polonia",       type: "Sepakbola", city: "Medan",    price: "200.000", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800" },
  { id: 15, name: "Lapangan Bola Kebun Lada",    type: "Sepakbola", city: "Binjai",   price: "150.000", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800" },
  { id: 16, name: "Stadion Binjai",              type: "Sepakbola", city: "Binjai",   price: "300.000", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800" },
  { id: 17, name: "Klub Tenis Jasdam",           type: "Tenis",     city: "Medan",    price: "120.000", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800" },
  { id: 18, name: "Tenis Indoor Setiabudi",      type: "Tenis",     city: "Medan",    price: "150.000", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800" },
  { id: 19, name: "Tenis Court Tandam",          type: "Tenis",     city: "Binjai",   price: "90.000",  image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800" },
  { id: 20, name: "Arena Tenis Binjai Utara",    type: "Tenis",     city: "Binjai",   price: "100.000", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800" },
  { id: 21, name: "Lapangan Voli Maimun",        type: "Voli",      city: "Medan",    price: "100.000", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800" },
  { id: 22, name: "GOR Voli Amplas",             type: "Voli",      city: "Medan",    price: "120.000", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800" },
  { id: 23, name: "Lapangan Voli Berngam",       type: "Voli",      city: "Binjai",   price: "80.000",  image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800" },
  { id: 24, name: "GOR Voli Selesai",            type: "Voli",      city: "Binjai",   price: "90.000",  image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800" },
  { id: 25, name: "Royal Sumatra Golf",          type: "Golf",      city: "Medan",    price: "500.000", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800" },
  { id: 26, name: "Tuntungan Golf Club",         type: "Golf",      city: "Medan",    price: "400.000", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800" },
  { id: 27, name: "Binjai Golf Residence",       type: "Golf",      city: "Binjai",   price: "250.000", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800" },
  { id: 28, name: "Kolam Renang Selayang",       type: "Renang",    city: "Medan",    price: "50.000",  image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800" },
  { id: 29, name: "Tirta Ria Pool",              type: "Renang",    city: "Medan",    price: "40.000",  image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800" },
  { id: 30, name: "Kolam Renang Tirta Binjai",   type: "Renang",    city: "Binjai",   price: "35.000",  image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800" },
  { id: 31, name: "Gedung Sate Futsal",          type: "Futsal",    city: "Bandung",  price: "130.000", image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800" },
  { id: 32, name: "GBK Basketball Court",        type: "Basket",    city: "Jakarta",  price: "350.000", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800" },
  { id: 33, name: "Senayan Golf Club",           type: "Golf",      city: "Jakarta",  price: "800.000", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800" },
  { id: 34, name: "Pakuwon Badminton Hall",      type: "Badminton", city: "Surabaya", price: "110.000", image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800" },
  { id: 35, name: "Canggu Yoga Center",          type: "Yoga",      city: "Bali",     price: "250.000", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800" },
  { id: 36, name: "Medan Boxing Camp",           type: "Boxing",    city: "Medan",    price: "180.000", image: "https://images.unsplash.com/photo-1549719386-74dfc27e43b4?w=800" },
  { id: 37, name: "Biliar Center Medan",         type: "Biliar",    city: "Medan",    price: "70.000",  image: "https://images.unsplash.com/photo-1543886518-eec7ae03e913?w=800" },
  { id: 38, name: "Bowling Alley Binjai",        type: "Bowling",   city: "Binjai",   price: "90.000",  image: "https://images.unsplash.com/photo-1596485890987-0b1a134a4cb5?w=800" },
];

const SPORTS = ["Futsal","Badminton","Basket","Sepakbola","Tenis","Voli","Golf","Renang","Yoga","Biliar","Bowling","Boxing"];
const CITIES = ["Medan","Binjai","Jakarta","Bandung","Surabaya","Bali"];

const Reserve = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [searchTerm, setSearchTerm] = useState(params.get("term") || "");
  const [searchCity, setSearchCity] = useState(params.get("city") || "");
  const [searchSport, setSearchSport] = useState(params.get("sport") || "");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const filtered = venueData.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      (v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)) &&
      (searchCity === "" || v.city === searchCity) &&
      (searchSport === "" || v.type === searchSport)
    );
  });

  const toggleSport = s => setSearchSport(prev => prev === s ? "" : s);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 max-w-[1100px] mx-auto w-full px-6 pt-10 pb-20">

        <div className="mb-8">
          <h1 className="text-[28px] sm:text-[34px] font-extrabold text-gray-900">Venue Tersedia</h1>
          <p className="text-gray-500 text-[14px] mt-1">{filtered.length} venue ditemukan</p>
        </div>

        {/* Search Row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Cari nama venue..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-[#00A859] transition-colors bg-gray-50"
          />
          <select value={searchCity} onChange={e => setSearchCity(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-700 outline-none focus:border-[#00A859] bg-gray-50">
            <option value="">Semua Kota</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={searchSport} onChange={e => setSearchSport(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-700 outline-none focus:border-[#00A859] bg-gray-50">
            <option value="">Semua Olahraga</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(searchTerm || searchCity || searchSport) && (
            <button onClick={() => { setSearchTerm(""); setSearchCity(""); setSearchSport(""); }}
              className="px-4 py-2.5 text-[13px] font-semibold text-gray-400 hover:text-red-500 transition-colors">
              Reset
            </button>
          )}
        </div>

        {/* Sport Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SPORTS.map(s => (
            <button key={s} onClick={() => toggleSport(s)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${
                searchSport === s
                  ? "bg-[#00A859] text-white border-[#00A859]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#00A859] hover:text-[#00A859]"
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(venue => (
              <div key={venue.id} onClick={() => navigate(`/venue/${venue.id}`)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200">
                <div className="overflow-hidden">
                  <img src={venue.image} alt={venue.name} className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <span className="inline-block px-2.5 py-1 bg-[#e6f7ef] text-[#00A859] text-[11px] font-bold rounded-full mb-2">{venue.type}</span>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1 leading-tight">{venue.name}</h3>
                  <p className="text-[13px] text-gray-500 mb-3">📍 {venue.city}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-400 block">mulai dari</span>
                      <span className="text-[15px] font-extrabold text-gray-900">Rp {venue.price}<span className="text-[12px] font-medium text-gray-400"> /jam</span></span>
                    </div>
                    <button className="px-4 py-2 bg-[#00A859] text-white text-[12px] font-bold rounded-xl hover:bg-[#008f4c] transition-colors">Booking</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[40px] mb-4">🔍</p>
            <p className="text-gray-500 text-[16px] font-semibold">Venue tidak ditemukan</p>
            <p className="text-gray-400 text-[14px] mt-2">Coba ubah pencarian atau filter kamu</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Reserve;
