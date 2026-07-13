import { useState, useEffect } from "react";

const PRICE_RANGE_OPTIONS = [
  { value: "semua", label: "Semua Harga" },
  { value: "nol", label: "Rp 0 (Belum diisi)" },
  { value: "0-15000", label: "Rp 1 - Rp 15.000" },
  { value: "15000-25000", label: "Rp 15.000 - Rp 25.000" },
  { value: "25000-50000", label: "Rp 25.000 - Rp 50.000" },
  { value: "50000-100000", label: "Rp 50.000 - Rp 100.000" },
  { value: "100000+", label: "Di atas Rp 100.000" },
];

function FilterModal({
  isOpen,
  onClose,
  onApplyFilter,
  initialFilters,
  merekOptions,
  kategoriOptions,
  supplierOptions,
  ukuranOptions,
  liniProdukOptions,
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
      ukuran: "semua",
      lini_produk: "semua",
      price_range: "semua",
      supplier: "semua",
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

          {/* --- FITUR BARU: Dropdown Ukuran --- */}
          <div>
            <label
              htmlFor="filter-ukuran"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Ukuran
            </label>
            <select
              id="ukuran"
              value={filters.ukuran || "semua"}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, ukuran: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Ukuran</option>
              {(ukuranOptions || []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* --- FITUR BARU: Dropdown Lini Produk --- */}
          <div>
            <label
              htmlFor="filter-lini-produk"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Lini Produk
            </label>
            <select
              id="lini_produk"
              value={filters.lini_produk || "semua"}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, lini_produk: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Lini Produk</option>
              {(liniProdukOptions || []).map((lp) => (
                <option key={lp} value={lp}>
                  {lp}
                </option>
              ))}
            </select>
          </div>

          {/* --- FITUR BARU: Dropdown Harga Jual Range --- */}
          <div>
            <label
              htmlFor="filter-price-range"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Harga Jual
            </label>
            <select
              id="price_range"
              value={filters.price_range || "semua"}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, price_range: e.target.value }))
              }
              className="w-full p-2 border rounded bg-white"
            >
              {PRICE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
