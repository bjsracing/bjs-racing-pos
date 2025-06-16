import { useRef } from "react";
import * as XLSX from "xlsx"; // Import library xlsx
import { FiUpload } from "react-icons/fi";

function ImportExcelButton({ onDataUpload }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
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

        // Kirim data JSON hasil baca ke parent component (Produk.jsx)
        onDataUpload(json);
      } catch (error) {
        console.error("Error reading or parsing Excel file", error);
        alert("Gagal membaca file Excel. Pastikan formatnya benar.");
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input agar bisa upload file yg sama lagi
    event.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv" // Hanya menerima file excel/csv
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
