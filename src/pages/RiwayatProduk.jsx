// src/pages/RiwayatProduk.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  FiArrowLeft,
  FiEdit,
  FiPlusCircle,
  FiArrowDown,
  FiArrowUp,
} from "react-icons/fi";

const RiwayatProduk = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: productData, error: pError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (pError) throw pError;
      setProduct(productData);

      const { data: historyData, error: hError } = await supabase
        .from("product_history_logs")
        .select("*")
        .eq("product_id", productId);
      if (hError) throw hError;

      const { data: stockLogsData, error: sError } = await supabase
        .from("stock_logs")
        .select("*")
        .eq("product_id", productId);
      if (sError) throw sError;

      const formattedHistory = (historyData || []).map((log) => ({
        ...log,
        type: "log",
        date: new Date(log.created_at),
      }));

      const formattedStockLogs = (stockLogsData || []).map((log) => ({
        ...log,
        type: "stock",
        date: new Date(log.created_at),
      }));

      const combinedData = [...formattedHistory, ...formattedStockLogs];
      combinedData.sort((a, b) => b.date - a.date); // Urutkan dari yang terbaru

      setHistory(combinedData);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
      alert("Gagal memuat riwayat produk.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getLogIcon = (log) => {
    if (log.type === "stock") {
      return log.perubahan > 0 ? (
        <div className="bg-green-100 text-green-600 p-2 rounded-full">
          <FiArrowUp />
        </div>
      ) : (
        <div className="bg-red-100 text-red-600 p-2 rounded-full">
          <FiArrowDown />
        </div>
      );
    }
    if (log.change_type === "PRODUK DIBUAT") {
      return (
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <FiPlusCircle />
        </div>
      );
    }
    return (
      <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
        <FiEdit />
      </div>
    );
  };

  const renderLogDetails = (log) => {
    if (log.type === "stock") {
      return (
        <div>
          <span
            className={`font-bold ${log.perubahan > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {log.perubahan > 0 ? `+${log.perubahan}` : log.perubahan}
          </span>
          <span className="text-slate-600">
            {" "}
            · {log.keterangan || "Perubahan Stok"}
          </span>
        </div>
      );
    }
    if (log.change_type === "PRODUK DIBUAT") {
      return (
        <span className="font-semibold text-slate-700">
          Produk baru berhasil ditambahkan ke sistem.
        </span>
      );
    }
    return (
      <p className="text-slate-600">
        <span className="font-semibold capitalize">
          {log.field_changed.replace("_", " ")}
        </span>{" "}
        diubah dari
        <span className="font-bold text-red-600 mx-1">
          "{log.old_value}"
        </span>{" "}
        menjadi
        <span className="font-bold text-green-600 ml-1">"{log.new_value}"</span>
        .
      </p>
    );
  };

  if (loading)
    return <p className="text-center p-8">Memuat riwayat produk...</p>;
  if (!product)
    return <p className="text-center p-8">Produk tidak ditemukan.</p>;

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link
          to="/produk"
          className="text-blue-600 hover:underline flex items-center gap-2 mb-2 w-fit"
        >
          <FiArrowLeft />
          <span>Kembali ke Manajemen Produk</span>
        </Link>
        <h1 className="text-3xl font-bold">{product.nama}</h1>
        <p className="text-slate-500">
          Menampilkan riwayat perubahan & pergerakan stok untuk produk ini.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        {history.length > 0 ? (
          <div className="space-y-6">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex gap-4 border-b last:border-b-0 pb-4"
              >
                <div className="mt-1">{getLogIcon(log)}</div>
                <div className="flex-1">
                  {renderLogDetails(log)}
                  <p className="text-xs text-slate-400 mt-1">
                    {format(log.date, "EEEE, dd MMMM yyyy HH:mm", {
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-10">
            Belum ada riwayat untuk produk ini.
          </p>
        )}
      </div>
    </div>
  );
};

export default RiwayatProduk;
