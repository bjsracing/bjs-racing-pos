import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import SupplierModal from "../components/SupplierModal.jsx";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null); // <-- State untuk data yang akan diedit

  async function getSuppliers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("nama_supplier", { ascending: true });

    if (error) console.error("Error fetching suppliers:", error);
    else setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => {
    getSuppliers();
  }, []);

  // Fungsi untuk membuka modal dalam mode 'Tambah'
  const handleOpenAddModal = () => {
    setSupplierToEdit(null); // Pastikan data edit kosong
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka modal dalam mode 'Edit'
  const handleOpenEditModal = (supplier) => {
    setSupplierToEdit(supplier); // Isi dengan data supplier yang dipilih
    setIsModalOpen(true);
  };

  // Fungsi untuk menyimpan (bisa untuk Tambah atau Edit)
  const handleSaveSupplier = async (supplierData) => {
    if (supplierData.id) {
      // Jika ada ID, berarti mode EDIT
      const { error } = await supabase
        .from("suppliers")
        .update(supplierData)
        .eq("id", supplierData.id);
      if (error) alert("Error mengupdate supplier: " + error.message);
      else alert("Supplier berhasil diperbarui!");
    } else {
      // Jika tidak ada ID, berarti mode TAMBAH
      delete supplierData.id;
      const { error } = await supabase.from("suppliers").insert([supplierData]);
      if (error) alert("Error menambahkan supplier: " + error.message);
      else alert("Supplier berhasil ditambahkan!");
    }
    setIsModalOpen(false);
    getSuppliers(); // Refresh tabel
  };

  // Fungsi untuk MENGHAPUS supplier
  const handleDeleteSupplier = async (supplierId, supplierName) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus supplier "${supplierName}"?`,
      )
    ) {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);
      if (error) {
        alert("Error menghapus supplier: " + error.message);
      } else {
        alert("Supplier berhasil dihapus.");
        getSuppliers(); // Refresh tabel
      }
    }
  };

  if (loading) return <p>Memuat data...</p>;

  return (
    <div>
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit} // Kirim data supplier ke modal
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Supplier</h1>
        <button
          onClick={handleOpenAddModal} // Panggil fungsi untuk mode 'Tambah'
          className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <FiPlus />
          <span>Tambah Supplier</span>
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nama Supplier
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Kontak Person
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Telepon
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {supplier.nama_supplier}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {supplier.kontak_person}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    {supplier.telepon}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                    {/* Tombol Edit dan Hapus sekarang berfungsi */}
                    <button
                      onClick={() => handleOpenEditModal(supplier)}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteSupplier(
                          supplier.id,
                          supplier.nama_supplier,
                        )
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10 text-slate-500">
                  Belum ada data supplier. Silakan tambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Suppliers;
