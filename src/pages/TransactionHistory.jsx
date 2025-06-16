import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import TransactionDetailModal from "../components/TransactionDetailModal.jsx"; // Import modal

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    async function getTransactions() {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
      } else {
        setTransactions(data);
      }
      setLoading(false);
    }
    getTransactions();
  }, []);

  if (loading) return <p>Memuat data...</p>;

  // GANTI SELURUH BLOK 'return' ANDA DENGAN INI:
  return (
    <div>
      <TransactionDetailModal
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
      </div>

      {loading && <p className="text-center">Memuat data...</p>}
      {!loading && transactions.length === 0 && (
        <div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-md">
          Belum ada riwayat transaksi.
        </div>
      )}

      {/* Tampilan Tabel untuk Desktop */}
      {!loading && transactions.length > 0 && (
        <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-slate-200">
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total Akhir
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {new Date(trx.created_at).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm font-semibold">
                    Rp {new Intl.NumberFormat("id-ID").format(trx.total_akhir)}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    <span
                      className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${trx.status_pembayaran === "Lunas" ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"}`}
                    >
                      {trx.status_pembayaran}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                    <button
                      onClick={() => setSelectedTransaction(trx)}
                      className="text-blue-500 hover:underline"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tampilan Kartu untuk Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {!loading &&
          transactions.map((trx) => (
            <div key={trx.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">
                    Rp {new Intl.NumberFormat("id-ID").format(trx.total_akhir)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(trx.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${trx.status_pembayaran === "Lunas" ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"}`}
                >
                  {trx.status_pembayaran}
                </span>
              </div>
              <div className="mt-4 text-right border-t pt-2">
                <button
                  onClick={() => setSelectedTransaction(trx)}
                  className="text-sm text-blue-500 hover:underline font-semibold"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default TransactionHistory;
