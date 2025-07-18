// src/pages/DetailPesananGrosir.jsx (Versi Final dengan Tampilan Lengkap)
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";

const DetailPesananGrosir = () => {
  const { soId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("sales_orders")
        .select("*, customers(nama_pelanggan, telepon)")
        .eq("id", soId)
        .single();
      if (orderError) throw orderError;
      setOrder(orderData);

      // Cek apakah ada invoice yang terhubung
      if (orderData.status === "Selesai") {
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select("id")
          .eq("sales_order_id", orderData.id)
          .single();
        setInvoice(invoiceData);
      }

      // Query diperbarui untuk mengambil Merek dan Stok
      const { data: itemsData, error: itemsError } = await supabase
        .from("sales_order_items")
        .select("*, products(nama, kode, ukuran, merek, stok)")
        .eq("sales_order_id", soId);
      if (itemsError) throw itemsError;
      setItems(itemsData);
    } catch (error) {
      console.error("Gagal memuat detail pesanan:", error);
      alert("Gagal memuat detail pesanan.");
    } finally {
      setLoading(false);
    }
  }, [soId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleConfirmOrder = async () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengonfirmasi pesanan ini? Stok akan dialokasikan dan pesanan tidak bisa diedit lagi.",
      )
    ) {
      setIsProcessing(true);
      try {
        const { error } = await supabase.rpc("confirm_sales_order", {
          order_id: soId,
        });
        if (error) throw error;
        alert("Pesanan berhasil dikonfirmasi! Stok telah dialokasikan.");
        fetchOrderDetails();
      } catch (error) {
        alert("Gagal mengonfirmasi pesanan: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading)
    return <p className="p-8 text-center">Memuat detail pesanan...</p>;
  if (!order)
    return <p className="p-8 text-center">Pesanan tidak ditemukan.</p>;

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link
          to="/penjualan-grosir"
          className="text-blue-600 hover:underline flex items-center gap-2 mb-2 w-fit"
        >
          <FiArrowLeft />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
        <h1 className="text-3xl font-bold">{order.so_number}</h1>
        <p className="text-slate-500">
          Detail untuk pesanan dari:{" "}
          <strong>{order.customers.nama_pelanggan}</strong>
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
          Rincian Pesanan
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <p className="text-slate-500">Tanggal Pesan</p>
            <p className="font-semibold">
              {format(new Date(order.tanggal_pesanan), "d MMM yyyy", {
                locale: id,
              })}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Status Pesanan</p>
            <p className="font-semibold">{order.status}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Catatan</p>
            <p className="font-semibold">{order.catatan_pesanan || "-"}</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-6 border-b pb-2">
          Item yang Dipesan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600">
                  Produk
                </th>
                <th className="p-3 text-left font-semibold text-slate-600">
                  Merek
                </th>
                <th className="p-3 text-center font-semibold text-slate-600">
                  Stok Saat Ini
                </th>
                <th className="p-3 text-center font-semibold text-slate-600">
                  Jumlah
                </th>
                <th className="p-3 text-center font-semibold text-slate-600">
                  Satuan
                </th>
                <th className="p-3 text-left font-semibold text-slate-600">
                  Catatan Item
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <p className="font-bold text-slate-800">
                      {item.products.nama}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.products.kode} · {item.products.ukuran || "-"}
                    </p>
                  </td>
                  <td className="p-3 text-slate-700">
                    {item.products.merek || "-"}
                  </td>
                  <td className="p-3 text-center font-semibold">
                    {item.products.stok}
                  </td>
                  <td className="p-3 text-center font-bold text-lg text-blue-600">
                    {item.kuantitas}
                  </td>
                  <td className="p-3 text-center text-slate-700">
                    {item.satuan || "Pcs"}
                  </td>
                  <td className="p-3 text-slate-600">
                    {item.catatan_item || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end gap-4">
          <Link
            to={`/cetak/pesanan/${order.id}`}
            target="_blank"
            className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700"
          >
            <FiPrinter />
            <span>Cetak Pesanan</span>
          </Link>
          {order.status === "Draft" && (
            <button
              onClick={handleConfirmOrder}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-slate-400"
            >
              <FiCheckCircle />
              <span>
                {isProcessing ? "Memproses..." : "Konfirmasi Pesanan"}
              </span>
            </button>
          )}
          {order.status === "Dikonfirmasi" && (
            <Link
              to={`/penjualan-grosir/nota/baru/${order.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              <FiFileText />
              <span>Buat Nota Penjualan</span>
            </Link>
          )}
          {/* --- TOMBOL BARU: Link ke Detail Nota jika sudah dibuat --- */}
          {order.status === "Selesai" && invoice?.id && (
            <Link
              to={`/nota/detail/${invoice.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700"
            >
              <FiEye />
              <span>Lihat Nota Terkait</span>
            </Link>
          )}
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailPesananGrosir;
