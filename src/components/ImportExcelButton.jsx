// src/components/ImportExcelButton.jsx

import { useRef, useState, useEffect } from "react"; // Tambahkan useState dan useEffect
import * as XLSX from "xlsx";
import { FiUpload } from "react-icons/fi";
import { supabase } from "../supabaseClient.js"; // Import supabase

function ImportExcelButton({ onDataUpload }) {
  const fileInputRef = useRef(null);
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

  const handleFileChange = (event) => {
    // Validasi peran pengguna sebelum melanjutkan
    if (userRole !== "admin" && userRole !== "owner") {
      alert("Akses ditolak. Hanya akun admin yang dapat mengimpor data.");
      // Hentikan proses
      event.target.value = "";
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        onDataUpload(json);
      } catch (error) {
        console.error("Error reading or parsing Excel file", error);
        alert("Gagal membaca file Excel. Pastikan formatnya benar.");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
      >
        <FiUpload />
        <span>Impor Data Produk</span>
      </button>
    </>
  );
}

export default ImportExcelButton;
