import React, { useEffect } from 'react'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  actionText,
  confirmLabel = 'Confirm',
  returnLabel = 'Return',
  isProcessing = false,
  icon,
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
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border"
        style={{ borderColor: 'rgba(0, 153, 102, 0.18)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex justify-center">
          {icon || (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          )}
        </div>

        <p className="text-center text-2xl font-extrabold text-gray-900 leading-tight">
          Are you sure?
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Do you really want to {actionText}
        </p>

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {returnLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-xl border-2 border-red-600 bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal