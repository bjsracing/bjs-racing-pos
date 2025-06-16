import { useState, useEffect } from "react";

function SupplierModal({ isOpen, onClose, onSave, supplierToEdit }) {
  const [supplier, setSupplier] = useState({
    nama_supplier: "",
    kontak_person: "",
    telepon: "",
    alamat: "",
    catatan: "",
  });

  useEffect(() => {
    if (supplierToEdit) {
      setSupplier(supplierToEdit);
    } else {
      setSupplier({
        nama_supplier: "",
        kontak_person: "",
        telepon: "",
        alamat: "",
        catatan: "",
      });
    }
  }, [supplierToEdit, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSupplier((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(supplier);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {supplierToEdit ? "Edit Supplier" : "Tambah Supplier Baru"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nama_supplier"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Nama Supplier
              </label>
              <input
                id="nama_supplier"
                type="text"
                value={supplier.nama_supplier}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                htmlFor="kontak_person"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Kontak Person
              </label>
              <input
                id="kontak_person"
                type="text"
                value={supplier.kontak_person || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                htmlFor="telepon"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Telepon
              </label>
              <input
                id="telepon"
                type="text"
                value={supplier.telepon || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                htmlFor="alamat"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Alamat
              </label>
              <textarea
                id="alamat"
                value={supplier.alamat || ""}
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border rounded"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="catatan"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Catatan
              </label>
              <textarea
                id="catatan"
                value={supplier.catatan || ""}
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border rounded"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
            >
              {supplierToEdit ? "Simpan Perubahan" : "Simpan Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierModal;
