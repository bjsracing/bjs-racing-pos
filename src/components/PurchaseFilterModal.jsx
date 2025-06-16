import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const PurchaseFilterModal = ({
  isOpen,
  onClose,
  onApplyFilter,
  initialFilters,
  merekOptions,
  kategoriOptions,
  supplierOptions,
}) => {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      merek: "semua",
      kategori: "semua",
      supplier: "semua",
    };
    setFilters(resetFilters);
    onApplyFilter(resetFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Filter Produk</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="modal-filter-merek"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Merek
            </label>
            <select
              id="modal-filter-merek"
              value={filters.merek}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, merek: e.target.value }))
              }
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="semua">Semua Merek</option>
              {merekOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="modal-filter-kategori"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Kategori
            </label>
            <select
              id="modal-filter-kategori"
              value={filters.kategori}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, kategori: e.target.value }))
              }
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          {/* DIUBAH: Filter supplier diaktifkan kembali dan disesuaikan */}
          <div>
            <label
              htmlFor="modal-filter-supplier"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Supplier
            </label>
            <select
              id="modal-filter-supplier"
              value={filters.supplier}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, supplier: e.target.value }))
              }
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="semua">Semua Supplier</option>
              {/* Mengirim nama_supplier sebagai value */}
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.nama_supplier}>
                  {s.nama_supplier}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="py-2 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Reset Filter
          </button>
          <button
            onClick={handleApply}
            className="py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFilterModal;
