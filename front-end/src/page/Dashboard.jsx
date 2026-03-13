import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiBarChart2, FiBriefcase, FiGrid, FiLogOut } from 'react-icons/fi'

const Dashboard = () => {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: 'BusinessName',
    businessNumber: '08123456789',
    email: 'admin@bukalapang.com',
    address: 'Jl. Merdeka No. 1',
    isVerified: false,
  })

  const [lapangans, setLapangans] = useState([
    {
      id: 1,
      tipeOlahraga: 'Futsal',
      alamat: 'Jl. Merdeka No. 1',
      biayaPerJam: 120000,
      slots: [
        { id: 1, startTime: '08:00', endTime: '09:00', isBooked: false },
        { id: 2, startTime: '09:00', endTime: '10:00', isBooked: true },
      ],
    },
  ])

  const [activeTab, setActiveTab] = useState('stats')
  const [editingLapanganId, setEditingLapanganId] = useState(null)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [scheduleModalLapanganId, setScheduleModalLapanganId] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  const scheduleLapangan = useMemo(
    () => lapangans.find((l) => l.id === scheduleModalLapanganId),
    [lapangans, scheduleModalLapanganId]
  )

  const handleBusinessSubmit = (data) => {
    setBusinessInfo((prev) => ({ ...prev, ...data }))
  }

  const handleLapanganSubmit = (data) => {
    if (editingLapanganId) {
      setLapangans((prev) =>
        prev.map((lap) =>
          lap.id === editingLapanganId ? { ...lap, ...data } : lap
        )
      )
      setEditingLapanganId(null)
    } else {
      const newLapangan = {
        id: Date.now(),
        ...data,
        biayaPerJam: Number(data.biayaPerJam),
        slots: [],
      }
      setLapangans((prev) => [...prev, newLapangan])
    }

    reset()
  }

  const startEditLapangan = (lapangan) => {
    setEditingLapanganId(lapangan.id)
    setValue('tipeOlahraga', lapangan.tipeOlahraga)
    setValue('alamat', lapangan.alamat)
    setValue('biayaPerJam', lapangan.biayaPerJam)
  }

  const deleteLapangan = (id) => {
    setLapangans((prev) => prev.filter((l) => l.id !== id))
    if (scheduleModalLapanganId === id) {
      setScheduleModalLapanganId(null)
      setEditingSlotId(null)
      reset({ startTime: '', endTime: '', isBooked: 'false' })
    }
    if (editingLapanganId === id) {
      setEditingLapanganId(null)
      reset()
    }
  }

  const handleSlotSubmit = (data) => {
    if (!scheduleLapangan) return

    const slotPayload = {
      id: editingSlotId ?? Date.now(),
      startTime: data.startTime,
      endTime: data.endTime,
      isBooked: data.isBooked === 'true',
    }

    setLapangans((prev) =>
      prev.map((lap) => {
        if (lap.id !== scheduleLapangan.id) return lap
        const updatedSlots = editingSlotId
          ? lap.slots.map((s) => (s.id === editingSlotId ? slotPayload : s))
          : [...lap.slots, slotPayload]
        return { ...lap, slots: updatedSlots }
      })
    )

    setEditingSlotId(null)
    reset({ startTime: '', endTime: '', isBooked: 'false' })
  }

  const startEditSlot = (slot) => {
    setEditingSlotId(slot.id)
    setValue('startTime', slot.startTime)
    setValue('endTime', slot.endTime)
    setValue('isBooked', slot.isBooked ? 'true' : 'false')
  }

  const deleteSlot = (slotId) => {
    if (!scheduleLapangan) return
    setLapangans((prev) =>
      prev.map((lap) =>
        lap.id !== scheduleLapangan.id
          ? lap
          : { ...lap, slots: lap.slots.filter((s) => s.id !== slotId) }
      )
    )
    if (editingSlotId === slotId) {
      setEditingSlotId(null)
      reset({ startTime: '', endTime: '', isBooked: 'false' })
    }
  }

  const toggleSlotBooked = (slotId) => {
    if (!scheduleLapangan) return
    setLapangans((prev) =>
      prev.map((lap) => {
        if (lap.id !== scheduleLapangan.id) return lap
        return {
          ...lap,
          slots: lap.slots.map((s) =>
            s.id === slotId ? { ...s, isBooked: !s.isBooked } : s
          ),
        }
      })
    )
  }

  const stats = useMemo(() => {
    const totalFields = lapangans.length
    const totalSlots = lapangans.reduce((acc, lap) => acc + lap.slots.length, 0)
    const bookedSlots = lapangans.reduce(
      (acc, lap) => acc + lap.slots.filter((s) => s.isBooked).length,
      0
    )
    return { totalFields, totalSlots, bookedSlots }
  }, [lapangans])

  const tabItems = [
    { id: 'stats', label: 'Statistik', icon: FiBarChart2 },
    { id: 'business', label: 'Manage Business', icon: FiBriefcase },
    { id: 'fields', label: 'Manage Field', icon: FiGrid },
  ]

  const openScheduleModal = (lapanganId) => {
    setScheduleModalLapanganId(lapanganId)
    setEditingSlotId(null)
    reset({ startTime: '', endTime: '', isBooked: 'false' })
  }

  const closeScheduleModal = () => {
    setScheduleModalLapanganId(null)
    setEditingSlotId(null)
    reset({ startTime: '', endTime: '', isBooked: 'false' })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-64 min-h-screen bg-emerald-900 text-white flex flex-col">
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-lg font-semibold">LOGOMainYuk!</p>
              </div>
            </div>
          </div>

          <nav className="px-4 pb-8 space-y-1">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-6 pb-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/30 text-sm font-semibold text-white">
                {businessInfo.businessName
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold">{businessInfo.businessName}</p>
                <p className="text-xs text-emerald-200">Administrator</p>
              </div>
            </div>

            <button
              onClick={() => alert('Logout not implemented yet')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-white/15"
            >
              <FiLogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-10">
          {activeTab === 'stats' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Lapangan
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  {stats.totalFields}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Slot
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  {stats.totalSlots}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-6 py-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Slot Terbooking
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  {stats.bookedSlots}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Manage Business</h2>
              <form onSubmit={handleSubmit(handleBusinessSubmit)} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Nama Bisnis</label>
                    <input
                      defaultValue={businessInfo.businessName}
                      {...register('businessName', {
                        required: 'Nama bisnis wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-sm">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Nomor HP</label>
                    <input
                      defaultValue={businessInfo.businessNumber}
                      {...register('businessNumber', {
                        required: 'Nomor bisnis wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.businessNumber && (
                      <p className="text-red-500 text-sm">
                        {errors.businessNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      defaultValue={businessInfo.email}
                      {...register('email', {
                        required: 'Email wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Alamat</label>
                    <input
                      defaultValue={businessInfo.address}
                      {...register('address', {
                        required: 'Alamat wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700"
                  >
                    Simpan
                  </button>
                  <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    {businessInfo.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Kelola Lapangan</h2>
                <form
                  onSubmit={handleSubmit(handleLapanganSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium">Tipe Olahraga</label>
                    <select
                      {...register('tipeOlahraga', {
                        required: 'Tipe olahraga wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Pilih tipe olahraga
                      </option>
                      <option value="Futsal">Futsal</option>
                      <option value="Basket">Basket</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Volleyball">Volleyball</option>
                    </select>
                    {errors.tipeOlahraga && (
                      <p className="text-red-500 text-sm">
                        {errors.tipeOlahraga.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Alamat</label>
                    <input
                      {...register('alamat', {
                        required: 'Alamat wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                      placeholder="Jl. Contoh No. 10"
                    />
                    {errors.alamat && (
                      <p className="text-red-500 text-sm">
                        {errors.alamat.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Biaya per Jam (Rp)
                    </label>
                    <input
                      type="number"
                      {...register('biayaPerJam', {
                        required: 'Biaya per jam wajib diisi',
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                      placeholder="120000"
                    />
                    {errors.biayaPerJam && (
                      <p className="text-red-500 text-sm">
                        {errors.biayaPerJam.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                    >
                      {editingLapanganId ? 'Update Lapangan' : 'Simpan Lapangan'}
                    </button>
                    {editingLapanganId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLapanganId(null)
                          reset({ tipeOlahraga: '', alamat: '', biayaPerJam: '' })
                        }}
                        className="rounded border px-4 py-2"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Daftar Lapangan</h3>
                  <div className="space-y-3">
                    {lapangans.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        Belum ada lapangan. Tambahkan lapangan terlebih dahulu.
                      </p>
                    ) : (
                      lapangans.map((lap) => (
                        <div
                          key={lap.id}
                          className={
                            'rounded border p-4 flex flex-col gap-3 ' +
                            (lap.id === editingLapanganId
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white')
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{lap.tipeOlahraga}</p>
                              <p className="text-sm text-gray-600">{lap.alamat}</p>
                              <p className="text-sm">Rp {lap.biayaPerJam}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openScheduleModal(lap.id)}
                                className="rounded border px-3 py-1 text-sm"
                              >
                                Jadwal
                              </button>
                              <button
                                onClick={() => startEditLapangan(lap)}
                                className="rounded border px-3 py-1 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteLapangan(lap.id)}
                                className="rounded border px-3 py-1 text-sm text-red-600"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {scheduleModalLapanganId && scheduleLapangan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Kelola Jadwal — {scheduleLapangan.tipeOlahraga}
                </h3>
                <p className="text-sm text-slate-500">{scheduleLapangan.alamat}</p>
              </div>
              <button
                onClick={closeScheduleModal}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

            <div className="p-6">
              <form
                onSubmit={handleSubmit(handleSlotSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium">Start</label>
                    <input
                      type="time"
                      {...register('startTime', {
                        required: 'Waktu mulai wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.startTime && (
                      <p className="text-red-500 text-sm">
                        {errors.startTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">End</label>
                    <input
                      type="time"
                      {...register('endTime', {
                        required: 'Waktu selesai wajib diisi',
                      })}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {errors.endTime && (
                      <p className="text-red-500 text-sm">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Status Booking</label>
                    <select
                      {...register('isBooked')}
                      className="mt-1 block w-full rounded border border-slate-200 bg-white/80 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-opacity-50"
                    >
                      <option value="false">Tersedia</option>
                      <option value="true">Terbooking</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                  >
                    {editingSlotId ? 'Update Slot' : 'Tambah Slot'}
                  </button>
                  {editingSlotId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlotId(null)
                        reset({ startTime: '', endTime: '', isBooked: 'false' })
                      }}
                      className="rounded border px-4 py-2"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Daftar Slot</h3>
                {scheduleLapangan.slots.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Tidak ada slot. Tambahkan slot untuk mulai menerima pemesanan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scheduleLapangan.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex flex-col gap-2 rounded border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-sm text-gray-600">
                              {slot.isBooked ? 'Terbooking' : 'Tersedia'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleSlotBooked(slot.id)}
                              className="rounded border px-3 py-1 text-sm"
                            >
                              {slot.isBooked ? 'Batalkan' : 'Book'}
                            </button>
                            <button
                              onClick={() => startEditSlot(slot)}
                              className="rounded border px-3 py-1 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSlot(slot.id)}
                              className="rounded border px-3 py-1 text-sm text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
