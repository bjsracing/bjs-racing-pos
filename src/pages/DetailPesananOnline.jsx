// File: src/pages/DetailPesananOnline.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // Sesuaikan path

// Helper functions
const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);
const formatTanggal = (dateString) =>
  new Date(dateString).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

const statusColors = {
  /* ... objek statusColors dari file sebelumnya ... */
};

export default function DetailPesananOnlinePage() {
  const { orderId } = useParams(); // Ambil ID pesanan dari URL
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk form manajemen
  const [newStatus, setNewStatus] = useState("");
  const [resiNumber, setResiNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (nama_pelanggan, telepon),
        order_items (
          quantity,
          price,
          products (nama, sku)
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (error) {
      setError("Gagal memuat detail pesanan.");
      console.error(error);
    } else {
      setOrder(data);
      setNewStatus(data.status); // Atur state form sesuai data saat ini
      setResiNumber(data.shipping_receipt_number || "");
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        shipping_receipt_number: resiNumber,
      })
      .eq("id", orderId);

    if (error) {
      alert("Gagal memperbarui pesanan: " + error.message);
    } else {
      alert("Pesanan berhasil diperbarui!");
      fetchOrderDetails(); // Muat ulang data untuk menampilkan perubahan
    }
    setIsSaving(false);
  };

  if (loading) return <div className="p-6">Memuat detail pesanan...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!order) return <div className="p-6">Pesanan tidak ditemukan.</div>;

  return (
    <div className="p-6 space-y-6">
      <Link to="/pesanan-online" className="text-blue-600 hover:underline">
        &larr; Kembali ke Daftar Pesanan
      </Link>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            Detail Pesanan #{order.order_number}
          </h1>
          <p className="text-gray-500">
            Tanggal: {formatTanggal(order.created_at)}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 text-sm font-semibold rounded-full capitalize ${statusColors[order.status] || ""}`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Rincian Item */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Rincian Item</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Produk</th>
                  <th className="text-center pb-2">Kuantitas</th>
                  <th className="text-right pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.products.sku}>
                    <td className="py-2">
                      {item.products.nama} ({item.products.sku})
                    </td>
                    <td className="text-center py-2">
                      {item.quantity} x {formatRupiah(item.price)}
                    </td>
                    <td className="text-right py-2 font-medium">
                      {formatRupiah(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Detail Pelanggan & Pengiriman */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Pelanggan</h2>
              <p>{order.customers.nama_pelanggan}</p>
              <p>{order.customers.telepon}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Alamat Pengiriman</h2>
              <p>{order.shipping_address.recipient_name}</p>
              <p>
                {order.shipping_address.full_address},{" "}
                {order.shipping_address.destination_text}
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          {/* Rincian Biaya */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Rincian Biaya</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal Produk</span>
                <span>{formatRupiah(order.subtotal_products)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ongkos Kirim</span>
                <span>{formatRupiah(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Layanan</span>
                <span>{formatRupiah(order.service_fee)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon ({order.voucher_code})</span>
                  <span>- {formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatRupiah(order.total_amount)}</span>
              </div>
            </div>
          </div>
          {/* Form Manajemen */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Manajemen Pesanan</h2>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium">
                  Ubah Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="paid">Telah Dibayar</option>
                  <option value="processing">Diproses</option>
                  <option value="shipped">Dikirim</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              <div>
                <label htmlFor="resi" className="block text-sm font-medium">
                  Nomor Resi
                </label>
                <input
                  type="text"
                  id="resi"
                  value={resiNumber}
                  onChange={(e) => setResiNumber(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
