// src/pages/PenjualanGrosir.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiXCircle,
  FiPrinter,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import SalesOrderFilter from "../components/SalesOrderFilter.jsx"; // Impor komponen filter baru

const PenjualanGrosir = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fungsi ini dipanggil oleh komponen filter setiap kali ada perubahan
  const handleFilterChange = useCallback(async (filters) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("search_sales_orders", {
      search_term: filters.searchTerm,
      status_filter: filters.status,
      mitra_id_filter: filters.mitra === "semua" ? null : filters.mitra,
      start_date_filter: filters.startDate || null, // <-- Diperbaiki
      end_date_filter: filters.endDate || null, // <-- Diperbaiki
    });

    if (error) {
      alert("Gagal mengambil data pesanan: " + error.message);
      setSalesOrders([]);
    } else {
      setSalesOrders(data || []);
    }
    setLoading(false);
  }, []);

  // useEffect untuk memicu refresh data jika diperlukan
  useEffect(() => {
    // Fungsi ini bisa dipanggil lagi jika ada tombol refresh manual
    // Untuk sekarang, kita biarkan kosong karena filter yang menangani load awal
  }, [refreshTrigger]);

  const handleCancelOrder = async (orderId, soNumber) => {
    // Logika pembatalan tidak berubah...
    if (
      window.confirm(
        `Apakah Anda yakin ingin MEMBATALKAN pesanan "${soNumber}"?`,
      )
    ) {
      // ... (kode untuk update status ke 'Batal')
      setRefreshTrigger((t) => t + 1); // Picu refresh
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-200 text-gray-800";
      case "Dikonfirmasi":
        return "bg-blue-200 text-blue-800";
      case "Menunggu Pembayaran":
        return "bg-yellow-200 text-yellow-800";
      case "Selesai":
        return "bg-green-200 text-green-800";
      case "Batal":
        return "bg-red-200 text-red-800";
      default:
        return "bg-slate-200 text-slate-800";
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Penjualan Grosir
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola dan lacak semua pesanan untuk mitra bisnis Anda.
          </p>
        </div>
        <Link
          to="/penjualan-grosir/baru"
          className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          <FiPlus size={20} />
          <span>Buat Pesanan Grosir</span>
        </Link>
      </div>

      {/* Render Komponen Filter */}
      <SalesOrderFilter onFilterChange={handleFilterChange} />

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Daftar Pesanan Grosir
        </h2>
        {loading ? (
          <p className="text-center text-slate-500 py-10">Memuat data...</p>
        ) : salesOrders.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-slate-500">
              Tidak ada data pesanan yang cocok dengan filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {salesOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 items-center"
              >
                <div className="col-span-2 md:col-span-1">
                  <p className="font-bold text-blue-600">{order.so_number}</p>
                  {order.invoice_number && (
                    <p className="text-xs font-mono text-purple-600">
                      {order.invoice_number}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 font-semibold mt-1">
                    {order.nama_pelanggan || "Mitra Dihapus"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal Pesan</p>
                  <p className="font-medium text-slate-800">
                    {new Date(order.tanggal_pesanan).toLocaleDateString(
                      "id-ID",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.final_status)}`}
                  >
                    {order.final_status}
                  </span>
                </div>
                <div className="flex justify-end items-center gap-2">
                  {/* --- TOMBOL AKSI KONTEKSTUAL BARU --- */}
                  {["Draft", "Dikonfirmasi"].includes(order.final_status) && (
                    <Link
                      to={`/penjualan-grosir/detail/${order.id}`}
                      title="Lihat Detail Pesanan"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-full"
                    >
                      <FiEye size={18} />
                    </Link>
                  )}
                  {["Menunggu Pembayaran", "Selesai"].includes(
                    order.final_status,
                  ) && (
                    <Link
                      to={`/nota/detail/${order.invoice_id}`}
                      title="Lihat Detail Nota"
                      className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-100 rounded-full"
                    >
                      <FiFileText size={18} />
                    </Link>
                  )}
                  {order.final_status === "Draft" && (
                    <Link
                      to={`/penjualan-grosir/edit/${order.id}`}
                      title="Edit Pesanan"
                      className="p-2 text-slate-600 hover:text-yellow-600 hover:bg-yellow-100 rounded-full"
                    >
                      <FiEdit size={18} />
                    </Link>
                  )}
                  {order.final_status !== "Draft" && (
                    <Link
                      to={`/cetak/pesanan/${order.id}`}
                      target="_blank"
                      title="Cetak Pesanan"
                      className="p-2 text-slate-600 hover:text-gray-600 hover:bg-gray-200 rounded-full"
                    >
                      <FiPrinter size={18} />
                    </Link>
                  )}
                  {order.invoice_id && (
                    <Link
                      to={`/cetak/nota/${order.invoice_id}`}
                      target="_blank"
                      title="Cetak Nota"
                      className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-100 rounded-full"
                    >
                      <FiPrinter size={18} />
                    </Link>
                  )}
                  {order.bukti_pembayaran_url && (
                    <a
                      href={order.bukti_pembayaran_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Lihat Bukti Bayar"
                      className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-100 rounded-full"
                    >
                      <FiImage size={18} />
                    </a>
                  )}
                  {order.final_status === "Draft" && (
                    <button
                      onClick={() =>
                        handleCancelOrder(order.id, order.so_number)
                      }
                      title="Batalkan Pesanan"
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <FiXCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PenjualanGrosir;
