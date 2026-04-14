import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { FiX, FiCheck, FiTrash2, FiBarChart2, FiGrid, FiCalendar, FiCreditCard, FiUser } from 'react-icons/fi'
import { FaChevronLeft } from 'react-icons/fa'
import LoadingOverlay from '../components/LoadingOverlay'
import ConfirmationModal from './ConfirmationModal'
import DisableSlotsModal from './DisableSlotsModal'
import SuccessMessage from '../components/SuccessMessage'
import Sidebar from '../components/Sidebar'
import { apiUrl } from '../config/api'

const getLocalToday = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysToLocalDateString = (dateString, daysToAdd) => {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''

  date.setDate(date.getDate() + daysToAdd)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSlotDate = (dateTimeValue) => String(dateTimeValue || '').slice(0, 10)
const getSlotTime = (dateTimeValue) => String(dateTimeValue || '').slice(11, 16)

const AdminManageSlotContent = ({ field, adminId, onClose, embedded = false }) => {
  const maxGenerateDays = 120
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
  const [recurringStartDate, setRecurringStartDate] = useState(getLocalToday)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideOpenTime, setOverrideOpenTime] = useState('')
  const [overrideCloseTime, setOverrideCloseTime] = useState('')
  const [overridePrice, setOverridePrice] = useState('')
  const [overrideList, setOverrideList] = useState([])
  const [viewSlotsForCourt, setViewSlotsForCourt] = useState(null)
  const [viewDate, setViewDate] = useState(getLocalToday)
  const [viewSlots, setViewSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [isDisablingSlots, setIsDisablingSlots] = useState(false)
  const [selectedSlotIds, setSelectedSlotIds] = useState([])
  const [slotsToDisable, setSlotsToDisable] = useState(null)
  const [slotsToEditPrice, setSlotsToEditPrice] = useState(null)
  const [editPriceValue, setEditPriceValue] = useState('')
  const [isEditingSlotPrice, setIsEditingSlotPrice] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [courtToDelete, setCourtToDelete] = useState(null)
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false)
  const [isClearSlotsModalOpen, setIsClearSlotsModalOpen] = useState(false)
  const [clearStartDate, setClearStartDate] = useState('')
  const [clearEndDate, setClearEndDate] = useState('')
  const [isClearingSlots, setIsClearingSlots] = useState(false)

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

  useEffect(() => {
    // Keep selection in sync when date/filter data changes.
    const visibleSlotIds = new Set(
      viewSlots
        .filter((slot) => getSlotDate(slot.start_time) === viewDate)
        .map((slot) => slot.id)
    )

    setSelectedSlotIds((prev) => prev.filter((slotId) => visibleSlotIds.has(slotId)))
  }, [viewDate, viewSlots])

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
    const today = getLocalToday()

    if (!Number.isInteger(recurringDuration) || recurringDuration < 1) {
      showErrorMessage('Please fill a valid duration')
      return
    }

    if (recurringDuration > maxGenerateDays) {
      showErrorMessage(`Duration cannot be more than ${maxGenerateDays} days`)
      return
    }

    if (!recurringStartDate) {
      showErrorMessage('Please select start date')
      return
    }

    if (recurringStartDate < today) {
      showErrorMessage('Start date must be today or later')
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
          setRecurringStartDate(getLocalToday())
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

  const openClearSlotsModal = () => {
    const minAllowedDate = addDaysToLocalDateString(getLocalToday(), 8)
    setClearStartDate(minAllowedDate)
    setClearEndDate(minAllowedDate)
    setIsClearSlotsModalOpen(true)
  }

  const closeClearSlotsModal = () => {
    if (isClearingSlots) return
    setIsClearSlotsModalOpen(false)
  }

  const handleConfirmClearSlots = async () => {
    if (!clearStartDate || !clearEndDate) {
      showErrorMessage('Please select both start and end dates')
      return
    }

    if (clearEndDate < clearStartDate) {
      showErrorMessage('End date must be on or after start date')
      return
    }

    const minAllowedDate = addDaysToLocalDateString(getLocalToday(), 8)
    if (clearStartDate < minAllowedDate || clearEndDate < minAllowedDate) {
      showErrorMessage(`Clear slots can only be done from ${minAllowedDate} onward`)
      return
    }

    try {
      setIsClearingSlots(true)
      const response = await fetch(apiUrl(`/field/${field.id}/slots/clear-range`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          startDate: clearStartDate,
          endDate: clearEndDate
        })
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessMessage(`Cleared ${result.deletedCount || 0} slot${result.deletedCount === 1 ? '' : 's'} (${result.keptBookedCount || 0} booked kept)`)
        setIsClearSlotsModalOpen(false)
        await fetchSlotsOnly()
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to clear slots')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    } finally {
      setIsClearingSlots(false)
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
    const today = getLocalToday()
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

  const handleToggleSlotSelection = (slot) => {
    if (!slot || slot.is_booked === 1) return

    setSelectedSlotIds((prev) => {
      if (prev.includes(slot.id)) {
        return prev.filter((id) => id !== slot.id)
      }
      return [...prev, slot.id]
    })
  }

  const handleSelectAllSlots = () => {
    const selectableIds = viewSlots
      .filter((slot) => getSlotDate(slot.start_time) === viewDate && slot.is_booked !== 1)
      .map((slot) => slot.id)

    // Toggle: if all are already selected, deselect all; otherwise select all
    if (selectedSlotIds.length === selectableIds.length && selectedSlotIds.length > 0) {
      setSelectedSlotIds([])
    } else {
      setSelectedSlotIds(selectableIds)
    }
  }

  const handleDisableSelectedSlots = () => {
    if (selectedSlotIds.length === 0) return
    setSlotsToDisable(selectedSlotIds)
  }

  const handleOpenEditPriceModal = () => {
    if (selectedSlotIds.length === 0) return

    const firstSelectedSlot = viewSlots.find((slot) => slot.id === selectedSlotIds[0])
    const initialPrice = firstSelectedSlot?.price !== undefined ? String(parseInt(firstSelectedSlot.price, 10)) : ''

    setEditPriceValue(initialPrice)
    setSlotsToEditPrice(selectedSlotIds)
  }

  const closeEditPriceModal = () => {
    if (isEditingSlotPrice) return
    setSlotsToEditPrice(null)
    setEditPriceValue('')
  }

  const handleConfirmEditPrice = async () => {
    if (!slotsToEditPrice || slotsToEditPrice.length === 0) return

    const parsedPrice = parseFloat(editPriceValue)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showErrorMessage('Please enter a valid price')
      return
    }

    try {
      setIsEditingSlotPrice(true)
      const response = await fetch(apiUrl(`/field/${field.id}/slots/update-price`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          slotIds: slotsToEditPrice,
          newPrice: parsedPrice
        })
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessMessage(`Updated price for ${result.updatedCount || 0} slot${result.updatedCount === 1 ? '' : 's'}`)
        setSelectedSlotIds([])
        setSlotsToEditPrice(null)
        setEditPriceValue('')
        await fetchSlotsOnly()
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to update slot prices')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    } finally {
      setIsEditingSlotPrice(false)
    }
  }

  const closeDisableConfirmModal = () => {
    if (isDisablingSlots) return
    setSlotsToDisable(null)
  }

  const handleConfirmDisableSlots = async () => {
    if (!slotsToDisable || slotsToDisable.length === 0) return

    try {
      setIsDisablingSlots(true)
      const response = await fetch(apiUrl(`/field/${field.id}/slots/disable`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          slotIds: slotsToDisable
        })
      })

      if (response.ok) {
        showSuccessMessage('Selected slots disabled')
        setSelectedSlotIds([])
        setSlotsToDisable(null)
        await fetchSlotsOnly()
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.error || 'Failed to disable slots')
      }
    } catch (err) {
      showErrorMessage('Cannot connect to server')
    } finally {
      setIsDisablingSlots(false)
    }
  }

  const hasValidStartDate = Boolean(recurringStartDate)
  const hasValidDuration = Number.isInteger(recurringDuration) && recurringDuration > 0 && recurringDuration <= maxGenerateDays
  const canGenerateSlots = hasValidStartDate && hasValidDuration
  const selectedDateSlots = viewSlots.filter((slot) => getSlotDate(slot.start_time) === viewDate)
  const timeSlots = Array.from(new Set(selectedDateSlots.map((slot) => getSlotTime(slot.start_time)))).sort()
  const selectableSlotCount = selectedDateSlots.filter((slot) => slot.is_booked !== 1).length
  const hasSelectedSlots = selectedSlotIds.length > 0

  if (!field) return null

  return (
    <div className={embedded ? 'w-full' : 'fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50'}>
      <SuccessMessage
        message={success?.message}
        triggerKey={success?.id}
        onClose={() => setSuccess(null)}
      />
      <div className={embedded ? 'w-full min-h-[75vh] overflow-y-auto' : 'bg-white rounded-2xl shadow-lg p-8 max-w-[96vw] w-full mx-4 min-h-[75vh] max-h-[92vh] overflow-y-auto'}>
        {embedded ? (
          <div className="mb-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 uppercase hover:text-black"
            >
              <FaChevronLeft /> Back
            </button>
            <h2 className="text-2xl font-bold">Manage Courts: {field.name}</h2>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Manage Courts: {field.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiX className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        )}

        <div className={embedded ? 'bg-white rounded-2xl shadow-lg p-8 min-h-[75vh] overflow-y-auto' : ''}>

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
                <div className="rounded-2xl p-6 border border-gray-200 bg-white">
                  <p className="text-sm font-bold mb-4 text-gray-800">Add New Court</p>
                  <div className="flex gap-3">
                    <input
                      placeholder="e.g., Court A, Lapangan 1"
                      value={newCourtName}
                      onChange={(e) => setNewCourtName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCourt()
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />
                    <button
                      onClick={handleAddCourt}
                      className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:opacity-90 transition font-semibold text-sm shrink-0"
                    >
                      <span className="text-white font-black text-base leading-none">+</span> Add
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

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-300">
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
                        <span>Generate once:</span>
                      </label>
                      {recurrenceType === 'specific' && (
                        <input
                          type="date"
                          value={recurringStartDate}
                          min={getLocalToday()}
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
                                max={maxGenerateDays}
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

                                  setRecurringDuration(Math.min(maxGenerateDays, Math.max(1, parsedValue)))
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-2">Start date:</label>
                              <input
                                type="date"
                                value={recurringStartDate}
                                min={getLocalToday()}
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
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
                <button
                  type="button"
                  onClick={openClearSlotsModal}
                  className="px-5 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition font-semibold text-sm whitespace-nowrap"
                >
                  Clear Slots
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold mb-3 text-gray-700">Schedule Preview</p>

              {courts.length === 0 || selectedDateSlots.length === 0 ? (
                <div className="text-center py-12 bg-gray-100 rounded-2xl">
                  <p className="text-gray-500 font-semibold">No slots available for {viewDate}</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSlots}
                      disabled={selectableSlotCount === 0}
                      className={`h-10 w-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition ${
                        selectableSlotCount === 0
                          ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                          : selectedSlotIds.length === selectableSlotCount && selectableSlotCount > 0
                          ? 'bg-primary text-white border-primary hover:bg-primary/90'
                          : 'border-primary bg-white text-primary hover:bg-primary/5'
                      }`}
                      title="Select all slots"
                      aria-label="Select all slots"
                    >
                      All
                    </button>

                    {hasSelectedSlots && (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenEditPriceModal}
                          className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition"
                          title="Edit selected slots"
                          aria-label="Edit selected slots"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-5 w-5 relative left-px"
                          >
                            <path
                              d="M12 20h9"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleDisableSelectedSlots}
                          disabled={isDisablingSlots}
                          className={`h-10 w-10 rounded-lg text-white flex items-center justify-center transition ${
                            isDisablingSlots ? 'bg-primary/40 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                          }`}
                          title="Disable selected slots"
                          aria-label="Disable selected slots"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-5 w-5"
                          >
                            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" />
                            <path
                              d="M8.5 15.5l7-7"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
                  <div
                    className="gap-2 p-6 rounded-2xl bg-white"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`
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

                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                          <div className="h-12 sm:h-14 flex items-center text-[9px] sm:text-[11px] font-semibold leading-none">
                            {time} - {String(parseInt(time.split(':')[0], 10) + 1).padStart(2, '0')}:00
                          </div>

                          {courts.map(court => {
                            const slot = viewSlots.find(s => {
                              const slotDate = getSlotDate(s.start_time)
                              const slotTime = getSlotTime(s.start_time)
                              return slotDate === viewDate && slotTime === time && s.court_id === court.id
                            })

                            if (!slot) {
                              return <div key={`${court.id}-${time}`}></div>
                            }

                            const isBooked = slot.is_booked === 1
                            const isSelected = selectedSlotIds.includes(slot.id)

                            return (
                              <button
                                type="button"
                                key={`slot-${slot.id}`}
                                onClick={() => handleToggleSlotSelection(slot)}
                                disabled={isBooked}
                                className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center transition p-2 text-center ${
                                  isBooked
                                    ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                }`}
                              >
                                {isBooked ? (
                                  <span className="text-[9px] sm:text-[10px] font-semibold">Unavailable</span>
                                ) : isSelected ? (
                                  <span className="text-[9px] sm:text-[10px] font-bold">Selected</span>
                                ) : (
                                  <>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-primary">
                                      Rp {parseInt(slot.price, 10).toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </button>
                            )
                          })}
                        </React.Fragment>
                      ))}
                  </div>
                </div>
                </>
              )}
            </div>
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

      <DisableSlotsModal
        isOpen={slotsToDisable !== null}
        onClose={closeDisableConfirmModal}
        onConfirm={handleConfirmDisableSlots}
        slotCount={slotsToDisable?.length || 0}
        isProcessing={isDisablingSlots}
      />

      {slotsToEditPrice !== null && (
        <div className="fixed inset-0 z-60 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900">Edit Slot Price</h3>
            <p className="mt-2 text-sm text-gray-600">Set one price for {slotsToEditPrice.length} selected slot{slotsToEditPrice.length !== 1 ? 's' : ''}.</p>

            <div className="mt-5">
              <label className="block text-sm font-semibold mb-2 text-gray-700">New price</label>
              <div className="w-full flex items-center gap-2">
                <span className="font-bold text-gray-700">Rp</span>
                <input
                  type="number"
                  min="1"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleConfirmEditPrice()
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditPriceModal}
                disabled={isEditingSlotPrice}
                className="px-4 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEditPrice}
                disabled={isEditingSlotPrice}
                className="px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
              >
                {isEditingSlotPrice ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearSlotsModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900">Clear Slots by Date Range</h3>
            <p className="mt-2 text-sm text-gray-600">This removes only unbooked slots and keeps booked slots on schedule.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Start date</label>
                <input
                  type="date"
                  value={clearStartDate}
                  min={addDaysToLocalDateString(getLocalToday(), 8)}
                  onChange={(e) => setClearStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">End date</label>
                <input
                  type="date"
                  value={clearEndDate}
                  min={clearStartDate || addDaysToLocalDateString(getLocalToday(), 8)}
                  onChange={(e) => setClearEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <p className="text-xs text-gray-500">Clear slots is blocked for dates in the next 7 days, including today.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeClearSlotsModal}
                disabled={isClearingSlots}
                className="px-4 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearSlots}
                disabled={isClearingSlots}
                className="px-4 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {isClearingSlots ? 'Clearing...' : 'Clear Slots'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const AdminManageSlot = ({ field, adminId, onClose, embedded = false }) => {
  const hasDirectProps = Boolean(field && adminId)
  const navigate = useNavigate()
  const { fieldId } = useParams()

  const [routeAdminId, setRouteAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [routeField, setRouteField] = useState(null)
  const [routeLoading, setRouteLoading] = useState(true)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    if (hasDirectProps) return

    const adminCookie = Cookies.get('admin_session')
    const adminSession = JSON.parse(localStorage.getItem('adminId') || 'null')

    if (!adminSession && !adminCookie) {
      navigate('/login')
      return
    }

    if (adminCookie) {
      const sessionData = JSON.parse(adminCookie)
      setRouteAdminId(sessionData.adminId)
      setAdminName(sessionData.adminName)
      setAdminEmail(sessionData.email)
      localStorage.setItem('adminId', sessionData.adminId)
    } else if (adminSession) {
      setRouteAdminId(adminSession)
    }
  }, [hasDirectProps, navigate])

  useEffect(() => {
    if (hasDirectProps || !routeAdminId || !fieldId) return

    const fetchField = async () => {
      try {
        setRouteLoading(true)
        const response = await fetch(apiUrl(`/fields/${routeAdminId}`))

        if (!response.ok) {
          setRouteError('Failed to fetch field')
          return
        }

        const fields = await response.json()
        const matchedField = fields.find((item) => String(item.id) === String(fieldId))

        if (!matchedField) {
          setRouteError('Field not found')
          return
        }

        setRouteField(matchedField)
        setRouteError('')
      } catch (err) {
        setRouteError('Cannot connect to server')
      } finally {
        setRouteLoading(false)
      }
    }

    fetchField()
  }, [hasDirectProps, routeAdminId, fieldId])

  const handleLogout = () => {
    localStorage.removeItem('adminId')
    Cookies.remove('admin_session')
    navigate('/login')
  }

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, path: '/dashboard' },
    { id: 'fields', label: 'Manage Fields', icon: FiGrid, path: '/field' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/booking' },
    { id: 'payment-qr', label: 'Payment QR', icon: FiCreditCard, path: '/admin/payment-qr' },
    { id: 'security-info', label: 'Security & Info', icon: FiUser, path: '/admin/security-info' },
  ]

  if (hasDirectProps) {
    return <AdminManageSlotContent field={field} adminId={adminId} onClose={onClose} embedded={embedded} />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      <Sidebar
        activeTabId="fields"
        adminName={adminName}
        adminEmail={adminEmail}
        handleLogout={handleLogout}
        tabItems={tabItems}
      />

      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        {routeLoading ? (
          <div className="text-center py-12 text-gray-500">Loading slot management...</div>
        ) : routeError ? (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
            {routeError}
          </div>
        ) : (
          <AdminManageSlotContent
            field={routeField}
            adminId={routeAdminId}
            onClose={() => navigate('/field')}
            embedded
          />
        )}
      </main>
    </div>
  )
}

export default AdminManageSlot