import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiArrowLeft,
  FiUpload,
  FiCheckSquare,
  FiImage,
  FiTrash2,
  FiFileText,
  FiPlusCircle,
} from "react-icons/fi";
import PurchaseOrderShareModal from "../components/PurchaseOrderShareModal.jsx";
import ProductModal from "../components/ProductModal.jsx";

const DetailPembelian = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  // State utama
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // State untuk biaya, pembayaran, dan file
  const [shippingCost, setShippingCost] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Belum Dibayar");
  const [dueDate, setDueDate] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);

  // State untuk semua modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [poDocumentData, setPoDocumentData] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [productSaveError, setProductSaveError] = useState("");

  const formatRupiah = (number, includeSymbol = true) => {
    if (isNaN(Number(number)) || number === null || number === "")
      return includeSymbol ? "Rp 0" : "0";
    return new Intl.NumberFormat("id-ID", {
      style: includeSymbol ? "currency" : "decimal",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

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
      setShippingCost(orderData.shipping_cost || "");
      setDiscountAmount(orderData.discount_amount || "");
      setOtherCosts(orderData.other_costs || "");
      setPaymentStatus(orderData.payment_status || "Belum Dibayar");
      setDueDate(orderData.due_date || "");

      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select(`*, products(*)`)
        .eq("purchase_order_id", poId);
      if (itemsError) throw itemsError;
      const initialItems = itemsData.map((item) => ({
        ...item,
        quantity_received_input:
          item.quantity_received != null
            ? item.quantity_received
            : item.quantity_ordered,
        new_purchase_price:
          item.purchase_price != null
            ? item.purchase_price
            : item.products.harga_beli || "",
        new_selling_price: item.products.harga_jual,
        is_price_changed: false,
      }));
      setItems(initialItems);

      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, nama_supplier");
      if (suppliersData) setSupplierOptions(suppliersData);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [poId]);

  const costSummary = useMemo(() => {
    // Jika order sudah Selesai atau Dibatalkan, ambil data langsung dari PO, JANGAN hitung ulang.
    if (
      purchaseOrder &&
      (purchaseOrder.status === "Selesai" ||
        purchaseOrder.status === "Dibatalkan")
    ) {
      const totalAkhir = Number(purchaseOrder.total_amount) || 0;
      const ongkir = Number(purchaseOrder.shipping_cost) || 0;
      const biayaLain = Number(purchaseOrder.other_costs) || 0;
      const diskon = Number(purchaseOrder.discount_amount) || 0;
      // Hitung subtotal berdasarkan data yang sudah final
      const subtotal = totalAkhir - ongkir - biayaLain + diskon;

      return { subtotal, totalAkhir };
    }

    // Jika order masih Dipesan, hitung secara real-time dari input pengguna (logika lama yang sudah benar).
    const subtotal = items.reduce((acc, item) => {
      const price = Number(item.new_purchase_price) || 0;
      const qty = Number(item.quantity_received_input) || 0;
      return acc + price * qty;
    }, 0);
    const totalAkhir =
      subtotal +
      (Number(shippingCost) || 0) +
      (Number(otherCosts) || 0) -
      (Number(discountAmount) || 0);
    return { subtotal, totalAkhir };
  }, [items, purchaseOrder, shippingCost, discountAmount, otherCosts]);

  const handleCostChange = (setter, value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setter(numericValue);
  };

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

  const handleSaveNewProduct = async (productData) => {
    try {
      setProductSaveError("");
      const { id, ...dataToSave } = productData;
      const selectedSupplier = supplierOptions.find(
        (opt) => opt.id === dataToSave.supplier_id
      );
      dataToSave.supplier = selectedSupplier
        ? selectedSupplier.nama_supplier
        : null;
      const { error } = await supabase.from("products").insert(dataToSave);
      if (error) {
        throw error;
      }
      alert(
        "Produk baru berhasil ditambahkan! Anda bisa mencarinya sekarang untuk ditambahkan ke PO."
      );
      setIsProductModalOpen(false);
    } catch (error) {
      setProductSaveError(error.message);
    }
  };

  const handleProcessReceipt = async () => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menyelesaikan pesanan ini? Stok akan otomatis bertambah dan harga diperbarui."
      )
    )
      return;
    setIsSaving(true);
    let imageUrl = purchaseOrder.invoice_image_url || null;
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

      if (!imageUrl && !isOrderClosed) {
        alert("Mohon unggah foto nota/invoice terlebih dahulu.");
        setIsSaving(false);
        return;
      }

      const totalItemValue = costSummary.subtotal;
      const itemsPayload = items.map((item) => {
        const itemSubtotal =
          (Number(item.quantity_received_input) || 0) *
          (Number(item.new_purchase_price) || 0);
        const valuePortion =
          totalItemValue > 0 ? itemSubtotal / totalItemValue : 1 / items.length;
        const allocatedShipping = (Number(shippingCost) || 0) * valuePortion;
        const allocatedDiscount = (Number(discountAmount) || 0) * valuePortion;
        const allocatedOtherCosts = (Number(otherCosts) || 0) * valuePortion;
        const finalItemCost =
          itemSubtotal +
          allocatedShipping +
          allocatedOtherCosts -
          allocatedDiscount;
        const receivedQty = Number(item.quantity_received_input) || 0;
        const conversionRate = Number(item.products.nilai_konversi) || 1;
        const totalBaseQuantity = receivedQty * conversionRate;
        const finalLandedCostPerUnit =
          totalBaseQuantity > 0 ? finalItemCost / totalBaseQuantity : 0;
        return {
          po_item_id: item.id,
          product_id: item.product_id,
          quantity_received: receivedQty,
          quantity_to_add_to_stock: totalBaseQuantity,
          final_landed_cost: finalLandedCostPerUnit,
          new_selling_price: item.is_price_changed
            ? Number(item.new_selling_price)
            : null,
        };
      });

      const { error: rpcError } = await supabase.rpc("process_po_receipt_v2", {
        p_po_id: poId,
        p_invoice_image_url: imageUrl,
        p_shipping_cost: Number(shippingCost) || 0,
        p_discount_amount: Number(discountAmount) || 0,
        p_other_costs: Number(otherCosts) || 0,
        p_payment_status: paymentStatus,
        p_due_date: dueDate || null,
        p_total_amount: costSummary.totalAkhir,
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
        satuan: item.unit_ordered || item.products.satuan_dasar,
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

  const isOrderClosed =
    purchaseOrder.status === "Selesai" || purchaseOrder.status === "Dibatalkan";
  const areAllPricesFilled = items.every(
    (item) => item.new_purchase_price && Number(item.new_purchase_price) > 0
  );
  const areAllQuantitiesFilled = items.every(
    (item) =>
      item.quantity_received_input !== "" &&
      Number(item.quantity_received_input) >= 0
  );
  const isSaveDisabled =
    isSaving ||
    isOrderClosed ||
    (purchaseOrder.status === "Dipesan" &&
      (!areAllPricesFilled || !areAllQuantitiesFilled));

  return (
    <>
      <PurchaseOrderShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        orderData={poDocumentData}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveNewProduct}
        supplierOptions={supplierOptions}
        saveError={productSaveError}
        setSaveError={setProductSaveError}
      />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          {isOrderClosed
            ? `Detail Pesanan (${purchaseOrder.status})`
            : `Terima Barang: ${purchaseOrder.po_number}`}
        </h1>
        <Link
          to="/pembelian"
          className="flex items-center gap-2 py-2 px-4 rounded-lg text-slate-600 hover:bg-slate-200"
        >
          <FiArrowLeft />
          <span>Kembali</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg w-full mb-6">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-semibold text-slate-800">Daftar Item</h2>
          {!isOrderClosed && (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white"
            >
              <FiPlusCircle />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
        <div className="space-y-6">
          {items.map((item) => {
            const displayUnit =
              item.unit_ordered || item.products.satuan_dasar || "Pcs";
            const hasConversion =
              item.products.nilai_konversi > 1 &&
              item.products.satuan_pembelian;
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b last:border-b-0 pb-6"
              >
                <div className="md:col-span-4">
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
                  <p className="text-base text-slate-800 mb-1">Dipesan</p>
                  <p className="font-bold text-2xl">{item.quantity_ordered}</p>
                  <p className="text-sm text-slate-500">{displayUnit}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-slate-800 mb-1">
                    {isOrderClosed
                      ? "Jml Diterima"
                      : `Jml Diterima (${displayUnit})`}
                  </label>
                  <input
                    type="number"
                    placeholder="Jml"
                    value={item.quantity_received_input}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "quantity_received_input",
                        e.target.value
                      )
                    }
                    disabled={isOrderClosed}
                    className="w-full p-2 border rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  {hasConversion && !isOrderClosed && (
                    <p className="text-sm text-slate-500 mt-1">
                      (1 {item.products.satuan_pembelian} ={" "}
                      {item.products.nilai_konversi}{" "}
                      {item.products.satuan_dasar})
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-slate-800 mb-1">
                    {isOrderClosed ? "Harga Beli Tercatat" : "Harga Beli Baru"}
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
                    <p className="text-base text-slate-700 mt-1">
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
                        Harga jual lama:{" "}
                        {formatRupiah(item.products.harga_jual)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">
            Rincian Biaya & Pembayaran
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Biaya Pengiriman (Ongkir)
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatRupiah(shippingCost, false)}
                  onChange={(e) =>
                    handleCostChange(setShippingCost, e.target.value)
                  }
                  disabled={isOrderClosed}
                  className="w-full p-2 border rounded-lg mt-1 disabled:bg-slate-100 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Diskon / Potongan Harga
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatRupiah(discountAmount, false)}
                  onChange={(e) =>
                    handleCostChange(setDiscountAmount, e.target.value)
                  }
                  disabled={isOrderClosed}
                  className="w-full p-2 border rounded-lg mt-1 disabled:bg-slate-100 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Biaya Lainnya
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatRupiah(otherCosts, false)}
                  onChange={(e) =>
                    handleCostChange(setOtherCosts, e.target.value)
                  }
                  disabled={isOrderClosed}
                  className="w-full p-2 border rounded-lg mt-1 disabled:bg-slate-100 text-right"
                />
              </div>
            </div>
            <div className="space-y-4 md:border-l md:pl-8">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal Barang</span>
                  <span>{formatRupiah(costSummary.subtotal)}</span>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between text-base font-bold text-slate-800">
                  <span>Total Akhir</span>
                  <span>{formatRupiah(costSummary.totalAkhir)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Status Pembayaran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  disabled={isOrderClosed}
                  className="w-full p-2 border rounded-lg mt-1 bg-white disabled:bg-slate-100"
                >
                  <option>Belum Dibayar</option>
                  <option>Bayar Sebagian</option>
                  <option>Lunas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isOrderClosed}
                  className="w-full p-2 border rounded-lg mt-1 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {isOrderClosed ? "Nota/Invoice Pembelian" : "Unggah Foto Nota"}
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
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-center">
            <button
              onClick={handleShowPoDocument}
              className="w-full mb-4 flex items-center justify-center gap-3 bg-white text-blue-600 border-2 border-blue-500 font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
            >
              <FiFileText size={20} />
              <span>Tampilkan Dokumen PO</span>
            </button>
            <p className="text-slate-500 text-center text-sm mb-4">
              {isOrderClosed
                ? "Pesanan ini sudah ditutup."
                : "Pastikan semua data sudah benar sebelum menyimpan."}
            </p>
            <button
              onClick={handleProcessReceipt}
              disabled={isSaveDisabled}
              className="w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
            >
              <FiCheckSquare size={22} />
              <span>
                {isSaving ? "Memproses..." : "Simpan & Terima Barang"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailPembelian;
