import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiFilter,
  FiAward,
  FiSearch,
  FiTag, // <-- 1. TAMBAHKAN IKON BARU
} from "react-icons/fi";
import CustomerModal from "../components/CustomerModal.jsx";
import DebtPaymentModal from "../components/DebtPaymentModal.jsx";
import CustomerFilterModal from "../components/CustomerFilterModal.jsx";
import SpecialPriceModal from "../components/SpecialPriceModal.jsx"; // <-- 2. IMPOR KOMPONEN MODAL BARU

const tierColors = {
  Umum: "bg-slate-100 text-slate-800",
  Bronze: "bg-orange-100 text-orange-800",
  Silver: "bg-gray-200 text-gray-800",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-purple-100 text-purple-800",
};

function Customers() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [debtModalCustomer, setDebtModalCustomer] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: "semua",
    piutang: "semua",
    tingkatan: "semua",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // <-- 3. TAMBAHKAN STATE UNTUK MODAL HARGA SPESIAL
  const [isSpecialPriceModalOpen, setIsSpecialPriceModalOpen] = useState(false);
  const [customerForSpecialPrice, setCustomerForSpecialPrice] = useState(null);

  async function getCustomersData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_overview")
      .select("*")
      .order("nama_pelanggan", { ascending: true });
    if (error) console.error("Error fetching customer overview:", error);
    else setAllCustomers(data || []);
    setLoading(false);
  }
  useEffect(() => {
    getCustomersData();
  }, []);

  useEffect(() => {
    let result = allCustomers;
    // Terapkan filter
    if (activeFilters.status !== "semua") {
      result = result.filter((c) => c.status === activeFilters.status);
    }
    if (activeFilters.tingkatan !== "semua") {
      result = result.filter((c) => c.tingkatan === activeFilters.tingkatan);
    }
    if (activeFilters.piutang === "punya_hutang") {
      result = result.filter((c) => c.total_piutang > 0);
    } else if (activeFilters.piutang === "tidak_punya_hutang") {
      result = result.filter((c) => c.total_piutang <= 0);
    }
    // Terapkan pencarian setelah filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.nama_pelanggan &&
            c.nama_pelanggan.toLowerCase().includes(lowercasedTerm)) ||
          (c.telepon && c.telepon.includes(lowercasedTerm)),
      );
    }
    setFilteredCustomers(result);
  }, [allCustomers, activeFilters, searchTerm]);

  const handleOpenAddModal = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };
  const handleOpenDebtModal = (customer) => {
    setDebtModalCustomer(customer);
  };

  // <-- 4. TAMBAHKAN FUNGSI HANDLER UNTUK MODAL BARU
  const handleOpenSpecialPriceModal = (customer) => {
    setCustomerForSpecialPrice(customer);
    setIsSpecialPriceModalOpen(true);
  };

  const handleSaveCustomer = async (customerData) => {
    if (customerData.id) {
      const {
        total_transaksi,
        total_piutang,
        total_laba_dihasilkan,
        tingkatan,
        ...updateData
      } = customerData;
      const { error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", customerData.id);
      if (error) {
        alert("Error mengupdate pelanggan: " + error.message);
      } else {
        alert("Pelanggan diperbarui!");
      }
    } else {
      delete customerData.id;
      const { error } = await supabase.from("customers").insert([customerData]);
      if (error) alert("Error: " + error.message);
      else alert("Pelanggan ditambahkan!");
    }
    setIsModalOpen(false);
    getCustomersData();
  };
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`Yakin ingin menghapus pelanggan "${customerName}"?`)) {
      await supabase.from("customers").delete().eq("id", customerId);
      alert("Pelanggan dihapus.");
      getCustomersData();
    }
  };

  if (loading) return <p>Memuat data...</p>;

  return (
    <div>
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />
      <DebtPaymentModal
        isOpen={debtModalCustomer !== null}
        onClose={() => {
          setDebtModalCustomer(null);
          getCustomersData();
        }}
        customer={debtModalCustomer}
      />
      <CustomerFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilter={setActiveFilters}
        currentFilters={activeFilters}
      />

      {/* <-- 5. RENDER KOMPONEN MODAL BARU --> */}
      <SpecialPriceModal
        isOpen={isSpecialPriceModalOpen}
        onClose={() => setIsSpecialPriceModalOpen(false)}
        customer={customerForSpecialPrice}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50"
          >
            <FiFilter />
            <span>Filter</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <FiPlus />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama atau Telepon Pelanggan..."
            className="w-full p-2 pl-10 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-center">Memuat data...</p>}
      {!loading && filteredCustomers.length === 0 && (
        <p className="text-center text-slate-500 py-10">
          Tidak ada data pelanggan yang cocok.
        </p>
      )}

      {/* Tampilan Tabel untuk Desktop */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nama Pelanggan / Toko
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tipe
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tingkatan
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Piutang
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    <p className="font-semibold text-slate-900">
                      {customer.nama_pelanggan}
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.nama_pemilik
                        ? `(Pemilik: ${customer.nama_pemilik})`
                        : customer.telepon}
                    </p>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${customer.tipe_pelanggan === "Grosir" ? "bg-yellow-300 text-slate-1000" : "bg-blue-500 text-white"}`}
                    >
                      {customer.tipe_pelanggan}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm">
                    <span
                      className={`px-2 py-1 font-bold leading-tight rounded-full text-xs ${tierColors[customer.tingkatan] || "bg-slate-100"}`}
                    >
                      <FiAward className="inline mr-1 mb-0.5" />
                      {customer.tingkatan}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm font-semibold text-red-600">
                    {customer.total_piutang > 0
                      ? `Rp ${new Intl.NumberFormat("id-ID").format(customer.total_piutang)}`
                      : "-"}
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                    <span
                      className={`px-2 py-1 font-semibold leading-tight rounded-full ${customer.status === "Aktif" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-sm text-center whitespace-nowrap">
                    {/* <-- 6. TAMBAHKAN TOMBOL AKSI BARU UNTUK HARGA SPESIAL (DESKTOP) --> */}
                    <button
                      onClick={() => handleOpenSpecialPriceModal(customer)}
                      title="Atur Harga Spesial"
                      className="text-indigo-500 hover:text-indigo-700 mr-3 disabled:text-slate-300"
                      disabled={customer.tipe_pelanggan !== "Grosir"}
                    >
                      <FiTag size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenDebtModal(customer)}
                      title="Kelola Piutang"
                      className="text-green-500 hover:text-green-700 mr-3 disabled:text-slate-300"
                      disabled={
                        !customer.total_piutang || customer.total_piutang <= 0
                      }
                    >
                      <FiDollarSign size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      title="Edit Pelanggan"
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteCustomer(
                          customer.id,
                          customer.nama_pelanggan,
                        )
                      }
                      title="Hapus Pelanggan"
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

      {/* Tampilan Kartu untuk Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {!loading &&
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-slate-900">
                    {customer.nama_pelanggan}
                  </p>
                  <p className="text-sm text-slate-500">
                    {customer.nama_pemilik
                      ? `(Pemilik: ${customer.nama_pemilik})`
                      : customer.telepon}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${customer.status === "Aktif" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
                >
                  {customer.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${customer.tipe_pelanggan === "Grosir" ? "bg-yellow-300 text-slate-1000" : "bg-blue-500 text-white"}`}
                >
                  {customer.tipe_pelanggan}
                </span>
                <span
                  className={`px-2 py-1 font-bold leading-tight rounded-full text-xs ${tierColors[customer.tingkatan] || "bg-slate-100"}`}
                >
                  <FiAward className="inline mr-1 mb-0.5" />
                  {customer.tingkatan}
                </span>
              </div>

              <div className="mt-4 border-t pt-2">
                <div className="text-sm flex justify-between">
                  <span className="text-slate-500">Total Piutang:</span>
                  <span className="font-bold text-red-600">
                    {customer.total_piutang > 0
                      ? `Rp ${new Intl.NumberFormat("id-ID").format(customer.total_piutang)}`
                      : "-"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {/* <-- 7. TAMBAHKAN TOMBOL AKSI BARU UNTUK HARGA SPESIAL (MOBILE) --> */}
                <button
                  onClick={() => handleOpenSpecialPriceModal(customer)}
                  title="Atur Harga Spesial"
                  className="text-indigo-500 hover:text-indigo-700 p-2 disabled:text-slate-300"
                  disabled={customer.tipe_pelanggan !== "Grosir"}
                >
                  <FiTag size={20} />
                </button>
                <button
                  onClick={() => handleOpenDebtModal(customer)}
                  title="Kelola Piutang"
                  className="text-green-500 hover:text-green-700 p-2 disabled:text-slate-300"
                  disabled={
                    !customer.total_piutang || customer.total_piutang <= 0
                  }
                >
                  <FiDollarSign size={20} />
                </button>
                <button
                  onClick={() => handleOpenEditModal(customer)}
                  title="Edit Pelanggan"
                  className="text-blue-500 hover:text-blue-700 p-2"
                >
                  <FiEdit size={20} />
                </button>
                <button
                  onClick={() =>
                    handleDeleteCustomer(customer.id, customer.nama_pelanggan)
                  }
                  title="Hapus Pelanggan"
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
export default Customers;
