import { useState, useEffect } from "react";

function CustomerFilterModal({
  isOpen,
  onClose,
  onApplyFilter,
  currentFilters,
}) {
  const [filters, setFilters] = useState(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      status: "semua",
      piutang: "semua",
      tingkatan: "semua",
    };
    onApplyFilter(defaultFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Filter Pelanggan</h2>
        <div className="space-y-4">
          {/* --- FILTER TINGKATAN YANG DIMINTA --- */}
          <div>
            <label
              htmlFor="tingkatan"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Tingkatan Pelanggan
            </label>
            <select
              id="tingkatan"
              value={filters.tingkatan}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Tingkatan</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
              <option value="Umum">Umum</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="status"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Status Pelanggan
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="piutang"
              className="block mb-1 text-sm font-medium text-slate-700"
            >
              Status Piutang
            </label>
            <select
              id="piutang"
              value={filters.piutang}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="semua">Semua</option>
              <option value="punya_hutang">Punya Hutang</option>
              <option value="tidak_punya_hutang">Tidak Punya Hutang</option>
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
export default CustomerFilterModal;

