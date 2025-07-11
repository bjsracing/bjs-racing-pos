import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";

function LaporanProdukTerlaris() {
  const location = useLocation();
  const { dateRange } = location.state || {};
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Ambil transaksi pada rentang tanggal
      const { data: transactions, error: trxError } = await supabase
        .from("transactions")
        .select("items")
        .gte("created_at", new Date(startDate).toISOString())
        .lte("created_at", new Date(endDate).toISOString());
      if (trxError) throw trxError;

      // 2. Agregasi data penjualan dari JSON
      const salesMap = new Map();
      transactions.forEach((trx) => {
        if (Array.isArray(trx.items)) {
          trx.items.forEach((item) => {
            if (!salesMap.has(item.id)) {
              salesMap.set(item.id, { ...item, total_terjual: 0 });
            }
            salesMap.get(item.id).total_terjual += item.quantity;
          });
        }
      });

      const productIds = Array.from(salesMap.keys());
      if (productIds.length === 0) {
        setReportData([]);
        setLoading(false);
        return;
      }

      // 3. Ambil data produk dan supplier terkait
      const { data: productsData, error: prdError } = await supabase
        .from("products")
        .select("id, stok, stok_min, supplier_id, suppliers(nama_supplier)")
        .in("id", productIds);
      if (prdError) throw prdError;

      const productsInfo = new Map(productsData.map((p) => [p.id, p]));

      // 4. Gabungkan data & hitung estimasi
      const combinedData = Array.from(salesMap.values()).map((item) => {
        const productInfo = productsInfo.get(item.id);
        const stok_saat_ini = productInfo?.stok ?? 0;
        const stok_minimal = productInfo?.stok_min ?? 0;

        let saran_pembelian = 0;
        if (stok_saat_ini <= stok_minimal) {
          const daysInFilter =
            differenceInDays(new Date(endDate), new Date(startDate)) + 1;
          const avgDailySales =
            item.total_terjual / (daysInFilter > 0 ? daysInFilter : 1);
          const monthlyNeed = Math.ceil(avgDailySales * 30);
          const suggestion = monthlyNeed - stok_saat_ini;
          saran_pembelian = suggestion > 0 ? suggestion : 0;
        }

        return {
          id: item.id,
          kode: item.kode,
          nama: item.nama,
          merek: item.merek || "-",
          kategori: item.kategori || "-",
          nama_supplier: productInfo?.suppliers?.nama_supplier || "-",
          total_terjual: item.total_terjual,
          stok_saat_ini,
          stok_minimal,
          saran_pembelian,
        };
      });

      // 5. Urutkan berdasarkan total terjual
      combinedData.sort((a, b) => b.total_terjual - a.total_terjual);
      setReportData(combinedData);
    } catch (error) {
      console.error("Gagal memuat laporan:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData(dateRange?.[0], dateRange?.[1]);
  }, [dateRange, fetchReportData]);

  const formattedDateRange = dateRange
    ? `${format(new Date(dateRange[0]), "d MMM yyyy", { locale: id })} - ${format(new Date(dateRange[1]), "d MMM yyyy", { locale: id })}`
    : "Semua Waktu";

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            to="/dashboard"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            <FaArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Laporan Produk Terlaris
            </h1>
            <p className="text-sm text-slate-500">{formattedDateRange}</p>
          </div>
        </div>

        {loading ? (
          <p>Memuat data laporan...</p>
        ) : (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Merek</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3 text-center">Terjual</th>
                    <th className="px-4 py-3 text-center">Stok</th>
                    <th className="px-4 py-3 text-center">Min. Stok</th>
                    <th className="px-4 py-3 text-center">Saran Pembelian</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-center">{index + 1}</td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {item.kode}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {item.nama}
                      </td>
                      <td className="px-4 py-4">{item.merek}</td>
                      <td className="px-4 py-4">{item.kategori}</td>
                      <td className="px-4 py-4">{item.nama_supplier}</td>
                      <td className="px-4 py-4 text-center font-bold text-lg">
                        {item.total_terjual}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.stok_saat_ini}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.stok_minimal}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-blue-600">
                        {item.saran_pembelian > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <FaShoppingCart />
                            <span>{item.saran_pembelian}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaporanProdukTerlaris;
