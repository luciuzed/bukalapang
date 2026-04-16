import React from 'react'

const Notification = ({ isOpen, pendingBookings, onNotificationClick }) => {
  if (!isOpen) return null

  const hasNotifications = pendingBookings.length > 0

  return (
    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-black text-gray-900">Notifications</p>
      </div>

      {hasNotifications ? (
        <div className="py-2 max-h-72 overflow-y-auto">
          {pendingBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => onNotificationClick(booking.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
            >
              <p className="text-sm font-bold text-gray-900 truncate">Pending booking #{booking.id}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{booking.field_name || 'Venue booking requires action'}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5">
          <p className="text-sm font-medium text-gray-500">Nothing new here.</p>
        </div>
      )}
    </div>
  )
}

export default Notification
