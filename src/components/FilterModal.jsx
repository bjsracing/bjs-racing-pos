import { useState, useEffect } from "react";

const PRICE_RANGE_OPTIONS = [
  { value: "semua", label: "Semua Harga", countKey: null },
  { value: "nol", label: "Rp 0 (Belum diisi)", countKey: "nol" },
  { value: "0-15000", label: "Rp 1 - Rp 15.000", countKey: "1-15k" },
  { value: "15000-25000", label: "Rp 15.000 - Rp 25.000", countKey: "15k-25k" },
  { value: "25000-50000", label: "Rp 25.000 - Rp 50.000", countKey: "25k-50k" },
  { value: "50000-100000", label: "Rp 50.000 - Rp 100.000", countKey: "50k-100k" },
  { value: "100000+", label: "Di atas Rp 100.000", countKey: "100k+" },
];

function FilterModal({
  isOpen,
  onClose,
  onFilterChange,
  onResetFilters,
  filters,
  cascadeOptions,
  priceCounts,
}) {
  if (!isOpen) return null;

  const opts = cascadeOptions || {};
  const counts = priceCounts || {};

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  const renderOptions = (items) => {
    if (!items || items.length === 0) return null;
    return items.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Filter Produk</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4">
          {/* 1. Merek (Root) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Merek
            </label>
            <select
              value={filters.merek}
              onChange={(e) => handleChange("merek", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Merek</option>
              {renderOptions(opts.merek)}
            </select>
          </div>

          {/* 2. Kategori (filtered by: Merek) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Kategori
            </label>
            <select
              value={filters.kategori}
              onChange={(e) => handleChange("kategori", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Kategori</option>
              {renderOptions(opts.kategori)}
            </select>
          </div>

          {/* 3. Lini Produk (filtered by: Merek + Kategori) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Lini Produk
            </label>
            <select
              value={filters.lini_produk || "semua"}
              onChange={(e) => handleChange("lini_produk", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Lini Produk</option>
              {renderOptions(opts.lini_produk)}
            </select>
          </div>

          {/* 4. Ukuran (filtered by: Merek + Kategori + Lini) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Ukuran
            </label>
            <select
              value={filters.ukuran || "semua"}
              onChange={(e) => handleChange("ukuran", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Ukuran</option>
              {renderOptions(opts.ukuran)}
            </select>
          </div>

          {/* 5. Supplier (filtered by: all above) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Supplier
            </label>
            <select
              value={filters.supplier || "semua"}
              onChange={(e) => handleChange("supplier", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Supplier</option>
              {renderOptions(opts.supplier)}
            </select>
          </div>

          {/* 6. Harga Jual (with badge count) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Harga Jual
            </label>
            <select
              value={filters.price_range || "semua"}
              onChange={(e) => handleChange("price_range", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              {PRICE_RANGE_OPTIONS.map((o) => {
                const count = o.countKey ? counts[o.countKey] : null;
                return (
                  <option key={o.value} value={o.value}>
                    {o.label}
                    {count != null ? ` (${count.toLocaleString("id-ID")})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 7. Status (independent) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Status Produk
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Tidak Aktif</option>
              <option value="Diarsipkan">Diarsipkan</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleReset}
            className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
