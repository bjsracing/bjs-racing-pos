import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";

function DebtPaymentModal({ isOpen, onClose, customer }) {
  const [unpaidTransactions, setUnpaidTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const fetchUnpaidTransactions = async () => {
    if (!customer) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("status_pembayaran", "Belum Lunas");

    if (error) {
      console.error("Error fetching unpaid transactions:", error);
    } else {
      setUnpaidTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnpaidTransactions();
    }
  }, [isOpen, customer]);

  const handlePayment = async (transaction) => {
    const paymentAmount = Number(paymentAmounts[transaction.id]) || 0;
    if (paymentAmount <= 0 || paymentAmount > transaction.sisa_hutang) {
      alert("Jumlah pembayaran tidak valid.");
      return;
    }

    const newRemainingDebt = transaction.sisa_hutang - paymentAmount;
    const newStatus = newRemainingDebt <= 0 ? "Lunas" : "Belum Lunas";

    const { error } = await supabase
      .from("transactions")
      .update({
        sisa_hutang: newRemainingDebt,
        status_pembayaran: newStatus,
        bayar: transaction.bayar + paymentAmount, // Tambahkan pembayaran baru ke total bayar
      })
      .eq("id", transaction.id);

    if (error) {
      alert("Gagal menyimpan pembayaran: " + error.message);
    } else {
      alert("Pembayaran berhasil dicatat!");
      // Refresh daftar hutang di modal
      fetchUnpaidTransactions();
      setPaymentAmounts({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-2">Kelola Piutang</h2>
        <p className="text-lg font-semibold text-primary-700 mb-4">
          {customer?.nama_pelanggan}
        </p>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <p>Memuat...</p>
          ) : unpaidTransactions.length > 0 ? (
            <div className="space-y-4">
              {unpaidTransactions.map((trx) => (
                <div key={trx.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>
                      {new Date(trx.created_at).toLocaleDateString("id-ID")}
                    </span>
                    <span className="font-semibold">
                      Sisa Hutang: Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(trx.sisa_hutang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Jumlah Bayar"
                      className="w-full p-2 border rounded"
                      onChange={(e) =>
                        setPaymentAmounts((prev) => ({
                          ...prev,
                          [trx.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handlePayment(trx)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              Pelanggan ini tidak memiliki hutang.
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6 border-t pt-4">
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

export default DebtPaymentModal;
