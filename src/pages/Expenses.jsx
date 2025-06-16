import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import ExpenseModal from "../components/ExpenseModal.jsx";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  async function getExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("tanggal", { ascending: false }); // Urutkan berdasarkan tanggal

    if (error) console.error("Error fetching expenses:", error);
    else setExpenses(data);
    setLoading(false);
  }

  useEffect(() => {
    getExpenses();
  }, []);

  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (expenseData) => {
    if (expenseData.id) {
      const { error } = await supabase
        .from("expenses")
        .update(expenseData)
        .eq("id", expenseData.id);
      if (error) alert("Error: " + error.message);
      else alert("Pengeluaran diperbarui!");
    } else {
      delete expenseData.id;
      const { error } = await supabase.from("expenses").insert([expenseData]);
      if (error) alert("Error: " + error.message);
      else alert("Pengeluaran ditambahkan!");
    }
    setIsModalOpen(false);
    getExpenses();
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Yakin ingin menghapus catatan pengeluaran ini?")) {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);
      if (error) alert("Error: " + error.message);
      else alert("Pengeluaran dihapus.");
      getExpenses();
    }
  };

  if (loading) return <p>Memuat data...</p>;

  // GANTI SELURUH BLOK 'return' ANDA DENGAN INI:
  return (
    <div>
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengeluaran</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <FiPlus />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {loading && <p className="text-center">Memuat data...</p>}
      {!loading && expenses.length === 0 && (
        <div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-md">
          Belum ada data pengeluaran.
        </div>
      )}

      {/* Tampilan Tabel untuk Desktop */}
      {!loading && expenses.length > 0 && (
        <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-slate-200">
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {new Date(expense.tanggal).toLocaleDateString("id-ID", {
                      dateStyle: "long",
                    })}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {expense.kategori_pengeluaran}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm font-semibold">
                    Rp {new Intl.NumberFormat("id-ID").format(expense.jumlah)}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {expense.keterangan}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                    <button
                      onClick={() => handleOpenEditModal(expense)}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tampilan Kartu untuk Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {!loading &&
          expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">
                    {expense.kategori_pengeluaran}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(expense.tanggal).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <p className="font-semibold text-lg text-red-600">
                  - Rp {new Intl.NumberFormat("id-ID").format(expense.jumlah)}
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-2 italic">
                {expense.keterangan || "Tidak ada keterangan."}
              </p>
              <div className="mt-4 flex justify-end gap-2 border-t pt-2">
                <button
                  onClick={() => handleOpenEditModal(expense)}
                  title="Edit Pengeluaran"
                  className="text-blue-500 hover:text-blue-700 p-2"
                >
                  <FiEdit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  title="Hapus Pengeluaran"
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Expenses;
