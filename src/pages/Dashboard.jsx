// src/pages/Dashboard.jsx (Versi Final dengan Backend-Driven Charts)

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
  FaCalculator,
  FaBullseye,
  FaUserTie,
  FaExclamationCircle,
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { updateAiConfig, getUserRole } from "../config/aiConfig.js";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { id } from "date-fns/locale";

registerLocale("id", id);
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

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded ${className}`}
    style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite linear" }}
  />
);

const DashboardSkeleton = () => (
  <div className="p-4 sm:p-6 bg-orange-200 min-h-screen rounded-xl">
    <div className="mb-6"><Skeleton className="h-8 w-48" /></div>
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow flex flex-col items-center h-32">
          <Skeleton className="w-12 h-12 rounded-full mb-3" />
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center h-32">
        <Skeleton className="w-12 h-12 rounded-full mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center h-56">
        <Skeleton className="w-12 h-12 rounded-full mb-3" />
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="w-24 h-24 rounded-full mb-2" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow h-80">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-full w-full rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow h-72">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-full w-full rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow h-96">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-full w-full rounded" />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow h-64">
          <Skeleton className="h-5 w-32 mb-4" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-3" />)}
        </div>
        <div className="bg-white p-4 rounded-lg shadow h-64">
          <Skeleton className="h-5 w-32 mb-4" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-3" />)}
        </div>
      </div>
    </div>
  </div>
);

const MetricCard = ({
  icon,
  title,
  value,
  color,
  isLink = false,
  to = "#",
  state = {},
  trendChange = null,
  trendLabel = "vs minggu lalu",
}) => {
  const content = (
    <div
      className={`bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center text-center h-full ${isLink ? "hover:opacity-90 transition-opacity" : ""}`}
    >
      <div className={`p-4 rounded-full text-white mb-3 ${color}`}>{icon}</div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {trendChange !== null && trendChange !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${
          trendChange >= 0 ? "text-green-600" : "text-red-500"
        }`}>
          {trendChange >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
          <span>{trendChange >= 0 ? "+" : ""}{trendChange}%</span>
          <span className="text-slate-400 font-normal">{trendLabel}</span>
        </div>
      )}
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

  // State untuk kartu baru
  const [topCustomers, setTopCustomers] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(60000000);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState("60000000");
  const [userRole, setUserRole] = useState(null);
  const [savingTarget, setSavingTarget] = useState(false);

  // State untuk 5 chart baru (client-side aggregation)
  const [brandSalesChartData, setBrandSalesChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [profitMarginChartData, setProfitMarginChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [peakHoursChartData, setPeakHoursChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [purchaseVsSalesChartData, setPurchaseVsSalesChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [weeklyTrend, setWeeklyTrend] = useState({
    thisWeek: 0,
    lastWeek: 0,
    change: 0,
    thisWeekProfit: 0,
    lastWeekProfit: 0,
    profitChange: 0,
  });

  // State untuk filter tanggal
  const [activeFilter, setActiveFilter] = useState("7days");
  const [dateRange, setDateRange] = useState([
    startOfDay(subDays(new Date(), 6)),
    endOfDay(new Date()),
  ]);

  // Fungsi-fungsi dan sisa kode Anda dimulai dari sini...

  const handleDateFilterChange = (filter) => {
    setActiveFilter(filter);
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
      default:
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
    }
    setDateRange([start, end]);
  };

  const handleCustomDateChange = (dates) => {
    // `dates` adalah sebuah array [startDate, endDate]
    const [start, end] = dates;

    // Langsung update state tanggal agar kalender responsif
    setDateRange(dates);

    // Ubah status filter menjadi 'custom' HANYA jika sudah lengkap
    if (start && end) {
      setActiveFilter("custom");
    }
  };

  const fetchDashboardData = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const startTime = startOfDay(startDate).toISOString();
      const endTime = endOfDay(endDate).toISOString();

      // Panggil semua data dari backend secara paralel
      const [
        metricsRes,
        chartsRes,
        topProductsRes,
        topPilokRes,
        recentActivitiesRes,
      ] = await Promise.all([
        supabase.rpc("get_dashboard_metrics", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_dashboard_charts_data", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_best_selling_products", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_best_selling_products", {
          start_date: startTime,
          end_date: endTime,
          category_filter: "Pilok",
        }),
        supabase
          .from("transactions")
          .select(
            "id, total_akhir, items, created_at, customers(nama_pelanggan)",
          )
          .gte("created_at", startTime)
          .lte("created_at", endTime)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Proses Metrik
      if (metricsRes.error) throw metricsRes.error;
      const { sales_value, profit_value, transactions_count } =
        metricsRes.data[0];
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
        salesValue: sales_value,
        profitValue: profit_value,
        transactionsCount: transactions_count,
      });

      // Proses Data Grafik dari RPC
      if (chartsRes.error) throw chartsRes.error;
      const { daily_sales, category_sales } = chartsRes.data[0];
      setDailySalesChartData({
        labels: Object.keys(daily_sales || {}).map((date) =>
          format(new Date(date), "d MMM", { locale: id }),
        ),
        datasets: [
          {
            label: "Penjualan (Rp)",
            data: Object.values(daily_sales || {}),
            borderColor: "rgb(251, 146, 60)",
            backgroundColor: "rgba(251, 146, 60, 0.5)",
            tension: 0.1,
          },
        ],
      });
      const sortedCategories = Object.entries(category_sales || {}).sort(
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
            ],
          },
        ],
      });

      // Proses Top Produk & Pilok dari RPC
      if (topProductsRes.error) throw topProductsRes.error;
      if (topPilokRes.error) throw topPilokRes.error;
      setTopProductsChartData({
        labels: (topProductsRes.data || []).slice(0, 20).map((p) => p.nama),
        datasets: [
          {
            label: "Jumlah Terjual",
            data: (topProductsRes.data || [])
              .slice(0, 20)
              .map((p) => p.total_terjual),
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      });
      setTopPilokChartData({
        labels: (topPilokRes.data || [])
          .slice(0, 20)
          .map((p) => `${p.nama} (${p.kode}) ${p.merek || ""}`.trim()),
        datasets: [
          {
            label: "Jumlah Terjual",
            data: (topPilokRes.data || [])
              .slice(0, 20)
              .map((p) => p.total_terjual),
            backgroundColor: "rgba(251, 146, 60, 0.8)",
            borderColor: "rgba(251, 146, 60, 1)",
            borderWidth: 1,
          },
        ],
      });

      // Proses Aktivitas Terkini
      if (recentActivitiesRes.error) throw recentActivitiesRes.error;
      setRecentActivities(recentActivitiesRes.data || []);

      // Ambil data kartu baru secara paralel
      const [topCustomersRes, outOfStockRes, targetRes] = await Promise.all([
        supabase
          .from("customer_overview")
          .select("nama_pelanggan, total_transaksi, tingkatan")
          .order("total_transaksi", { ascending: false })
          .limit(5),
        supabase
          .from("products")
          .select("id, kode, nama, merek, ukuran")
          .eq("status", "Aktif")
          .eq("stok", 0)
          .order("nama")
          .limit(10),
        supabase
          .from("ai_config")
          .select("value")
          .eq("key", "monthly_sales_target")
          .single(),
      ]);

      setTopCustomers(topCustomersRes.data || []);
      setOutOfStockProducts(outOfStockRes.data || []);
      setOutOfStockCount(outOfStockRes.data?.length || 0);
      if (targetRes.data?.value) {
        setMonthlyTarget(Number(targetRes.data.value));
      }

      // === RPC-BASED DATA untuk 5 chart baru ===
      const [
        brandSalesRes,
        profitMarginRes,
        peakHoursRes,
        purchaseVsSalesRes,
        thisWeekMetricsRes,
        lastWeekMetricsRes,
        lastMonthMetricsRes,
      ] = await Promise.all([
        supabase.rpc("get_sales_by_brand", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_profit_margin_by_category", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_peak_hours", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_purchase_vs_sales", {
          start_date: startTime,
          end_date: endTime,
        }),
        supabase.rpc("get_dashboard_metrics", {
          start_date: startOfDay(subDays(new Date(), 6)).toISOString(),
          end_date: endOfDay(new Date()).toISOString(),
        }),
        supabase.rpc("get_dashboard_metrics", {
          start_date: startOfDay(subDays(new Date(), 13)).toISOString(),
          end_date: startOfDay(subDays(new Date(), 7)).toISOString(),
        }),
        supabase.rpc("get_dashboard_metrics", {
          start_date: startOfMonth(subMonths(new Date(), 1)).toISOString(),
          end_date: endOfMonth(subMonths(new Date(), 1)).toISOString(),
        }),
      ]);

      // --- 1. Penjualan per Merek ---
      const brandColors = [
        "#FBAC18", "#000000", "#6B7280", "#2563EB",
        "#DC2626", "#059669", "#7C3AED", "#EA580C",
      ];
      const topBrands = (brandSalesRes.data || []).slice(0, 8);
      setBrandSalesChartData({
        labels: topBrands.map((r) => r.merek),
        datasets: [
          {
            data: topBrands.map((r) => r.total_penjualan),
            backgroundColor: brandColors.slice(0, topBrands.length),
          },
        ],
      });

      // --- 2. Profit Margin per Kategori ---
      const catData = (profitMarginRes.data || [])
        .filter((r) => r.kategori !== "-")
        .slice(0, 15);
      setProfitMarginChartData({
        labels: catData.map((r) => r.kategori),
        datasets: [
          {
            label: "Margin (%)",
            data: catData.map((r) => r.margin_persen),
            backgroundColor: catData.map((r) =>
              r.margin_persen >= 30
                ? "rgba(16,185,129,0.7)"
                : r.margin_persen >= 15
                  ? "rgba(245,158,11,0.7)"
                  : "rgba(239,68,68,0.7)",
            ),
            borderColor: catData.map((r) =>
              r.margin_persen >= 30
                ? "rgb(16,185,129)"
                : r.margin_persen >= 15
                  ? "rgb(245,158,11)"
                  : "rgb(239,68,68)",
            ),
            borderWidth: 1,
          },
        ],
      });

      // --- 3. Jam Sibuk ---
      const peakData = peakHoursRes.data || [];
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const peakMap = Object.fromEntries(peakData.map((r) => [r.jam, r.jumlah_transaksi]));
      const peakValues = allHours.map((h) => Number(peakMap[h] || 0));
      const peakMax = Math.max(...peakValues);
      setPeakHoursChartData({
        labels: allHours.map((h) => `${h}:00`),
        datasets: [
          {
            label: "Jumlah Transaksi",
            data: peakValues,
            backgroundColor: peakValues.map((v) => {
              const intensity = peakMax > 0 ? v / peakMax : 0;
              return `rgba(59,130,246,${0.3 + intensity * 0.7})`;
            }),
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 1,
          },
        ],
      });

      // --- 5. Tren Mingguan ---
      const thisWeekTotal = thisWeekMetricsRes.data?.[0]?.sales_value || 0;
      const lastWeekTotal = lastWeekMetricsRes.data?.[0]?.sales_value || 0;
      const weeklyChange = lastWeekTotal > 0
        ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 1000) / 10
        : thisWeekTotal > 0 ? 100 : 0;
      const thisWeekProfit = thisWeekMetricsRes.data?.[0]?.profit_value || 0;
      const lastWeekProfit = lastWeekMetricsRes.data?.[0]?.profit_value || 0;
      const profitChange = lastWeekProfit > 0
        ? Math.round(((thisWeekProfit - lastWeekProfit) / lastWeekProfit) * 1000) / 10
        : thisWeekProfit > 0 ? 100 : 0;
      setWeeklyTrend({
        thisWeek: thisWeekTotal,
        lastWeek: lastWeekTotal,
        change: weeklyChange,
        thisWeekProfit,
        lastWeekProfit,
        profitChange,
      });

      // --- 6. Penjualan bulan lalu (untuk trend kartu Target) ---
      const lastMonthTotal = lastMonthMetricsRes.data?.[0]?.sales_value || 0;
      setLastMonthSales(lastMonthTotal);

      // --- 4. Pembelian vs Penjualan ---
      const pvsData = purchaseVsSalesRes.data || [];
      setPurchaseVsSalesChartData({
        labels: pvsData.map((r) => format(new Date(r.tanggal), "d MMM", { locale: id })),
        datasets: [
          {
            label: "Penjualan",
            data: pvsData.map((r) => r.penjualan),
            borderColor: "rgb(16,185,129)",
            backgroundColor: "rgba(16,185,129,0.1)",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Pembelian",
            data: pvsData.map((r) => r.pembelian),
            borderColor: "rgb(59,130,246)",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      });
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error.message);
      // Tambahkan alert agar pengguna tahu jika ada masalah
      alert("Gagal memuat data dashboard. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user role for edit permissions
  useEffect(() => {
    const loadRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    loadRole();
  }, []);

  const canEditTarget = userRole === "admin" || userRole === "owner";

  const handleSaveTarget = async () => {
    const newValue = Number(editTargetValue);
    if (!newValue || newValue < 0) return;
    setSavingTarget(true);
    try {
      await updateAiConfig("monthly_sales_target", String(newValue));
      setMonthlyTarget(newValue);
      setIsEditingTarget(false);
    } catch (err) {
      alert("Gagal menyimpan target: " + err.message);
    } finally {
      setSavingTarget(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateRange[0], dateRange[1]);
  }, [dateRange, fetchDashboardData]);

  // Kode JSX di bawah ini tidak berubah, hanya memanggil state yang sudah diisi.
  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 sm:p-6 bg-orange-200 min-h-screen rounded-xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      {/* --- FILTER TANGGAL DENGAN CLASSNAME DINAMIS --- */}
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <MetricCard
          icon={<FaDollarSign size={24} />}
          title="Penjualan"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(metrics.salesValue)}`}
          color="bg-green-500"
          trendChange={weeklyTrend.lastWeek > 0 ? weeklyTrend.change : null}
        />
        <MetricCard
          icon={<FaMoneyBillWave size={24} />}
          title="Keuntungan"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(metrics.profitValue)}`}
          color="bg-teal-500"
          trendChange={weeklyTrend.lastWeekProfit > 0 ? weeklyTrend.profitChange : null}
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

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <MetricCard
          icon={<FaCalculator size={24} />}
          title="Rata-rata/Transaksi"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(
            metrics.transactionsCount > 0
              ? Math.round(metrics.salesValue / metrics.transactionsCount)
              : 0,
          )}`}
          color="bg-purple-500"
        />
        <div className="bg-white p-5 rounded-lg shadow flex flex-col items-center justify-center text-center h-full">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-2.5 rounded-full text-white bg-indigo-500">
              <FaBullseye size={18} />
            </div>
            <p className="text-sm text-slate-500 font-medium">Target Bulanan</p>
            {canEditTarget && !isEditingTarget && (
              <button
                onClick={() => {
                  setEditTargetValue(String(monthlyTarget));
                  setIsEditingTarget(true);
                }}
                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                title="Edit target"
              >
                <FaPencilAlt size={11} />
              </button>
            )}
          </div>

          {/* Circular Progress */}
          {(() => {
            const pct = monthlyTarget > 0 ? Math.min((metrics.salesValue / monthlyTarget) * 100, 100) : 0;
            const radius = 42;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (pct / 100) * circumference;
            const strokeColor =
              pct >= 100 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444";
            return (
              <div className="relative my-2">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle
                    cx="55" cy="55" r={radius}
                    fill="none" stroke="#e2e8f0" strokeWidth="8"
                  />
                  <circle
                    cx="55" cy="55" r={radius}
                    fill="none" stroke={strokeColor} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: strokeColor }}>
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Status Badge */}
          {(() => {
            const pct = monthlyTarget > 0 ? (metrics.salesValue / monthlyTarget) * 100 : 0;
            if (pct >= 100) {
              return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-1.5">Tercapai</span>;
            }
            if (pct >= 60) {
              return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 mb-1.5">On Track</span>;
            }
            return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 mb-1.5">Perlu Percepatan</span>;
          })()}

          {/* Sisa Target */}
          <p className="text-xs text-slate-500 mb-1">
            {monthlyTarget > 0 && metrics.salesValue < monthlyTarget
              ? <>Sisa <span className="font-semibold text-slate-700">Rp {new Intl.NumberFormat("id-ID").format(monthlyTarget - metrics.salesValue)}</span> lagi</>
              : <span className="font-semibold text-green-600">Target Tercapai!</span>
            }
          </p>

          {/* Estimasi Tanggal Tercapai */}
          {(() => {
            const today = new Date();
            const dayOfMonth = today.getDate();
            if (dayOfMonth <= 0 || monthlyTarget <= 0) return null;
            if (metrics.salesValue >= monthlyTarget) {
              return <p className="text-xs text-green-600 font-medium mb-1">Tercapai lebih awal!</p>;
            }
            const daysInMonth = endOfMonth(today).getDate();
            const sisaHari = daysInMonth - dayOfMonth;
            if (sisaHari <= 0) return null;
            const dailyRate = metrics.salesValue / dayOfMonth;
            const projected = metrics.salesValue + dailyRate * sisaHari;
            if (projected >= monthlyTarget) {
              const sisaTarget = monthlyTarget - metrics.salesValue;
              const hariButuh = Math.ceil(sisaTarget / dailyRate);
              const estimatedDate = new Date(today);
              estimatedDate.setDate(estimatedDate.getDate() + hariButuh);
              const tglStr = format(estimatedDate, "d MMMM yyyy", { locale: id });
              return <p className="text-xs text-slate-500 mb-1">Diperkirakan tercapai <span className="font-medium text-slate-700">{tglStr}</span></p>;
            }
            const sisaTarget = monthlyTarget - metrics.salesValue;
            const kecepatanDibutuhkan = Math.ceil(sisaTarget / sisaHari);
            return <p className="text-xs text-slate-500 mb-1">Perlu <span className="font-medium text-amber-600">Rp {new Intl.NumberFormat("id-ID").format(kecepatanDibutuhkan)}/hari</span> selama {sisaHari} hari lagi</p>;
          })()}

          {/* Mini Trend vs Bulan Lalu */}
          {(() => {
            if (lastMonthSales <= 0) return null;
            const thisMonthTarget = monthlyTarget;
            const thisMonthPct = thisMonthTarget > 0 ? (metrics.salesValue / thisMonthTarget) * 100 : 0;
            const lastMonthPct = thisMonthTarget > 0 ? (lastMonthSales / thisMonthTarget) * 100 : 0;
            const diff = thisMonthPct - lastMonthPct;
            const rounded = Math.round(Math.abs(diff) * 10) / 10;
            if (rounded === 0) return null;
            if (diff > 0) {
              return <p className="text-xs text-green-600 font-medium mb-1">&#8593; {rounded}% dari bulan lalu</p>;
            }
            return <p className="text-xs text-red-500 font-medium mb-1">&#8595; {rounded}% dari bulan lalu</p>;
          })()}

          {/* Sales & Target values */}
          <div className="w-full mt-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">
                Rp {new Intl.NumberFormat("id-ID").format(metrics.salesValue)}
              </span>
              {isEditingTarget ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editTargetValue}
                    onChange={(e) => setEditTargetValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTarget();
                      if (e.key === "Escape") setIsEditingTarget(false);
                    }}
                    className="w-28 text-right px-1.5 py-0.5 border border-indigo-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    autoFocus
                    min="0"
                    disabled={savingTarget}
                  />
                  <button
                    onClick={handleSaveTarget}
                    disabled={savingTarget}
                    className="text-green-500 hover:text-green-700 disabled:opacity-50"
                    title="Simpan"
                  >
                    <FaCheck size={12} />
                  </button>
                  <button
                    onClick={() => setIsEditingTarget(false)}
                    disabled={savingTarget}
                    className="text-red-400 hover:text-red-600 disabled:opacity-50"
                    title="Batal"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : (
                <span className="text-slate-500">
                  Target: Rp {new Intl.NumberFormat("id-ID").format(monthlyTarget)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: 4 chart baru */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Penjualan per Merek</h2>
          <div className="mt-4 h-72 flex justify-center items-center">
            {brandSalesChartData.labels.length > 0 ? (
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
                data={brandSalesChartData}
              />
            ) : (
              <p className="text-slate-400 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            Penjualan per Kategori
          </h2>
          <div className="mt-4 h-72 flex justify-center items-center">
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

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Jam Sibuk</h2>
          <p className="text-sm text-slate-500 mb-4">
            Distribusi transaksi per jam
          </p>
          <div className="h-64">
            {peakHoursChartData.labels.length > 0 ? (
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: {
                        font: { size: 8 },
                        maxRotation: 45,
                        callback: function (val, index) {
                          return index % 3 === 0 ? this.getLabelForValue(val) : "";
                        },
                      },
                    },
                    y: { beginAtZero: true },
                  },
                }}
                data={peakHoursChartData}
              />
            ) : (
              <p className="text-slate-400 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-1">Tren Mingguan</h2>
          <p className="text-xs text-slate-400 mb-4">
            Minggu ini vs minggu lalu
          </p>
          <div className="flex flex-col justify-center h-56">
            {(() => {
              const thisWeek = Math.round(weeklyTrend.thisWeek);
              const lastWeek = Math.round(weeklyTrend.lastWeek);
              const maxVal = Math.max(thisWeek, lastWeek, 1);
              const barWidth = (val) => Math.max((val / maxVal) * 100, 2);
              return (
                <>
                  {/* Bar Minggu Ini */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-600">Minggu ini</span>
                      <span className="text-xs font-bold text-slate-800">
                        Rp {new Intl.NumberFormat("id-ID").format(thisWeek)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700 ease-out"
                        style={{ width: `${barWidth(thisWeek)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bar Minggu Lalu */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-400">Minggu lalu</span>
                      <span className="text-xs text-slate-400">
                        Rp {new Intl.NumberFormat("id-ID").format(lastWeek)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                        style={{ width: `${barWidth(lastWeek)}%` }}
                      />
                    </div>
                  </div>

                  {/* Arrow + Persentase */}
                  <div className="flex items-center justify-center gap-2">
                    {weeklyTrend.change !== 0 && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                        weeklyTrend.change >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {weeklyTrend.change >= 0 ? (
                          <FaArrowUp size={12} className="animate-bounce" />
                        ) : (
                          <FaArrowDown size={12} className="animate-bounce" />
                        )}
                        {weeklyTrend.change >= 0 ? "+" : ""}{weeklyTrend.change}%
                      </span>
                    )}
                    <span className="text-xs text-slate-400">vs minggu lalu</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ROW 4: 2 chart baru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            Profit Margin per Kategori
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Persentase keuntungan per kategori
          </p>
          <div className="h-72">
            {profitMarginChartData.labels.length > 0 ? (
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        callback: (val) => `${val}%`,
                      },
                    },
                    y: {
                      ticks: { font: { size: 10, weight: "bold" } },
                    },
                  },
                }}
                data={profitMarginChartData}
              />
            ) : (
              <p className="text-slate-400 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            Pembelian vs Penjualan
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Perbandingan arus kas harian
          </p>
          <div className="h-72">
            {purchaseVsSalesChartData.labels.length > 0 ? (
              <Line
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: { boxWidth: 12, font: { size: 10 } },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (val) =>
                          `Rp ${new Intl.NumberFormat("id-ID").format(val)}`,
                      },
                    },
                    x: {
                      ticks: { font: { size: 9 } },
                    },
                  },
                }}
                data={purchaseVsSalesChartData}
              />
            ) : (
              <p className="text-slate-400 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                    scales: {
                      y: { ticks: { font: { size: 10, weight: "bold" } } },
                    },
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

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Aktivitas Terkini</h2>
            <ul className="space-y-2">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  if (!activity || !activity.id) return null;
                  const itemCount = Array.isArray(activity.items) ? activity.items.length : 0;
                  return (
                    <li
                      key={activity.id}
                      className="text-sm border-b border-slate-100 pb-3 last:border-b-0 rounded-lg px-3 py-2.5 -mx-1 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm cursor-default"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {activity.customers?.nama_pelanggan ||
                              "Pelanggan Umum"}
                          </p>
                          {itemCount > 0 && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              itemCount >= 5
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {itemCount} item
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs">
                          {new Date(activity.created_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                      {Array.isArray(activity.items) && (
                        <ul className="pl-2 space-y-0.5">
                          {activity.items.slice(0, 2).map((item, index) => {
                            if (!item) return null;
                            const key =
                              item.id || item.product_id || `item-${index}`;
                            const quantity =
                              item.kuantitas || item.quantity || 0;
                            const name = item.nama || `(Item Grosir)`;
                            const brand = item.merek || "";
                            return (
                              <li key={key} className="text-xs text-slate-500">
                                {quantity}x {name} {brand && <span className="text-slate-400">({brand})</span>}
                              </li>
                            );
                          })}
                          {activity.items.length > 2 && (
                            <li
                              key={`more-${activity.id}`}
                              className="text-xs text-slate-400 italic"
                            >
                              ...dan {activity.items.length - 2} item lainnya
                            </li>
                          )}
                        </ul>
                      )}
                      <p className="text-right font-bold text-sm mt-1.5 text-slate-800">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          activity.total_akhir,
                        )}
                      </p>
                    </li>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400">
                  Tidak ada transaksi pada rentang ini.
                </p>
              )}
            </ul>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaUserTie className="text-indigo-500" />
                Pelanggan Terbaik
              </h2>
            </div>
            {topCustomers.length > 0 ? (
              <ul className="space-y-3">
                {topCustomers.map((customer, index) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <li
                      key={customer.nama_pelanggan}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {index < 3 ? medals[index] : `#${index + 1}`}
                        </span>
                        <div>
                          <p className="font-semibold">
                            {customer.nama_pelanggan}
                          </p>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {customer.tingkatan}
                          </span>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          customer.total_transaksi,
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Belum ada data pelanggan.
              </p>
            )}
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaExclamationCircle className="text-red-500" />
                Produk Habis
              </h2>
              <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded-full">
                {outOfStockCount}
              </span>
            </div>
            {outOfStockProducts.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {outOfStockProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-slate-700">
                        {product.nama}
                      </p>
                      <p className="text-xs text-slate-400">
                        {product.kode} {product.merek && `· ${product.merek}`}
                        {product.ukuran && ` · ${product.ukuran}`}
                      </p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      Stok 0
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Semua produk tersedia.
              </p>
            )}
            {outOfStockCount > 10 && (
              <Link
                to="/produk"
                state={{ filter: "habis" }}
                className="block text-center text-sm text-blue-600 hover:underline mt-2"
              >
                Lihat semua ({outOfStockCount})
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
