import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaKey } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import Cookies from 'js-cookie';
import LoadingOverlay from '../components/LoadingOverlay';
import ProfileSidebar from '../components/ProfileSidebar';

const API_BASE_URL = 'http://localhost:5000/api';

const getAccountId = (session) =>
  session?.id ?? session?.userId ?? session?.user_id ?? session?.accountId ?? null;

const formatBookingDate = (value) => {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatFieldLabel = (fieldName, category) => {
  if (!fieldName) return 'Booking';
  return category ? `${fieldName} (${category})` : fieldName;
};

const formatTimeValue = (value) => {
  if (!value) return '--';

  const timeString = String(value).trim();
  const timeMatch = timeString.match(/(\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : timeString;
};

const formatTimeSlots = (timeSlots) => {
  if (!timeSlots) return '--';

  return String(timeSlots)
    .split(',')
    .map((slot) => slot.trim())
    .filter(Boolean)
    .map((slot) => {
      const [startTime, endTime] = slot.split(' - ');
      const formattedStart = formatTimeValue(startTime);
      const formattedEnd = formatTimeValue(endTime);

      return `${formattedStart} - ${formattedEnd}`;
    })
    .join(', ');
};

const formatBookingStatus = (status) => {
  const normalizedStatus = (status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        badgeClass: 'bg-primary',
        icon: 'check',
      };
    case 'pending':
      return {
        label: 'Pending',
        badgeClass: 'bg-[#ff8904]',
        icon: 'pending',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-red-700',
        icon: 'x',
      };
    case 'failed':
      return {
        label: 'Failed',
        badgeClass: 'bg-slate-500',
        icon: 'x',
      };
    case 'unpaid':
      return {
        label: 'Unpaid',
        badgeClass: 'bg-[#ff8904]',
        icon: null,
      };
    default:
      return {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
        badgeClass: 'bg-gray-400',
        icon: null,
      };
  }
};

const getBookingCardView = ({ booking, displayName, statusInfo, variant, emptyTitle }) => {
  if (variant === 'empty') {
    return {
      badgeLabel: 'Empty',
      badgeClass: 'bg-gray-400',
      title: emptyTitle || `No booking history yet ${displayName}`,
      date: '--',
      time: '--',
      venue: '--',
      showLoadingActions: false,
      showPayNow: false,
      showFooter: false,
    };
  }

  return {
    badgeLabel: statusInfo.label,
    badgeClass: statusInfo.badgeClass,
    badgeIcon: statusInfo.icon,
    title: `#${booking.id} ${displayName}`,
    date: formatBookingDate(booking.booking_date),
    time: formatTimeSlots(booking.time_slots),
    venue: formatFieldLabel(booking.field_name),
    showLoadingActions: false,
    showPayNow: booking.status === 'unpaid' && Boolean(booking.payment_id),
    showFooter: true,
  };
};

const StatusBadgeContent = ({ label, icon }) => {
  if (icon === 'check') {
    return (
      <span className="inline-flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="leading-none">{label}</span>
      </span>
    );
  }

  if (icon === 'pending') {
    return (
      <span className="inline-flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22c0-4-3-6-5-8-2 2-5 4-5 8" />
          <path d="M17 2c0 4-3 6-5 8-2-2-5-4-5-8" />
        </svg>
        <span className="leading-none">{label}</span>
      </span>
    );
  }

  if (icon === 'x') {
    return (
      <span className="inline-flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path
            d="M6 6l12 12M18 6l-12 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="leading-none">{label}</span>
      </span>
    );
  }

  return <span className="leading-none">{label}</span>;
};

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@example.com' });
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = Cookies.get('user_session');

    if (!session) {
      setLoadingBookings(false);
      return;
    }

    try {
      const parsedData = JSON.parse(session);
      setUser(parsedData);
    } catch (error) {
      console.error('Failed to parse user session:', error);
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    const accountId = getAccountId(user);

    if (!accountId) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }

    const controller = new AbortController();

    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const response = await fetch(`${API_BASE_URL}/bookings/user/${encodeURIComponent(accountId)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch booking history');
        }

        const data = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to load booking history:', error);
          setBookings([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBookings(false);
        }
      }
    };

    fetchBookings();

    return () => controller.abort();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'bookings' ? <BookingsList user={user} bookings={bookings} loadingBookings={loadingBookings} navigate={navigate} /> : <SecuritySection user={user} />}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: BOOKINGS LIST ---
const BookingsList = ({ user, bookings, loadingBookings, navigate }) => {
  const [bookingIdQuery, setBookingIdQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const displayName = (user.name || 'Guest').toUpperCase();

  if (loadingBookings) {
    return <LoadingOverlay show />;
  }

  const filteredBookings = bookings.filter((booking) => {
    const bookingId = String(booking.id || '');
    const matchesBookingId = bookingIdQuery.trim()
      ? bookingId.toLowerCase().includes(bookingIdQuery.trim().toLowerCase())
      : true;
    const matchesStatus = statusFilter === 'all'
      ? true
      : (booking.status || '').toLowerCase() === statusFilter;

    return matchesBookingId && matchesStatus;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-800">My Bookings</h1>
        <button
          type="button"
          onClick={() => navigate('/venue')}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:opacity-90 transition font-semibold text-sm"
        >
          <span className="text-white font-black text-base leading-none">+</span> Add Booking
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search by Booking ID..." 
          value={bookingIdQuery}
          onChange={(event) => setBookingIdQuery(event.target.value)}
          className="flex-1 min-w-75 bg-white border border-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusInfo = formatBookingStatus(booking.status);

            return (
              <BookingCard
                key={booking.id}
                variant="booking"
                booking={booking}
                displayName={displayName}
                statusInfo={statusInfo}
                navigate={navigate}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center text-gray-500 font-medium">
          No matching bookings found
        </div>
      )}
    </div>
  );
};

const BookingCard = ({ variant, booking, displayName, statusInfo, navigate, emptyTitle }) => {
  const cardView = getBookingCardView({ booking, displayName, statusInfo, variant, emptyTitle });

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className={`absolute top-6 right-6 inline-flex items-center gap-1.5 font-bold px-4 py-1.5 text-[10px] rounded-full shrink-0 uppercase tracking-widest ${cardView.badgeClass} text-white`}>
        <StatusBadgeContent label={cardView.badgeLabel} icon={cardView.badgeIcon} />
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800">{cardView.title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Date</span>
          <span className="font-bold text-gray-700">{cardView.date}</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Time</span>
          <span className="font-bold text-gray-700">{cardView.time}</span>
        </div>
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Venue</span>
          <span className="font-bold text-gray-700">{cardView.venue}</span>
        </div>
      </div>

      {cardView.showFooter && (
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
          {cardView.showLoadingActions && (
            <>
              <button className="text-gray-800 font-bold text-sm hover:underline">Book Again</button>
              <button className="text-red-600 font-black text-sm hover:underline">Pay Now</button>
            </>
          )}

          {cardView.showPayNow && (
            <button
              type="button"
              onClick={() => navigate(`/payment/${booking.payment_id}`)}
              className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary transition flex items-center gap-2"
            >
              <FiCheck size={16} />
              Confirm Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: SECURITY ---
const SecuritySection = ({ user }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
    <h1 className="text-2xl font-black text-gray-800 mb-8">Security & Information</h1>
    
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-2xl text-gray-600"><FaUserEdit size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-800">Edit Basic Information</h3>
            <p className="text-xs text-gray-400">Your email and display name</p>
          </div>
        </div>
        <div className="space-y-4">
          <input type="text" defaultValue={user.name} className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" placeholder="Full Name" />
          <input type="email" defaultValue={user.email} className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" placeholder="Email Address" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-2xl text-gray-600"><FaKey size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-800">Change Password</h3>
            <p className="text-xs text-gray-400">Make sure your password is strong and unique</p>
          </div>
        </div>
        <div className="space-y-4">
          <input type="password" title="Old Password" placeholder="Old Password" className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" />
          <input type="password" title="New Password" placeholder="New Password" className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm" />
          <button className="w-full py-4 bg-gray-800 text-white rounded-xl font-bold mt-2">Update Credentials</button>
        </div>
      </div>
    </div>
  </div>
);

export default ProfilePage;