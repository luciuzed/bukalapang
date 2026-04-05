import React, { useEffect, useState } from 'react'
import { FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi'
import LoadingOverlay from '../components/LoadingOverlay'
import ConfirmationModal from './ConfirmationModal'
import SuccessMessage from '../components/SuccessMessage'
import { apiUrl } from '../config/api'

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
  const [recurringStartDate, setRecurringStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideOpenTime, setOverrideOpenTime] = useState('')
  const [overrideCloseTime, setOverrideCloseTime] = useState('')
  const [overridePrice, setOverridePrice] = useState('')
  const [overrideList, setOverrideList] = useState([])
  const [viewSlotsForCourt, setViewSlotsForCourt] = useState(null)
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [viewSlots, setViewSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [courtToDelete, setCourtToDelete] = useState(null)
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false)

  const showSuccessMessage = (message) => {
    setSuccess({ id: Date.now(), message })
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
        fetch(apiUrl(`/field/${field.id}/courts`)),
        fetch(apiUrl(`/field/${field.id}/slots`))
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

  const fetchSlotsOnly = async () => {
    try {
      const slotsResponse = await fetch(apiUrl(`/field/${field.id}/slots`))
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setViewSlots(slotsData)
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err)
    }
  }

  const handleAddCourt = async () => {
    if (!newCourtName.trim()) {
      showErrorMessage('Please enter court name')
      return
    }

    try {
      const response = await fetch(apiUrl(`/field/${field.id}/courts`), {
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
        const refreshResponse = await fetch(apiUrl(`/field/${field.id}/courts`))
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

  const openDeleteCourtModal = (courtId) => {
    setCourtToDelete(courtId)
  }

  const closeDeleteCourtModal = () => {
    if (isDeleteProcessing) return
    setCourtToDelete(null)
  }

  const handleDeleteCourt = async () => {
    if (!courtToDelete) return

    try {
      setIsDeleteProcessing(true)
      const response = await fetch(apiUrl(`/field/${field.id}/courts/${courtToDelete}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      })

      if (response.ok) {
        showSuccessMessage('Court deleted')
        setCourtToDelete(null)
        const refreshResponse = await fetch(apiUrl(`/field/${field.id}/courts`))
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
    } finally {
      setIsDeleteProcessing(false)
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
    if (!Number.isInteger(recurringDuration) || recurringDuration < 1) {
      showErrorMessage('Please fill a valid duration')
      return
    }

    if (recurringDuration > 365) {
      showErrorMessage('Duration cannot be more than 365 days')
      return
    }

    if (!recurringStartDate) {
      showErrorMessage('Please select start date')
      return
    }

    setSlotsLoading(true)
    try {
      const response = await fetch(apiUrl(`/field/${field.id}/generate-slots`), {
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
          const refreshResponse = await fetch(apiUrl(`/field/${field.id}/slots`))
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
          setRecurringStartDate(new Date().toISOString().split('T')[0])
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
      const response = await fetch(apiUrl(`/field/${field.id}/slots/override`), {
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
      const response = await fetch(apiUrl(`/field/${field.id}/slots`))
      if (response.ok) {
        const data = await response.json()
        setViewSlots(data)
      }
    } catch (err) {
      showErrorMessage('Failed to fetch slots')
    }
  }

  const hasValidStartDate = Boolean(recurringStartDate)
  const hasValidDuration = Number.isInteger(recurringDuration) && recurringDuration > 0 && recurringDuration <= 365
  const canGenerateSlots = hasValidStartDate && hasValidDuration

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-[96vw] w-full mx-4 min-h-[75vh] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Courts: {field.name}</h2>
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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5">
            {/* COURTS LIST VIEW */}
            {slotSetupScreen === 'court-list' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-6 border border-gray-100">
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
                              onClick={() => openDeleteCourtModal(court.id)}
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
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-300">
                  <p className="text-sm text-green-700"><strong>Court:</strong> {selectedCourt.name}</p>
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Price per Slot</label>
                    <div className="w-full flex items-center gap-2">
                      <span className="font-bold text-gray-700">Rp</span>
                      <input
                        type="number"
                        value={courtPrice}
                        onChange={(e) => setCourtPrice(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-r from-primary/10 to-blue-50 rounded-2xl p-4 border border-primary/20">
                  <p className="text-sm text-gray-700">System will automatically create 1-hour slots between these times. For example: 8:00-9:00.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-700">Schedule Pattern</label>
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`flex items-center gap-3 text-sm font-semibold mb-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                          recurrenceType === 'specific'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={recurrenceType === 'specific'}
                          onChange={() => setRecurrenceType('specific')}
                          className="sr-only"
                        />
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            recurrenceType === 'specific' ? 'border-primary' : 'border-gray-300'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full transition ${
                              recurrenceType === 'specific' ? 'bg-primary' : 'bg-transparent'
                            }`}
                          />
                        </span>
                        <span>Generate once starting from:</span>
                      </label>
                      {recurrenceType === 'specific' && (
                        <input
                          type="date"
                          value={recurringStartDate}
                          onChange={(e) => setRecurringStartDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                        />
                      )}
                    </div>

                    <div>
                      <label
                        className={`flex items-center gap-3 text-sm font-semibold mb-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                          recurrenceType === 'weekly'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={recurrenceType === 'weekly'}
                          onChange={() => setRecurrenceType('weekly')}
                          className="sr-only"
                        />
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            recurrenceType === 'weekly' ? 'border-primary' : 'border-gray-300'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full transition ${
                              recurrenceType === 'weekly' ? 'bg-primary' : 'bg-transparent'
                            }`}
                          />
                        </span>
                        <span>Repeat on specific days of week:</span>
                      </label>
                      {recurrenceType === 'weekly' && (
                        <>
                          <div className="grid grid-cols-7 gap-2">
                            {[
                              { label: 'Mon', value: 1 },
                              { label: 'Tue', value: 2 },
                              { label: 'Wed', value: 3 },
                              { label: 'Thu', value: 4 },
                              { label: 'Fri', value: 5 },
                              { label: 'Sat', value: 6 },
                              { label: 'Sun', value: 0 }
                            ].map(({ label, value }) => (
                              <button
                                key={value}
                                onClick={() => {
                                  const newDays = [...recurringDays]
                                  if (newDays.includes(value)) {
                                    newDays.splice(newDays.indexOf(value), 1)
                                  } else {
                                    newDays.push(value)
                                  }
                                  setRecurringDays(newDays.sort())
                                }}
                                className={`px-2 py-2 rounded-lg text-xs font-semibold transition ${
                                  recurringDays.includes(value)
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-2">Duration (days):</label>
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={Number.isNaN(recurringDuration) ? '' : recurringDuration}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '') {
                                    setRecurringDuration(NaN)
                                    return
                                  }

                                  const parsedValue = parseInt(value, 10)
                                  if (Number.isNaN(parsedValue)) {
                                    setRecurringDuration(NaN)
                                    return
                                  }

                                  setRecurringDuration(Math.min(365, Math.max(1, parsedValue)))
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-2">Start date:</label>
                              <input
                                type="date"
                                value={recurringStartDate}
                                onChange={(e) => setRecurringStartDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                    disabled={!canGenerateSlots}
                    className={`px-6 py-2.5 rounded-full transition font-semibold text-sm flex items-center gap-2 ${
                      canGenerateSlots
                        ? 'bg-primary text-white hover:opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiCheck className="h-4 w-4" /> Generate Slots
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-7 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Select Date to View</label>
              <input
                type="date"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-bold mb-3 text-gray-700">Schedule Preview</p>

              {courts.length === 0 || viewSlots.filter(s => {
                const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                return slotDate === viewDate
              }).length === 0 ? (
                <div className="text-center py-12 bg-gray-100 rounded-2xl">
                  <p className="text-gray-500 font-semibold">No slots available for {viewDate}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className="gap-2 p-6 rounded-2xl"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`,
                      backgroundColor: '#f6f6f6'
                    }}
                  >
                    <div></div>

                    {courts.map(court => (
                      <div
                        key={court.id}
                        className="h-10 flex items-center justify-center font-bold text-[10px] sm:text-xs"
                      >
                        {court.name}
                      </div>
                    ))}

                    {Array.from(
                      new Set(
                        viewSlots
                          .filter(s => {
                            const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                            return slotDate === viewDate
                          })
                          .map(s => {
                            const date = new Date(s.start_time)
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            return `${hours}:${minutes}`
                          })
                      )
                    )
                      .sort()
                      .map(time => (
                        <React.Fragment key={time}>
                          <div className="h-12 sm:h-14 flex items-center text-[9px] sm:text-[11px] font-semibold leading-none">
                            {time} - {String(parseInt(time.split(':')[0], 10) + 1).padStart(2, '0')}:00
                          </div>

                          {courts.map(court => {
                            const slot = viewSlots.find(s => {
                              const slotDate = new Date(s.start_time).toISOString().split('T')[0]
                              const date = new Date(s.start_time)
                              const hours = String(date.getHours()).padStart(2, '0')
                              const minutes = String(date.getMinutes()).padStart(2, '0')
                              const slotTime = `${hours}:${minutes}`
                              return slotDate === viewDate && slotTime === time && s.court_id === court.id
                            })

                            if (!slot) {
                              return <div key={`${court.id}-${time}`}></div>
                            }

                            const isBooked = slot.is_booked === 1

                            return (
                              <div
                                key={`slot-${slot.id}`}
                                className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center transition p-2 text-center ${
                                  isBooked
                                    ? 'bg-gray-300 text-gray-500 border-gray-300'
                                    : 'bg-white text-gray-700 border-gray-300'
                                }`}
                              >
                                {isBooked ? (
                                  <span className="text-[9px] sm:text-[10px] font-semibold">Unavailable</span>
                                ) : (
                                  <>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-primary">
                                      Rp {parseInt(slot.price, 10).toLocaleString()}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] text-green-700 font-semibold">
                                      Available
                                    </span>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* LOADING OVERLAY FOR SLOT GENERATION */}
      <LoadingOverlay show={slotsLoading} />

      <ConfirmationModal
        isOpen={courtToDelete !== null}
        onClose={closeDeleteCourtModal}
        onConfirm={handleDeleteCourt}
        actionText="delete this court"
        isProcessing={isDeleteProcessing}
      />
    </div>
  )
}

export default AdminManageSlot