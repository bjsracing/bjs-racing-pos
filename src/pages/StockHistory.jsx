import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { FiSearch } from "react-icons/fi";

function StockHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function getLogs() {
      setLoading(true);

      // Membangun query dasar
      let query = supabase
        .from("stock_logs")
        .select("*, products(kode, nama)") // <-- Tetap ambil data produk terkait
        .order("created_at", { ascending: false });

      // --- PERBAIKAN UTAMA DI SINI ---
      // Jika ada pencarian, kita akan memfilter ID produk terlebih dahulu
      if (searchTerm.trim() !== "") {
        // 1. Cari ID produk yang cocok dengan pencarian
        const { data: productIds, error: productError } = await supabase
          .from("products")
          .select("id")
          .or(`nama.ilike.%${searchTerm}%,kode.ilike.%${searchTerm}%`);

        if (productError) {
          console.error(productError);
        } else {
          // Ambil hanya array dari ID-nya
          const ids = productIds.map((p) => p.id);
          // 2. Filter tabel stock_logs dimana product_id ada di dalam daftar ID yang kita temukan
          if (ids.length > 0) {
            query = query.in("product_id", ids);
          } else {
            // Jika tidak ada produk yang cocok, pastikan hasilnya kosong
            query = query.eq(
              "product_id",
              "00000000-0000-0000-0000-000000000000",
            ); // ID palsu
          }
        }
      }

      // Eksekusi query final
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching stock logs:", error);
      } else {
        setLogs(data);
      }
      setLoading(false);
    }

    // Debounce tetap digunakan
    const delayDebounceFn = setTimeout(() => {
      getLogs();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // GANTI SELURUH BLOK 'return' ANDA DENGAN INI:
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Riwayat Stok</h1>

      <div className="relative mb-4">
        <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau kode produk..."
          className="w-full md:w-1/3 p-2 pl-10 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p className="text-center">Memuat data...</p>}
      {!loading && logs.length === 0 && (
        <div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-md">
          Tidak ada riwayat stok yang cocok.
        </div>
      )}

      {/* Tampilan Tabel untuk Desktop */}
      {!loading && logs.length > 0 && (
        <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-slate-200">
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Perubahan
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    <p className="font-semibold">
                      {log.products?.nama || "Produk Dihapus"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.products?.kode || "N/A"}
                    </p>
                  </td>
                  <td
                    className={`px-5 py-4 border-b border-slate-200 text-sm text-center font-bold ${log.perubahan > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {log.perubahan > 0 ? `+${log.perubahan}` : log.perubahan}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {log.keterangan}
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
          logs.map((log) => (
            <div
              key={log.id}
              className={`bg-white p-4 rounded-lg shadow border-l-4 ${log.perubahan > 0 ? "border-green-500" : "border-red-500"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">
                    {log.products?.nama || "Produk Dihapus"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.products?.kode || "N/A"}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {log.keterangan}
                  </p>
                </div>
                <span
                  className={`text-lg font-bold ${log.perubahan > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {log.perubahan > 0 ? `+${log.perubahan}` : log.perubahan}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right border-t pt-1">
                {new Date(log.created_at).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default StockHistory;
