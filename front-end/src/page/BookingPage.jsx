import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

const BookingPage = () => {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fields-public')
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      }
    } catch (err) {
      console.error('Failed to fetch fields:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const categories = ['All', 'Futsal', 'Badminton', 'Basketball', 'Tennis']

  const filteredFields = useMemo(() => {
    return fields.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery, fields])

  const totalPages = Math.ceil(filteredFields.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = filteredFields.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-6 bg-white min-h-screen pb-16">
        <div className="text-center py-8">Loading venues...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6 bg-white min-h-screen pb-16">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-primary to-primary/90 rounded-2xl p-6 mb-6 text-white shadow-sm">
        <h1 className="text-xl font-bold mb-1 tracking-tight">Find a Venue</h1>
        <p className="text-[11px] text-red-100 mb-4 opacity-80 uppercase tracking-wider font-medium">Instant Booking</p>
        <div className="flex bg-white rounded-lg p-1 shadow-inner max-w-xs">
          <div className="grow flex items-center px-2">
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
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
              activeCategory === cat ? "bg-primary text-white " : "bg-white text-gray-400 border-gray-100 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Venue Grid */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No venues found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
          {currentItems.map((item) => (
            <Link to={`/venue/${item.id}`} key={item.id} className={`group cursor-pointer block ${item.is_active === 0 ? 'pointer-events-none' : ''}`}>
              <div className={`relative aspect-5/4 rounded-xl overflow-hidden mb-2 bg-gray-50 border transition-all ${item.is_active === 0 ? 'border-gray-200' : 'border-gray-100'}`}>
                {item.image_url ? (
                  <>
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className={`w-full h-full object-cover transition duration-500 ${item.is_active === 0 ? 'grayscale' : 'group-hover:scale-105'}`} 
                    />
                    {item.is_active === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Closed</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${item.is_active === 0 ? 'bg-gray-300' : 'bg-linear-to-br from-gray-200 to-gray-300'}`}></div>
                )}
                <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-primary shadow-sm">
                  {item.category}
                </div>
              </div>
              <div className={`px-0.5 ${item.is_active === 0 ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[13px] text-gray-900 truncate pr-2 group-hover:text-primary transition-colors">{item.name}</h3>
                  <span className="text-[10px] font-bold flex items-center gap-0.5 shrink-0"><FaStar className="text-yellow-400" /> {item.rating || '4.5'}</span>
                </div>
                <p className="text-gray-400 text-[10px] flex items-center gap-1 mt-0.5"><FaMapMarkerAlt className="text-primary/60 scale-75" /> {item.city || 'Location'}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[13px] font-black text-gray-900">
                    Rp {item.min_price ? (item.min_price / 1000).toFixed(0) : 'N/A'}k{item.max_price && item.max_price !== item.min_price ? ` - Rp ${(item.max_price / 1000).toFixed(0)}k` : ''}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">/ hr</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Restoration: Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border border-gray-100 disabled:opacity-20 hover:bg-gray-50 transition-colors"
          >
            <FaChevronLeft size={10} className="text-gray-500" />
          </button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)} 
                className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                  currentPage === i + 1 ? "bg-primary text-white" : "text-gray-400 hover:text-black"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border border-gray-100 disabled:opacity-20 hover:bg-gray-50 transition-colors"
          >
            <FaChevronRight size={10} className="text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;