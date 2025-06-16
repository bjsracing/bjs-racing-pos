// Baris 'import IntlNumberFormat...' yang error sudah dihapus

function TransactionDetailModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Detail Transaksi</h2>
        <p className="text-sm text-slate-500 mb-4">
          Tanggal:{" "}
          {new Date(transaction.created_at).toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>

        <div className="max-h-60 overflow-y-auto border-t border-b py-2">
          <h3 className="font-semibold mb-2">Item yang Terjual:</h3>
          {transaction.items &&
            transaction.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center mb-1 text-sm"
              >
                <span>
                  {item.nama}{" "}
                  <span className="text-slate-500">x{item.quantity}</span>
                </span>
                {/* Penggunaan new Intl.NumberFormat yang benar */}
                <span>
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    item.harga_jual * item.quantity,
                  )}
                </span>
              </div>
            ))}
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>
              Rp {new Intl.NumberFormat("id-ID").format(transaction.total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Diskon</span>
            <span className="text-red-500">
              - Rp {new Intl.NumberFormat("id-ID").format(transaction.diskon)}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Akhir</span>
            <span>
              Rp{" "}
              {new Intl.NumberFormat("id-ID").format(transaction.total_akhir)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bayar</span>
            <span>
              Rp {new Intl.NumberFormat("id-ID").format(transaction.bayar)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kembalian</span>
            <span>
              Rp {new Intl.NumberFormat("id-ID").format(transaction.kembalian)}
            </span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailModal;
