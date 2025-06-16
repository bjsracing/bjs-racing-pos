import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi"; // Impor sudah lengkap
import { supabase } from "../supabaseClient";

const Pembelian = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // --- TAMBAHAN: State untuk memicu refresh data ---
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(
          `id, po_number, order_date, status, suppliers ( nama_supplier )`
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchase orders:", error);
      } else {
        setPurchaseOrders(data);
      }
      setLoading(false);
    };

    fetchPurchaseOrders();
    // --- PERUBAHAN: useEffect akan berjalan lagi jika refreshTrigger berubah ---
  }, [refreshTrigger]);

  // --- TAMBAHAN: Fungsi untuk menghapus pesanan ---
  const handleDeleteOrder = async (orderId, poNumber) => {
    // 1. Minta konfirmasi dari pengguna untuk keamanan
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus pesanan "${poNumber}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      // 2. Lakukan proses hapus ke Supabase
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", orderId);

      if (error) {
        alert("Gagal menghapus pesanan: " + error.message);
      } else {
        alert("Pesanan berhasil dihapus.");
        // 3. Picu refresh data untuk memperbarui tampilan
        setRefreshTrigger((t) => t + 1);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Dipesan":
        return "bg-yellow-100 text-yellow-800";
      case "Selesai":
        return "bg-green-100 text-green-800";
      case "Dibatalkan":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Manajemen Pembelian
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lacak dan kelola semua pesanan pembelian Anda ke supplier.
          </p>
        </div>
        <Link
          to="/pembelian/baru"
          className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 transition-all duration-200"
        >
          <FiPlus size={20} />
          <span>Buat Pesanan Baru</span>
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Daftar Pesanan (Purchase Orders)
        </h2>

        {loading ? (
          <p className="text-center text-slate-500 py-10">
            Memuat data pesanan...
          </p>
        ) : purchaseOrders.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-slate-500">Belum ada data pesanan pembelian.</p>
            <p className="text-sm text-slate-400 mt-2">
              Klik "Buat Pesanan Baru" untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 items-center"
              >
                <div className="col-span-2 md:col-span-1">
                  <p className="font-bold text-blue-600">{order.po_number}</p>
                  <p className="text-sm text-slate-600">
                    {order.suppliers?.nama_supplier || "Supplier Umum"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal Pesan</p>
                  <p className="font-medium text-slate-800">
                    {new Date(order.order_date).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-end items-center gap-2">
                  <Link
                    to={`/pembelian/detail/${order.id}`}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-full transition-colors"
                    title={
                      order.status === "Dipesan"
                        ? "Lihat & Terima Barang"
                        : "Lihat Detail"
                    }
                  >
                    <FiEye size={18} />
                  </Link>

                  {order.status === "Dipesan" && (
                    <>
                      <Link
                        to={`/pembelian/edit/${order.id}`}
                        className="p-2 text-slate-600 hover:text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors"
                        title="Edit Pesanan"
                      >
                        <FiEdit size={18} />
                      </Link>
                      {/* --- PERUBAHAN: onClick sekarang memanggil fungsi hapus --- */}
                      <button
                        onClick={() =>
                          handleDeleteOrder(order.id, order.po_number)
                        }
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="Hapus Pesanan"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </>
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

export default Pembelian;
