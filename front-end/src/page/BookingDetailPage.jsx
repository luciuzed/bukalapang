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
  const [slots, setSlots] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    fetchFieldDetails();
    fetchCourts();
  }, [id]);

  const fetchFieldDetails = async () => {
    try {
      const fieldResponse = await fetch(`http://localhost:5000/api/field/detail/${id}`);
      if (!fieldResponse.ok) {
        navigate('/venue');
        return;
      }
      const fieldData = await fieldResponse.json();
      setField(fieldData);

      // Slots are already included in the response from /detail endpoint
      if (fieldData.slots) {
        setSlots(fieldData.slots);
      }
    } catch (err) {
      console.error('Failed to fetch field:', err);
      navigate('/venue');
    }
  };

  const fetchCourts = async () => {
    try {
      const courtsResponse = await fetch(`http://localhost:5000/api/courts/${id}`);
      if (courtsResponse.ok) {
        const courtsData = await courtsResponse.json();
        setCourts(courtsData);
      }
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    } finally {
      setLoading(false);
    }
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

  // Filter slots by selected date (both booked and available)
  const selectedDateSlots = slots.filter(slot => {
    const slotDate = new Date(slot.start_time).toISOString().split('T')[0];
    return slotDate === selectedDate;
  });

  // Get selected slot objects for calculation
  const selectedSlotObjects = selectedDateSlots.filter(slot => selectedSlotIds.includes(slot.id));
  const totalPrice = selectedSlotObjects.reduce((sum, slot) => sum + parseInt(slot.price), 0);

  const handleRemoveSlot = (slotId) => {
    setSelectedSlotIds(prev => prev.filter(id => id !== slotId));
  };

  // Extract unique time slots from the slots data
  const timeSlots = Array.from(
    new Set(
      selectedDateSlots.map(slot => {
        const date = new Date(slot.start_time);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      })
    )
  ).sort();

  // Get price for a specific court
  const getCourtPrice = (courtId) => {
    const courtSlot = selectedDateSlots.find(slot => slot.court_id === courtId);
    return courtSlot ? parseInt(courtSlot.price) : 0;
  };

  // Format time range (e.g., "08:00" -> "08:00 - 09:00")
  const formatTimeRange = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = String((hours + 1) % 24).padStart(2, '0');
    return `${startTime} - ${endHours}:${String(minutes).padStart(2, '0')}`;
  };

  // Toggle slot selection
  const toggleSlot = (courtId, time) => {
    // Find the slot matching this court and time
    const slot = selectedDateSlots.find(s => {
      const slotDate = new Date(s.start_time);
      const slotHours = String(slotDate.getHours()).padStart(2, '0');
      const slotMinutes = String(slotDate.getMinutes()).padStart(2, '0');
      const slotTime = `${slotHours}:${slotMinutes}`;
      
      // Match by time and court_id
      return slotTime === time && s.court_id === courtId;
    });

    if (slot) {
      if (selectedSlotIds.includes(slot.id)) {
        setSelectedSlotIds(prev => prev.filter(id => id !== slot.id));
      } else {
        setSelectedSlotIds(prev => [...prev, slot.id]);
      }
    }
  };

  // Helper function to check if a slot is selected for given court and time
  const isSlotSelected = (courtId, time) => {
    return selectedDateSlots.some(slot => {
      if (!selectedSlotIds.includes(slot.id)) return false;
      
      const slotDate = new Date(slot.start_time);
      const slotHours = String(slotDate.getHours()).padStart(2, '0');
      const slotMinutes = String(slotDate.getMinutes()).padStart(2, '0');
      const slotTime = `${slotHours}:${slotMinutes}`;
      
      return slotTime === time && slot.court_id === courtId;
    });
  };

  const contactWhatsApp = () => {
    const msg = `Halo Admin,
Venue: ${field.name}
Tanggal: ${selectedDate}
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
        {/* LEFT SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl overflow-hidden aspect-video shadow-xl bg-gray-200">
            {field.image_url ? (
              <img src={field.image_url} className="w-full h-full object-cover" alt={field.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-300 to-gray-400">
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

          <div className="p-6 rounded-2xl" style={{backgroundColor: '#f2f2f2'}}>
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
                setSelectedSlotIds([]);
              }}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full"
            />
          </div>

          {/* SLOT TABLE */}
          {/* SLOT GRID */}
          <div>
            <p className="text-xs font-bold mb-3">Select Time & Court</p>

            {/* CHECK IF THERE ARE NO COURTS OR NO TIME SLOTS */}
            {courts.length === 0 || timeSlots.length === 0 ? (
              <div className="text-center py-12 bg-gray-100 rounded-2xl">
                <p className="text-gray-500 font-semibold">Schedule empty</p>
              </div>
            ) : (
              /* GRID FIXED SYSTEM */
              <div
                className="grid gap-2 p-6 rounded-2xl"
                style={{
                  gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`,
                  backgroundColor: '#f2f2f2'
                }}
              >

                {/* EMPTY TOP LEFT */}
                <div></div>

                {/* HEADER */}
                {courts.map(court => (
                  <div
                    key={court.id}
                    className="h-10 flex items-center justify-center font-bold text-[10px] sm:text-xs"
                  >
                    {court.name}
                  </div>
                ))}

                {/* ROWS */}
                {timeSlots.map(time => (
                  <React.Fragment key={time}>

                    {/* TIME */}
                    <div className="h-12 sm:h-14 flex items-center text-[9px] sm:text-[11px] font-semibold leading-none">
                      {formatTimeRange(time)}
                    </div>

                    {/* BUTTONS */}
                    {courts.map(court => {
                      const key = `${court.id}-${time}`;
                      const isSelected = isSlotSelected(court.id, time);

                      // Check if a slot exists for this court at this specific time
                      const slotExists = selectedDateSlots.some(slot => {
                        const slotDate = new Date(slot.start_time);
                        const slotHours = String(slotDate.getHours()).padStart(2, '0');
                        const slotMinutes = String(slotDate.getMinutes()).padStart(2, '0');
                        const slotTime = `${slotHours}:${slotMinutes}`;
                        return slotTime === time && slot.court_id === court.id;
                      });

                      // If no slot exists, render empty div
                      if (!slotExists) {
                        return <div key={key}></div>;
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => toggleSlot(court.id, time)}
                          className={`h-12 sm:h-14 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-400 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {isSelected ? "✓" : (
                            <span className="text-[9px] sm:text-[11px]">
                              Rp {getCourtPrice(court.id).toLocaleString()}
                            </span>
                          )}
                        </button>
                      );
                    })}

                  </React.Fragment>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div>
          <div className="sticky top-8 bg-white p-6 rounded-3xl shadow-2xl shadow-black/15 ring-1 ring-black/3 space-y-6">
            <div>
              <p className="text-sm text-gray-400">Price per slot</p>
              <p className="text-xl font-black">
                {selectedSlotObjects.length > 0 
                  ? `Rp ${parseInt(selectedSlotObjects[0].price).toLocaleString()}`
                  : 'Select slots'
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Selected</p>
              <p className="text-sm font-bold">
                {selectedSlotIds.length} slot(s)
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
              disabled={selectedDateSlots.length === 0 || selectedSlotIds.length === 0}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition"
            >
              Book • Rp {totalPrice.toLocaleString()}
            </button>

            <button
              onClick={contactWhatsApp}
              className="w-full py-3 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold hover:bg-green-600 transition"
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
        selectedSlotIds={selectedSlotIds}
        selectedSlots={selectedSlotObjects}
        totalPrice={totalPrice}
        onRemove={handleRemoveSlot}
        onContinue={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default BookingDetailPage;
