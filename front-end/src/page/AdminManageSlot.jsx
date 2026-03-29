import React, { useEffect, useState } from 'react'
import { FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi'
import LoadingOverlay from '../components/LoadingOverlay'

const AdminManageSlot = ({ field, adminId, onClose }) => {
  const [courts, setCourts] = useState([])
  const [newCourtName, setNewCourtName] = useState('')
  const [courtsLoading, setCourtsLoading] = useState(false)
  const [slotSetupScreen, setSlotSetupScreen] = useState('court-list') // 'court-list', 'set-hours', 'view-schedule'
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [courtOpenTime, setCourtOpenTime] = useState('08:00')
  const [courtCloseTime, setCourtCloseTime] = useState('17:00')
  const [courtPrice, setCourtPrice] = useState('100000')
  const [recurrenceType, setRecurrenceType] = useState('specific') // 'specific', 'weekly', 'monthly'
  const [recurringDays, setRecurringDays] = useState([0,1,2,3,4,5,6]) // 0=Sun to 6=Sat
  const [recurringDuration, setRecurringDuration] = useState(7) // days
  const [recurringStartDate, setRecurringStartDate] = useState('')
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideOpenTime, setOverrideOpenTime] = useState('')
  const [overrideCloseTime, setOverrideCloseTime] = useState('')
  const [overridePrice, setOverridePrice] = useState('')
  const [overrideList, setOverrideList] = useState([])
  const [viewSlotsForCourt, setViewSlotsForCourt] = useState(null)
  const [viewDate, setViewDate] = useState('')
  const [viewSlots, setViewSlots] = useState([])
  const [slotsModalTab, setSlotsModalTab] = useState('manage') // 'manage' or 'view'
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const showSuccessMessage = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  const showErrorMessage = (message) => {
    setError(message)
    setTimeout(() => setError(''), 3000)
  }

  // Initialize component
  useEffect(() => {
    if (field) {
      fetchCourtsAndSlots()
    }
  }, [field])

  const fetchCourtsAndSlots = async () => {
    setCourtsLoading(true)
    try {
      const [courtsResponse, slotsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/field/${field.id}/courts`),
        fetch(`http://localhost:5000/api/field/${field.id}/slots`)
      ])

      if (courtsResponse.ok) {
        const courtsData = await courtsResponse.json()
        setCourts(courtsData)
      } else {
        setCourts([])
      }

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setViewSlots(slotsData)
      } else {
        setViewSlots([])
      }
    } catch (err) {
      showErrorMessage('Failed to fetch data')
      setCourts([])
      setViewSlots([])
    } finally {
      setCourtsLoading(false)
    }
  }

  const handleAddCourt = async () => {
    if (!newCourtName.trim()) {
      showErrorMessage('Please enter court name')
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/field/${field.id}/courts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          name: newCourtName
        })
      })

      if (response.ok) {
        showSuccessMessage('Court added')
        setNewCourtName('')
        // Refresh courts
        const refreshResponse = await fetch(`http://localhost:5000/api/field/${field.id}/courts`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setCourts(data)
        }
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to add court')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    }
  }

  const handleDeleteCourt = async (courtId) => {
    if (!window.confirm('Delete this court?')) return

    try {
      const response = await fetch(`http://localhost:5000/api/field/${field.id}/courts/${courtId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      })

      if (response.ok) {
        showSuccessMessage('Court deleted')
        const refreshResponse = await fetch(`http://localhost:5000/api/field/${field.id}/courts`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setCourts(data)
        }
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to delete court')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    }
  }

  const handleSetCourtHours = () => {
    if (!courtOpenTime || !courtCloseTime || !courtPrice) {
      showErrorMessage('Please fill all fields')
      return
    }

    if (courtOpenTime >= courtCloseTime) {
      showErrorMessage('Opening time must be before closing time')
      return
    }

    setSlotSetupScreen('view-schedule')
  }

  const handleGenerateSlots = async () => {
    if (!recurringStartDate) {
      showErrorMessage('Please select start date')
      return
    }

    setSlotsLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/field/${field.id}/generate-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          courtId: selectedCourt.id,
          courtName: selectedCourt.name,
          openingTime: courtOpenTime,
          closingTime: courtCloseTime,
          price: parseFloat(courtPrice),
          startDate: recurringStartDate,
          duration: recurringDuration,
          durationType: recurrenceType,
          daysOfWeek: recurringDays
        })
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessMessage(`Generated time slots`)

        // Refresh viewSlots to show newly generated slots
        try {
          const refreshResponse = await fetch(`http://localhost:5000/api/field/${field.id}/slots`)
          if (refreshResponse.ok) {
            const data = await refreshResponse.json()
            setViewSlots(data)
          }
        } catch (err) {
          console.error('Failed to refresh slots:', err)
        }

        setTimeout(() => {
          setSlotSetupScreen('court-list')
          setRecurringDays([0,1,2,3,4,5,6])
          setRecurringDuration(7)
        }, 2000)
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to generate slots')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleAddOverride = async () => {
    if (!overrideDate || !overrideOpenTime || !overrideCloseTime || !overridePrice) {
      showErrorMessage('Please fill all override fields')
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/field/${field.id}/slots/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          courtId: selectedCourt.id,
          overrideDate,
          openingTime: overrideOpenTime,
          closingTime: overrideCloseTime,
          price: parseFloat(overridePrice)
        })
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessMessage(`Override applied - ${result.count} slots updated`)
        setOverrideDate('')
        setOverrideOpenTime('')
        setOverrideCloseTime('')
        setOverridePrice('')
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to apply override')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    }
  }

  const handleViewSlots = async (court) => {
    setViewSlotsForCourt(court)
    setSlotSetupScreen('view-grid')
    // Set default date to today
    const today = new Date().toISOString().split('T')[0]
    setViewDate(today)

    try {
      const response = await fetch(`http://localhost:5000/api/field/${field.id}/slots`)
      if (response.ok) {
        const data = await response.json()
        setViewSlots(data)
      }
    } catch (err) {
      showErrorMessage('Failed to fetch slots')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Slots: {field.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 inline-block rounded-full bg-green-50 border border-green-300 text-green-700 px-5 py-2 text-sm font-semibold shadow-sm">
            {success}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setSlotsModalTab('manage')
              setSlotSetupScreen('court-list')
            }}
            className={`px-4 py-3 text-sm font-semibold transition ${
              slotsModalTab === 'manage'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Courts & Schedule
          </button>
          <button
            onClick={() => {
              setSlotsModalTab('view')
              setViewDate(new Date().toISOString().split('T')[0])
            }}
            className={`px-4 py-3 text-sm font-semibold transition ${
              slotsModalTab === 'view'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            View Schedule Table
          </button>
        </div>

        {/* MANAGE TAB */}
        {slotsModalTab === 'manage' && (
          <>
            {/* COURTS LIST VIEW */}
            {slotSetupScreen === 'court-list' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <p className="text-sm font-bold mb-4 text-gray-800">Add New Court</p>
                  <div className="flex gap-3">
                    <input
                      placeholder="e.g., Court A, Lapangan 1"
                      value={newCourtName}
                      onChange={(e) => setNewCourtName(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />
                    <button
                      onClick={handleAddCourt}
                      className="px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 transition flex items-center gap-2 font-semibold text-sm shrink-0"
                    >
                      <FiPlus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold mb-4 text-gray-800">Your Courts ({courts.length})</p>
                  {courtsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading courts...</div>
                  ) : courts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-2xl border border-gray-100">
                      No courts yet. Add one above!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courts.map((court) => (
                        <div
                          key={court.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{court.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Click to set schedule</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCourt(court)
                                setSlotSetupScreen('set-hours')
                                setCourtOpenTime('08:00')
                                setCourtCloseTime('17:00')
                                setCourtPrice('100000')
                              }}
                              className="px-4 py-2.5 bg-primary text-white rounded-full hover:opacity-90 transition font-semibold text-sm"
                            >
                              Set Schedule
                            </button>
                            <button
                              onClick={() => handleDeleteCourt(court.id)}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete court"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SET COURT HOURS VIEW */}
            {slotSetupScreen === 'set-hours' && selectedCourt && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-700"><strong>Court:</strong> {selectedCourt.name}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Opening Time</label>
                      <input
                        type="time"
                        value={courtOpenTime}
                        onChange={(e) => setCourtOpenTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Closing Time</label>
                      <input
                        type="time"
                        value={courtCloseTime}
                        onChange={(e) => setCourtCloseTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Price per Slot (Rp)</label>
                    <input
                      type="number"
                      value={courtPrice}
                      onChange={(e) => setCourtPrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="bg-linear-to-r from-primary/10 to-blue-50 rounded-2xl p-4 border border-primary/20">
                  <p className="text-sm text-gray-700"><strong>Note:</strong> System will automatically create 1-hour slots between these times. For example: 8:00-9:00, 9:00-10:00, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-700">Schedule Pattern</label>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <input
                          type="radio"
                          checked={recurrenceType === 'specific'}
                          onChange={() => setRecurrenceType('specific')}
                          className="w-4 h-4"
                        />
                        Generate once starting from:
                      </label>
                      <input
                        type="date"
                        value={recurringStartDate}
                        onChange={(e) => setRecurringStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <input
                          type="radio"
                          checked={recurrenceType === 'weekly'}
                          onChange={() => setRecurrenceType('weekly')}
                          className="w-4 h-4"
                        />
                        Repeat on specific days of week:
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const newDays = [...recurringDays]
                              if (newDays.includes(idx)) {
                                newDays.splice(newDays.indexOf(idx), 1)
                              } else {
                                newDays.push(idx)
                              }
                              setRecurringDays(newDays.sort())
                            }}
                            className={`px-2 py-2 rounded-lg text-xs font-semibold transition ${
                              recurringDays.includes(idx)
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-600 block mb-2">Duration (days):</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={recurringDuration}
                          onChange={(e) => setRecurringDuration(parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Start date required below</p>
                    </div>
                  </div>

                  {recurrenceType === 'weekly' && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Start date:</label>
                      <input
                        type="date"
                        value={recurringStartDate}
                        onChange={(e) => setRecurringStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSlotSetupScreen('court-list')
                      setSelectedCourt(null)
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition font-semibold text-sm text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateSlots}
                    className="px-6 py-2.5 bg-primary text-white rounded-full hover:opacity-90 transition font-semibold text-sm flex items-center gap-2"
                  >
                    <FiCheck className="h-4 w-4" /> Generate Slots
                  </button>
                </div>
              </div>
            )}

            {!slotSetupScreen && (
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition font-semibold text-sm text-gray-700"
                >
                  Close
                </button>
              </div>
            )}
          </>
        )}

        {/* VIEW TAB */}
        {slotsModalTab === 'view' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Select Date to View</label>
              <input
                type="date"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            {/* SCHEDULE TABLE */}
            <div className="mt-6 overflow-x-auto">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid gap-0 border-b border-gray-200" style={{ gridTemplateColumns: `120px repeat(${[...new Set(viewSlots.filter(s => {
                  const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                  return slotDate === viewDate
                }).map(s => s.court_name || 'Court ' + (s.court_id || '1')))].length || 1}, 1fr)` }}>
                  <div className="px-4 py-3 text-xs font-bold text-gray-700 bg-primary/5 border-r border-gray-200">
                    Time
                  </div>
                  {[...new Set(viewSlots
                    .filter(s => {
                      const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                      return slotDate === viewDate
                    })
                    .map(s => s.court_name || 'Court ' + (s.court_id || '1')))
                  ]
                    .sort()
                    .map((court) => (
                      <div key={court} className="px-4 py-3 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-200 text-center">
                        {court}
                      </div>
                    ))}
                </div>

                {/* Slots Grid */}
                <div className="divide-y divide-gray-200">
                  {[...new Set(viewSlots
                    .filter(s => {
                      const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                      return slotDate === viewDate
                    })
                    .map(s => {
                      const startTime = new Date(s.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                      return startTime
                    }))]
                    .sort()
                    .map(time => (
                      <div key={time} className="grid gap-0 border-b border-gray-200" style={{ gridTemplateColumns: `120px repeat(${[...new Set(viewSlots.filter(s => {
                        const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                        return slotDate === viewDate
                      }).map(s => s.court_name || 'Court ' + (s.court_id || '1')))].length || 1}, 1fr)` }}>
                        {/* Time Cell */}
                        <div className="px-4 py-3 text-xs font-bold text-gray-900 bg-gray-50 border-r border-gray-200">
                          {time}-{String(parseInt(time.split(':')[0])+1).padStart(2, '0')}:00
                        </div>

                        {/* Slot Cells */}
                        {[...new Set(viewSlots
                          .filter(s => {
                            const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                            return slotDate === viewDate
                          })
                          .map(s => s.court_name || 'Court ' + (s.court_id || '1')))
                        ]
                          .sort()
                          .map(courtName => {
                            const slot = viewSlots.find(s => {
                              const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                              const slotTime = new Date(s.start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })
                              return slotDate === viewDate && slotTime === time && (s.court_name || 'Court ' + (s.court_id || '1')) === courtName
                            })

                            if (!slot) {
                              return (
                                <div key={courtName} className="px-3 py-3 border-r border-gray-200 bg-gray-50"></div>
                              )
                            }

                            const isBooked = slot.is_booked === 1

                            return (
                              <div
                                key={slot.id}
                                className={`px-3 py-4 border-r border-gray-200 text-center ${
                                  isBooked
                                    ? 'bg-gray-100 opacity-50'
                                    : 'bg-white'
                                }`}
                              >
                                <p className="text-xs font-bold text-primary">Rp {parseInt(slot.price).toLocaleString()}</p>
                                <p className={`text-xs mt-1 font-semibold ${isBooked ? 'text-gray-500' : 'text-green-700'}`}>
                                  {isBooked ? 'Tidak Tersedia' : 'Tersedia'}
                                </p>
                              </div>
                            )
                          })}
                      </div>
                    ))}
                </div>

                {viewSlots.filter(s => {
                  const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                  return slotDate === viewDate
                }).length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No slots created for {viewDate}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition font-semibold text-sm text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOADING OVERLAY FOR SLOT GENERATION */}
      <LoadingOverlay show={slotsLoading} />
    </div>
  )
}

export default AdminManageSlot