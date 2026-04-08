import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { venueData } from "./reserve";

const TIMES = ["07:00","08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","19:00","20:00","21:00"];

const VenueDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const venue = venueData.find(v => v.id.toString() === id);

  const [selectedSlots, setSelectedSlots] = useState([]);
  const priceNum = venue ? parseInt(venue.price.replace(".", "")) : 0;
  const total = selectedSlots.length * priceNum;

  if (!venue) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-[16px]">Venue tidak ditemukan.</p>
    </div>
  );

  const toggleSlot = t => {
    setSelectedSlots(prev =>
      prev.includes(t) ? prev.filter(s => s !== t) : [...prev, t]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </button>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* ── LEFT SIDE ── */}
          <div className="w-full lg:w-[58%]">
            <img
              src={venue.image}
              alt={venue.name}
              className="w-full h-[320px] sm:h-[400px] object-cover rounded-3xl"
            />

            <div className="mt-6">
              <span className="inline-block px-3 py-1 bg-[#e6f7ef] text-[#00A859] text-[12px] font-bold rounded-full mb-3">
                {venue.type}
              </span>
              <h1 className="text-[28px] sm:text-[32px] font-extrabold text-gray-900 leading-tight mb-2">{venue.name}</h1>
              <div className="flex items-center gap-1.5 text-[#00A859]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-[14px] font-semibold">{venue.city}</span>
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="mt-8">
              <h2 className="text-[16px] font-bold text-gray-800 mb-4">Pilih Slot Waktu</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIMES.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleSlot(t)}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                      selectedSlots.includes(t)
                        ? "bg-[#00A859] text-white border-[#00A859]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#00A859]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE – BOOKING CARD ── */}
          <div className="w-full lg:w-[42%] lg:sticky lg:top-[90px]">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-7 flex flex-col gap-5">
              {/* Price */}
              <div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Harga</p>
                <p className="text-[22px] font-extrabold text-gray-900">
                  Rp {venue.price}
                  <span className="text-[14px] font-medium text-gray-400"> / jam</span>
                </p>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Selected Slots */}
              <div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Slot Dipilih</p>
                {selectedSlots.length === 0 ? (
                  <p className="text-[14px] text-gray-400">Belum ada slot dipilih</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSlots.map(s => (
                      <span key={s} className="px-3 py-1 bg-[#e6f7ef] text-[#00A859] text-[12px] font-bold rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Total */}
              <div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
                <p className="text-[32px] font-extrabold text-gray-900">
                  Rp {total.toLocaleString("id-ID")}
                </p>
              </div>

              {/* Book Button */}
              <button
                disabled={selectedSlots.length === 0}
                onClick={() => selectedSlots.length > 0 && alert("Booking berhasil!")}
                className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all ${
                  selectedSlots.length > 0
                    ? "bg-[#00A859] text-white hover:bg-[#008f4c] shadow-[0_4px_16px_rgba(0,168,89,0.3)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Book • Rp {total.toLocaleString("id-ID")}
              </button>

              {/* WhatsApp */}
              <button className="w-full py-4 rounded-2xl text-[15px] font-bold bg-[#25D366] text-white hover:bg-[#20b858] flex items-center justify-center gap-2 transition-colors">
                <svg viewBox="0 0 448 512" className="w-5 h-5 fill-current">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 411.3h-.1c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.8 18.3L72 331.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.9 83-184.9 184.9-184.9 55.6 0 107.8 21.6 147 60.8 39.2 39.2 60.8 91.4 60.8 147 0 101.9-82.9 184.6-184.6 182.4zM324.4 252.6c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.6-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.6-16.6-14.8-27.8-33.2-31-38.7-3.2-5.6-.3-8.6 2.4-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.6 5.5-9.3 1.9-3.7.9-7-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                Ask via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
