import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiArrowLeft,
  FiUpload,
  FiCheckSquare,
  FiImage,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";
import PurchaseOrderShareModal from "../components/PurchaseOrderShareModal.jsx";

const DetailPembelian = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [poDocumentData, setPoDocumentData] = useState(null);

  // --- SEMUA FUNGSI HELPER & HANDLER KITA KUMPULKAN DI SINI ---
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
      setError(null);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("purchase_orders")
          .select(`*, suppliers(nama_supplier, telepon)`)
          .eq("id", poId)
          .single();
        if (orderError) throw orderError;
        setPurchaseOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from("purchase_order_items")
          .select(`*, products(*)`)
          .eq("purchase_order_id", poId);
        if (itemsError) throw itemsError;

        const initialItems = itemsData.map((item) => ({
          ...item,
          new_purchase_price: item.purchase_price || "",
          new_selling_price: item.products.harga_jual,
          is_price_changed: false,
        }));
        setItems(initialItems);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
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
      })
    );
  };

  const handleProcessReceipt = async () => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menyelesaikan pesanan ini? Stok akan otomatis bertambah."
      )
    )
      return;
    setIsSaving(true);
    let imageUrl = null;
    try {
      if (invoiceFile) {
        const fileName = `${poId}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from("purchase-invoices")
          .upload(fileName, invoiceFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("purchase-invoices")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      const itemsPayload = items.map((item) => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        new_purchase_price: Number(item.new_purchase_price),
        new_selling_price: item.is_price_changed
          ? Number(item.new_selling_price)
          : null,
      }));
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

  const handleShowPoDocument = () => {
    // Pastikan purchaseOrder sudah ada sebelum membuat dokumen
    if (!purchaseOrder) return;
    const documentData = {
      po_number: purchaseOrder.po_number,
      order_date: purchaseOrder.order_date,
      supplier_name: purchaseOrder.suppliers?.nama_supplier || "Supplier Umum",
      supplier_phone: purchaseOrder.suppliers?.telepon || null,
      items: items.map((item) => ({
        product_id: item.product_id,
        kode: item.products.kode,
        nama: item.products.nama,
        merek: item.products.merek,
        satuan: item.products.satuan,
        catatan_item: item.catatan_item,
        quantity_ordered: item.quantity_ordered,
      })),
    };
    setPoDocumentData(documentData);
    setIsShareModalOpen(true);
  };

  if (loading)
    return <div className="p-8 text-center">Memuat detail pesanan...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!purchaseOrder)
    return <div className="p-8 text-center">Pesanan tidak ditemukan.</div>;

  // --- SEMUA LOGIKA KONDISIONAL DIPINDAH KE SINI AGAR AMAN ---
  const isOrderClosed =
    purchaseOrder.status === "Selesai" || purchaseOrder.status === "Dibatalkan";
  const areAllPricesFilled = items.every(
    (item) => item.new_purchase_price && Number(item.new_purchase_price) > 0
  );
  const isSaveDisabled =
    isSaving ||
    isOrderClosed ||
    (purchaseOrder.status === "Dipesan" &&
      (!invoiceFile || !areAllPricesFilled));

  return (
    <>
      <PurchaseOrderShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        orderData={poDocumentData}
      />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            {isOrderClosed
              ? `Detail Pesanan (${purchaseOrder.status})`
              : `Terima Barang: ${purchaseOrder.po_number}`}
          </h1>
          <div className="text-base text-slate-800 mt-2 space-x-4">
            <span>
              Supplier:{" "}
              <span className="font-bold text-blue-600">
                {purchaseOrder.suppliers?.nama_supplier || "Supplier Umum"}
              </span>
            </span>
            <span>
              Status: <span className="font-bold">{purchaseOrder.status}</span>
            </span>
            <span>
              Tanggal:{" "}
              <span className="font-bold">
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

      <div className="bg-white p-6 rounded-xl shadow-lg w-full">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-4">
          Daftar Item
        </h2>
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b last:border-b-0 pb-6"
            >
              <div className="md:col-span-5">
                <p className="font-bold text-lg text-blue-600">
                  {item.products.nama}
                </p>
                <p className="text-sm text-slate-800 font-semibold mt-1">
                  (
                  <span className="font-bold">
                    {item.products.kode || "N/A"}
                  </span>
                  ) -{" "}
                  <span className="text-orange-500">
                    {item.products.merek || "-"}
                  </span>
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  {item.products.kategori}
                </p>
              </div>
              <div className="md:col-span-1 text-center">
                <p className="text-sm text-slate-800 mb-1">Dipesan</p>
                <p className="font-bold text-2xl">{item.quantity_ordered}</p>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  {isOrderClosed
                    ? "Harga Beli Tercatat"
                    : "Harga Beli Baru (per item)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder={isOrderClosed ? "" : "Wajib diisi"}
                    value={
                      item.new_purchase_price
                        ? new Intl.NumberFormat("id-ID").format(
                            item.new_purchase_price
                          )
                        : ""
                    }
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "new_purchase_price",
                        e.target.value
                      )
                    }
                    disabled={isOrderClosed}
                    className="w-full p-2 pl-8 border rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                {!isOrderClosed && (
                  <p className="text-sm text-slate-700 mt-1">
                    Harga lama: {formatRupiah(item.products.harga_beli)}
                  </p>
                )}
              </div>
              <div className="md:col-span-3">
                {item.is_price_changed && !isOrderClosed && (
                  <div className="bg-yellow-50 p-3 rounded-lg animate-fade-in">
                    <label className="block text-xs text-yellow-700 font-semibold mb-1">
                      Update harga jual?
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
                                item.new_selling_price
                              )
                            : ""
                        }
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "new_selling_price",
                            e.target.value
                          )
                        }
                        className="w-full p-2 pl-8 border rounded-lg border-yellow-300 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="text-sm text-slate-700 mt-1">
                      Harga jual lama: {formatRupiah(item.products.harga_jual)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {isOrderClosed
              ? "Nota/Invoice Pembelian"
              : "Unggah Foto Nota/Invoice (Wajib)"}
          </h3>
          {isOrderClosed && purchaseOrder.invoice_image_url ? (
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
          ) : isOrderClosed && !purchaseOrder.invoice_image_url ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada nota/invoice yang diunggah.
              </p>
            </div>
          ) : (
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
          {(purchaseOrder.status === "Selesai" ||
            purchaseOrder.status === "Dipesan") && (
            <button
              onClick={handleShowPoDocument}
              className="w-full mb-4 flex items-center justify-center gap-3 bg-white text-blue-600 border-2 border-blue-500 font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
            >
              <FiFileText size={20} />
              <span>Tampilkan Dokumen PO</span>
            </button>
          )}
          <p className="text-slate-600 text-center mb-4">
            {isOrderClosed
              ? "Pesanan ini sudah ditutup."
              : "Pastikan semua harga beli baru & nota telah diunggah sebelum menyimpan."}
          </p>
          <button
            onClick={handleProcessReceipt}
            disabled={isSaveDisabled}
            className="w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            <FiCheckSquare size={22} />
            <span>
              {isSaving
                ? "Memproses..."
                : isOrderClosed
                ? "Pesanan Ditutup"
                : "Simpan & Terima Barang"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DetailPembelian;
