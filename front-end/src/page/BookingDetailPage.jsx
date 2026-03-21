import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaChevronLeft,
  FaWhatsapp
} from 'react-icons/fa';
import BookingSummaryModal from './BookingSummaryModal';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    fetchFieldDetails();
  }, [id]);

  const fetchFieldDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/field/${id}`);
      if (response.ok) {
        const data = await response.json();
        setField(data);
      } else {
        navigate('/venue');
      }
    } catch (err) {
      console.error('Failed to fetch field:', err);
      navigate('/venue');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = (slotKey) => {
    setSelectedSlots(prev => prev.filter(key => key !== slotKey));
  };

  if (loading) {
    return <div className="p-10 text-center font-bold">Loading...</div>;
  }

  if (!field) {
    return <div className="p-10 text-center font-bold">Field not found</div>;
  }

  const openGoogleMaps = () => {
    if (!field.address) return;
    const query = encodeURIComponent(field.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openTime = "08:00";
  const closeTime = "22:00";
  const slotDuration = 60;
  const pricePerHour = 100000;

  const courts = ["Court A", "Court B", "Court C"];

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

  const displayPrice = isWeekend(selectedDate) ? pricePerHour * 1.2 : pricePerHour;
  const pricePerSlot = displayPrice * (slotDuration / 60);

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
Venue: ${field.name}
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

          <div className="rounded-3xl overflow-hidden aspect-video shadow-xl bg-gray-200">
            {field.image_url ? (
              <img src={field.image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <span className="text-gray-600">No image</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black">{field.name}</h1>
            <button
              onClick={openGoogleMaps}
              className="flex items-center gap-2 text-primary mt-2 hover:underline"
            >
              <FaMapMarkerAlt /> {field.address}
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl">
            <p className="text-sm text-gray-500">
              {field.description || "No description available."}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">
              {field.category}
            </div>
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
                        className={`h-12 sm:h-14 rounded-xl border flex items-center justify-center transition ${
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
                Rp {displayPrice.toLocaleString()} / hour
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
              className="w-full py-4 bg-primary text-white rounded-xl font-bold disabled:opacity-30"
            >
              Book • Rp {totalPrice.toLocaleString()}
            </button>

            <button
              onClick={contactWhatsApp}
              className="w-full py-3 bg-green-500 text-white rounded-xl flex items-center justify-center gap-2"
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

 