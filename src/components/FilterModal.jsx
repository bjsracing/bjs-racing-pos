import SearchableSelect from "./SearchableSelect";
import PriceRangeSlider from "./PriceRangeSlider";

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

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
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
          <SearchableSelect
            label="Merek"
            value={filters.merek}
            options={opts.merek || []}
            placeholder="Cari merek..."
            allLabel="Semua Merek"
            onSelect={(val) => handleChange("merek", val)}
          />
          <SearchableSelect
            label="Kategori"
            value={filters.kategori}
            options={opts.kategori || []}
            placeholder="Cari kategori..."
            allLabel="Semua Kategori"
            onSelect={(val) => handleChange("kategori", val)}
          />
          <SearchableSelect
            label="Lini Produk"
            value={filters.lini_produk || "semua"}
            options={opts.lini_produk || []}
            placeholder="Cari lini produk..."
            allLabel="Semua Lini Produk"
            onSelect={(val) => handleChange("lini_produk", val)}
          />
          <SearchableSelect
            label="Ukuran"
            value={filters.ukuran || "semua"}
            options={opts.ukuran || []}
            placeholder="Cari ukuran..."
            allLabel="Semua Ukuran"
            onSelect={(val) => handleChange("ukuran", val)}
          />
          <SearchableSelect
            label="Supplier"
            value={filters.supplier || "semua"}
            options={opts.supplier || []}
            placeholder="Cari supplier..."
            allLabel="Semua Supplier"
            onSelect={(val) => handleChange("supplier", val)}
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Harga Jual
            </label>
            <PriceRangeSlider
              value={filters.price_range || "semua"}
              priceCounts={priceCounts}
              onChange={(val) => handleChange("price_range", val)}
            />
          </div>

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
