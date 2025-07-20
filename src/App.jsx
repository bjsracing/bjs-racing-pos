import { useState, useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import Navbar from "./components/Navbar.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Produk from "./pages/Produk.jsx";
import Pos from "./pages/Pos.jsx";
import PenjualanGrosir from "./pages/PenjualanGrosir.jsx";
import FormPesananGrosir from "./pages/FormPesananGrosir.jsx";
import DetailPesananGrosir from "./pages/DetailPesananGrosir.jsx";
import FormNotaGrosir from "./pages/FormNotaGrosir.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Pembelian from "./pages/Pembelian.jsx"; // <-- 1. IMPORT HALAMAN BARU
import FormPembelian from "./pages/FormPembelian.jsx"; // <-- 1. IMPORT HALAMAN FORMULIR
import DetailPembelian from "./pages/DetailPembelian.jsx"; // <-- 1. IMPORT HALAMAN BARU
import DetailNotaPage from "./pages/DetailNotaPage.jsx";
import Customers from "./pages/Customers.jsx";
import Login from "./pages/Login.jsx";
import TransactionHistory from "./pages/TransactionHistory.jsx";
import StockHistory from "./pages/StockHistory.jsx";
import Expenses from "./pages/Expenses.jsx";
import LaporanLabaRugi from "./pages/LaporanLabaRugi.jsx";
import PermintaanPelanggan from "./pages/PermintaanPelanggan.jsx";
import LaporanProdukTerlaris from "./pages/LaporanProdukTerlaris";
import LaporanProdukPilok from "./pages/LaporanProdukPilok";
import RiwayatProduk from "./pages/RiwayatProduk.jsx";
import CetakDokumenPage from "./pages/CetakDokumenPage.jsx";

function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-orange-100 flex">
      {/* Navbar sekarang menjadi komponen utama yang mengontrol dirinya sendiri */}
      <Navbar
        isOpen={isSidebarOpen}
        onLinkClick={() => setSidebarOpen(false)}
      />

      {/* Wrapper untuk konten utama */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header sekarang menjadi bagian dari konten */}
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />

        {/* Main content area sekarang bisa di-scroll secara independen */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-800 text-white">
        Memuat Sesi...
      </div>
    );
  }

  // Ganti seluruh blok <Routes> Anda dengan ini
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* RUTE UNTUK HALAMAN CETAK (DI LUAR MAIN LAYOUT) */}
      <Route
        path="/cetak/:tipe/:id"
        element={
          <ProtectedRoute session={session}>
            <CetakDokumenPage />
          </ProtectedRoute>
        }
      />

      {/* RUTE UNTUK SEMUA HALAMAN DENGAN TATA LETAK UTAMA */}
      <Route
        path="/"
        element={
          <ProtectedRoute session={session}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<Pos />} />

        <Route path="penjualan-grosir">
          <Route index element={<PenjualanGrosir />} />
          <Route path="baru" element={<FormPesananGrosir />} />
          <Route path="edit/:soId" element={<FormPesananGrosir />} />
          <Route path="detail/:soId" element={<DetailPesananGrosir />} />
          <Route path="nota/baru/:orderId" element={<FormNotaGrosir />} />
        </Route>

        {/* Path untuk detail nota diperbaiki dan dipindah ke sini */}
        <Route path="nota/detail/:invoiceId" element={<DetailNotaPage />} />

        <Route path="produk">
          <Route index element={<Produk />} />
          <Route path="riwayat/:productId" element={<RiwayatProduk />} />
        </Route>

        <Route path="suppliers" element={<Suppliers />} />
        <Route path="pembelian" element={<Pembelian />} />
        <Route path="pembelian/baru" element={<FormPembelian />} />
        <Route path="pembelian/edit/:poId" element={<FormPembelian />} />
        <Route path="pembelian/detail/:poId" element={<DetailPembelian />} />
        <Route path="pelanggan" element={<Customers />} />
        <Route path="permintaan-pelanggan" element={<PermintaanPelanggan />} />
        <Route path="pengeluaran" element={<Expenses />} />
        <Route path="/laporan/laba-rugi" element={<LaporanLabaRugi />} />
        <Route
          path="laporan-produk-terlaris"
          element={<LaporanProdukTerlaris />}
        />
        <Route path="laporan-produk-pilok" element={<LaporanProdukPilok />} />
        <Route path="histori-transaksi" element={<TransactionHistory />} />
        <Route path="histori-stok" element={<StockHistory />} />

        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
