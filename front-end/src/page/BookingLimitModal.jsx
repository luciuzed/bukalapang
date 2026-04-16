import React, { useEffect } from 'react';

const BookingLimitModal = ({ isOpen, onClose, onFinishNow }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-primary/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>

        <h2 className="text-center text-2xl font-black text-gray-900">
          Cannot book at the moment
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          You should finish the two previous bookings first.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition cursor-pointer hover:bg-gray-50"
          >
            Return
          </button>
          <button
            type="button"
            onClick={onFinishNow}
            className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition cursor-pointer hover:opacity-90"
          >
            Finish Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingLimitModal;