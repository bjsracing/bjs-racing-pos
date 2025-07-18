// src/pages/CetakDokumenPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotaPreview from "../components/NotaPreview";

const CetakDokumenPage = () => {
  const { tipe, id } = useParams(); // 'tipe' bisa 'pesanan' atau 'nota'
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let documentData = null;

    try {
      if (tipe === "pesanan") {
        // Logika untuk mengambil data Sales Order
        const { data: orderData, error: orderError } = await supabase
          .from("sales_orders")
          .select("*, customers(*)")
          .eq("id", id)
          .single();
        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from("sales_order_items")
          .select("*, products(*)")
          .eq("sales_order_id", id);
        if (itemsError) throw itemsError;

        // Struktur data disamakan dengan nota
        // Struktur data disamakan dengan nota
        const { customers, ...restOfOrderData } = orderData;
        documentData = {
          ...restOfOrderData,
          customer: customers, // <-- Diubah dari customers menjadi customer
          items: itemsData.map((item) => ({
            ...item,
            harga_grosir_deal: 0,
            diskon_item_rp: 0,
          })),
          total_akhir: 0,
          subtotal: 0,
          total_diskon: 0,
        };
      } else if (tipe === "nota") {
        // Logika untuk mengambil data Invoice (Nota Penjualan)
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*, customers(*)")
          .eq("id", id)
          .single();
        if (invoiceError) throw invoiceError;

        const { data: itemsData, error: itemsError } = await supabase
          .from("invoice_items")
          .select("*, products(*)")
          .eq("invoice_id", id);
        if (itemsError) throw itemsError;

        const { customers, ...restOfInvoiceData } = invoiceData;
        documentData = {
          ...restOfInvoiceData,
          customer: customers,
          items: itemsData,
        }; // <-- Diubah dari customers menjadi customer
      } else {
        throw new Error("Tipe dokumen tidak valid.");
      }

      // --- TAMBAHKAN BLOK DEBUG INI ---
      console.log("Tipe Dokumen:", tipe);
      console.log("Data yang akan dikirim ke preview:", documentData);
      // --- AKHIR BLOK DEBUG ---
      setData(documentData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching document data:", err);
    } finally {
      setLoading(false);
    }
  }, [tipe, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Memuat dokumen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <p>Gagal memuat dokumen: {error}</p>
      </div>
    );
  }

  return (
    <NotaPreview
      data={data}
      title={tipe === "pesanan" ? "NOTA PESANAN" : "NOTA PENJUALAN"}
      showSignatureBlocks={tipe === "nota"} // Tanda tangan hanya muncul di Nota Penjualan
    />
  );
};

export default CetakDokumenPage;
