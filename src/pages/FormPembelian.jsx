import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiSave, FiPlus, FiTrash2, FiSearch, FiFilter } from "react-icons/fi";
import PurchaseFilterModal from "../components/PurchaseFilterModal.jsx";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const FormPembelian = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    merek: "semua",
    kategori: "semua",
    supplier: "semua",
  });

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [merekOptions, setMerekOptions] = useState([]);
  const [kategoriOptions, setKategoriOptions] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, nama_supplier");
      if (suppliersData) setSupplierOptions(suppliersData);

      const { data: mereksData } = await supabase
        .from("products")
        .select("merek");
      if (mereksData) {
        const uniqueMereks = [
          ...new Set(mereksData.map((item) => item.merek).filter(Boolean)),
        ];
        setMerekOptions(uniqueMereks.sort());
      }

      const { data: kategorisData } = await supabase
        .from("products")
        .select("kategori");
      if (kategorisData) {
        const uniqueKategoris = [
          ...new Set(
            kategorisData.map((item) => item.kategori).filter(Boolean),
          ),
        ];
        setKategoriOptions(uniqueKategoris.sort());
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // ==================================================================
  // === BLOK YANG DIPERBAIKI SECARA TOTAL ADA DI SINI ===
  // ==================================================================
  useEffect(() => {
    const searchProducts = async () => {
      // ATURAN BARU: Hanya berhenti jika kolom pencarian KOSONG dan SEMUA filter dalam kondisi "semua".
      if (
        !debouncedSearchTerm &&
        activeFilters.merek === "semua" &&
        activeFilters.kategori === "semua" &&
        activeFilters.supplier === "semua"
      ) {
        setFilteredProducts([]);
        return;
      }

      const { data, error } = await supabase.rpc("search_products_for_po", {
        search_term: debouncedSearchTerm,
        merek_filter: activeFilters.merek,
        kategori_filter: activeFilters.kategori,
        supplier_filter: activeFilters.supplier,
      });

      if (error) {
        console.error("Error searching products via RPC:", error);
        setFilteredProducts([]);
      } else {
        setFilteredProducts(data || []);
      }
    };

    searchProducts();
  }, [debouncedSearchTerm, activeFilters]);
  // ==================================================================

  const handleAddItem = (product) => {
    if (orderItems.some((item) => item.product_id === product.id))
      return alert("Produk sudah ada di daftar.");
    const newItem = {
      product_id: product.id,
      kode: product.kode,
      nama: product.nama,
      merek: product.merek,
      kategori: product.kategori,
      stok: product.stok, // Menambahkan info stok untuk ditampilkan
      quantity_ordered: 1,
    };
    setOrderItems([...orderItems, newItem]);
    setSearchTerm("");
  };

  const handleRemoveItem = (product_id) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== product_id));
  };

  const handleQuantityChange = (product_id, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    setOrderItems(
      orderItems.map((item) =>
        item.product_id === product_id
          ? { ...item, quantity_ordered: newQuantity }
          : item,
      ),
    );
  };

  const handleSaveOrder = async () => {
    // 1. Validasi: Pastikan ada item di keranjang
    if (orderItems.length === 0) {
      alert("Silakan tambahkan minimal satu produk ke dalam pesanan.");
      return;
    }

    setIsSaving(true);

    try {
      // 2. Generate Nomor PO yang unik
      const po_number = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;

      // 3. Simpan data utama (header) ke tabel 'purchase_orders'
      const { data: newOrder, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: po_number,
          supplier_id: selectedSupplier || null,
          status: "Dipesan", // Status awal sesuai alur kerja
        })
        .select("id") // Ambil kembali ID dari PO yang baru dibuat untuk langkah berikutnya
        .single();

      if (orderError) {
        throw orderError; // Lemparkan error jika gagal
      }

      // 4. Siapkan data item untuk disimpan, kaitkan dengan ID PO yang baru
      const itemsToInsert = orderItems.map((item) => ({
        purchase_order_id: newOrder.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
      }));

      // 5. Simpan semua item ke tabel 'purchase_order_items'
      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        // Jika penyimpanan item gagal, idealnya kita hapus PO header yang sudah terbuat (transaksional)
        // Namun untuk sekarang, kita lemparkan error saja agar proses berhenti
        throw itemsError;
      }

      // 6. Jika semua berhasil
      alert(`Pesanan ${po_number} berhasil dibuat!`);
      navigate("/pembelian"); // Arahkan kembali ke halaman daftar pembelian
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan pesanan: " + error.message);
    } finally {
      setIsSaving(false); // Pastikan tombol kembali aktif apa pun yang terjadi
    }
  };

  if (loading) return <p className="text-center p-8">Memuat data...</p>;

  return (
    <>
      <PurchaseFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilter={setActiveFilters}
        initialFilters={activeFilters}
        merekOptions={merekOptions}
        kategoriOptions={kategoriOptions}
        supplierOptions={supplierOptions}
      />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Buat Pesanan Baru
        </h1>
        <Link
          to="/pembelian"
          className="py-2 px-4 rounded-lg text-slate-600 hover:bg-slate-200"
        >
          Kembali
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
        {/* === PEMILIHAN SUPPLIER === */}
        <div className="mb-6">
          <label
            htmlFor="supplier"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Pilih Supplier
          </label>
          <select
            id="supplier"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">-- Supplier Umum (Tidak Terdaftar) --</option>
            {supplierOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_supplier}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t my-6"></div>

        {/* === PENCARIAN & FILTER "PINTAR" === */}
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Cari & Tambah Produk
        </h3>
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode, Nama, Merek..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50"
          >
            <FiFilter />
            <span>Filter</span>
          </button>
        </div>

        {/* Hasil Pencarian */}
        {/* DIUBAH: Tampilkan jika sedang mengetik ATAU jika ada hasil dari filter */}
        {(searchTerm || filteredProducts.length > 0) && (
          <ul className="bg-white border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center p-3 hover:bg-slate-50 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      <span className="font-normal text-slate-500">
                        [{p.kode || "N/A"}]
                      </span>{" "}
                      {p.nama}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Merek:{" "}
                      <span className="font-medium text-slate-600">
                        {p.merek || "-"}
                      </span>{" "}
                      | Kategori:{" "}
                      <span className="font-medium text-slate-600">
                        {p.kategori || "-"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddItem(p)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold py-1 px-2 rounded-md hover:bg-blue-50"
                  >
                    <FiPlus /> Tambah
                  </button>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-slate-500">
                Produk tidak ditemukan.
              </li>
            )}
          </ul>
        )}

        <div className="border-t my-6"></div>

        {/* === DAFTAR BARANG YANG DIPESAN === */}
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Item Pesanan
        </h3>
        <div className="space-y-3">
          {orderItems.length > 0 ? (
            orderItems.map((item) => (
              <div
                key={item.product_id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start bg-slate-50 p-4 rounded-lg"
              >
                <div className="md:col-span-2">
                  <p className="font-bold text-slate-800">
                    <span className="font-normal text-slate-500">
                      [{item.kode || "N/A"}]
                    </span>{" "}
                    {item.nama}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Merek:{" "}
                    <span className="font-medium text-slate-600">
                      {item.merek || "-"}
                    </span>{" "}
                    | Kategori:{" "}
                    <span className="font-medium text-slate-600">
                      {item.kategori || "-"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-self-stretch">
                  <input
                    type="number"
                    value={item.quantity_ordered}
                    onChange={(e) =>
                      handleQuantityChange(item.product_id, e.target.value)
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-center"
                    min="1"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.product_id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-4">
              Belum ada item yang ditambahkan.
            </p>
          )}
        </div>

        {/* === TOMBOL SIMPAN === */}
        <div className="mt-8 border-t pt-6 flex justify-end">
          <button
            onClick={handleSaveOrder}
            disabled={isSaving || orderItems.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            <FiSave />
            <span>{isSaving ? "Menyimpan..." : "Simpan Pesanan"}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default FormPembelian;
