import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

const Dashboard = () => {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: 'Bukalapang',
    businessNumber: '08123456789',
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

  const [editingLapanganId, setEditingLapanganId] = useState(null)
  const [selectedLapanganId, setSelectedLapanganId] = useState(
    lapangans[0]?.id ?? null
  )
  const [editingSlotId, setEditingSlotId] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  const selectedLapangan = useMemo(
    () => lapangans.find((l) => l.id === selectedLapanganId),
    [lapangans, selectedLapanganId]
  )

  const handleBusinessSubmit = (data) => {
    setBusinessInfo((prev) => ({ ...prev, ...data }))
  }

  const handleVerifyToggle = () => {
    setBusinessInfo((prev) => ({ ...prev, isVerified: !prev.isVerified }))
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
      setSelectedLapanganId(newLapangan.id)
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
    if (selectedLapanganId === id) {
      setSelectedLapanganId(lapangans[0]?.id ?? null)
    }
    if (editingLapanganId === id) {
      setEditingLapanganId(null)
      reset()
    }
  }

  const handleSlotSubmit = (data) => {
    if (!selectedLapangan) return

    const slotPayload = {
      id: editingSlotId ?? Date.now(),
      startTime: data.startTime,
      endTime: data.endTime,
      isBooked: data.isBooked === 'true',
    }

    setLapangans((prev) =>
      prev.map((lap) => {
        if (lap.id !== selectedLapangan.id) return lap
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
    if (!selectedLapangan) return
    setLapangans((prev) =>
      prev.map((lap) =>
        lap.id !== selectedLapangan.id
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
    if (!selectedLapangan) return
    setLapangans((prev) =>
      prev.map((lap) => {
        if (lap.id !== selectedLapangan.id) return lap
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

  return (
    <div className="w-full min-h-screen py-10">
      <h1 className="text-4xl font-bold mb-6">Admin Lapangan Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-3 mb-10">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold mb-3">Bisnis</h2>
          <form
            onSubmit={handleSubmit(handleBusinessSubmit)}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium">Nama Bisnis</label>
              <input
                defaultValue={businessInfo.businessName}
                {...register('businessName', {
                  required: 'Nama bisnis wajib diisi',
                })}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
              {errors.businessName && (
                <p className="text-red-500 text-sm">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Nomor Bisnis
              </label>
              <input
                defaultValue={businessInfo.businessNumber}
                {...register('businessNumber', {
                  required: 'Nomor bisnis wajib diisi',
                })}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
              {errors.businessNumber && (
                <p className="text-red-500 text-sm">
                  {errors.businessNumber.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-white"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={handleVerifyToggle}
                className={
                  'rounded px-4 py-2 text-white ' +
                  (businessInfo.isVerified
                    ? 'bg-green-600'
                    : 'bg-orange-600')
                }
              >
                {businessInfo.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold mb-3">Statistik</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Total Lapangan</span>
              <span className="font-semibold">{stats.totalFields}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Slot</span>
              <span className="font-semibold">{stats.totalSlots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Slot Terbooking</span>
              <span className="font-semibold">{stats.bookedSlots}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold mb-3">Aksi Cepat</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setEditingLapanganId(null)
                reset({ tipeOlahraga: '', alamat: '', biayaPerJam: '' })
                setSelectedLapanganId(null)
              }}
              className="w-full rounded border px-4 py-2 text-left"
            >
              Buat Lapangan Baru
            </button>
            <button
              onClick={() => selectedLapanganId && setSelectedLapanganId(null)}
              className="w-full rounded border px-4 py-2 text-left"
            >
              Buka Jadwal Lapangan
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold mb-4">Kelola Lapangan</h2>

          <form
            onSubmit={handleSubmit(handleLapanganSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium">
                Tipe Olahraga
              </label>
              <input
                {...register('tipeOlahraga', {
                  required: 'Tipe olahraga wajib diisi',
                })}
                className="mt-1 block w-full rounded border px-3 py-2"
                placeholder="Futsal / Basket / Tennis"
              />
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
                className="mt-1 block w-full rounded border px-3 py-2"
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
                className="mt-1 block w-full rounded border px-3 py-2"
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
                className="rounded bg-primary px-4 py-2 text-white"
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
            <div className="space-y-2">
              {lapangans.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Belum ada lapangan. Tambahkan lapangan terlebih dahulu.
                </p>
              ) : (
                lapangans.map((lap) => (
                  <div
                    key={lap.id}
                    className={
                      'rounded border p-3 flex flex-col gap-2 ' +
                      (lap.id === selectedLapanganId
                        ? 'bg-primary/10 border-primary'
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
                          onClick={() => {
                            setSelectedLapanganId(lap.id)
                            setEditingLapanganId(null)
                            reset({
                              tipeOlahraga: '',
                              alamat: '',
                              biayaPerJam: '',
                            })
                          }}
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

        <div className="rounded-lg border p-5">
          <h2 className="text-xl font-semibold mb-4">Kelola Jadwal</h2>

          {!selectedLapangan ? (
            <p className="text-sm text-gray-600">
              Pilih lapangan untuk mengelola jadwalnya.
            </p>
          ) : (
            <>
              <div className="mb-4 rounded bg-gray-50 p-4">
                <p className="font-semibold">{selectedLapangan.tipeOlahraga}</p>
                <p className="text-sm text-gray-600">{selectedLapangan.alamat}</p>
                <p className="text-sm">
                  Harga per jam: Rp {selectedLapangan.biayaPerJam}
                </p>
              </div>

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
                      className="mt-1 block w-full rounded border px-3 py-2"
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
                      className="mt-1 block w-full rounded border px-3 py-2"
                    />
                    {errors.endTime && (
                      <p className="text-red-500 text-sm">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Status Booking
                    </label>
                    <select
                      {...register('isBooked')}
                      className="mt-1 block w-full rounded border px-3 py-2"
                    >
                      <option value="false">Tersedia</option>
                      <option value="true">Terbooking</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-white"
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
                {selectedLapangan.slots.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Tidak ada slot. Tambahkan slot untuk mulai menerima pemesanan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedLapangan.slots.map((slot) => (
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
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
