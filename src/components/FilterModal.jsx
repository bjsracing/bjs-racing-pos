// FilterModal.jsx (Versi Perbaikan)
import { useState } from "react";

// 1. Props diubah: tidak lagi menerima `products`, tapi langsung `merekOptions` & `kategoriOptions`
function FilterModal({
  isOpen,
  onClose,
  onApplyFilter,
  merekOptions,
  kategoriOptions,
}) {
  const [filters, setFilters] = useState({
    merek: "semua",
    kategori: "semua",
    status: "semua",
  });

  // 2. useEffect untuk memproses `products` sudah DIHAPUS karena tidak diperlukan lagi.

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      merek: "semua",
      kategori: "semua",
      status: "semua",
    };
    setFilters(defaultFilters);
    onApplyFilter(defaultFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Filter Produk</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="filter-merek"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Merek
            </label>
            <select
              id="merek"
              value={filters.merek}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, merek: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Merek</option>
              {/* Langsung menggunakan prop merekOptions */}
              {merekOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-kategori"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Kategori
            </label>
            <select
              id="kategori"
              value={filters.kategori}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, kategori: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Kategori</option>
              {/* Langsung menggunakan prop kategoriOptions */}
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          {/* ... Sisa JSX untuk Status, Reset, Terapkan, tetap SAMA ... */}
          <div>
            <label
              htmlFor="filter-status"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Status Produk
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={handleReset}
            className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
