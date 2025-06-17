import React, { useState, useEffect } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../supabaseClient";

// Hook 'useDebounce' untuk jeda saat mengetik
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const PurchaseOrderFilter = ({ onFilterChange }) => {
  // State untuk menampung pilihan di dropdown supplier
  const [supplierOptions, setSupplierOptions] = useState([]);

  // State untuk setiap input filter
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("semua");
  const [supplier, setSupplier] = useState("semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Debounce HANYA untuk kolom search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // useEffect ini akan "melaporkan" perubahan filter ke halaman utama
  // setiap kali ada interaksi dari pengguna (mengetik atau memilih dropdown)
  useEffect(() => {
    onFilterChange({
      searchTerm: debouncedSearchTerm,
      status,
      supplier,
      startDate,
      endDate,
    });
  }, [
    debouncedSearchTerm,
    status,
    supplier,
    startDate,
    endDate,
    onFilterChange,
  ]);

  // Mengambil daftar supplier untuk dropdown saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id, nama_supplier")
        .order("nama_supplier");
      if (data) setSupplierOptions(data);
    };
    fetchSuppliers();
  }, []);

  // Fungsi untuk mereset semua filter ke kondisi awal
  const handleReset = () => {
    setSearchTerm("");
    setStatus("semua");
    setSupplier("semua");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Kolom Pencarian */}
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-slate-600">
            Cari No. PO / Supplier
          </label>
          <input
            type="text"
            placeholder="Ketik untuk mencari otomatis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg"
          />
        </div>
        {/* Filter Status */}
        <div>
          <label className="text-sm font-medium text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg bg-white"
          >
            <option value="semua">Semua Status</option>
            <option value="Dipesan">Dipesan</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
        {/* Filter Supplier */}
        <div>
          <label className="text-sm font-medium text-slate-600">Supplier</label>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg bg-white"
          >
            <option value="semua">Semua Supplier</option>
            {supplierOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_supplier}
              </option>
            ))}
          </select>
        </div>
        {/* Filter Tanggal */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-slate-600">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg text-slate-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg text-slate-500"
            />
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
          >
            <FiRefreshCw size={16} />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderFilter;
