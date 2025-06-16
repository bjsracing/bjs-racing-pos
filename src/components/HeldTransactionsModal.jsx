// src/components/HeldTransactionsModal.jsx

import { FiArrowRightCircle } from "react-icons/fi";

function HeldTransactionsModal({ isOpen, onClose, transactions, onResume }) {
  // Jangan render apapun jika modal tidak terbuka
  if (!isOpen) return null;

  return (
    // Latar belakang gelap transparan
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start pt-16 sm:pt-24 p-4"
      onClick={onClose}
    >
      {/* Kontainer Modal */}
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat diklik di dalam
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          Lanjutkan Transaksi Tertahan
        </h2>

        {/* Area Konten yang Bisa di-scroll */}
        <div className="flex-1 overflow-y-auto pr-2">
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((trx) => (
                <div
                  key={trx.id}
                  className="border rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-slate-50 transition-colors"
                >
                  {/* Info Transaksi */}
                  <div>
                    <p className="font-bold text-slate-800">
                      {trx.customer_data?.nama_pelanggan || "Pelanggan Umum"}
                    </p>
                    <div className="text-sm text-slate-500 mt-1 space-x-4">
                      <span>
                        Waktu:{" "}
                        {new Date(trx.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>{trx.cart_data.length} item</span>
                    </div>
                    {trx.notes && (
                      <p className="text-xs text-orange-600 italic mt-1 bg-orange-50 px-2 py-1 rounded">
                        Catatan: {trx.notes}
                      </p>
                    )}
                  </div>

                  {/* Tombol Lanjutkan */}
                  <button
                    onClick={() => onResume(trx)}
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-3 sm:mt-0 w-full sm:w-auto"
                  >
                    <span>Lanjutkan</span>
                    <FiArrowRightCircle />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              Tidak ada transaksi yang ditahan.
            </p>
          )}
        </div>

        {/* Tombol Tutup */}
        <div className="flex justify-end mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeldTransactionsModal;
