import { useState, useEffect } from "react";
import { Routes, Route, Outlet, useNavigate, Navigate } from "react-router-dom"; // Tambahkan useNavigate dan Navigate
import { supabase } from "./supabaseClient.js";
import Navbar from "./components/Navbar.jsx";
import Header from "./components/Header.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Produk from "./pages/Produk.jsx";
import Pos from "./pages/Pos.jsx";
import PenjualanGrosir from "./pages/PenjualanGrosir.jsx";
import FormPesananGrosir from "./pages/FormPesananGrosir.jsx";
import DetailPesananGrosir from "./pages/DetailPesananGrosir.jsx";
import FormNotaGrosir from "./pages/FormNotaGrosir.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Pembelian from "./pages/Pembelian.jsx";
import FormPembelian from "./pages/FormPembelian.jsx";
import DetailPembelian from "./pages/DetailPembelian.jsx";
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

// Komponen layout utama yang tetap sama
function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="h-screen bg-orange-100 flex">
      <Navbar
        isOpen={isSidebarOpen}
        onLinkClick={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Komponen utama aplikasi
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk mendapatkan sesi dan memvalidasi peran pengguna
    const checkSessionAndRole = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      // Jika ada sesi, periksa peran di tabel profiles
      if (currentSession) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentSession.user.id)
          .single();

        // Cek apakah peran valid atau ada error
        if (error || !profile || !profile.role) {
          console.error(
            "Kesalahan mendapatkan profil atau peran tidak ada:",
            error,
          );
          await supabase.auth.signOut(); // Logout jika profil atau peran tidak ditemukan
          setSession(null);
        } else {
          setSession(currentSession);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    };

    checkSessionAndRole();

    // Listener real-time untuk perubahan sesi
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Panggil kembali fungsi validasi saat ada perubahan
      checkSessionAndRole();
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

      {/* RUTE YANG MEMERLUKAN AUTENTIKASI */}
      {session ? (
        <>
          <Route path="/cetak/:tipe/:id" element={<CetakDokumenPage />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<Pos />} />
            {/* ... rute lain Anda di sini ... */}
            <Route path="penjualan-grosir">
              <Route index element={<PenjualanGrosir />} />
              <Route path="baru" element={<FormPesananGrosir />} />
              <Route path="edit/:soId" element={<FormPesananGrosir />} />
              <Route path="detail/:soId" element={<DetailPesananGrosir />} />
              <Route path="nota/baru/:orderId" element={<FormNotaGrosir />} />
            </Route>
            <Route path="nota/detail/:invoiceId" element={<DetailNotaPage />} />
            <Route path="produk">
              <Route index element={<Produk />} />
              <Route path="riwayat/:productId" element={<RiwayatProduk />} />
            </Route>
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="pembelian" element={<Pembelian />} />
            <Route path="pembelian/baru" element={<FormPembelian />} />
            <Route path="pembelian/edit/:poId" element={<FormPembelian />} />
            <Route
              path="pembelian/detail/:poId"
              element={<DetailPembelian />}
            />
            <Route path="pelanggan" element={<Customers />} />
            <Route
              path="permintaan-pelanggan"
              element={<PermintaanPelanggan />}
            />
            <Route path="pengeluaran" element={<Expenses />} />
            <Route path="/laporan/laba-rugi" element={<LaporanLabaRugi />} />
            <Route
              path="laporan-produk-terlaris"
              element={<LaporanProdukTerlaris />}
            />
            <Route
              path="laporan-produk-pilok"
              element={<LaporanProdukPilok />}
            />
            <Route path="histori-transaksi" element={<TransactionHistory />} />
            <Route path="histori-stok" element={<StockHistory />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </>
      ) : (
        // Redirect ke login jika tidak ada sesi
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
