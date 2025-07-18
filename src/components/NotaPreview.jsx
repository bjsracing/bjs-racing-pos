// src/components/NotaPreview.jsx

import React, { useRef } from "react";
import { toPng } from "html-to-image";
import { PDFDownloadLink } from "@react-pdf/renderer";
import NotaTemplate from "./NotaTemplate";
import NotaPDF from "./NotaPDF";
import { FiDownload, FiImage, FiFileText, FiShare2 } from "react-icons/fi";

const NotaPreview = ({ data, title, showSignatureBlocks }) => {
  const notaRef = useRef(null);

  // Fungsi untuk mengunduh sebagai gambar PNG
  const handleDownloadImage = () => {
    if (notaRef.current === null) return;
    toPng(notaRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${title} - ${data.customer.nama_pelanggan}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Gagal mengunduh gambar:", err));
  };

  // Fungsi untuk berbagi ke WhatsApp
  const handleSendWhatsApp = () => {
    const customerPhone = data.customer.telepon?.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Yth. Bpk/Ibu ${data.customer.nama_pelanggan},\n\nBerikut kami lampirkan *${title}* untuk pesanan Anda dengan nomor *${data.invoice_number || data.so_number}*.\n\nTotal tagihan: *Rp ${new Intl.NumberFormat("id-ID").format(data.total_akhir)}*.\n\nTerima kasih atas kepercayaan Anda.\n\nSalam,\nBJS Racing`,
    );

    // Cek jika nomor telepon diawali 0, ganti dengan 62
    const internationalPhone = customerPhone?.startsWith("0")
      ? `62${customerPhone.substring(1)}`
      : customerPhone;

    if (internationalPhone) {
      window.open(
        `https://wa.me/${internationalPhone}?text=${message}`,
        "_blank",
      );
    } else {
      alert("Nomor telepon pelanggan tidak valid untuk dikirim ke WhatsApp.");
    }
  };

  return (
    <div className="bg-slate-200 min-h-screen p-4 sm:p-8">
      {/* --- TOOLBAR TOMBOL AKSI --- */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-white rounded-xl shadow-md flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownloadImage}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiImage />
          <span>Unduh Gambar (.png)</span>
        </button>

        {/* --- BAGIAN PDF DIMATIKAN SEMENTARA UNTUK TES --- */}
        {/*
        <PDFDownloadLink
          document={<NotaPDF data={data} title={title} showSignatureBlocks={showSignatureBlocks} />}
          fileName={`${title} - ${data.customer.nama_pelanggan}.pdf`}
        >
          {({ loading }) => (
            <button className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-slate-400">
              <FiFileText />
              <span>{loading ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>
          )}
        </PDFDownloadLink>
        */}

        <button
          onClick={handleSendWhatsApp}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <FiShare2 />
          <span>Kirim WA</span>
        </button>
      </div>

      {/* --- PREVIEW NOTA --- */}
      {/* Komponen NotaTemplate dibungkus dengan div yang memiliki ref */}
      <div ref={notaRef}>
        <NotaTemplate
          data={data}
          title={title}
          showSignatureBlocks={showSignatureBlocks}
        />
      </div>
    </div>
  );
};

export default NotaPreview;
