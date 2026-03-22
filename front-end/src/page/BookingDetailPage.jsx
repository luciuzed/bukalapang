import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaChevronLeft,
  FaWhatsapp
} from 'react-icons/fa';
import { allExperiences } from './BookingPage';
import BookingSummaryModal from './BookingSummaryModal';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemoveSlot = (slotKey) => {
    setSelectedSlots(prev => prev.filter(key => key !== slotKey));
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const field = allExperiences.find(item => item.id === parseInt(id));

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedSlots, setSelectedSlots] = useState([]);

  if (!field) {
    return <div className="p-10 text-center font-bold">Field not found</div>;
  }

  const openGoogleMaps = () => {
    if (!field.location) return;
    const query = encodeURIComponent(field.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openTime = field.openTime || "08:00";
  const closeTime = field.closeTime || "22:00";
  const slotDuration = field.slotDuration || 60;

  const weekdayPrice = field.weekdayPrice || 100000;
  const weekendPrice = field.weekendPrice || 120000;

  const courts = field.courts?.length
    ? field.courts
    : ["Court A","Court B","Court C","Court D","Court E","Court F"];

  const facilities = field.facilities || [];

  const generateTimeSlots = (open, close, duration) => {
    const slots = [];
    const [openHour, openMin] = open.split(":").map(Number);
    const [closeHour, closeMin] = close.split(":").map(Number);

    let current = new Date();
    current.setHours(openHour, openMin, 0);

    const end = new Date();
    end.setHours(closeHour, closeMin, 0);

    while (current < end) {
      const next = new Date(current);
      next.setMinutes(current.getMinutes() + duration);

      const format = (d) => d.toTimeString().slice(0, 5);
      slots.push(`${format(current)} - ${format(next)}`);

      current = next;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots(openTime, closeTime, slotDuration);

  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const pricePerHour = isWeekend(selectedDate) ? weekendPrice : weekdayPrice;
  const pricePerSlot = pricePerHour * (slotDuration / 60);

  const toggleSlot = (court, time) => {
    const key = `${court}-${time}`;
    setSelectedSlots(prev =>
      prev.includes(key)
        ? prev.filter(i => i !== key)
        : [...prev, key]
    );
  };

  const totalPrice = selectedSlots.length * pricePerSlot;

  const contactWhatsApp = () => {
    const msg = `Halo Admin,
Venue: ${field.title}
Tanggal: ${selectedDate}
Slot: ${selectedSlots.join(', ')}
Total: Rp ${totalPrice.toLocaleString()}`;

    window.open(`https://wa.me/6289794383499?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 mb-20">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 uppercase hover:text-black"
      >
        <FaChevronLeft /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-3xl overflow-hidden aspect-video shadow-xl">
            <img src={field.img} className="w-full h-full object-cover" />
          </div>

          <div>
            <h1 className="text-3xl font-black">{field.title}</h1>
            <button
              onClick={openGoogleMaps}
              className="flex items-center gap-2 text-primary mt-2 cursor-pointer hover:underline"
            >
              <FaMapMarkerAlt /> {field.location}
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl">
            <p className="text-sm text-gray-500">
              {field.description || "No description available."}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {facilities.map((f, i) => (
              <div key={i} className="px-3 py-1 text-xs rounded-full bg-gray-100">
                {f}
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold mb-2">Select Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlots([]);
              }}
              className="border rounded-xl px-4 py-2 w-full"
            />
          </div>

          {/* SLOT GRID */}
          <div>
            <p className="text-xs font-bold mb-3">Select Time & Court</p>

            {/* 🔥 GRID FIXED SYSTEM */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`
              }}
            >

              {/* EMPTY TOP LEFT */}
              <div></div>

              {/* HEADER */}
              {courts.map(court => (
                <div
                  key={court}
                  className="h-10 flex items-center justify-center font-bold text-[10px] sm:text-xs"
                >
                  {court}
                </div>
              ))}

              {/* ROWS */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>

                  {/* TIME */}
                  <div className="h-12 sm:h-14 flex items-center text-[9px] sm:text-[11px] font-semibold leading-none">
                    {time}
                  </div>

                  {/* BUTTONS */}
                  {courts.map(court => {
                    const key = `${court}-${time}`;
                    const isSelected = selectedSlots.includes(key);

                    return (
                      <button
                        key={key}
                        onClick={() => toggleSlot(court, time)}
                        className={`h-12 sm:h-14 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-400 border-gray-200 hover:border-primary"
                        }`}
                      >
                        {isSelected ? "✓" : (
                          <span className="text-[9px] sm:text-[11px]">
                            Rp {pricePerSlot.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}

                </React.Fragment>
              ))}

            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="sticky top-8 bg-white p-6 rounded-3xl shadow-xl space-y-6">

            <div>
              <p className="text-sm text-gray-400">
                Price ({isWeekend(selectedDate) ? "Weekend" : "Weekday"})
              </p>
              <p className="text-xl font-black">
                Rp {pricePerHour.toLocaleString()} / hour
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Selected</p>
              <p className="text-sm font-bold">
                {selectedSlots.length} slot(s)
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-3xl font-black">
                Rp {totalPrice.toLocaleString()}
              </p>
            </div>
          
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedDate || selectedSlots.length === 0}
              className={`w-full py-4 bg-primary text-white rounded-xl font-bold transition-all ${
                !selectedDate || selectedSlots.length === 0 
                  ? "opacity-30" 
                  : "opacity-100 cursor-pointer hover:opacity-90"
              }`}
            >
              Book • Rp {totalPrice.toLocaleString()}
            </button>

            <button
              onClick={contactWhatsApp}
              className="w-full py-3 bg-green-500 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaWhatsapp /> Ask via WhatsApp
            </button>

          </div>
        </div>

      </div>
      <BookingSummaryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        field={field}
        selectedDate={selectedDate}
        selectedSlots={selectedSlots}
        pricePerSlot={pricePerSlot}
        onRemove={handleRemoveSlot}
        onContinue={() => {
          alert("Proceeding to payment...");
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default BookingDetailPage;