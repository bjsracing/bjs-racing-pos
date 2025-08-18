// src/components/ExportExcelButton.jsx

import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient.js";
import { FiDownload } from "react-icons/fi";
import { useState, useEffect } from "react"; // Tambahkan useEffect

function ExportExcelButton() {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null); // State untuk menyimpan peran pengguna

  // Ambil peran pengguna saat komponen dimuat
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  const handleExport = async () => {
    // Validasi peran pengguna
    if (userRole !== "admin" && userRole !== "owner") {
      alert("Akses ditolak. Hanya akun admin yang dapat mengekspor data.");
      return;
    }

    setLoading(true);
    // 1. Ambil semua data produk dari database
    const { data: products, error } = await supabase
      .from("products")
      .select(
        "kode, nama, kategori, harga_beli, harga_jual, stok, stok_min, status",
      );

    if (error) {
      setLoading(false);
      alert("Gagal mengambil data untuk ekspor: " + error.message);
      return;
    }

    // 2. Buat worksheet baru dari data JSON
    const worksheet = XLSX.utils.json_to_sheet(products);
    // 3. Buat workbook baru
    const workbook = XLSX.utils.book_new();
    // 4. Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Produk");

    // 5. Buat file Excel dan picu unduhan
    XLSX.writeFile(workbook, "Daftar Produk BJS.xlsx");
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400"
    >
      <FiDownload />
      <span>{loading ? "Memproses..." : "Ekspor Data Produk"}</span>
    </button>
  );
}

export default ExportExcelButton;
