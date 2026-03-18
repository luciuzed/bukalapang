import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaChevronLeft, FaRegClock, FaShieldAlt } from 'react-icons/fa';
import { allExperiences } from './HomePage'; 

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const field = allExperiences.find(item => item.id === parseInt(id));

  if (!field) return <div className="p-10 text-center">Field not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest hover:text-black">
        <FaChevronLeft size={10} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100 shadow-sm border border-gray-100">
           <img src={field.img} alt={field.title} className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="text-2xl font-black mb-2 text-gray-900">{field.title}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
              <FaStar /> {field.rating}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <FaMapMarkerAlt className="text-primary" /> {field.location}
            </span>
          </div>

          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rate</p>
            <p className="text-3xl font-black text-gray-900">{field.price}<span className="text-sm font-normal text-gray-400 ml-1">/ hour</span></p>
            
            <button className="w-full mt-6 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
              Reserve This Slot
            </button>
          </div>
          
          <div className="space-y-4 px-2">
            <div className="flex items-center gap-3 text-gray-600">
              <FaRegClock className="text-primary" size={14} />
              <span className="text-xs font-medium">Open: 08:00 - 22:00</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FaShieldAlt className="text-green-500" size={14} />
              <span className="text-xs font-medium">Verified Venue Provider</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pt-4 border-t border-gray-100">
              {field.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;