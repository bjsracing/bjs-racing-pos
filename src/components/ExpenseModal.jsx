import { useState, useEffect } from "react";

function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit }) {
  const [expense, setExpense] = useState({
    tanggal: new Date().toISOString().slice(0, 10), // Default ke hari ini
    kategori_pengeluaran: "",
    jumlah: "",
    keterangan: "",
  });

  useEffect(() => {
    if (expenseToEdit) {
      // Format tanggal agar sesuai dengan input type="date"
      const formattedDate = new Date(expenseToEdit.tanggal)
        .toISOString()
        .slice(0, 10);
      setExpense({ ...expenseToEdit, tanggal: formattedDate });
    } else {
      setExpense({
        tanggal: new Date().toISOString().slice(0, 10),
        kategori_pengeluaran: "",
        jumlah: "",
        keterangan: "",
      });
    }
  }, [expenseToEdit, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setExpense((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...expense,
      jumlah: Number(expense.jumlah), // Pastikan jumlah adalah angka
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {expenseToEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tanggal"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Tanggal
              </label>
              <input
                id="tanggal"
                type="date"
                value={expense.tanggal}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                htmlFor="kategori_pengeluaran"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Kategori Pengeluaran
              </label>
              <input
                id="kategori_pengeluaran"
                type="text"
                value={expense.kategori_pengeluaran}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Contoh: Gaji, Listrik, Sewa"
                required
              />
            </div>
            <div>
              <label
                htmlFor="jumlah"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Jumlah (Rp)
              </label>
              <input
                id="jumlah"
                type="number"
                value={expense.jumlah}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                htmlFor="keterangan"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Keterangan
              </label>
              <textarea
                id="keterangan"
                value={expense.keterangan || ""}
                onChange={handleChange}
                rows="3"
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
              {expenseToEdit ? "Simpan Perubahan" : "Simpan Pengeluaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ExpenseModal;
