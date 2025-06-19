import { useState, useEffect } from "react";

// Menerima prop baru: initialFilters & supplierOptions
function FilterModal({
  isOpen,
  onClose,
  onApplyFilter,
  initialFilters,
  merekOptions,
  kategoriOptions,
  supplierOptions,
}) {
  // State filter sekarang diinisialisasi dari props
  const [filters, setFilters] = useState(initialFilters);

  // useEffect untuk me-reset state lokal jika modal dibuka dengan filter yang berbeda
  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      merek: "semua",
      kategori: "semua",
      supplier: "semua", // Ditambahkan
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
          {/* Dropdown Merek (Sudah Benar) */}
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
              {merekOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Kategori (Sudah Benar) */}
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
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* --- FITUR BARU: Dropdown Supplier --- */}
          <div>
            <label
              htmlFor="filter-supplier"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Supplier
            </label>
            <select
              id="supplier"
              value={filters.supplier}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, supplier: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Supplier</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.nama_supplier}>
                  {s.nama_supplier}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Status (dengan perbaikan) */}
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
              {/* --- BUG 3 FIX: Opsi Diarsipkan Ditambahkan --- */}
              <option value="Diarsipkan">Diarsipkan</option>
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
