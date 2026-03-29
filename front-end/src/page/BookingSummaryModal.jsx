import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FaCalendarAlt, FaClock, FaTrashAlt, FaTimes, FaCheckCircle } from 'react-icons/fa';

const BookingSummaryModal = ({ 
  isOpen, 
  onClose, 
  field, 
  selectedDate, 
  selectedSlotIds,
  selectedSlots,
  totalPrice,
  onRemove 
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) setStep(1);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const serviceFee = 1000;
  const totalPayment = totalPrice + serviceFee;

  const handleProceedToPayment = async () => {
    try {
      setError('');
      setIsProcessing(true);

      // Get userId from session/auth
      const userCookie = Cookies.get('user_session');
      let userId;

      if (userCookie) {
        const userData = JSON.parse(userCookie);
        userId = userData.userId;
      }

      if (!userId) {
        setError('User not authenticated. Please log in again.');
        return;
      }

      // Create booking
      const bookingResponse = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fieldId: field.id,
          selectedSlotIds
        })
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const bookingData = await bookingResponse.json();
      
      // Store booking details for payment page
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        bookingId: bookingData.id,
        totalAmount: bookingData.totalAmount,
        serviceFee: serviceFee,
        fieldName: field.name
      }));

      setStep(2);
      // Auto-navigate to payment after confirmation
      setTimeout(() => {
        navigate('/payment', { state: { bookingId: bookingData.id } });
      }, 2000);

    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
      setIsProcessing(false);
    }
  };

  // --- RENDERING STEP 2 (CONFIRMATION) ---
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center mb-4 text-primary">
            <FaCheckCircle size={60} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 text-sm mb-6">
            You have successfully selected <span className="font-bold text-gray-800">{selectedSlotIds.length} slot(s)</span>. Ready to proceed to payment?
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Payment</span>
              <span className="font-bold text-primary text-lg">Rp {totalPayment.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">Redirecting to payment in 2 seconds...</p>
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{
              animation: 'slideIn 2s ease-in forwards'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING STEP 1 (SUMMARY) ---
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Booking Summary</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-gray-800 mb-4">Field & Date</p>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-800">{field.name}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt size={12} /> {selectedDate}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Selected Slots ({selectedSlots.length})</p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {selectedSlots.length > 0 ? (
                selectedSlots.map((slot) => {
                  const startTime = new Date(slot.start_time).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                  const endTime = new Date(slot.end_time).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });

                  return (
                    <div key={slot.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex gap-2 items-center flex-1">
                        <FaClock size={12} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {startTime} - {endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">
                          Rp {parseInt(slot.price).toLocaleString()}
                        </span>
                        <button 
                          onClick={() => onRemove(slot.id)}
                          className="text-gray-300 hover:text-red-500 transition"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400 py-4 text-sm italic">No slots selected</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-400">
              <span>Slots Total</span>
              <span className="text-gray-800">Rp {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-400">
              <span>Service Fee</span>
              <span className="text-gray-800">Rp {serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-bold text-gray-800">Total Payment</span>
              <span className="text-xl font-black text-primary">Rp {totalPayment.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 border border-primary text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleProceedToPayment}
              disabled={selectedSlots.length === 0 || isProcessing}
              className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummaryModal;