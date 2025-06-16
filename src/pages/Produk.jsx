// src/pages/Produk.jsx (Versi Final & Lengkap)

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiFilter,
  FiAlertTriangle,
} from "react-icons/fi";
import ProductModal from "../components/ProductModal.jsx";
import ViewNoteModal from "../components/ViewNoteModal.jsx";
import FilterModal from "../components/FilterModal.jsx";
import ImportExcelButton from "../components/ImportExcelButton.jsx";
import ExportExcelButton from "../components/ExportExcelButton.jsx";

// Helper Hook untuk debounce
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

function Produk() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeFilters, setActiveFilters] = useState({
    merek: "semua",
    kategori: "semua",
    status: "semua",
  });
  const [showLowStockOnly, setShowLowStockOnly] = useState(
    () => location.state?.filter === "stok_rendah",
  );
  const [merekOptions, setMerekOptions] = useState([]);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [noteToView, setNoteToView] = useState(null);

  const forceRefresh = () => setRefreshTrigger((t) => t + 1);

  // --- EFFECTS ---

  // Effect Utama untuk mengambil data produk
  useEffect(() => {
    let isActive = true;
    const performFetch = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("search_products", {
        search_term: debouncedSearchTerm,
        merek_filter: activeFilters.merek,
        kategori_filter: activeFilters.kategori,
        status_filter: activeFilters.status,
        low_stock_only: showLowStockOnly,
      });

      if (isActive) {
        if (error) {
          console.error("Error fetching products:", error);
          setProducts([]);
        } else if (Array.isArray(data)) {
          const formattedData = data.map((p) => ({
            ...p,
            suppliers: { nama_supplier: p.supplier },
          }));
          setProducts(formattedData);
        }
        setLoading(false);
      }
    };

    performFetch();

    return () => {
      isActive = false;
    };
  }, [debouncedSearchTerm, activeFilters, showLowStockOnly, refreshTrigger]);

  // Effect untuk mengambil data opsi filter (Merek, Kategori, Supplier)
  useEffect(() => {
    const fetchOptions = async () => {
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, nama_supplier");
      if (Array.isArray(suppliersData)) setSupplierOptions(suppliersData);

      const { data: mereksData } = await supabase
        .from("products")
        .select("merek");
      if (Array.isArray(mereksData)) {
        const uniqueMereks = [
          ...new Set(mereksData.map((item) => item.merek).filter(Boolean)),
        ];
        setMerekOptions(uniqueMereks.sort());
      }
      const { data: kategorisData } = await supabase
        .from("products")
        .select("kategori");
      if (Array.isArray(kategorisData)) {
        const uniqueKategoris = [
          ...new Set(
            kategorisData.map((item) => item.kategori).filter(Boolean),
          ),
        ];
        setKategoriOptions(uniqueKategoris.sort());
      }
    };
    fetchOptions();
  }, []);

  // Effect untuk membersihkan state dari navigasi
  useEffect(() => {
    if (location.state?.filter === "stok_rendah") {
      navigate(location.pathname, { state: {}, replace: true });
    }
  }, []);

  // --- HANDLERS ---
  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    // 1. Temukan objek supplier lengkap berdasarkan supplier_id yang dikirim dari modal
    const selectedSupplier = supplierOptions.find(
      (opt) => opt.id === productData.supplier_id,
    );

    // 2. Siapkan data yang akan dikirim, buang properti yang tidak perlu
    const { suppliers, nama_supplier, ...restOfData } = productData;

    const updateData = {
      ...restOfData,
      // 3. Isi kolom 'supplier' (teks) dengan nama supplier yang ditemukan.
      //    Jika tidak ada supplier yang dipilih, isi dengan null.
      supplier: selectedSupplier ? selectedSupplier.nama_supplier : null,
    };

    // 4. Hapus properti supplier_id karena kolom ini tidak ada di tabel products
    delete updateData.supplier_id;

    let error;
    if (updateData.id) {
      // Kirim data yang sudah bersih dan benar untuk di-update
      ({ error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", updateData.id));
    } else {
      ({ error } = await supabase.from("products").insert([updateData]));
    }

    if (error) {
      alert("Gagal menyimpan produk: " + error.message);
    } else {
      alert(updateData.id ? "Produk diperbarui!" : "Produk ditambahkan!");
      setIsModalOpen(false);
      forceRefresh();
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Yakin ingin hapus "${productName}"?`)) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) alert("Gagal menghapus: " + error.message);
      else {
        alert("Produk dihapus.");
        forceRefresh();
      }
    }
  };

  const handleDataUpload = async (dataFromExcel) => {
    if (!dataFromExcel || dataFromExcel.length === 0) {
      return alert(
        "Tidak ada data di dalam file Excel atau format tidak sesuai.",
      );
    }
    if (
      !window.confirm(
        `Anda akan mengimpor ${dataFromExcel.length} produk. Lanjutkan?`,
      )
    ) {
      return;
    }
    const productsToInsert = dataFromExcel.map((row) => ({
      kode: row.kode || null,
      nama: row.nama || "Tanpa Nama",
      merek: row.merek || null,
      kategori: row.kategori || null,
      harga_beli: Number(row.harga_beli) || 0,
      harga_jual: Number(row.harga_jual) || 0,
      stok: Number(row.stok) || 0,
      stok_min: Number(row.stok_min) || 0,
      catatan: row.catatan || null,
      status: row.status || "Aktif",
    }));
    setLoading(true);
    const { error } = await supabase.from("products").insert(productsToInsert);
    setLoading(false);
    if (error) {
      alert("Gagal impor data: " + error.message);
    } else {
      alert(`Berhasil mengimpor ${productsToInsert.length} produk!`);
      forceRefresh();
    }
  };

  // --- RENDER ---
  if (loading && products.length === 0) {
    return <div className="p-4 text-center">Memuat data produk...</div>;
  }

  return (
    <div className="p-4">
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        supplierOptions={supplierOptions}
      />
      <ViewNoteModal
        isOpen={noteToView !== null}
        onClose={() => setNoteToView(null)}
        note={noteToView}
      />
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilter={setActiveFilters}
        merekOptions={merekOptions}
        kategoriOptions={kategoriOptions}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Manajemen Produk</h1>
        <div className="flex gap-2 flex-col md:flex-row w-full md:w-auto">
          <ImportExcelButton onDataUpload={handleDataUpload} />
          <ExportExcelButton data={products} fileName="daftar-produk" />
          <button
            onClick={handleOpenAddModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            <FiPlus />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kode, Nama, Merek, Kategori..."
            className="w-full p-2 pl-10 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50"
        >
          <FiFilter />
          <span>Filter</span>
        </button>
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-lg ${showLowStockOnly ? "bg-yellow-400 text-yellow-900" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
        >
          <FiAlertTriangle />
          <span>
            {showLowStockOnly ? "Tampilkan Semua" : "Hanya Stok Rendah"}
          </span>
        </button>
      </div>

      {showLowStockOnly && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
          role="alert"
        >
          <p className="font-bold">Mode Stok Rendah Aktif</p>
        </div>
      )}

      {/* Tampilan Tabel Desktop */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Kode
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Merek
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Harga Beli
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Harga Jual
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Stok Min
              </th>
              <th className="px-5 py-3 border-b-2 border-slate-300 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Catatan
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
            {products.length > 0 ? (
              products.map((product) => {
                const isLowStock =
                  product.stok > 0 && product.stok <= product.stok_min;
                return (
                  <tr
                    key={product.id}
                    className={isLowStock ? "bg-red-100" : "hover:bg-slate-50"}
                  >
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      {product.kode}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      {product.nama}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      {product.merek}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      {product.kategori}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      {product.supplier || "-"}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        product.harga_beli,
                      )}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm whitespace-nowrap">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        product.harga_jual,
                      )}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                      {product.stok}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm text-center">
                      {product.stok_min}
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm">
                      <button
                        onClick={() => setNoteToView(product.catatan)}
                        className="text-blue-500 hover:underline disabled:text-slate-400 disabled:no-underline"
                        disabled={!product.catatan}
                      >
                        <p className="truncate w-32">
                          {product.catatan || "-"}
                        </p>
                      </button>
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 font-semibold leading-tight rounded-full ${product.status === "Aktif" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b border-slate-200 text-sm text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteProduct(product.id, product.nama)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="12" className="text-center py-10 text-slate-500">
                  Tidak ada data produk yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu Mobile */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.length > 0 ? (
          products.map((product) => {
            const isLowStock =
              product.stok > 0 && product.stok <= product.stok_min;
            return (
              <div
                key={product.id}
                className={`bg-white p-4 rounded-lg shadow ${isLowStock ? "border-l-4 border-red-500" : "border-l-4 border-transparent"}`}
              >
                {" "}
                <div className="flex justify-between items-start mb-2">
                  {" "}
                  <h3 className="text-lg font-bold text-slate-800 pr-2">
                    {product.nama}
                  </h3>{" "}
                  <span
                    className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full whitespace-nowrap ${product.status === "Aktif" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
                  >
                    {product.status}
                  </span>{" "}
                </div>{" "}
                <div className="text-sm space-y-1">
                  {" "}
                  <p className="text-slate-400">
                    Kode: {product.kode || "-"}
                  </p>{" "}
                  <p className="text-slate-600">
                    {product.merek || "Tanpa Merek"}
                  </p>{" "}
                  <p className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                    {product.kategori}
                  </p>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <div className="my-3 border-t border-slate-200"></div>{" "}
                  <div className="flex justify-between items-end">
                    {" "}
                    <div className="text-sm">
                      {" "}
                      <p className="text-slate-500">Stok</p>{" "}
                      <p
                        className={`font-semibold ${isLowStock ? "text-red-600" : "text-slate-700"}`}
                      >
                        {product.stok}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          (Min: {product.stok_min})
                        </span>
                      </p>{" "}
                    </div>{" "}
                    <div className="text-right">
                      {" "}
                      <p className="text-slate-500 text-sm">Harga Jual</p>{" "}
                      <p className="text-lg font-bold text-orange-500">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          product.harga_jual,
                        )}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex justify-end items-center mt-2 -mr-2">
                    {" "}
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                    >
                      <FiEdit size={20} />
                    </button>{" "}
                    <button
                      onClick={() =>
                        handleDeleteProduct(product.id, product.nama)
                      }
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FiTrash2 size={20} />
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-500 col-span-full">
            Tidak ada data produk yang cocok.
          </div>
        )}
      </div>
    </div>
  );
}

export default Produk;
