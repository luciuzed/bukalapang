import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingOverlay from '../components/LoadingOverlay';
import Navbar from '../components/Navbar';
import qrImg from '../assets/qr.png';
import { apiUrl } from '../config/api';

const Payment = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [pendingBookingMeta, setPendingBookingMeta] = useState({});
  const [pollCount, setPollCount] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);

  const getTimeLeftSeconds = (transactionTime) => {
    if (!transactionTime) return null;

    const normalized = typeof transactionTime === 'string'
      ? transactionTime.replace(' ', 'T')
      : transactionTime;
    const createdAt = new Date(normalized);

    if (Number.isNaN(createdAt.getTime())) return null;

    const expiresAt = createdAt.getTime() + (10 * 60 * 1000);
    const remainingMs = expiresAt - Date.now();

    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  const formatTimeLeft = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        console.log('Fetching payment with ID:', paymentId);
        const response = await fetch(apiUrl(`/bookings/payment/${paymentId}`));
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || `Payment not found (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Payment data received:', data);
        setPayment(data);
        setPaymentStatus(data.status);
        setTimeLeftSeconds(getTimeLeftSeconds(data.transaction_time));
        
        const stored = window.sessionStorage.getItem('pendingBooking');
        if (stored) {
          setPendingBookingMeta(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Full error:', err);
        setError(err.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  useEffect(() => {
    if (paymentStatus !== 'unpaid' || !payment?.transaction_time) {
      return;
    }

    setTimeLeftSeconds(getTimeLeftSeconds(payment.transaction_time));

    const interval = setInterval(() => {
      setTimeLeftSeconds(getTimeLeftSeconds(payment.transaction_time));
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus, payment?.transaction_time]);

  useEffect(() => {
    if (paymentStatus === 'unpaid' && timeLeftSeconds === 0) {
      setPaymentStatus('failed');
    }
  }, [paymentStatus, timeLeftSeconds]);


  useEffect(() => {
    if (paymentStatus === 'unpaid' && pollCount < 120) { 
      const timer = setTimeout(() => {

        const fetchPaymentStatus = async () => {
          try {
            const response = await fetch(apiUrl(`/bookings/payment/${paymentId}`));
            if (response.ok) {
              const data = await response.json();
              setPayment(data);
              setPaymentStatus(data.status);
              setTimeLeftSeconds(getTimeLeftSeconds(data.transaction_time));
              console.log('Payment status checked:', data.status);
            }
          } catch (err) {
            console.error('Error checking payment status:', err);
          }
        };
        
        fetchPaymentStatus();
        setPollCount(pollCount + 1);
      }, 10000); 
      
      return () => clearTimeout(timer);
    }
  }, [pollCount, paymentStatus, paymentId]);

  const handleConfirmPayment = async () => {
    try {
      setError('');
      setProcessing(true);

      const response = await fetch(apiUrl(`/bookings/payment/${paymentId}/confirm`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm payment');
      }

      const data = await response.json();
      setPaymentStatus('paid');

      setTimeout(() => {
        navigate('/venue');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to confirm payment');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="container mx-auto px-6 sm:px-10 shrink-0">
          <Navbar />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
          <LoadingOverlay message="Loading payment details..." />
        </div>
      </div>
    );
  }

  // Payment Success Screen
  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-6 sm:px-10 shrink-0">
          <Navbar />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <FaCheckCircle size={72} className="text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been confirmed. Your booking status is now <span className="font-bold text-primary">pending</span>
            </p>
            <p className="text-xs text-gray-400">Redirecting to venues...</p>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-primary animate-pulse" style={{
                animation: 'slideIn 2s ease-in forwards'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Failed Screen
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-6 sm:px-10 shrink-0">
          <Navbar />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <FaTimesCircle size={72} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Payment Expired</h2>
            <p className="text-gray-600 mb-4">
              The booking has been cancelled and the slots have been released.
            </p>
            <button
              onClick={() => navigate('/venue')}
              className="w-full bg-red-500 text-white py-2.5 rounded-2xl font-bold hover:bg-red-600 transition-colors"
            >
              Return to Venues
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Pending Screen (Unpaid)
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-6 sm:px-10 shrink-0">
        <Navbar />
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl w-full items-stretch">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl lg:col-span-2">
            <div className="text-center mb-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Payment Details</h1>
              <p className="text-gray-600">Complete your booking payment</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {payment && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Booking Information</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Booking ID</span>
                      <span className="font-bold text-gray-800">#{payment.booking_id}</span>
                    </div>
                    {pendingBookingMeta.fieldName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Venue</span>
                        <span className="font-bold text-gray-800">{pendingBookingMeta.fieldName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2.5 border-t border-gray-300">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-xl sm:text-2xl font-black text-primary">Rp {parseInt(payment.amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border-2 border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                      <FaClock size={12} /> Payment Window
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-primary mb-2">{formatTimeLeft(timeLeftSeconds)}</p>
                    <p className="text-xs text-gray-500">
                      Until payment expires.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/venue')}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-50 transition-colors"
                  >
                    Return to Venues
                  </button>

                  <button
                    onClick={handleConfirmPayment}
                    disabled={processing || paymentStatus !== 'unpaid'}
                    className="w-full bg-primary text-white py-3 rounded-2xl font-bold text-base sm:text-lg hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col">
            <p className="text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-wide">QRIS</p>
            <div className="rounded-2xl border border-gray-100 p-3 flex-1 flex items-center justify-center">
              <img
                src={qrImg}
                alt="QRIS code"
                className="w-full max-w-60 object-contain"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">Scan to pay, then press Confirm Payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
