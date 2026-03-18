import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export const allExperiences = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  title: `${['Petak Enam', 'Prisma', 'Holeo', 'Cilandak', 'Senayan'][i % 5]} ${['Arena', 'Hall', 'Center'][i % 3]}`,
  location: i % 2 === 0 ? "Jakarta Barat" : "Jakarta Selatan",
  tag: ['Badminton', 'Tennis', 'Golf', 'Billiard', 'Basket'][i % 5],
  price: `Rp ${(i + 1) * 10}k`,
  rating: (4 + Math.random()).toFixed(1),
  img: `https://picsum.photos/seed/${i + 22}/500/400`,
  description: "A premium sports venue featuring international standard facilities, professional lighting, and a comfortable atmosphere for all players."
}));

const ITEMS_PER_PAGE = 12;

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredExperiences = useMemo(() => {
    return allExperiences.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.tag === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredExperiences.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto py-6 bg-white min-h-screen pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-6 mb-6 text-white shadow-sm">
        <h1 className="text-xl font-bold mb-1 tracking-tight">Find an Experience</h1>
        <p className="text-[11px] text-red-100 mb-4 opacity-80 uppercase tracking-wider font-medium">Instant Booking</p>
        <div className="flex bg-white rounded-lg p-1 shadow-inner max-w-xs">
          <div className="flex-grow flex items-center px-2">
            <FaSearch className="text-gray-300 text-xs mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full text-[13px] text-gray-800 focus:outline-none"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
        {['All', 'Badminton', 'Tennis', 'Golf', 'Billiard', 'Basket'].map((cat) => (
          <button 
            key={cat} 
            onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
              activeCategory === cat ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Venue Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
        {currentItems.map((item) => (
          <Link to={`/about/${item.id}`} key={item.id} className="group cursor-pointer block">
            <div className="relative aspect-[5/4] rounded-xl overflow-hidden mb-2 bg-gray-50 border border-gray-100">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-primary shadow-sm">
                {item.tag}
              </div>
            </div>
            <div className="px-0.5">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-[13px] text-gray-900 truncate pr-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <span className="text-[10px] font-bold flex items-center gap-0.5 shrink-0"><FaStar className="text-yellow-400" /> {item.rating}</span>
              </div>
              <p className="text-gray-400 text-[10px] flex items-center gap-1 mt-0.5"><FaMapMarkerAlt className="text-primary/60 scale-75" /> {item.location}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[13px] font-black text-gray-900">{item.price}</span>
                <span className="text-[9px] text-gray-400 font-medium">/ hr</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Restoration: Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 disabled:opacity-20 hover:bg-gray-50 transition-colors"
          >
            <FaChevronLeft size={10} className="text-gray-500" />
          </button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)} 
                className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                  currentPage === i + 1 ? "bg-black text-white" : "text-gray-400 hover:text-black"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 disabled:opacity-20 hover:bg-gray-50 transition-colors"
          >
            <FaChevronRight size={10} className="text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;