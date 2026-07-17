import React, { useRef, useState } from "react";
import {
  FiX,
  FiDownload,
  FiMessageSquare,
  FiUsers,
} from "react-icons/fi";
import * as htmlToImage from "html-to-image";

const PurchaseOrderShareModal = ({ isOpen, onClose, orderData }) => {
  const documentRef = useRef();
  // State untuk menampilkan status loading saat gambar sedang dibuat
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !orderData) return null;

  // --- FUNGSI UNTUK MENGUNDUH PO SEBAGAI GAMBAR PNG ---
  const handleDownload = async () => {
    if (!documentRef.current) return;
    setIsProcessing(true); // Mulai loading
    try {
      // Opsi untuk meningkatkan kualitas gambar
      const options = {
        cacheBust: true,
        pixelRatio: 2, // Resolusi 2x lebih tajam
        style: { margin: 0 },
      };

      const dataUrl = await htmlToImage.toPng(documentRef.current, options);

      // Buat link sementara untuk men-trigger download
      const link = document.createElement("a");
      link.download = `${orderData.po_number}.png`;
      link.href = dataUrl;
      document.body.appendChild(link); // Tambahkan ke dokumen agar bisa di-klik
      link.click();
      document.body.removeChild(link); // Hapus setelah selesai
    } catch (err) {
      console.error("Gagal mengunduh gambar:", err);
      alert("Gagal mengunduh gambar, silakan coba lagi.");
    } finally {
      setIsProcessing(false); // Selesai loading
    }
  };

  // --- FUNGSI GENERATE TEKS PESAN PO ---
  const generatePOMessage = () => {
    let message = `*PESANAN PEMBELIAN (PO)*\n\n`;
    message += `*No. PO:* ${orderData.po_number}\n`;
    message += `*Supplier:* ${orderData.supplier_name}\n\n`;
    message += `Halo, kami dari *BJS RACING* ingin memesan barang-barang berikut:\n\n`;

    orderData.items.forEach((item) => {
      message += `*- ${item.nama}*\n`;
      message += `  (Kode: ${item.kode || "N/A"}, Merek: ${
        item.merek || "-"
      }) \n`;
      message += `  *Jumlah:* ${item.quantity_ordered} ${
        item.satuan || "Pcs"
      }\n`;
      if (item.catatan_item) {
        message += `  *Catatan:* ${item.catatan_item}\n`;
      }
      message += `\n`;
    });

    message += `Mohon untuk segera disiapkan dan diinfo lebih lanjut. Terima kasih.`;
    return message;
  };

  // --- FUNGSI KIRIM KE NOMOR SUPPLIER ---
  const handleShareToSupplier = () => {
    if (!orderData.supplier_phone) {
      alert(
        "Tidak bisa mengirim ke WhatsApp karena nomor telepon supplier tidak terdaftar."
      );
      return;
    }

    // Format nomor telepon ke format internasional (62xxx)
    let phoneNumber = orderData.supplier_phone.replace(/[^0-9]/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "62" + phoneNumber.substring(1);
    }

    const message = generatePOMessage();
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // --- FUNGSI KIRIM KE NOMOR LAIN / GROUP WA ---
  const handleShareToOther = () => {
    const message = generatePOMessage();
    // Buka WhatsApp tanpa nomor tujuan → user pilih kontak/grup sendiri
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="p-4 border-b bg-white rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            Pesanan Berhasil Dibuat!
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {/* ... Bagian Tampilan Dokumen PO (tidak ada perubahan)... */}
          <div
            ref={documentRef}
            id="po-document"
            className="bg-white p-8 border rounded-md shadow-sm w-full"
          >
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="font-bold text-2xl tracking-wider text-slate-900">
                  PESANAN PEMBELIAN
                </h3>
                <p className="text-slate-800">{orderData.po_number}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-xl text-orange-500">
                  BJS RACING
                </p>
                <p className="text-sm text-slate-700">
                  Jl. Wijaya Kusuma, Bangsri, Jepara
                </p>
                <p className="text-sm text-slate-700 whitespace-nowrap">
                  Telepon/WA: +62881011669213
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm my-6">
              <div>
                <p className="text-slate-700 mb-1">Supplier:</p>
                <p className="font-bold text-base text-blue-600">
                  {orderData.supplier_name || "Supplier Umum"}
                </p>
                {orderData.supplier_phone && (
                  <p className="text-slate-800">{orderData.supplier_phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-slate-700 mb-1">Tanggal Pesan:</p>
                <p className="font-semibold text-slate-800">
                  {new Date(orderData.order_date).toLocaleDateString("id-ID", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
            </div>
            <div className="w-full text-sm">
              <div className="flex bg-slate-100 rounded-t-lg p-3 font-semibold text-slate-700 uppercase tracking-wider">
                <div className="w-4/12 pr-2">Produk</div>
                <div className="w-5/12 pr-2">Catatan</div>
                <div className="w-3/12 text-right">Qty / Satuan</div>
              </div>
              <div className="border-x border-b rounded-b-lg">
                {orderData.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex p-3 border-b last:border-b-0 items-start gap-2"
                  >
                    <div className="w-4/12">
                      <p className="font-bold text-blue-600 break-words">
                        {item.nama}
                      </p>
                      <p className="text-xs text-slate-800 font-semibold">
                        (<span className="font-bold">{item.kode || "N/A"}</span>
                        ) -{" "}
                        <span className="text-orange-500">
                          {item.merek || "-"}
                        </span>
                      </p>
                    </div>
                    <div className="w-5/12">
                      <p className="text-sm text-slate-800 italic break-words">
                        {item.catatan_item || "-"}
                      </p>
                    </div>
                    <div className="w-3/12 text-right">
                      <p className="font-extrabold text-xl text-slate-900">
                        {item.quantity_ordered}
                      </p>
                      <p className="text-sm text-slate-700">
                        {item.satuan || "Pcs"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t mt-8 pt-4 text-center">
              <p className="text-xs text-slate-500 italic">
                Dokumen ini dibuat secara otomatis oleh sistem BJS RACING
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-200 border-t rounded-b-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-blue-300 transition-transform transform hover:scale-105"
          >
            <FiDownload />
            <span>{isProcessing ? "Memproses..." : "Unduh PO"}</span>
          </button>
          <button
            onClick={handleShareToSupplier}
            disabled={!orderData.supplier_phone}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <FiMessageSquare />
            <span>Kirim ke Supplier</span>
          </button>
          <button
            onClick={handleShareToOther}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
          >
            <FiUsers />
            <span>Kirim ke Nomor Lain</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderShareModal;
