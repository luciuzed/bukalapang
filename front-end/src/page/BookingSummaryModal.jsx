import React, { useEffect, useState } from 'react'; // Added useState
import { FaCalendarAlt, FaClock, FaHashtag, FaTrashAlt, FaTimes, FaCheckCircle, FaCreditCard } from 'react-icons/fa';

const BookingSummaryModal = ({ 
  isOpen, 
  onClose, 
  field, 
  selectedDate, 
  selectedSlots, 
  pricePerSlot, 
  onRemove 
}) => {
  // 🔥 Track which step we are on: 1 = Summary, 2 = Confirmation/Processing
  const [step, setStep] = useState(1);

  // Reset to step 1 whenever the modal is closed/opened
  useEffect(() => {
    if (!isOpen) setStep(1);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const serviceFee = 1000;
  const subtotal = selectedSlots.length * pricePerSlot;
  const totalPayment = subtotal + serviceFee;

  // --- RENDERING STEP 2 (CONFIRMATION) ---
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center mb-4 text-primary">
            <FaCheckCircle size={60} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Konfirmasi Pesanan</h2>
          <p className="text-gray-500 text-sm mb-6">
            Apakah Anda yakin ingin memproses pesanan untuk <span className="font-bold text-gray-800">{selectedSlots.length} slot</span> ini?
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Bayar</span>
              <span className="font-bold text-primary text-lg">Rp {totalPayment.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => alert("Redirecting to Gateway...")} 
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg cursor-pointer shadow-red-100 hover:opacity-90 transition-all"
            >
              Bayar Sekarang
            </button>
            <button 
              onClick={() => setStep(1)} 
              className="w-full py-3 text-gray-400 font-bold cursor-pointer hover:text-gray-600 transition-colors"
            >
              Cek Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING STEP 1 (SUMMARY) ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Ringkasan Pemesanan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors cursor-pointer">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-4">Pesanan</p>
            <div className="max-h-48 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {selectedSlots.length > 0 ? (
                selectedSlots.map((slot, index) => {
                  const [court, time] = slot.split('-');
                  return (
                    <div key={index} className="flex justify-between items-start animate-in slide-in-from-bottom-2">
                      <div className="flex gap-3">
                        <div className="bg-gray-800 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0">1x</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{field.title}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-gray-400 text-[11px]">
                            <span className="flex items-center gap-1"><FaCalendarAlt /> {selectedDate}</span>
                            <span className="flex items-center gap-1"><FaClock /> {time}</span>
                            <span className="flex items-center gap-1"><FaHashtag /> {court}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="text-sm font-bold text-primary">Rp {pricePerSlot.toLocaleString()}</p>
                        <button onClick={() => onRemove(slot)} className="text-gray-300 hover:text-red-500 cursor-pointer"><FaTrashAlt size={14} /></button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400 py-4 text-sm italic">Belum ada slot terpilih</p>
              )}
            </div>
            <button onClick={onClose} className="mt-4 px-4 py-2 border border-primary text-primary rounded-full cursor-pointer text-xs font-bold hover:bg-primary hover:text-white transition-colors">
              + Tambah Tiket
            </button>
          </div>  

          <div className="pt-4 border-t border-dashed space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-400">
              <span>Biaya Pemesanan</span>
              <span className="text-gray-800">Rp {serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-800">Total Pembayaran</span>
              <span className="text-xl font-black text-primary">Rp {totalPayment.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-3 border border-primary text-primary rounded-xl font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors">
              Kembali
            </button>
            <button 
              onClick={() => setStep(2)} // 🔥 Move to step 2
              disabled={selectedSlots.length === 0}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 shadow-lg cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummaryModal;