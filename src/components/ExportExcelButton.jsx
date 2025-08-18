// src/components/ExportExcelButton.jsx

import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient.js";
import { FiDownload } from "react-icons/fi";
import { useState, useEffect } from "react";

function ExportExcelButton() {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Gunakan onAuthStateChange untuk mendengarkan perubahan sesi dan data pengguna
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleExport = async () => {
    if (userRole !== "admin" && userRole !== "owner") {
      alert("Akses ditolak. Hanya akun admin yang dapat mengekspor data.");
      return;
    }

    setLoading(true);
    // ... sisa kode handleExport tidak berubah
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

    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Produk");
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
