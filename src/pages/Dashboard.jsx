import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaDollarSign,
  FaReceipt,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
} from "date-fns";
import { id } from "date-fns/locale";

// Registrasi locale Indonesia untuk DatePicker
registerLocale("id", id);

// Registrasi komponen ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

// --- Komponen Kartu Metrik (Layout Vertikal Baru) ---
const MetricCard = ({
  icon,
  title,
  value,
  color,
  isLink = false,
  to = "#",
  state = {},
}) => {
  const content = (
    <div
      className={`bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center text-center h-full ${isLink ? "hover:opacity-90 transition-opacity" : ""}`}
    >
      <div className={`p-4 rounded-full text-white mb-3 ${color}`}>{icon}</div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return isLink ? (
    <Link to={to} state={state}>
      {content}
    </Link>
  ) : (
    content
  );
};

// --- Komponen Utama Dashboard ---
function Dashboard() {
  // State untuk metrik
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    salesValue: 0,
    profitValue: 0,
    transactionsCount: 0,
  });

  // State untuk grafik
  const [dailySalesChartData, setDailySalesChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [topProductsChartData, setTopProductsChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [topPilokChartData, setTopPilokChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [categoryChartData, setCategoryChartData] = useState({
    labels: [],
    datasets: [],
  });

  // State lainnya
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk filter tanggal
  const [activeFilter, setActiveFilter] = useState("7days");
  const [dateRange, setDateRange] = useState([
    startOfDay(subDays(new Date(), 6)),
    endOfDay(new Date()),
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Fungsi-fungsi untuk filter tanggal ---
  const handleDateFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowDatePicker(false);
    let start, end;
    const today = new Date();
    switch (filter) {
      case "this_month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "today":
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case "7days":
      default:
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
    }
    setDateRange([start, end]);
  };

  const handleCustomDateChange = (dates) => {
    const [start, end] = dates;
    setDateRange([start, end]); // Update range saat memilih
    if (start && end) {
      setActiveFilter("custom");
      setShowDatePicker(false);
    }
  };

  // --- Fungsi utama untuk mengambil semua data dashboard ---
  const fetchDashboardData = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const startTime = startOfDay(startDate).toISOString();
      const endTime = endOfDay(endDate).toISOString();

      // 1. Ambil Data Transaksi
      const { data: transactions, error: trxError } = await supabase
        .from("transactions")
        .select(
          "total_akhir, total_laba, items, created_at, customers(nama_pelanggan)",
        )
        .gte("created_at", startTime)
        .lte("created_at", endTime)
        .order("created_at", { ascending: false });
      if (trxError) throw trxError;

      // 2. Kalkulasi Metrik Dasar
      const salesValue = transactions.reduce(
        (sum, trx) => sum + trx.total_akhir,
        0,
      );
      const profitValue = transactions.reduce(
        (sum, trx) => sum + trx.total_laba,
        0,
      );
      const transactionsCount = transactions.length;

      // 3. Ambil Metrik Produk
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "Aktif");
      const { data: lowStockProductsData } = await supabase
        .from("products")
        .select("stok, stok_min")
        .gt("stok", 0);
      const lowStockProducts =
        lowStockProductsData?.filter((p) => p.stok <= p.stok_min).length || 0;
      setMetrics({
        totalProducts,
        lowStockProducts,
        salesValue,
        profitValue,
        transactionsCount,
      });

      // 4. Proses Data untuk Grafik & Aktivitas
      const productSales = {};
      const pilokSales = {};
      const categorySales = {};
      const dailySales = {};
      const dateLabels = eachDayOfInterval({ start: startDate, end: endDate });
      dateLabels.forEach((day) => {
        dailySales[format(day, "yyyy-MM-dd")] = 0;
      });

      transactions.forEach((trx) => {
        const trxDate = format(new Date(trx.created_at), "yyyy-MM-dd");
        if (dailySales.hasOwnProperty(trxDate)) {
          dailySales[trxDate] += trx.total_akhir;
        }

        if (Array.isArray(trx.items)) {
          trx.items.forEach((item) => {
            const itemTotal = item.harga_jual * item.quantity;
            if (item.kategori) {
              categorySales[item.kategori] =
                (categorySales[item.kategori] || 0) + itemTotal;
            }
            productSales[item.nama] =
              (productSales[item.nama] || 0) + item.quantity;
            if (item.kategori === "Pilok") {
              const pilokIdentifier =
                `${item.nama} (${item.kode}) ${item.merek || ""}`.trim();
              pilokSales[pilokIdentifier] =
                (pilokSales[pilokIdentifier] || 0) + item.quantity;
            }
          });
        }
      });

      // 5. Siapkan Data Grafik Penjualan Harian
      setDailySalesChartData({
        labels: Object.keys(dailySales).map((date) =>
          format(new Date(date), "d MMM", { locale: id }),
        ),
        datasets: [
          {
            label: "Penjualan (Rp)",
            data: Object.values(dailySales),
            borderColor: "rgb(251, 146, 60)",
            backgroundColor: "rgba(251, 146, 60, 0.5)",
            tension: 0.1,
          },
        ],
      });

      // 6. Siapkan Data Grafik Top 20 Produk Terlaris
      const sortedProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20);
      setTopProductsChartData({
        labels: sortedProducts.map(([name]) => name),
        datasets: [
          {
            label: "Jumlah Terjual",
            data: sortedProducts.map(([, qty]) => qty),
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      });

      // 7. Siapkan Data Grafik Top 20 Pilok Terlaris (dengan perbaikan)
      const sortedPilok = Object.entries(pilokSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20);
      setTopPilokChartData({
        labels: sortedPilok.map(([name]) => name),
        datasets: [
          {
            label: "Jumlah Terjual",
            data: sortedPilok.map(([, qty]) => qty),
            backgroundColor: "rgba(251, 146, 60, 0.8)",
            borderColor: "rgba(251, 146, 60, 1)",
            borderWidth: 1,
          },
        ],
      });

      // 8. Siapkan Data Grafik Penjualan per Kategori
      const sortedCategories = Object.entries(categorySales).sort(
        ([, a], [, b]) => b - a,
      );
      setCategoryChartData({
        labels: sortedCategories.map(([name]) => name),
        datasets: [
          {
            data: sortedCategories.map(([, total]) => total),
            backgroundColor: [
              "#3B82F6",
              "#10B981",
              "#F59E0B",
              "#EF4444",
              "#8B5CF6",
              "#EC4899",
              "#6B7280",
              "#FBBF24",
              "#D946EF",
              "#22D3EE",
            ],
          },
        ],
      });

      // 9. Siapkan Data Aktivitas Terkini
      setRecentActivities(transactions.slice(0, 5));
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(dateRange[0], dateRange[1]);
  }, [dateRange, fetchDashboardData]);

  if (loading)
    return (
      <div className="p-6">
        <p>Memuat data dashboard...</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      {/* --- Filter Tanggal (dengan perbaikan) --- */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDateFilterChange("today")}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${activeFilter === "today" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleDateFilterChange("7days")}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${activeFilter === "7days" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            7 Hari
          </button>
          <button
            onClick={() => handleDateFilterChange("this_month")}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${activeFilter === "this_month" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Bulan Ini
          </button>
          <div className="relative">
            <DatePicker
              selected={dateRange[0]}
              onChange={handleCustomDateChange}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              selectsRange
              locale="id"
              dateFormat="d MMM yyyy"
              customInput={
                <button
                  className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 ${activeFilter === "custom" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
                >
                  <FaCalendarAlt />
                  <span>{`${format(dateRange[0], "d MMM yy")} - ${format(dateRange[1], "d MMM yy")}`}</span>
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* --- Grid Kartu Metrik (dengan perbaikan) --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <MetricCard
          icon={<FaDollarSign size={24} />}
          title="Penjualan"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(metrics.salesValue)}`}
          color="bg-green-500"
        />
        <MetricCard
          icon={<FaMoneyBillWave size={24} />}
          title="Keuntungan"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(metrics.profitValue)}`}
          color="bg-teal-500"
        />
        <MetricCard
          icon={<FaReceipt size={24} />}
          title="Transaksi"
          value={metrics.transactionsCount}
          color="bg-orange-500"
        />
        <MetricCard
          icon={<FaBoxOpen size={24} />}
          title="Produk Aktif"
          value={metrics.totalProducts}
          color="bg-blue-500"
        />
        <MetricCard
          icon={<FaExclamationTriangle size={24} />}
          title="Stok Rendah"
          value={metrics.lowStockProducts}
          color="bg-yellow-500"
          isLink={true}
          to="/produk"
          state={{ filter: "stok_rendah" }}
        />
      </div>

      {/* Grid Utama (2 kolom besar) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Kolom Kiri (3/5) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Grafik Penjualan</h2>
            <div className="h-80">
              <Line
                options={{ responsive: true, maintainAspectRatio: false }}
                data={dailySalesChartData}
              />
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">
              Top 20 Produk Terlaris
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Berdasarkan kuantitas (semua kategori)
            </p>
            <Link
              to="/laporan-produk-terlaris"
              state={{ dateRange }}
              className="block cursor-pointer"
            >
              <div className="h-96">
                <Bar
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    scales: { y: { ticks: { font: { size: 10 } } } },
                  }}
                  data={topProductsChartData}
                />
              </div>
            </Link>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">
              Top 20 Produk Pilok Terlaris
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Berdasarkan kuantitas (kategori Pilok)
            </p>
            <Link
              to="/laporan-produk-pilok"
              state={{ dateRange }}
              className="block cursor-pointer"
            >
              <div className="h-96">
                <Bar
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    scales: {
                      y: {
                        ticks: {
                          font: { size: 10, weight: "bold" },
                          color: "#000",
                        },
                      },
                    },
                  }}
                  data={topPilokChartData}
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Kolom Kanan (2/5) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">
              Penjualan per Kategori
            </h2>
            <div className="mt-4 h-64 flex justify-center items-center">
              <Pie
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: { boxWidth: 12, font: { size: 10 } },
                    },
                  },
                }}
                data={categoryChartData}
              />
            </div>
          </div>

          {/* --- Aktivitas Terkini (dengan perbaikan) --- */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Aktivitas Terkini</h2>
            <ul className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <li
                    key={act.id}
                    className="text-sm border-b pb-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">
                        {act.customers?.nama_pelanggan || "Pelanggan"}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {new Date(act.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ul className="pl-2 space-y-1">
                      {act.items.slice(0, 2).map(
                        (
                          item, // Tampilkan maks 2 item
                        ) => (
                          <li key={item.id} className="text-xs text-slate-600">
                            {item.quantity}x {item.nama} ({item.merek || "-"})
                          </li>
                        ),
                      )}
                      {act.items.length > 2 && (
                        <li className="text-xs text-slate-400 italic">
                          ...dan {act.items.length - 2} item lainnya
                        </li>
                      )}
                    </ul>
                    <p className="text-right font-semibold mt-1">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(act.total_akhir)}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  Tidak ada transaksi pada rentang ini.
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
