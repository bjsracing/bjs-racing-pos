// src/pages/FormPembelian.jsx (Versi Final Gabungan Stabil + Fitur Baru)
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiSave, FiPlus, FiTrash2, FiSearch, FiFilter, FiCamera } from "react-icons/fi";
import PurchaseFilterModal from "../components/PurchaseFilterModal.jsx";
import PurchaseOrderShareModal from "../components/PurchaseOrderShareModal.jsx";
import ProductModal from "../components/ProductModal.jsx";
import NotaOcrModal from "../components/NotaOcrModal.jsx";

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
  const navigate = useNavigate();
  const location = useLocation();

  const requestedProduct = location.state?.requestedProduct;
  const selectedRequestIds = location.state?.selectedRequests;

  // State
  const [orderItems, setOrderItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productSaveError, setProductSaveError] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // --- EFEK ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, nama_supplier, telepon");
      if (suppliersData) setSupplierOptions(suppliersData);

      const { data: productsData } = await supabase
        .from("products")
        .select("*");
      if (productsData) {
        setAllProducts(productsData);
        const uniqueMereks = [
          ...new Set(productsData.map((item) => item.merek).filter(Boolean)),
        ];
        setMerekOptions(uniqueMereks.sort());
        const uniqueKategoris = [
          ...new Set(productsData.map((item) => item.kategori).filter(Boolean)),
        ];
        setKategoriOptions(uniqueKategoris.sort());
      }

      // DIKEMBALIKAN: Logika lengkap untuk mode edit
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
          stok: item.products.stok,
          catatan_item: item.catatan_item || "",
          quantity_ordered: item.quantity_ordered,
          satuan_dasar: item.products.satuan_dasar || "Pcs",
          satuan_pembelian: item.products.satuan_pembelian,
          nilai_konversi: item.products.nilai_konversi,
          unit_ordered:
            item.unit_ordered || item.products.satuan_dasar || "Pcs",
          conversion_to_base: item.conversion_to_base || 1,
        }));
        setOrderItems(loadedItems);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [poId, isEditMode]);

  useEffect(() => {
    const handleRequests = async () => {
      if (selectedRequestIds && selectedRequestIds.length > 0) {
        const { data, error } = await supabase
          .from("permintaan_pelanggan")
          .select("*")
          .in("id", selectedRequestIds);
        if (error) {
          console.error(error);
          return;
        }
        setSuggestedItems(data || []);
      } else if (requestedProduct?.nama_produk_diminta) {
        const fullSearchTerm =
          `${requestedProduct.nama_produk_diminta} ${requestedProduct.catatan || ""}`.trim();
        setSearchTerm(fullSearchTerm);
        setSuggestedItems([requestedProduct]);
      }
    };
    if (!isEditMode) handleRequests();
  }, [requestedProduct, selectedRequestIds, isEditMode]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearchTerm) {
        setFilteredProducts([]);
        return;
      }
      const { data, error } = await supabase.rpc("search_products_for_po_v2", {
        search_term: debouncedSearchTerm,
        merek_filter: activeFilters.merek,
        kategori_filter: activeFilters.kategori,
        supplier_filter: activeFilters.supplier,
      });
      if (error) {
        console.error("Error searching products:", error);
      } else {
        setFilteredProducts(data || []);
      }
    };
    if (!loading) searchProducts();
  }, [debouncedSearchTerm, activeFilters, loading]);

  // --- HANDLER ---
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
      catatan_item: "",
      quantity_ordered: 1,
      satuan_dasar: product.satuan_dasar || "Pcs",
      satuan_pembelian: product.satuan_pembelian,
      nilai_konversi: product.nilai_konversi,
      unit_ordered: product.satuan_dasar || "Pcs",
      conversion_to_base: 1,
    };
    setOrderItems((prev) => [...prev, newItem]);
    setSuggestedItems((prev) =>
      prev.filter(
        (s) =>
          s.nama_produk_diminta.trim().toLowerCase() !==
          product.nama.trim().toLowerCase(),
      ),
    );
  };

  const handleSearchAndAdd = async (suggestionName) => {
    const term = suggestionName.trim();
    setLoading(true);
    const { data: foundProduct, error } = await supabase
      .from("products")
      .select("*")
      .ilike("nama", `%${term}%`)
      .limit(1)
      .single();
    setLoading(false);
    if (error && error.code !== "PGRST116") {
      alert("Terjadi kesalahan saat mencari produk: " + error.message);
      return;
    }
    if (foundProduct) {
      handleAddItem(foundProduct);
    } else {
      alert(
        `Produk dengan nama "${suggestionName}" tidak ditemukan di master produk.`,
      );
      setSearchTerm(suggestionName);
    }
  };

  // DIKEMBALIKAN: Semua fungsi handler yang hilang
  const handleRemoveItem = (product_id) =>
    setOrderItems((prev) =>
      prev.filter((item) => item.product_id !== product_id),
    );
  const handleQuantityChange = (product_id, quantity) => {
    const newQuantity = Math.max(1, parseFloat(quantity) || 1);
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product_id === product_id
          ? { ...item, quantity_ordered: newQuantity }
          : item,
      ),
    );
  };
  const handleItemNoteChange = (product_id, note) =>
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product_id === product_id ? { ...item, catatan_item: note } : item,
      ),
    );
  const handleUnitChange = (product_id, newUnit) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.product_id === product_id) {
          if (newUnit === item.satuan_dasar)
            return {
              ...item,
              unit_ordered: item.satuan_dasar,
              conversion_to_base: 1,
            };
          else if (newUnit === item.satuan_pembelian)
            return {
              ...item,
              unit_ordered: item.satuan_pembelian,
              conversion_to_base: item.nilai_konversi,
            };
        }
        return item;
      }),
    );
  };

  const handleSaveOrder = async () => {
    if (orderItems.length === 0)
      return alert("Silakan tambahkan minimal satu produk.");
    const invalidItems = orderItems.filter((item) => !item.product_id);
    if (invalidItems.length > 0) {
      return alert(
        `${invalidItems.length} item tidak memiliki produk terkait. Hapus atau ganti item tersebut sebelum menyimpan.`,
      );
    }
    setIsSaving(true);
    try {
      const itemsToInsertPayload = (purchaseOrderId) =>
        orderItems.map((item) => ({
          purchase_order_id: purchaseOrderId,
          product_id: item.product_id,
          quantity_ordered: item.quantity_ordered,
          catatan_item: item.catatan_item,
          unit_ordered: item.unit_ordered,
          conversion_to_base: item.conversion_to_base,
        }));
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("purchase_orders")
          .update({ supplier_id: selectedSupplier || null })
          .eq("id", poId);
        if (updateError) throw updateError;
        await supabase
          .from("purchase_order_items")
          .delete()
          .eq("purchase_order_id", poId);
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemsToInsertPayload(poId));
        if (itemsError) throw itemsError;
        alert(`Pesanan berhasil diperbarui!`);
        navigate("/pembelian");
      } else {
        const po_number = `PO-BJS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;
        const { data: newOrder, error: orderError } = await supabase
          .from("purchase_orders")
          .insert({
            po_number,
            supplier_id: selectedSupplier || null,
            status: "Dipesan",
          })
          .select("id, order_date")
          .single();
        if (orderError) throw orderError;
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemsToInsertPayload(newOrder.id));
        if (itemsError) throw itemsError;
        const requestIdsToUpdate =
          selectedRequestIds || (requestedProduct ? [requestedProduct.id] : []);
        if (requestIdsToUpdate.length > 0) {
          const { error: updateStatusError } = await supabase
            .from("permintaan_pelanggan")
            .update({ status: "Sudah Dipesan" })
            .in("id", requestIdsToUpdate);
          if (updateStatusError)
            console.error(
              "Gagal update status permintaan:",
              updateStatusError.message,
            );
        }
        const supplier = supplierOptions.find((s) => s.id === selectedSupplier);
        const completeOrderData = {
          po_number,
          order_date: newOrder.order_date,
          supplier_name: supplier ? supplier.nama_supplier : "Supplier Umum",
          supplier_phone: supplier ? supplier.telepon : null,
          items: orderItems.map((item) => ({
            nama: item.nama,
            kode: item.kode,
            merek: item.merek,
            catatan_item: item.catatan_item,
            quantity_ordered: item.quantity_ordered,
            satuan: item.unit_ordered,
          })),
        };
        setNewOrderData(completeOrderData);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan pesanan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOcrConfirm = (ocrItems) => {
    const updatedItems = [...orderItems];
    let addedCount = 0;
    let updatedCount = 0;

    ocrItems.forEach((ocrItem) => {
      if (!ocrItem.product_id) return;

      const matchIndex = updatedItems.findIndex((poItem) => {
        if (!poItem.nama || !ocrItem.product_nama) return false;
        if (poItem.product_id && ocrItem.product_id) {
          return poItem.product_id === ocrItem.product_id;
        }
        const poName = poItem.nama.toLowerCase().trim();
        const ocrName = ocrItem.product_nama.toLowerCase().trim();
        if (poName === ocrName) return true;
        if (poName.includes(ocrName) && ocrName.length >= poName.length * 0.5)
          return true;
        if (ocrName.includes(poName) && poName.length >= ocrName.length * 0.5)
          return true;
        return false;
      });

      if (matchIndex >= 0) {
        const existingCatatan = updatedItems[matchIndex].catatan_item || "";
        const notaPrice = ocrItem.harga_beli
          ? `Harga nota: Rp${ocrItem.harga_beli.toLocaleString("id-ID")}`
          : "";
        const pricePrefix = "Harga nota: ";
        let newCatatan = existingCatatan;
        if (notaPrice) {
          if (existingCatatan.includes(pricePrefix)) {
            newCatatan = existingCatatan.replace(
              new RegExp(`${pricePrefix}Rp[\\d.,]+`),
              notaPrice,
            );
          } else {
            newCatatan = existingCatatan
              ? `${existingCatatan} | ${notaPrice}`
              : notaPrice;
          }
        }
        updatedItems[matchIndex] = {
          ...updatedItems[matchIndex],
          quantity_ordered: ocrItem.kuantitas,
          catatan_item: newCatatan,
        };
        updatedCount++;
      } else {
        const foundProduct = allProducts.find(
          (p) => p.id === ocrItem.product_id,
        );
        if (!foundProduct) return;

        updatedItems.push({
          product_id: foundProduct.id,
          kode: foundProduct.kode,
          nama: foundProduct.nama,
          merek: foundProduct.merek || "",
          kategori: foundProduct.kategori || "",
          stok: foundProduct.stok || 0,
          catatan_item: ocrItem.harga_beli
            ? `Harga nota: Rp${ocrItem.harga_beli.toLocaleString("id-ID")}`
            : "",
          quantity_ordered: ocrItem.kuantitas,
          satuan_dasar: foundProduct.satuan_dasar || "Pcs",
          satuan_pembelian: foundProduct.satuan_pembelian,
          nilai_konversi: foundProduct.nilai_konversi,
          unit_ordered: foundProduct.satuan_dasar || "Pcs",
          conversion_to_base: 1,
        });
        addedCount++;
      }
    });

    setOrderItems(updatedItems);
    setIsOcrModalOpen(false);

    const messages = [];
    if (updatedCount > 0) messages.push(`${updatedCount} item diupdate`);
    if (addedCount > 0) messages.push(`${addedCount} item baru ditambahkan`);
    if (messages.length === 0) {
      alert("Tidak ada item baru yang ditambahkan dari nota.");
    } else {
      alert(`Berhasil! ${messages.join(", ")}.`);
    }
  };

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setProductSaveError("");
    setIsProductModalOpen(true);
  };
  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setProductSaveError("");
    setIsProductModalOpen(true);
  };
  const handleSaveProduct = async (productData) => {
    /* ... logika ini ada di halaman produk/permintaan ... */
  };
  const handleCloseShareModal = () => {
    navigate("/pembelian");
  };

  if (loading) return <p className="text-center p-8">Memuat data...</p>;

  return (
    <>
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        supplierOptions={supplierOptions}
        allProducts={allProducts}
        saveError={productSaveError}
        setSaveError={setProductSaveError}
      />
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
      <NotaOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onConfirm={handleOcrConfirm}
        allProducts={allProducts}
        existingItems={orderItems}
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

        {suggestedItems.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h4 className="font-bold text-blue-800 mb-2">
              Saran Produk dari Permintaan
            </h4>
            <ul className="space-y-2">
              {suggestedItems.map((sugg) => (
                <li
                  key={sugg.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-slate-700">
                    {sugg.nama_produk_diminta}
                  </span>
                  <button
                    onClick={() => handleSearchAndAdd(sugg.nama_produk_diminta)}
                    className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600"
                  >
                    Cari & Tambah
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Cari & Tambah Produk
          </h3>
          <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!selectedSupplier) {
                    alert("Pilih supplier terlebih dahulu sebelum import nota.");
                    return;
                  }
                  setIsOcrModalOpen(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 duration-200"
              >
                <FiCamera size={16} /> Import Nota
              </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Tambah Produk
            </button>
          </div>
        </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="text-sm text-slate-600 hover:text-slate-900 font-semibold py-1 px-3 rounded-md bg-slate-200 hover:bg-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAddItem(p)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold py-1 px-3 rounded-md bg-blue-100 hover:bg-blue-200"
                    >
                      <FiPlus /> Tambah
                    </button>
                  </div>
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

        {/* DIKEMBALIKAN: Kode JSX lengkap untuk menampilkan item pesanan */}
        <div className="space-y-4">
          {orderItems.length > 0 ? (
            orderItems.map((item) => (
              <div key={item.product_id} className="bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
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
                  <div>
                    <div className="flex gap-2 mb-1">
                      <label className="block text-sm font-medium text-slate-700 w-24 text-center">
                        Jumlah
                      </label>
                      <label className="block text-sm font-medium text-slate-700 flex-grow">
                        Satuan
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity_ordered}
                        onChange={(e) =>
                          handleQuantityChange(item.product_id, e.target.value)
                        }
                        className="w-24 p-2 border border-slate-300 rounded-lg text-center"
                        min="1"
                      />
                      <select
                        value={item.unit_ordered}
                        onChange={(e) =>
                          handleUnitChange(item.product_id, e.target.value)
                        }
                        className="flex-grow p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value={item.satuan_dasar}>
                          {item.satuan_dasar || "Pcs"}
                        </option>
                        {item.satuan_pembelian && (
                          <option value={item.satuan_pembelian}>
                            {item.satuan_pembelian}
                          </option>
                        )}
                      </select>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
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
