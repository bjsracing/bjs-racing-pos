import { useState, useEffect } from "react";

function CustomerModal({ isOpen, onClose, onSave, customerToEdit }) {
  const [customer, setCustomer] = useState({
    nama_pelanggan: "",
    telepon: "",
    alamat: "",
    catatan: "",
    status: "Aktif",
  });

  useEffect(() => {
    if (customerToEdit) {
      setCustomer(customerToEdit);
    } else {
      setCustomer({
        nama_pelanggan: "",
        telepon: "",
        alamat: "",
        catatan: "",
        status: "Aktif",
      });
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCustomer((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(customer);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {customerToEdit ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nama_pelanggan"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Nama Pelanggan
              </label>
              <input
                id="nama_pelanggan"
                type="text"
                value={customer.nama_pelanggan}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
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
                value={customer.telepon || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            {/* --- FIELD STATUS YANG DIMINTA --- */}
            <div>
              <label
                htmlFor="status"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="status"
                value={customer.status}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
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
                value={customer.alamat || ""}
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
                value={customer.catatan || ""}
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
              {customerToEdit ? "Simpan Perubahan" : "Simpan Pelanggan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerModal;
