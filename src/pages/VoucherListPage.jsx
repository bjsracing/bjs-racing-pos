// src/pages/VoucherListPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Sesuaikan path
import { FiPlus, FiEdit } from "react-icons/fi";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);

const VoucherListPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat voucher:", error);
      } else {
        setVouchers(data);
      }
      setLoading(false);
    };

    fetchVouchers();
  }, []);

  const renderDiscountValue = (voucher) => {
    if (voucher.type === "percentage") {
      return `${voucher.discount_value}% (Maks. ${formatRupiah(voucher.max_discount)})`;
    }
    if (voucher.type === "free_shipping") {
      return `Gratis Ongkir (Maks. ${formatRupiah(voucher.discount_value)})`;
    }
    return formatRupiah(voucher.discount_value);
  };

  const renderTarget = (voucher) => {
    const type = voucher.target_type || "all_products";
    const values = Array.isArray(voucher.target_value)
      ? voucher.target_value
      : [];
    if (type === "all_products" || values.length === 0)
      return <span className="text-gray-400">Semua Produk</span>;
    const label =
      type === "category"
        ? "Kategori"
        : type === "brand"
          ? "Merek"
          : "Produk";
    return (
      <span className="text-xs">
        <span className="font-medium text-blue-600">{label}:</span>{" "}
        {values.join(", ")}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Voucher</h1>
        <Link
          to="/manajemen-voucher/form"
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus />
          <span>Buat Voucher Baru</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 uppercase">
            <tr>
              <th className="px-6 py-3">Kode</th>
              <th className="px-6 py-3">Deskripsi</th>
              <th className="px-6 py-3">Tipe</th>
              <th className="px-6 py-3">Target</th>
              <th className="px-6 py-3">Nilai</th>
              <th className="px-6 py-3">Berlaku Hingga</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-6">
                  Memuat data...
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6">
                  Belum ada voucher yang dibuat.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold">
                    {voucher.code}
                  </td>
                  <td className="px-6 py-4">{voucher.description}</td>
                  <td className="px-6 py-4 capitalize">
                    {voucher.type.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4">{renderTarget(voucher)}</td>
                  <td className="px-6 py-4">{renderDiscountValue(voucher)}</td>
                  <td className="px-6 py-4">
                    {formatDate(voucher.valid_until)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${voucher.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {voucher.is_active ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/manajemen-voucher/form/${voucher.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VoucherListPage;
