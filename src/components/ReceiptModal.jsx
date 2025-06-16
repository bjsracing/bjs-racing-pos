// src/components/ReceiptModal.jsx (Versi Final dengan Revisi Tampilan)

import { useRef } from "react";
import { toPng } from "html-to-image";
import QRCode from "react-qr-code";
import { FiX, FiDownload, FiShare2 } from "react-icons/fi";

function ReceiptModal({ isOpen, onClose, transaction, shopInfo }) {
  const receiptRef = useRef(null);
  if (!isOpen || !transaction) return null;

  const shortTrxId = transaction.id.slice(0, 8).toUpperCase();

  const handleDownload = () => {
    if (receiptRef.current === null) return;
    toPng(receiptRef.current, { cacheBust: true, backgroundColor: "white" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `struk-${shopInfo.name.replace(/\s/g, "")}-${shortTrxId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Gagal mengunduh struk:", err);
        alert("Gagal membuat gambar struk.");
      });
  };

  const handleShare = () => {
    const customerData = transaction.customer_data || transaction.customers;
    const customerPhone = customerData?.telepon;
    if (!customerPhone) {
      return alert(
        "Nomor telepon pelanggan tidak tersedia untuk dibagikan ke WhatsApp.",
      );
    }
    const cleanPhone = customerPhone.startsWith("0")
      ? "62" + customerPhone.slice(1)
      : customerPhone;
    const message = `Terima kasih telah berbelanja di ${shopInfo.name}! Berikut adalah detail transaksi Anda. ID Transaksi: ${shortTrxId}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    alert(
      "Anda akan diarahkan ke WhatsApp. Jangan lupa unduh dan kirim gambar struknya.",
    );
  };

  const customerData = transaction.customer_data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-sm max-h-[95vh] flex flex-col">
        <div
          ref={receiptRef}
          className="bg-white p-6 text-black text-xs rounded-lg shadow-md flex-grow overflow-y-auto"
          style={{ fontSize: "11px" }}
        >
          {/* Header Toko */}
          <div className="text-center mb-3">
            {/* PERUBAHAN 1: Warna Oranye pada Judul */}
            <h3 className="text-xl font-bold text-orange-600 tracking-wider uppercase">
              {shopInfo.name}
            </h3>

            {/* PERUBAHAN 2 & 3: Format Alamat dan Telepon */}
            <div className="text-[10px] text-slate-600 mt-2 space-y-0.5">
              <p className="leading-tight font-bold">
                Jl. Wijaya Kusuma, Bangsri, Jepara
              </p>
              <p className="leading-tight font-bold">
                (Sebelah Timur SMP N 1 Bangsri)
              </p>
              <p className="leading-tight font-bold mt-1">
                Telepon/Whatsapp : {shopInfo.phone}
              </p>
            </div>
          </div>
          <hr className="border-dashed border-slate-400 my-2" />

          {/* Info Transaksi */}
          <div className="text-xs mb-2 text-slate-700">
            <div className="flex justify-between">
              <span className="font-medium">Tanggal:</span>
              <span>
                {new Date(transaction.created_at).toLocaleDateString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Waktu:</span>
              <span>
                {new Date(transaction.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ID Trx:</span>
              <span>{shortTrxId}</span>
            </div>
            {customerData?.nama_pelanggan &&
              customerData.nama_pelanggan !== "Pelanggan Umum" && (
                <div className="flex justify-between">
                  <span className="font-medium">Pelanggan:</span>
                  <span>{customerData.nama_pelanggan}</span>
                </div>
              )}
          </div>
          <hr className="border-dashed border-slate-400 my-2" />

          {/* Rincian Item */}
          <div className="text-sm">
            {transaction.items?.map((item) => (
              <div key={item.id} className="mb-1">
                <p className="font-semibold text-slate-800">{item.nama}</p>
                <div className="flex justify-between text-slate-700">
                  <span>
                    {item.quantity} x{" "}
                    {new Intl.NumberFormat("id-ID").format(item.harga_jual)}
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID").format(
                      item.harga_jual * item.quantity,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <hr className="border-dashed border-slate-400 my-2" />

          {/* Total */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between text-slate-700">
              <span className="font-medium">Subtotal:</span>
              <span>
                {new Intl.NumberFormat("id-ID").format(transaction.total)}
              </span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="font-medium">Diskon:</span>
              <span>
                - {new Intl.NumberFormat("id-ID").format(transaction.diskon)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 text-orange-600">
              <span>TOTAL:</span>
              <span>
                {new Intl.NumberFormat("id-ID").format(transaction.total_akhir)}
              </span>
            </div>
          </div>
          <hr className="border-dashed border-slate-400 my-2" />

          {/* Pembayaran */}
          <div className="text-sm space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="font-medium">Bayar:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID").format(transaction.bayar)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Kembali:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID").format(transaction.kembalian)}
              </span>
            </div>
          </div>

          {/* QR Code & Footer */}
          <div className="flex flex-col items-center mt-4">
            {/* Wadah untuk dua QR Code */}
            <div className="flex justify-around items-center text-center w-full">
              <div>
                <QRCode value={transaction.id} size={80} level="H" />
                <p className="text-[11px] mt-1 text-bolt-500">ID Transaksi</p>
              </div>
              <div>
                <img
                  src="/qr-whatsapp.png"
                  alt="Kontak WhatsApp BJS Racing"
                  className="w-[80px] h-[80px]"
                />
                <p className="text-[11px] mt-1 text-bold-500">
                  Simpan Kontak WA
                </p>
              </div>
            </div>

            {/* Teks Footer di bawah QR Code */}
            <p className="mt-4 font-bold text-center text-orange-600 text-xs">
              {shopInfo.footerNote}
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex-shrink-0 flex justify-center gap-2 sm:gap-4 mt-4 border-t border-slate-300 pt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            <FiDownload />
            <span>Unduh</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm"
          >
            <FiShare2 />
            <span>Share WA</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
          >
            <FiX />
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
