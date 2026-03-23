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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    fetchFieldDetails();
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
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = (slotId) => {
    setSelectedSlotIds(prev => prev.filter(id => id !== slotId));
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
  const totalPrice = selectedSlotObjects.reduce((sum, slot) => sum + parseFloat(slot.price), 0);

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
                setSelectedSlotIds([]);
              }}
              className="border rounded-xl px-4 py-2 w-full"
            />
          </div>

          {/* SLOT TABLE */}
          <div>
            <p className="text-xs font-bold mb-3">Available Time Slots</p>

            {selectedDateSlots.filter(s => s.is_booked === 0).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No available slots for {selectedDate}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div>
          <div className="sticky top-8 bg-white p-6 rounded-3xl shadow-xl space-y-6">
            <div>
              <p className="text-sm text-gray-400">Price per slot</p>
              <p className="text-xl font-black">
                {selectedSlotObjects.length > 0 
                  ? `Rp ${Math.round(selectedSlotObjects[0].price).toLocaleString()}`
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
