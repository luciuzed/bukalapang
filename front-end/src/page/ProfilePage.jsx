import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaKey } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import Cookies from 'js-cookie';
import LoadingOverlay from '../components/LoadingOverlay';
import ProfileSidebar from '../components/ProfileSidebar';
import SuccessMessage from '../components/SuccessMessage';
import { API_BASE_URL, apiUrl } from '../config/api';

const getAccountId = (session) =>
  session?.id ?? session?.userId ?? session?.user_id ?? session?.accountId ?? null;

const formatBookingDate = (value) => {
  if (!value) return '--';

  const raw = String(value).trim();
  const datePartMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!datePartMatch) return '--';

  const year = Number(datePartMatch[1]);
  const month = Number(datePartMatch[2]);
  const day = Number(datePartMatch[3]);

  const date = new Date(year, month - 1, day);
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
      createdAt: '--',
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

  const handleLogout = () => {
    Cookies.remove('user_session')
    navigate('/login')
  }

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
      <ProfileSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        userName={user.name}
        userEmail={user.email}
        handleLogout={handleLogout}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
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
        <h1 className="text-3xl font-black text-gray-800">My Bookings</h1>
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
        <div className="flex gap-10">
          <span className="text-gray-400 w-24">Booking Date</span>
          <span className="font-bold text-gray-700">{cardView.createdAt}</span>
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleCancelBooking(booking.id)}
                className="px-6 py-2 text-sm font-bold text-red-600 border border-red-100 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => navigate(`/payment/${booking.payment_id}`)}
                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl cursor-pointer hover:opacity-90 transition flex items-center gap-2"
              >
                <FiCheck size={16} />
                Confirm Payment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: SECURITY ---

const SecuritySection = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [success, setSuccess] = useState(null);

  // Logic to mask the email (e.g., gemini@gmail.com -> ge***@gmail.com)
  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '***@***.com';
    const [name, domain] = email.split('@');
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const handlePasswordUpdate = async () => {
    setCurrentPasswordError('');
    setGeneralError('');

    if (!currentPassword || !newPassword) {
      setGeneralError('Please fill in current and new password');
      return;
    }

    if (newPassword.length < 6) {
      setGeneralError('New password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setGeneralError('New password must be different from current password');
      return;
    }

    const userId = getAccountId(user);
    if (!userId) {
      setGeneralError('User session not found. Please login again');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const response = await fetch(apiUrl('/user/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data?.field === 'currentPassword') {
          setCurrentPasswordError(data.error || 'Current password is incorrect');
          return;
        }

        setGeneralError(data?.error || 'Failed to update password');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setSuccess({ id: Date.now(), message: data?.message || 'Password updated successfully' });
    } catch (error) {
      setGeneralError('Cannot connect to server');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />

      <h1 className="text-2xl font-black text-gray-800 mb-8">Security & Information</h1>
      
      <div className="space-y-6">
        {/* BASIC INFO SECTION - NO INPUT BOXES */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <FaUserEdit size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Account Identity</h3>
              <p className="text-xs text-gray-400">Verified identity details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Display Name */}
            <div className="flex justify-between items-center border-b border-black-50 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Full Name</p>
                <p className="text-sm font-bold text-gray-700">{user.name}</p>
              </div>
            </div>

            {/* Email Address */}
            <div className="flex justify-between items-center border-b border-black-50 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Primary Email</p>
                <p className="text-sm font-bold text-gray-700">{maskEmail(user.email)}</p>
              </div>
              <span className="text-[10px] bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* PASSWORD SECTION - KEEP INPUTS HERE AS THEY ARE EDITABLE */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gray-100 p-3 rounded-2xl text-gray-600"><FaKey size={20} /></div>
            <div>
              <h3 className="font-bold text-gray-800">Credentials</h3>
              <p className="text-xs text-gray-400">Update your account password</p>
            </div>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Current Password" 
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value)
                if (currentPasswordError) setCurrentPasswordError('')
              }}
              className={`w-full bg-gray-50 border focus:border-primary/20 focus:bg-white p-4 rounded-xl text-sm transition-all outline-none ${
                currentPasswordError ? 'border-red-500' : 'border-transparent'
              }`} 
            />
            {currentPasswordError && (
              <p className="text-red-500 text-sm -mt-2 ml-1">{currentPasswordError}</p>
            )}
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white p-4 rounded-xl text-sm transition-all outline-none" 
            />
            {generalError && (
              <p className="text-red-500 text-sm -mt-2 ml-1">{generalError}</p>
            )}
            <button
              type="button"
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword}
              className={`w-full py-4 text-white rounded-2xl font-bold mt-2 transition-all active:scale-[0.98] ${
                isUpdatingPassword ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'
              }`}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;