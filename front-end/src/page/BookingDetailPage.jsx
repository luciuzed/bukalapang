import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  FaMapMarkerAlt,
  FaChevronLeft,
  FaWhatsapp
} from 'react-icons/fa';
import LoadingOverlay from '../components/LoadingOverlay';
import BookingSummaryModal from './BookingSummaryModal';
import BookingLimitModal from './BookingLimitModal';
import { API_BASE_URL, apiUrl } from '../config/api';

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const LOCAL_UPLOAD_IMAGE_PATTERN = /^\/uploads\/.+\.(jpe?g|png)$/i;

const resolveImageUrl = (imageUrl) => {
  if (typeof imageUrl !== 'string') return '';
  const normalized = imageUrl.trim();
  if (!LOCAL_UPLOAD_IMAGE_PATTERN.test(normalized)) return '';
  return `${BACKEND_BASE_URL}${normalized}`;
};

const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSlotDate = (dateTimeValue) => String(dateTimeValue || '').slice(0, 10);
const getSlotTime = (dateTimeValue) => String(dateTimeValue || '').slice(11, 16);
const normalizeWhatsAppNumber = (rawNumber) => {
  const cleaned = String(rawNumber || '').trim().replace(/[\s()-]/g, '');
  if (!cleaned) return '';
  return cleaned.replace(/^\+/, '');
};

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [slots, setSlots] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isCheckingBookingLimit, setIsCheckingBookingLimit] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);

  useEffect(() => {
    setSelectedDate(getLocalToday());
    const loadVenueData = async () => {
      try {
        await Promise.all([fetchFieldDetails(), fetchCourts()]);
      } finally {
        setLoading(false);
      }
    };

    loadVenueData();
  }, [id]);

  const fetchFieldDetails = async () => {
    try {
      const fieldResponse = await fetch(apiUrl(`/field/detail/${id}`));
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
      const courtsResponse = await fetch(apiUrl(`/courts/${id}`));
      if (courtsResponse.ok) {
        const courtsData = await courtsResponse.json();
        setCourts(courtsData);
      }
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    }
  };

  if (loading) {
    return <LoadingOverlay show={loading} />;
  }

  if (!field) {
    return <div className="p-10 text-center font-bold">Field not found</div>;
  }

  const openGoogleMaps = () => {
    const rawSavedLink = String(field.google_maps_link || '').trim();

    if (rawSavedLink) {
      const hasScheme = /^https?:\/\//i.test(rawSavedLink);
      const normalizedSavedLink = hasScheme ? rawSavedLink : `https://${rawSavedLink}`;
      window.open(normalizedSavedLink, '_blank');
      return;
    }

    if (!field.address) return;
    const query = encodeURIComponent(field.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Filter slots by selected date
  const selectedDateSlots = slots.filter(slot => {
    const slotDate = getSlotDate(slot.start_time);
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
        return getSlotTime(slot.start_time);
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
      const slotTime = getSlotTime(s.start_time);
      
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
      
      const slotTime = getSlotTime(slot.start_time);
      
      return slotTime === time && slot.court_id === courtId;
    });
  };

  const contactWhatsApp = () => {
    const phoneNumber = normalizeWhatsAppNumber(field.admin_phone);
    if (!phoneNumber) {
      window.alert('WhatsApp number is not available for this field owner.');
      return;
    }

    const msg = `Halo Admin,
Venue: ${field.name}
Tanggal: ${selectedDate}
Total: Rp ${totalPrice.toLocaleString()}`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`);
  };

  const handleFinishNow = () => {
    setIsLimitModalOpen(false);
    navigate('/profile?tab=bookings&status=unpaid');
  };

  const checkBookingLimit = async () => {
    const userSession = Cookies.get('user_session');

    if (!userSession) {
      navigate('/login');
      return false;
    }

    try {
      setIsCheckingBookingLimit(true);
      const userData = JSON.parse(userSession);
      const userId = userData?.id;

      if (!userId) {
        navigate('/login');
        return false;
      }

      const response = await fetch(apiUrl(`/bookings/user/${encodeURIComponent(userId)}/booking-eligibility`));
      if (!response.ok) {
        throw new Error('Failed to check booking limit');
      }

      const data = await response.json();
      if (!data.canBook) {
        setIsLimitModalOpen(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to check booking limit:', err);
      return true;
    } finally {
      setIsCheckingBookingLimit(false);
    }
  };

  const handleBookClick = () => {
    const openBookingSummary = async () => {
      const canContinue = await checkBookingLimit();
      if (canContinue) {
        setIsModalOpen(true);
      }
    };

    openBookingSummary();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 mb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold cursor-pointer text-gray-400 mb-6 uppercase hover:text-black"
      >
        <FaChevronLeft /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* LEFT SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-3xl overflow-hidden aspect-video shadow-xl bg-gray-200">
            {field.image_url ? (
              <img src={resolveImageUrl(field.image_url)} className="w-full h-full object-cover" alt={field.name} />
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
              className="mt-2 flex items-start gap-2 text-left cursor-pointer text-primary hover:underline"
            >
              <FaMapMarkerAlt className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 wrap-anywhere w-fit">{field.address}</span>
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              {field.city && (
                <div className="px-3 py-1 text-xs rounded-full bg-gray-50 text-primary font-bold">
                  {field.city}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{backgroundColor: '#f6f6f6'}}>
            <p className="text-sm text-gray-500 whitespace-pre-wrap wrap-break-word">
              {field.description || "No description available."}
            </p>
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
              className="border border-gray-300 rounded-xl px-4 py-2 w-full cursor-pointer"
            />
          </div>

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
                className="grid gap-2 p-6 rounded-2xl overflow-x-auto"
                style={{
                  gridTemplateColumns: `80px repeat(${courts.length}, minmax(110px, 1fr))`,
                  backgroundColor: '#f6f6f6'
                }}
              >

                {/* EMPTY TOP LEFT */}
                <div className="min-w-[110px]"></div>

                {/* HEADER */}
                {courts.map(court => (
                  <div
                    key={court.id}
                    className="h-10 flex items-center justify-center font-bold text-[10px] sm:text-xs min-w-[110px]"
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

                      // Find the slot for this court at this specific time
                      const slot = selectedDateSlots.find(s => {
                        const slotTime = getSlotTime(s.start_time);
                        return slotTime === time && s.court_id === court.id;
                      });

                      // If no slot exists, render empty div
                      if (!slot) {
                        return <div key={key} className="min-w-[110px]"></div>;
                      }

                      const isBooked = slot.is_booked === 1;

                      return (
                        <button
                          key={key}
                          onClick={() => !isBooked && toggleSlot(court.id, time)}
                          disabled={isBooked}
                          className={`h-12 sm:h-14 rounded-xl border flex items-center justify-center transition min-w-[110px] ${
                            isBooked
                              ? "bg-gray-300 text-gray-500 border-gray-300 "
                              : isSelected
                              ? "bg-primary text-white border-primary cursor-pointer"
                              : "bg-white text-gray-400 border-gray-300 hover:border-primary cursor-pointer"
                          }`}
                        >
                          {isBooked ? (
                            <span className="text-[9px] sm:text-[11px]">Unavailable</span>
                          ) : isSelected ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="w-5 h-5"
                              aria-label="Selected"
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] font-bold text-primary">
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
          <div className="sticky top-8 bg-white p-6 rounded-3xl shadow-2xl shadow-black/15 ring-3 ring-black/3 space-y-6">
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

            <div className="border-t border-gray-300 pt-4">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-3xl font-black">
                Rp {totalPrice.toLocaleString()}
              </p>
            </div>
          
            <button
              onClick={handleBookClick}
              disabled={selectedDateSlots.length === 0 || selectedSlotIds.length === 0 || isCheckingBookingLimit}
              className="w-full py-4 bg-primary text-white rounded-2xl cursor-pointer font-bold disabled:bg-gray-300 disabled:text-gray-500 hover:bg-primary/90 transition"
            >
              {isCheckingBookingLimit ? 'Checking...' : `Book • Rp ${totalPrice.toLocaleString()}`}
            </button>

            <button
              onClick={contactWhatsApp}
              className="w-full py-3 bg-[#22c35d] text-white rounded-2xl flex items-center justify-center gap-2 cursor-pointer font-semibold hover:bg-green-600 transition"
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

      <BookingLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onFinishNow={handleFinishNow}
      />
    </div>
  );
};

export default BookingDetailPage;
