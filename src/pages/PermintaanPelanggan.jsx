// src/pages/PermintaanPelanggan.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiArrowRight, FiFileText } from "react-icons/fi";

const PermintaanPelanggan = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permintaan_pelanggan")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      alert("Gagal memuat data permintaan: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusBadge = (status) => {
    if (status === "Baru") return "bg-blue-100 text-blue-800";
    if (status === "Sudah Dipesan") return "bg-green-100 text-green-800";
    if (status === "Diarsipkan") return "bg-slate-100 text-slate-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Manajemen Permintaan Pelanggan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lacak produk yang dicari pelanggan namun tidak tersedia di toko.
        </p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Daftar Permintaan
        </h2>
        {loading ? (
          <p className="text-center text-slate-500 py-10">Memuat data...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <FiFileText className="mx-auto text-4xl text-slate-300 mb-2" />
            <p className="text-slate-500">
              Belum ada permintaan yang tercatat.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
              >
                <div className="md:col-span-2">
                  <p className="font-bold text-slate-800">
                    {req.nama_produk_diminta}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 italic">
                    "{req.catatan || "Tidak ada catatan"}"
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status)}`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="flex justify-end items-center">
                  {req.status === "Baru" && (
                    <Link
                      to="/pembelian/baru"
                      state={{ requestedProduct: req }} // Ini mengirim data permintaan ke FormPembelian
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 text-sm"
                    >
                      <span>Buat Pesanan</span>
                      <FiArrowRight size={16} />
                    </Link>
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

export default PermintaanPelanggan;
