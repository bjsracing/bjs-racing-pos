// src/pages/FormPesananGrosir.jsx (Versi Final)
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
    FiSave,
    FiPlus,
    FiTrash2,
    FiSearch,
    FiFilter,
    FiShare2,
    FiDownload,
    FiMessageSquare,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

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

const FormPesananGrosir = () => {
    const { soId } = useParams();
    const isEditMode = Boolean(soId);
    const navigate = useNavigate();
    const [mitraOptions, setMitraOptions] = useState([]);
    const [selectedMitra, setSelectedMitra] = useState("");
    const [orderItems, setOrderItems] = useState([]);
    const [catatanPesanan, setCatatanPesanan] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeFilters, setActiveFilters] = useState({
        merek: "semua",
        kategori: "semua",
    });
    const [merekOptions, setMerekOptions] = useState([]);
    const [kategoriOptions, setKategoriOptions] = useState([]);
    const [activeQuickFilter, setActiveQuickFilter] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const { data: mitraData } = await supabase
                .from("customers")
                .select("id, nama_pelanggan")
                .eq("tipe_pelanggan", "Grosir")
                .order("nama_pelanggan");
            setMitraOptions(mitraData || []);

            const { data: productsData } = await supabase
                .from("products")
                .select("merek, kategori")
                .eq("status", "Aktif");
            if (productsData) {
                setMerekOptions(
                    [
                        ...new Set(
                            productsData.map((p) => p.merek).filter(Boolean),
                        ),
                    ].sort(),
                );
                setKategoriOptions(
                    [
                        ...new Set(
                            productsData.map((p) => p.kategori).filter(Boolean),
                        ),
                    ].sort(),
                );
            }

            if (isEditMode) {
                try {
                    const { data: orderData, error: orderError } =
                        await supabase
                            .from("sales_orders")
                            .select("*, sales_order_items(*, products(*))")
                            .eq("id", soId)
                            .single();

                    if (orderError) throw orderError;
                    if (orderData.status !== "Draft") {
                        alert(
                            "Hanya pesanan dengan status Draft yang bisa diedit.",
                        );
                        return navigate("/penjualan-grosir");
                    }

                    setSelectedMitra(orderData.customer_id);
                    setCatatanPesanan(orderData.catatan_pesanan);
                    setOrderItems(
                        orderData.sales_order_items.map((item) => ({
                            product_id: item.product_id,
                            kode: item.products.kode,
                            nama: item.products.nama,
                            merek: item.products.merek,
                            ukuran: item.products.ukuran,
                            stok: item.products.stok,
                            kuantitas: item.kuantitas,
                            satuan: item.products.satuan_dasar || "Pcs",
                            catatan_item: item.catatan_item,
                        })),
                    );
                } catch (error) {
                    alert("Gagal memuat data pesanan untuk diedit.");
                    navigate("/penjualan-grosir");
                }
            }

            setLoading(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (
                !debouncedSearchTerm &&
                activeFilters.merek === "semua" &&
                activeFilters.kategori === "semua"
            ) {
                setFilteredProducts([]);
                return;
            }
            const { data, error } = await supabase.rpc(
                "search_products_for_po_v2",
                {
                    search_term: debouncedSearchTerm,
                    merek_filter: activeFilters.merek,
                    kategori_filter: activeFilters.kategori,
                    supplier_filter: "semua",
                },
            );
            if (error) console.error("Error searching products:", error);
            else setFilteredProducts(data || []);
        };
        if (!loading) searchProducts();
    }, [debouncedSearchTerm, activeFilters, loading]);

    const handleAddItem = (product) => {
        if (orderItems.some((item) => item.product_id === product.id))
            return alert("Produk sudah ada di daftar pesanan.");
        const newItem = {
            product_id: product.id,
            kode: product.kode,
            nama: product.nama,
            merek: product.merek,
            ukuran: product.ukuran,
            stok: product.stok,
            kuantitas: 1,
            satuan: product.satuan_dasar || "Pcs",
            catatan_item: "",
        };
        setOrderItems((prev) => [...prev, newItem]);
        setSearchTerm("");
    };

    const handleItemChange = (productId, field, value) => {
        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.product_id === productId) {
                    let updatedValue = value;
                    if (field === "kuantitas") {
                        updatedValue = Math.max(1, parseInt(value) || 1);
                        if (updatedValue > item.stok) {
                            alert(
                                `Peringatan: Stok untuk ${item.nama} hanya tersisa ${item.stok}. Anda memesan ${updatedValue}, perlu indent.`,
                            );
                        }
                    }
                    // Logika umum untuk memperbarui field, termasuk 'satuan'
                    return { ...item, [field]: updatedValue };
                }
                return item;
            }),
        );
    };

    const handleRemoveItem = (productId) =>
        setOrderItems((prev) =>
            prev.filter((item) => item.product_id !== productId),
        );

    // Ganti seluruh fungsi handleSaveOrder dengan ini
    const handleSaveOrder = async () => {
        if (!selectedMitra) return alert("Silakan pilih mitra.");
        if (orderItems.length === 0)
            return alert("Tambahkan minimal satu produk.");

        setIsSaving(true);
        try {
            if (isEditMode) {
                // --- LOGIKA UNTUK EDIT ---
                // 1. Update data pesanan utama
                const { error: orderError } = await supabase
                    .from("sales_orders")
                    .update({
                        customer_id: selectedMitra,
                        catatan_pesanan: catatanPesanan,
                    })
                    .eq("id", soId);
                if (orderError) throw orderError;

                // 2. Hapus item lama, lalu masukkan item baru (cara paling simpel)
                await supabase
                    .from("sales_order_items")
                    .delete()
                    .eq("sales_order_id", soId);

                const itemsToInsert = orderItems.map((item) => ({
                    sales_order_id: soId,
                    product_id: item.product_id,
                    kuantitas: item.kuantitas,
                    catatan_item: item.catatan_item,
                    satuan: item.satuan,
                }));
                const { error: itemsError } = await supabase
                    .from("sales_order_items")
                    .insert(itemsToInsert);
                if (itemsError) throw itemsError;

                alert(`Pesanan berhasil diperbarui.`);
            } else {
                // --- LOGIKA UNTUK BUAT BARU (TIDAK BERUBAH) ---
                const { data: soNumberData, error: soNumError } =
                    await supabase.rpc("generate_so_number");
                if (soNumError) throw soNumError;
                const { data: newOrder, error: orderError } = await supabase
                    .from("sales_orders")
                    .insert({
                        so_number: soNumberData,
                        customer_id: selectedMitra,
                        catatan_pesanan: catatanPesanan,
                        status: "Draft",
                    })
                    .select()
                    .single();
                if (orderError) throw orderError;
                const itemsToInsert = orderItems.map((item) => ({
                    sales_order_id: newOrder.id,
                    product_id: item.product_id,
                    kuantitas: item.kuantitas,
                    catatan_item: item.catatan_item,
                }));
                const { error: itemsError } = await supabase
                    .from("sales_order_items")
                    .insert(itemsToInsert);
                if (itemsError) throw itemsError;
                alert(
                    `Pesanan ${newOrder.so_number} berhasil disimpan sebagai Draft.`,
                );
            }
            navigate("/penjualan-grosir");
        } catch (error) {
            alert("Gagal menyimpan pesanan: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuickFilterClick = (brand) => {
        if (brand === activeQuickFilter) {
            setActiveFilters({ merek: "semua", kategori: "semua" });
            setActiveQuickFilter("");
        } else {
            setActiveFilters({ merek: brand, kategori: "Pilok" });
            setActiveQuickFilter(brand);
        }
    };

    const pilokBrands = ["DITON", "NIPPON PAINT", "SAMURAI", "SAPPORO"];

    if (loading) return <p className="p-8 text-center">Memuat...</p>;

    return (
        <div className="p-4">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {isEditMode
                        ? "Edit Pesanan Grosir"
                        : "Buat Pesanan Grosir Baru"}
                </h1>
                <Link
                    to="/penjualan-grosir"
                    className="py-2 px-4 rounded-lg text-slate-600 hover:bg-slate-200"
                >
                    Kembali
                </Link>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
                <div className="mb-6">
                    <label
                        htmlFor="mitra"
                        className="block text-sm font-medium text-slate-700 mb-2"
                    >
                        Pilih Mitra (Pelanggan Grosir)
                    </label>
                    <select
                        id="mitra"
                        value={selectedMitra}
                        onChange={(e) => setSelectedMitra(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">-- Pilih Mitra --</option>
                        {mitraOptions.map((mitra) => (
                            <option key={mitra.id} value={mitra.id}>
                                {mitra.nama_pelanggan}
                            </option>
                        ))}
                    </select>
                </div>

                <fieldset disabled={!selectedMitra}>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Cari & Tambah Produk
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <select
                            value={activeFilters.merek}
                            onChange={(e) =>
                                setActiveFilters((f) => ({
                                    ...f,
                                    merek: e.target.value,
                                }))
                            }
                            className="w-full p-2 border rounded-lg bg-white text-sm"
                        >
                            <option value="semua">Semua Merek</option>
                            {merekOptions.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            value={activeFilters.kategori}
                            onChange={(e) =>
                                setActiveFilters((f) => ({
                                    ...f,
                                    kategori: e.target.value,
                                }))
                            }
                            className="w-full p-2 border rounded-lg bg-white text-sm"
                        >
                            <option value="semua">Semua Kategori</option>
                            {kategoriOptions.map((k) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4 p-3 bg-slate-100 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-2">
                            Filter Cepat: Pilok
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {pilokBrands.map((brand) => (
                                <button
                                    key={brand}
                                    onClick={() =>
                                        handleQuickFilterClick(brand)
                                    }
                                    className={`w-full py-2 px-3 text-sm font-bold rounded-md transition-colors border ${activeQuickFilter === brand ? "bg-orange-500 text-white shadow" : "bg-white text-slate-700 hover:bg-slate-200"}`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative mb-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Kode, Nama, Merek, Kategori..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-lg"
                        />
                    </div>
                    {filteredProducts.length > 0 && searchTerm && (
                        <ul className="bg-white border border-slate-200 rounded-lg max-h-64 overflow-y-auto mt-1 absolute z-10 w-full md:w-1/2 shadow-lg">
                            {filteredProducts.map((p) => (
                                <li
                                    key={p.id}
                                    onClick={() => handleAddItem(p)}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                                >
                                    <p className="font-bold text-slate-800">
                                        {p.nama}{" "}
                                        <span className="font-normal text-slate-500">
                                            ({p.kode})
                                        </span>
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {p.merek || "-"} · Ukuran:{" "}
                                        {p.ukuran || "-"} · Stok: {p.stok}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="border-t my-6"></div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Item Pesanan
                    </h3>
                    <div className="space-y-4">
                        {orderItems.length > 0 ? (
                            orderItems.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="bg-slate-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                                >
                                    <div className="md:col-span-5">
                                        <p className="font-bold text-blue-600">
                                            {item.nama}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {item.merek || "-"} (
                                            {item.ukuran || "-"}){" "}
                                            <span className="font-mono text-xs">
                                                ({item.kode})
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Stok Saat Ini: {item.stok}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs">
                                            Jumlah
                                        </label>
                                        <input
                                            type="number"
                                            value={item.kuantitas}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    item.product_id,
                                                    "kuantitas",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full p-2 border rounded-lg text-center"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs">
                                            Satuan
                                        </label>
                                        <input
                                            type="text"
                                            value={item.satuan}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    item.product_id,
                                                    "satuan",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full p-2 border rounded-lg bg-white text-center"
                                            placeholder="Pcs"
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-xs">
                                            Catatan
                                        </label>
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                placeholder="Catatan..."
                                                value={item.catatan_item}
                                                onChange={(e) =>
                                                    handleItemChange(
                                                        item.product_id,
                                                        "catatan_item",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm p-2 border rounded-lg"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleRemoveItem(
                                                        item.product_id,
                                                    )
                                                }
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-full ml-2"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 py-4">
                                Belum ada item ditambahkan.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <label
                            htmlFor="catatan_pesanan"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Catatan Keseluruhan Pesanan
                        </label>
                        <textarea
                            id="catatan_pesanan"
                            rows="2"
                            value={catatanPesanan}
                            onChange={(e) => setCatatanPesanan(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="Tulis catatan tambahan untuk pesanan ini..."
                        ></textarea>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSaveOrder}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
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
                </fieldset>
            </div>
        </div>
    );
};

export default FormPesananGrosir;
