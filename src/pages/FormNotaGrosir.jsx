// src/pages/FormNotaGrosir.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiSave, FiArrowLeft } from "react-icons/fi";

const FormNotaGrosir = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [terminPembayaran, setTerminPembayaran] = useState("COD");

    const fetchOrderForInvoice = useCallback(async () => {
        setLoading(true);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from("sales_orders")
                .select("*, customers(*)") // <-- Diubah untuk mengambil semua data customer
                .eq("id", orderId)
                .single();
            if (orderError) throw orderError;

            if (orderData.status !== "Dikonfirmasi") {
                alert(
                    `Nota hanya bisa dibuat untuk pesanan berstatus 'Dikonfirmasi'. Status saat ini: ${orderData.status}`,
                );
                return navigate(`/penjualan-grosir/detail/${orderId}`);
            }
            setOrder(orderData);

            // --- LANGKAH 1: AMBIL HARGA SPESIAL UNTUK PELANGGAN INI ---
            let specialPrices = [];
            // Cek jika pelanggan adalah tipe Grosir
            if (
                orderData.customers &&
                orderData.customers.tipe_pelanggan === "Grosir"
            ) {
                const { data: spData, error: spError } = await supabase.rpc(
                    "get_special_prices_for_customer",
                    {
                        customer_uuid: orderData.customer_id,
                    },
                );

                if (spError) {
                    // Tidak perlu alert, cukup catat di console jika gagal, proses tetap lanjut
                    console.error(
                        "Peringatan: Gagal mengambil harga spesial.",
                        spError,
                    );
                } else {
                    specialPrices = spData || [];
                }
            }

            // --- AKHIR LANGKAH 1 ---

            const { data: itemsData, error: itemsError } = await supabase
                .from("sales_order_items")
                .select("*, products(id, nama, kode, ukuran, harga_grosir)")
                .eq("sales_order_id", orderId);
            if (itemsError) throw itemsError;

            // --- LANGKAH 2: TERAPKAN LOGIKA HARGA PRIORITAS ---
            const enrichedItems = itemsData.map((item) => {
                // Prioritas 1: Cari harga spesial
                const specialPriceData = specialPrices.find(
                    (sp) => sp.product_id === item.products.id,
                );

                // Tentukan harga final
                const finalPrice = specialPriceData
                    ? specialPriceData.harga_spesial // Jika ada, pakai harga spesial
                    : item.products.harga_grosir; // Jika tidak, pakai harga grosir default

                return {
                    ...item,
                    harga_grosir_deal: finalPrice, // Harga otomatis terisi sesuai prioritas
                    diskon_item_rp: 0,
                };
            });
            setItems(enrichedItems);
            // --- AKHIR LANGKAH 2 ---
        } catch (error) {
            alert("Gagal memuat data untuk nota: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        fetchOrderForInvoice();
    }, [fetchOrderForInvoice]);

    const handleItemChange = (itemId, field, value) => {
        const numericValue = value.replace(/[^0-9]/g, "");
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, [field]: Number(numericValue) || 0 }
                    : item,
            ),
        );
    };

    const subtotal = items.reduce(
        (sum, item) => sum + item.harga_grosir_deal * item.kuantitas,
        0,
    );
    const totalDiskon = items.reduce(
        (sum, item) => sum + item.diskon_item_rp * item.kuantitas, // <-- Perbaikan kecil: diskon dikali kuantitas
        0,
    );
    const totalAkhir = subtotal - totalDiskon;

    const handleSaveInvoice = async () => {
        setIsSaving(true);
        try {
            const invNumberData = order.so_number.replace("SO", "INV");

            const itemsPayload = items.map((item) => ({
                product_id: item.product_id,
                kuantitas: item.kuantitas,
                harga_grosir_deal: item.harga_grosir_deal,
                diskon_item_rp: item.diskon_item_rp,
            }));

            const { data: newInvoiceId, error: rpcError } = await supabase.rpc(
                "process_grosir_invoice",
                {
                    p_sales_order_id: orderId,
                    p_customer_id: order.customer_id,
                    p_invoice_number: invNumberData,
                    p_termin_pembayaran: terminPembayaran,
                    p_items: itemsPayload,
                },
            );

            if (rpcError) throw rpcError;

            alert(`Nota ${invNumberData} berhasil dibuat!`);
            navigate(`/nota/detail/${newInvoiceId}`);
        } catch (error) {
            alert("Gagal menyimpan nota: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p className="p-8 text-center">Memuat...</p>;

    return (
        <div className="p-4">
            <div className="mb-6">
                <Link
                    to={`/penjualan-grosir/detail/${orderId}`}
                    className="text-blue-600 hover:underline flex items-center gap-2 mb-2 w-fit"
                >
                    <FiArrowLeft />
                    <span>Kembali ke Detail Pesanan</span>
                </Link>
                <h1 className="text-3xl font-bold">Buat Nota Penjualan</h1>
                <p className="text-slate-500">
                    Untuk Pesanan: <strong>{order?.so_number}</strong>
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="grid grid-cols-12 gap-4 items-end border-b pb-4"
                        >
                            <div className="col-span-12 md:col-span-5">
                                <p className="font-bold text-slate-800">
                                    {item.products.nama}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {item.products.kode} · {item.kuantitas}{" "}
                                    {item.satuan}
                                </p>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <label className="text-xs">
                                    Harga Deal (Rp)
                                </label>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat(
                                        "id-ID",
                                    ).format(item.harga_grosir_deal)}
                                    onChange={(e) =>
                                        handleItemChange(
                                            item.id,
                                            "harga_grosir_deal",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full p-2 border rounded-lg"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Harga Grosir Default:{" "}
                                    {new Intl.NumberFormat("id-ID").format(
                                        item.products.harga_grosir,
                                    )}
                                </p>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <label className="text-xs">
                                    Diskon/Item (Rp)
                                </label>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat(
                                        "id-ID",
                                    ).format(item.diskon_item_rp)}
                                    onChange={(e) =>
                                        handleItemChange(
                                            item.id,
                                            "diskon_item_rp",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-2 text-right">
                                <p className="font-semibold">
                                    Rp{" "}
                                    {new Intl.NumberFormat("id-ID").format(
                                        item.harga_grosir_deal *
                                            item.kuantitas -
                                            item.diskon_item_rp *
                                                item.kuantitas, // <-- Perbaikan kecil
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Termin Pembayaran
                        </label>
                        <select
                            value={terminPembayaran}
                            onChange={(e) =>
                                setTerminPembayaran(e.target.value)
                            }
                            className="w-full p-2 mt-1 border rounded-lg bg-white"
                        >
                            <option value="COD">COD (Bayar di Tempat)</option>
                            <option value="14 Hari">Tempo 14 Hari</option>
                            <option value="30 Hari">Tempo 30 Hari</option>
                        </select>
                    </div>
                    <div className="text-right space-y-2 pt-4">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal:</span>
                            <span>
                                Rp{" "}
                                {new Intl.NumberFormat("id-ID").format(
                                    subtotal,
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">
                                Total Diskon:
                            </span>
                            <span>
                                - Rp{" "}
                                {new Intl.NumberFormat("id-ID").format(
                                    totalDiskon,
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between text-xl font-bold">
                            <span className="text-slate-800">Total Akhir:</span>
                            <span>
                                Rp{" "}
                                {new Intl.NumberFormat("id-ID").format(
                                    totalAkhir,
                                )}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t flex justify-end">
                    <button
                        onClick={handleSaveInvoice}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400"
                    >
                        <FiSave />
                        <span>
                            {isSaving
                                ? "Memproses Nota..."
                                : "Simpan & Buat Nota"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormNotaGrosir;
