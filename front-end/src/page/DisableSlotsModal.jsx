import React, { useEffect } from 'react'

const DisableSlotsModal = ({
  isOpen,
  onClose,
  onConfirm,
  slotCount = 0,
  isProcessing = false,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isProcessing, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4"
      onClick={() => {
        if (!isProcessing) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-primary/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="h-10 w-10 text-white"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" />
              <path
                d="M8.5 15.5l7-7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <p className="text-center text-2xl font-extrabold text-gray-900 leading-tight">
          Disable selected slots?
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          You cant enable it again.
        </p>

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Return
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-xl border-2 border-red-600 bg-red-600 px-5 py-3 text-sm font-bold text-white transition cursor-pointer hover:bg-red-600/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? 'Processing...' : 'Disable'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DisableSlotsModal
