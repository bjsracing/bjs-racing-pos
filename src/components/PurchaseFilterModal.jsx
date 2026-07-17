import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import SearchableSelect from "./SearchableSelect";

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
          <SearchableSelect
            label="Merek"
            value={filters.merek}
            options={merekOptions}
            placeholder="Cari merek..."
            allLabel="Semua Merek"
            onSelect={(val) =>
              setFilters((prev) => ({ ...prev, merek: val }))
            }
          />
          <SearchableSelect
            label="Kategori"
            value={filters.kategori}
            options={kategoriOptions}
            placeholder="Cari kategori..."
            allLabel="Semua Kategori"
            onSelect={(val) =>
              setFilters((prev) => ({ ...prev, kategori: val }))
            }
          />
          <SearchableSelect
            label="Supplier"
            value={filters.supplier}
            options={supplierOptions.map((s) => s.nama_supplier)}
            placeholder="Cari supplier..."
            allLabel="Semua Supplier"
            onSelect={(val) =>
              setFilters((prev) => ({ ...prev, supplier: val }))
            }
          />
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
