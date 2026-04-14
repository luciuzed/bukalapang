import React, { useEffect, useState } from 'react'

const SuccessMessage = ({ message, triggerKey, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return undefined

    setVisible(true)

    const exitTimer = setTimeout(() => setVisible(false), duration)
    const cleanupTimer = setTimeout(() => {
      if (onClose) onClose()
    }, duration + 360)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(cleanupTimer)
    }
  }, [message, triggerKey, duration, onClose])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-6 left-1/2 z-120 inline-flex max-w-[calc(100vw-28px)] -translate-x-1/2 items-center gap-2.5 rounded-[10px] border border-gray-200 bg-white px-5 py-3.5 text-left text-gray-900 shadow-[0_6px_14px_-12px_rgba(0,0,0,0.22),0_3px_8px_-10px_rgba(0,0,0,0.12)] pointer-events-none transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
      }`}
    >
      <span className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-full w-full"
        >
          <circle cx="12" cy="12" r="12" fill="#22c55e" />
          <path
            d="M7 12.5l3 3 7-7"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-base leading-none font-normal">{message}</span>
    </div>
  )
}

export default SuccessMessage