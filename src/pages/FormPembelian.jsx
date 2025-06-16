import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiSave, FiPlus, FiTrash2, FiSearch, FiFilter } from "react-icons/fi";
import PurchaseFilterModal from "../components/PurchaseFilterModal.jsx";
import PurchaseOrderShareModal from "../components/PurchaseOrderShareModal.jsx";

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
  const { poId } = useParams();
  const isEditMode = Boolean(poId);

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

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, nama_supplier, telepon");
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
            kategorisData.map((item) => item.kategori).filter(Boolean)
          ),
        ];
        setKategoriOptions(uniqueKategoris.sort());
      }
      if (isEditMode) {
        const { data: orderData, error: orderError } = await supabase
          .from("purchase_orders")
          .select("*")
          .eq("id", poId)
          .single();
        if (orderError) {
          alert("Error memuat data pesanan: " + orderError.message);
          setLoading(false);
          return;
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("purchase_order_items")
          .select("*, products(*)")
          .eq("purchase_order_id", poId);
        if (itemsError) {
          alert("Error memuat item pesanan: " + itemsError.message);
          setLoading(false);
          return;
        }

        setSelectedSupplier(orderData.supplier_id || "");
        const loadedItems = itemsData.map((item) => ({
          product_id: item.product_id,
          kode: item.products.kode,
          nama: item.products.nama,
          merek: item.products.merek,
          kategori: item.products.kategori,
          catatan: item.products.catatan, // Catatan dari produk
          catatan_item: item.catatan_item || "", // Catatan spesifik untuk PO ini
          stok: item.products.stok,
          satuan: item.products.satuan,
          quantity_ordered: item.quantity_ordered,
        }));
        setOrderItems(loadedItems);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [poId, isEditMode]);

  useEffect(() => {
    const searchProducts = async () => {
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

  const handleAddItem = (product) => {
    if (orderItems.some((item) => item.product_id === product.id))
      return alert("Produk sudah ada di daftar.");
    const newItem = {
      product_id: product.id,
      kode: product.kode,
      nama: product.nama,
      merek: product.merek,
      kategori: product.kategori,
      stok: product.stok,
      satuan: product.satuan,
      catatan_item: "", // Inputan catatan manual per item
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
          : item
      )
    );
  };

  const handleItemNoteChange = (product_id, note) => {
    setOrderItems(
      orderItems.map((item) =>
        item.product_id === product_id ? { ...item, catatan_item: note } : item
      )
    );
  };

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) {
      alert("Silakan tambahkan minimal satu produk ke dalam pesanan.");
      return;
    }
    setIsSaving(true);
    try {
      const po_number = `PO-BJS-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;
      const { data: newOrder, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: po_number,
          supplier_id: selectedSupplier || null,
          status: "Dipesan",
        })
        .select("id, order_date")
        .single();
      if (orderError) throw orderError;
      const itemsToInsert = orderItems.map((item) => ({
        purchase_order_id: newOrder.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        catatan_item: item.catatan_item,
      })); // <-- Simpan catatan item ke DB
      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
      const supplier = supplierOptions.find((s) => s.id === selectedSupplier);
      const completeOrderData = {
        po_number: po_number,
        order_date: newOrder.order_date,
        supplier_name: supplier ? supplier.nama_supplier : "Supplier Umum",
        supplier_phone: supplier ? supplier.telepon : null,
        items: orderItems,
      };
      setNewOrderData(completeOrderData);
      setIsShareModalOpen(true);
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan pesanan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setNewOrderData(null);
    setOrderItems([]);
    setSelectedSupplier("");
    navigate("/pembelian");
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
      <PurchaseOrderShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        orderData={newOrderData}
      />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          {isEditMode ? "Edit Pesanan Pembelian" : "Buat Pesanan Baru"}
        </h1>
        <Link
          to="/pembelian"
          className="py-2 px-4 rounded-lg text-slate-600 hover:bg-slate-200"
        >
          Kembali
        </Link>
      </div>

      {/* SEMUA BAGIAN DI BAWAH INI SEKARANG LENGKAP */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
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

        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Item Pesanan
        </h3>
        <div className="space-y-4">
          {orderItems.length > 0 ? (
            orderItems.map((item) => (
              <div key={item.product_id} className="bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
                    {/* PERMINTAAN 4: Perubahan warna dan style */}
                    <p className="font-bold text-blue-600 break-words">
                      {item.nama}
                    </p>
                    <p className="text-sm text-slate-800 font-semibold mt-1">
                      (<span className="font-bold">{item.kode || "N/A"}</span>)
                      -{" "}
                      <span className="text-orange-500">
                        {item.merek || "-"}
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
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Tambah catatan untuk item ini... (opsional)"
                    value={item.catatan_item}
                    onChange={(e) =>
                      handleItemNoteChange(item.product_id, e.target.value)
                    }
                    className="w-full text-sm p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-4">
              Belum ada item yang ditambahkan.
            </p>
          )}
        </div>

        <div className="mt-8 border-t pt-6 flex justify-end">
          <button
            onClick={handleSaveOrder}
            disabled={isSaving || orderItems.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            <FiSave />
            <span>
              {isSaving
                ? "Menyimpan..."
                : isEditMode
                ? "Simpan Perubahan"
                : "Simpan Pesanan"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default FormPembelian;
