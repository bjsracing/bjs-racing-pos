import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiArrowLeft,
  FiUpload,
  FiCheckSquare,
  FiImage,
  FiTrash2,
} from "react-icons/fi";

const DetailPembelian = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);

  const formatRupiah = (number) => {
    if (isNaN(number) || number === null) return "";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      // ... (logika fetch data sama seperti sebelumnya, tidak perlu diubah)
      const { data: orderData, error: orderError } = await supabase
        .from("purchase_orders")
        .select(`*, suppliers(nama_supplier)`)
        .eq("id", poId)
        .single();
      if (orderError) {
        setError(orderError.message);
        setLoading(false);
        return;
      }
      setPurchaseOrder(orderData);
      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select(`*, products(*)`)
        .eq("purchase_order_id", poId);
      if (itemsError) {
        setError(itemsError.message);
      } else {
        const initialItems = itemsData.map((item) => ({
          ...item,
          new_purchase_price: "",
          new_selling_price: item.products.harga_jual,
          is_price_changed: false,
        }));
        setItems(initialItems);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [poId]);

  const handleItemChange = (itemId, field, value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: numericValue };
          if (field === "new_purchase_price") {
            const oldPrice = item.products.harga_beli;
            const newPrice = Number(numericValue);
            updatedItem.is_price_changed =
              newPrice > 0 && newPrice !== oldPrice;
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Cek apakah semua harga beli sudah diisi untuk mengaktifkan tombol simpan
  const isSaveDisabled = useMemo(() => {
    if (isSaving) return true;
    if (items.length === 0) return true;
    return items.some(
      (item) =>
        !item.new_purchase_price || Number(item.new_purchase_price) <= 0,
    );
  }, [items, isSaving]);

  const handleProcessReceipt = async () => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menyelesaikan pesanan ini? Stok akan otomatis bertambah.",
      )
    ) {
      return;
    }

    setIsSaving(true);
    let imageUrl = null;

    try {
      // 1. Upload file jika ada
      if (invoiceFile) {
        const fileName = `${poId}-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("purchase-invoices")
          .upload(fileName, invoiceFile);

        if (uploadError) throw uploadError;

        // Dapatkan URL publik dari file yang di-upload
        const { data: publicUrlData } = supabase.storage
          .from("purchase-invoices")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Siapkan data item untuk dikirim ke RPC
      const itemsPayload = items.map((item) => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        new_purchase_price: Number(item.new_purchase_price),
        // Kirim harga jual baru HANYA jika harganya berubah
        new_selling_price: item.is_price_changed
          ? Number(item.new_selling_price)
          : null,
      }));

      // 3. Panggil fungsi RPC
      const { error: rpcError } = await supabase.rpc("process_po_receipt", {
        p_po_id: poId,
        p_invoice_image_url: imageUrl,
        p_items: itemsPayload,
      });

      if (rpcError) throw rpcError;

      alert("Pesanan berhasil diselesaikan! Stok dan harga telah diperbarui.");
      navigate("/pembelian");
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Memuat detail pesanan...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!purchaseOrder)
    return <div className="p-8 text-center">Pesanan tidak ditemukan.</div>;

  return (
    <>
      {/* ... bagian header tetap sama ... */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Terima Barang: {purchaseOrder.po_number}
          </h1>
          <div className="text-sm text-slate-500 mt-1 space-x-4">
            <span>
              Supplier:{" "}
              <span className="font-semibold">
                {purchaseOrder.suppliers?.nama_supplier || "Supplier Umum"}
              </span>
            </span>
            <span>
              Status:{" "}
              <span className="font-semibold">{purchaseOrder.status}</span>
            </span>
            <span>
              Tanggal:{" "}
              <span className="font-semibold">
                {new Date(purchaseOrder.order_date).toLocaleDateString("id-ID")}
              </span>
            </span>
          </div>
        </div>
        <Link
          to="/pembelian"
          className="mt-4 sm:mt-0 flex items-center gap-2 py-2 px-4 rounded-lg text-slate-600 hover:bg-slate-200"
        >
          <FiArrowLeft />
          <span>Kembali</span>
        </Link>
      </div>

      {/* ... bagian daftar item tetap sama ... */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-4">
          Daftar Item untuk Diterima
        </h2>
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b last:border-b-0 pb-6"
            >
              <div className="md:col-span-5">
                <p className="font-bold text-lg text-slate-800">
                  {item.products.nama}
                </p>
                <p className="text-sm text-slate-500">
                  {item.products.kode || "Tanpa Kode"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Merek: {item.products.merek} | Kategori:{" "}
                  {item.products.kategori}
                </p>
              </div>
              <div className="md:col-span-1 text-center">
                <p className="text-xs text-slate-500 mb-1">Dipesan</p>
                <p className="font-bold text-2xl">{item.quantity_ordered}</p>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-500 mb-1">
                  Harga Beli Baru (per item)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="Wajib diisi"
                    value={
                      item.new_purchase_price
                        ? new Intl.NumberFormat("id-ID").format(
                            item.new_purchase_price,
                          )
                        : ""
                    }
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "new_purchase_price",
                        e.target.value,
                      )
                    }
                    className="w-full p-2 pl-8 border rounded-lg"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Harga lama: {formatRupiah(item.products.harga_beli)}
                </p>
              </div>
              <div className="md:col-span-3">
                {item.is_price_changed && (
                  <div className="bg-yellow-50 p-3 rounded-lg animate-fade-in">
                    <label className="block text-xs text-yellow-700 font-semibold mb-1">
                      Ada perubahan harga beli. Update harga jual?
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={
                          item.new_selling_price
                            ? new Intl.NumberFormat("id-ID").format(
                                item.new_selling_price,
                              )
                            : ""
                        }
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "new_selling_price",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 pl-8 border rounded-lg border-yellow-300 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Harga jual lama: {formatRupiah(item.products.harga_jual)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BAGIAN YANG DIPERBARUI --- */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {/* Judul berubah sesuai status */}
            {purchaseOrder.status === "Selesai"
              ? "Nota/Invoice Pembelian"
              : "Unggah Foto Nota/Invoice (Opsional)"}
          </h3>

          {/* Logika Tampilan Kondisional */}
          {purchaseOrder.status === "Selesai" ? (
            purchaseOrder.invoice_image_url ? (
              // TAMPILAN JIKA SELESAI & ADA GAMBAR
              <div>
                <a
                  href={purchaseOrder.invoice_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Klik untuk melihat ukuran penuh"
                >
                  <img
                    src={purchaseOrder.invoice_image_url}
                    alt={`Nota untuk PO ${purchaseOrder.po_number}`}
                    className="w-full h-auto max-h-80 object-contain rounded-lg border p-2 cursor-pointer"
                  />
                </a>
              </div>
            ) : (
              // TAMPILAN JIKA SELESAI TAPI TIDAK ADA GAMBAR
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-sm text-slate-500">
                  Tidak ada nota/invoice yang diunggah untuk pesanan ini.
                </p>
              </div>
            )
          ) : (
            // TAMPILAN UPLOAD (jika status masih 'Dipesan')
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="invoice-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => setInvoiceFile(e.target.files[0])}
              />
              {!invoiceFile ? (
                <label htmlFor="invoice-upload" className="cursor-pointer">
                  <FiUpload className="mx-auto text-4xl text-slate-400" />
                  <p className="mt-2 text-sm text-blue-600 hover:underline">
                    Pilih file gambar
                  </p>
                </label>
              ) : (
                <div className="flex items-center justify-center gap-3 text-slate-700">
                  <FiImage className="text-green-500" />
                  <span className="text-sm font-medium">
                    {invoiceFile.name}
                  </span>
                  <button
                    onClick={() => setInvoiceFile(null)}
                    className="p-1 hover:bg-red-100 rounded-full"
                  >
                    <FiTrash2 className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-center items-center">
          <p className="text-slate-600 text-center mb-4">
            {purchaseOrder.status === "Selesai"
              ? "Pesanan ini sudah selesai diproses."
              : "Pastikan semua harga beli baru telah diisi sebelum menyimpan."}
          </p>
          <button
            onClick={handleProcessReceipt}
            disabled={isSaveDisabled || purchaseOrder.status === "Selesai"} // Tombol nonaktif jika sudah selesai
            className="w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            <FiCheckSquare size={22} />
            <span>
              {isSaving
                ? "Memproses..."
                : purchaseOrder.status === "Selesai"
                  ? "Pesanan Selesai"
                  : "Simpan & Terima Barang"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DetailPembelian;
