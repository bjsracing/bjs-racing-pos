import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { FaDollarSign, FaSignOutAlt, FaChartLine } from "react-icons/fa";

// Komponen Kartu Metrik Laporan
const ReportCard = ({ title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow`}>
    <p className="text-sm text-slate-500 font-medium">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>
      Rp {new Intl.NumberFormat("id-ID").format(value)}
    </p>
  </div>
);

function Reports() {
  const [reportData, setReportData] = useState({
    omzet: 0,
    pengeluaran: 0,
    laba: 0,
  });
  const [loading, setLoading] = useState(true);

  // State untuk filter tanggal
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Fungsi utama untuk mengambil dan menghitung data laporan
  async function fetchReportData(start, end) {
    setLoading(true);

    // Tambahkan jam, menit, detik agar filter akurat
    const startTime = new Date(start).toISOString();
    const endTime = new Date(end);
    endTime.setHours(23, 59, 59, 999);
    const endTimeStr = endTime.toISOString();

    // Ambil data transaksi dan pengeluaran secara bersamaan
    const [trxResponse, expResponse] = await Promise.all([
      supabase
        .from("transactions")
        .select("total_akhir, total_laba")
        .gte("created_at", startTime)
        .lte("created_at", endTimeStr),
      supabase
        .from("expenses")
        .select("jumlah")
        .gte("tanggal", startTime)
        .lte("tanggal", endTimeStr),
    ]);

    // Kalkulasi Omzet dan Laba dari transaksi
    const omzet = trxResponse.data
      ? trxResponse.data.reduce((sum, trx) => sum + trx.total_akhir, 0)
      : 0;
    const labaKotor = trxResponse.data
      ? trxResponse.data.reduce((sum, trx) => sum + trx.total_laba, 0)
      : 0;

    // Kalkulasi Pengeluaran
    const pengeluaran = expResponse.data
      ? expResponse.data.reduce((sum, exp) => sum + exp.jumlah, 0)
      : 0;

    setReportData({
      omzet: omzet,
      pengeluaran: pengeluaran,
      laba: labaKotor - pengeluaran, // Laba bersih = Laba kotor penjualan - pengeluaran
    });

    setLoading(false);
  }

  // useEffect untuk menjalankan fetchReportData saat tanggal berubah
  useEffect(() => {
    fetchReportData(startDate, endDate);
  }, [startDate, endDate]);

  // Fungsi-fungsi untuk preset tanggal
  const setDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    if (period === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      start.setDate(end.getDate() - 6);
    } else if (period === "month") {
      start.setDate(1);
    } else if (period === "year") {
      start.setMonth(0, 1);
    }
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // GANTI SELURUH BLOK 'return' ANDA DENGAN INI:
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Laporan Keuangan</h1>

      <div className="p-4 bg-white rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Dari Tanggal
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Sampai Tanggal
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setDateRange("today")}
            className="text-sm bg-slate-200 px-3 py-1 rounded-full hover:bg-slate-300"
          >
            Hari Ini
          </button>
          <button
            onClick={() => setDateRange("week")}
            className="text-sm bg-slate-200 px-3 py-1 rounded-full hover:bg-slate-300"
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setDateRange("month")}
            className="text-sm bg-slate-200 px-3 py-1 rounded-full hover:bg-slate-300"
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateRange("year")}
            className="text-sm bg-slate-200 px-3 py-1 rounded-full hover:bg-slate-300"
          >
            Tahun Ini
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Menghitung laporan...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard
            title="Total Omzet (Pendapatan)"
            value={reportData.omzet}
            color="text-blue-500"
          />
          <ReportCard
            title="Total Pengeluaran"
            value={reportData.pengeluaran}
            color="text-red-500"
          />
          <ReportCard
            title="Laba Bersih"
            value={reportData.laba}
            color="text-green-500"
          />
        </div>
      )}
    </div>
  );
}
export default Reports;
