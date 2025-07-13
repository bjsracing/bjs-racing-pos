import { useState, useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import Navbar from "./components/Navbar.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Produk from "./pages/Produk.jsx";
import Pos from "./pages/Pos.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Pembelian from "./pages/Pembelian.jsx"; // <-- 1. IMPORT HALAMAN BARU
import FormPembelian from "./pages/FormPembelian.jsx"; // <-- 1. IMPORT HALAMAN FORMULIR
import DetailPembelian from "./pages/DetailPembelian.jsx"; // <-- 1. IMPORT HALAMAN BARU
import Customers from "./pages/Customers.jsx";
import Login from "./pages/Login.jsx";
import TransactionHistory from "./pages/TransactionHistory.jsx";
import StockHistory from "./pages/StockHistory.jsx";
import Expenses from "./pages/Expenses.jsx";
import Reports from "./pages/Reports.jsx";
import PermintaanPelanggan from "./pages/PermintaanPelanggan.jsx";
import LaporanProdukTerlaris from "./pages/LaporanProdukTerlaris";
import LaporanProdukPilok from "./pages/LaporanProdukPilok";
import RiwayatProduk from "./pages/RiwayatProduk.jsx";

function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <Navbar
        isOpen={isSidebarOpen}
        onLinkClick={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
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

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        <Route path="produk">
          <Route index element={<Produk />} />
          <Route path="riwayat/:productId" element={<RiwayatProduk />} />
        </Route>
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="pembelian" element={<Pembelian />} />{" "}
        {/* <-- 2. TAMBAHKAN ROUTE INI */}
        <Route path="pembelian/baru" element={<FormPembelian />} />{" "}
        {/* <-- 2. TAMBAHKAN ROUTE INI */}
        <Route path="pembelian/edit/:poId" element={<FormPembelian />} />
        <Route
          path="pembelian/detail/:poId"
          element={<DetailPembelian />}
        />{" "}
        {/* <-- 2. TAMBAHKAN ROUTE DINAMIS INI */}
        <Route path="pelanggan" element={<Customers />} />
        <Route path="permintaan-pelanggan" element={<PermintaanPelanggan />} />
        <Route path="pengeluaran" element={<Expenses />} />
        <Route path="laporan" element={<Reports />} />
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
