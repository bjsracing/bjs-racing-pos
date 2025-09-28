// File: src/pages/PesananOnline.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient"; // Sesuaikan path ke supabase client Anda
import { Link } from "react-router-dom"; // Asumsi Anda menggunakan react-router-dom

// Helper functions (bisa diletakkan di file terpisah)
const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);
const formatTanggal = (dateString) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusColors = {
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  awaiting_payment: "bg-yellow-100 text-yellow-800",
};

export default function PesananOnlinePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from("online_orders_view").select("*");

    // Terapkan filter status
    if (statusFilter !== "semua") {
      query = query.eq("status", statusFilter);
    }

    // Terapkan filter pencarian
    if (searchTerm) {
      query = query.or(
        `order_number.ilike.%${searchTerm}%,nama_pelanggan.ilike.%${searchTerm}%`,
      );
    }

    // Urutkan berdasarkan yang terbaru
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Gagal mengambil pesanan online:", error);
      setError("Tidak dapat memuat data pesanan.");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manajemen Pesanan Online</h1>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Cari No. Pesanan / Nama Pelanggan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 p-2 border rounded-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 p-2 border rounded-md"
        >
          <option value="semua">Semua Status</option>
          <option value="paid">Telah Dibayar</option>
          <option value="processing">Diproses</option>
          <option value="shipped">Dikirim</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="awaiting_payment">Menunggu Pembayaran</option>
        </select>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 uppercase">
            <tr>
              <th className="px-6 py-3">No. Pesanan</th>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Pelanggan</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-6">
                  Memuat data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6">
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    <Link
                      to={`/pesanan-online/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {formatTanggal(order.created_at)}
                  </td>
                  <td className="px-6 py-4">{order.nama_pelanggan}</td>
                  <td className="px-6 py-4">
                    {formatRupiah(order.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
