import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // <-- IMPORT BARU
import { supabase } from "../supabaseClient.js";
import { Bar, Line } from "react-chartjs-2";
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
} from "chart.js";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaDollarSign,
  FaReceipt,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

const MetricCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow flex items-center h-full`}>
    <div className={`p-4 rounded-full text-white ${color}`}>{icon}</div>
    <div className="ml-4">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

function Dashboard() {
  // ... (Semua state dan useEffect untuk mengambil data tetap sama persis seperti sebelumnya) ...
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    todaySales: 0,
    todayTransactions: 0,
  });
  const [salesData, setSalesData] = useState({ labels: [], datasets: [] });
  const [lowStockData, setLowStockData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      const { data: productsData } = await supabase
        .from("products")
        .select("stok, stok_min");
      const totalProducts = productsData ? productsData.length : 0;
      const lowStockProducts = productsData
        ? productsData.filter((p) => p.stok > 0 && p.stok <= p.stok_min).length
        : 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { data: todayTrx } = await supabase
        .from("transactions")
        .select("total_akhir")
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());
      const todaySales = todayTrx
        ? todayTrx.reduce((sum, trx) => sum + trx.total_akhir, 0)
        : 0;
      const todayTransactions = todayTrx ? todayTrx.length : 0;
      setMetrics({
        totalProducts,
        lowStockProducts,
        todaySales,
        todayTransactions,
      });
      const salesByDay = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const formattedDate = d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        });
        salesByDay[formattedDate] = 0;
      }
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const { data: weeklySales } = await supabase
        .from("transactions")
        .select("created_at, total_akhir")
        .gte("created_at", sevenDaysAgo.toISOString());
      if (weeklySales) {
        weeklySales.forEach((trx) => {
          const formattedDate = new Date(trx.created_at).toLocaleDateString(
            "id-ID",
            { weekday: "short", day: "numeric" },
          );
          if (salesByDay[formattedDate] !== undefined) {
            salesByDay[formattedDate] += trx.total_akhir;
          }
        });
      }
      setSalesData({
        labels: Object.keys(salesByDay),
        datasets: [
          {
            label: "Penjualan (Rp)",
            data: Object.values(salesByDay),
            borderColor: "rgb(251, 146, 60)",
            backgroundColor: "rgba(251, 146, 60, 0.5)",
            tension: 0.1,
          },
        ],
      });
      const { data: topLowStock } = await supabase
        .from("products")
        .select("nama, stok")
        .gt("stok", 0)
        .order("stok", { ascending: true })
        .limit(5);
      setLowStockData({
        labels: topLowStock ? topLowStock.map((p) => p.nama) : [],
        datasets: [
          {
            label: "Jumlah Stok",
            data: topLowStock ? topLowStock.map((p) => p.stok) : [],
            backgroundColor: "rgba(239, 68, 68, 0.6)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      });
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  if (loading) return <p>Memuat data dashboard...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<FaBoxOpen size={24} />}
          title="Total Jenis Produk"
          value={metrics.totalProducts}
          color="bg-blue-500"
        />

        {/* --- PERUBAHAN DI SINI: Kartu ini sekarang adalah Link --- */}
        <Link
          to="/produk"
          state={{ filter: "stok_rendah" }}
          className="hover:opacity-90 transition-opacity"
        >
          <MetricCard
            icon={<FaExclamationTriangle size={24} />}
            title="Produk Stok Rendah"
            value={metrics.lowStockProducts}
            color="bg-yellow-500"
          />
        </Link>

        <MetricCard
          icon={<FaDollarSign size={24} />}
          title="Penjualan Hari Ini"
          value={`Rp ${new Intl.NumberFormat("id-ID").format(metrics.todaySales)}`}
          color="bg-green-500"
        />
        <MetricCard
          icon={<FaReceipt size={24} />}
          title="Transaksi Hari Ini"
          value={metrics.todayTransactions}
          color="bg-orange-500"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... (Kode Grafik tetap sama) ... */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            Penjualan 7 Hari Terakhir
          </h2>
          <Line
            options={{ responsive: true, maintainAspectRatio: true }}
            data={salesData}
          />
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">5 Produk Stok Terendah</h2>
          <Bar
            options={{
              responsive: true,
              maintainAspectRatio: true,
              indexAxis: "y",
            }}
            data={lowStockData}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
