// src/components/NotaTemplate.jsx

import React from "react";
import QRCode from "react-qr-code"; // Menggunakan library baru yang stabil
import { bankTransferInfo } from "../config/paymentInfo.js";

// Komponen ini adalah 'cetakan' visual untuk nota Anda
const NotaTemplate = ({ data, title, showSignatureBlocks = false }) => {
  // --- PERBAIKAN: Tambahkan pengecekan data yang lebih kuat ---
  if (!data || !data.customer || !data.items) {
    return (
      <div className="p-10 text-center">
        Data untuk dokumen tidak lengkap atau sedang dimuat...
      </div>
    );
  }

  // Mengelompokkan item berdasarkan merek untuk tampilan yang lebih rapi
  const groupedItems = data.items.reduce((acc, item) => {
    // Gunakan optional chaining untuk keamanan
    const brand = item.products?.merek || "Tanpa Merek";
    if (!acc[brand]) {
      acc[brand] = [];
    }
    acc[brand].push(item);
    return acc;
  }, {});

  const shopInfo = {
    name: "BJS RACING",
    subtitle: "DISTRIBUTOR SPRAY PAINT/PILOK",
    address: "Jl. Wijaya Kusuma, Bangsri, Jepara (Samping SMP N 1 Bangsri)",
    phone: "0881 01166 9213",
    footerNote: "Belanja Gak Pake Drama, Disini Tempatnya!",
  };

  return (
    <div
      id="nota-visual"
      className="bg-white text-black p-8 font-sans w-[800px] mx-auto shadow-lg"
    >
      {/* HEADER */}
      <header className="text-center border-b-4 border-black pb-4">
        <h1 className="text-4xl font-bold tracking-wider">{shopInfo.name}</h1>
        <p className="text-lg font-semibold">{shopInfo.subtitle}</p>
        <p className="text-sm">{shopInfo.address}</p>
        <p className="text-sm">Telp/WA: {shopInfo.phone}</p>
      </header>

      {/* INFO DOKUMEN */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold text-center mb-6 underline underline-offset-4">
          {title}
        </h2>
        <div className="flex justify-between">
          <div className="w-1/2">
            <p>
              <strong>Kepada Yth:</strong>
            </p>
            {/* --- PERBAIKAN: Menggunakan optional chaining ?. --- */}
            <p className="font-semibold text-lg">
              {data.customer?.nama_pelanggan}
            </p>
            <p>{data.customer?.alamat || "Alamat tidak tersedia"}</p>
            <p>Telp: {data.customer?.telepon || "-"}</p>
          </div>
          <div className="w-1/3 text-right">
            <p>
              <strong>No:</strong> {data.invoice_number || data.so_number}
            </p>
            <p>
              <strong>Tanggal:</strong>{" "}
              {new Date(
                data.tanggal_nota || data.tanggal_pesanan,
              ).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* TABEL ITEM */}
      <section className="mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-center w-[5%]">NO</th>
              <th className="border p-2 text-left w-[15%]">KODE</th>
              <th className="border p-2 text-left">NAMA BARANG</th>
              <th className="border p-2 text-center w-[10%]">QTY</th>
              <th className="border p-2 text-right w-[20%]">HARGA (Rp)</th>
              <th className="border p-2 text-right w-[20%]">JUMLAH (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedItems).flatMap(([brand, itemsInGroup]) => [
              <tr key={brand} className="bg-gray-100 font-bold">
                <td colSpan="6" className="border p-2">
                  {brand}
                </td>
              </tr>,
              ...itemsInGroup.map((item, index) => (
                <tr key={item.id}>
                  <td className="border p-2 text-center">{index + 1}</td>
                  {/* --- PERBAIKAN: Menggunakan optional chaining ?. --- */}
                  <td className="border p-2">{item.products?.kode}</td>
                  <td className="border p-2">{item.products?.nama}</td>
                  <td className="border p-2 text-center">{item.kuantitas}</td>
                  <td className="border p-2 text-right">
                    {new Intl.NumberFormat("id-ID").format(
                      item.harga_grosir_deal || 0,
                    )}
                  </td>
                  <td className="border p-2 text-right">
                    {new Intl.NumberFormat("id-ID").format(
                      (item.harga_grosir_deal || 0) * item.kuantitas,
                    )}
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </section>

      {/* TOTALS & PEMBAYARAN */}
      <section className="mt-6 flex justify-end">
        <div className="w-1/2">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="p-2 font-semibold">SUBTOTAL</td>
                <td className="p-2 text-right w-[60%]">
                  {new Intl.NumberFormat("id-ID").format(data.subtotal || 0)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">DISKON</td>
                <td className="p-2 text-right">
                  {new Intl.NumberFormat("id-ID").format(
                    data.total_diskon || 0,
                  )}
                </td>
              </tr>
              <tr className="bg-gray-200 font-bold text-xl">
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-right">
                  {new Intl.NumberFormat("id-ID").format(data.total_akhir || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* INFO PEMBAYARAN & TANDA TANGAN */}
      <section
        className={`mt-8 flex ${showSignatureBlocks ? "justify-between" : "justify-start"}`}
      >
        <div>
          <p className="font-bold underline">Info Pembayaran Transfer:</p>
          <p>
            Bank: <strong>{bankTransferInfo.bank}</strong>
          </p>
          <p>
            No. Rekening: <strong>{bankTransferInfo.account}</strong>
          </p>
          <p>
            Atas Nama: <strong>{bankTransferInfo.atas_nama}</strong>
          </p>
        </div>

        {showSignatureBlocks && (
          <div className="flex text-center gap-16">
            <div>
              <p>Hormat Kami,</p>
              <div className="h-20"></div>
              <p>(__________________)</p>
            </div>
            <div>
              <p>Penerima Barang,</p>
              <div className="h-20"></div>
              <p>(__________________)</p>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-8 pt-4 border-t-4 border-black text-center">
        <div className="flex justify-center items-center gap-10">
          <div>
            <QRCode
              value={data.invoice_number || data.so_number || "Tidak ada ID"}
              size={80}
            />
            <p className="text-xs font-semibold mt-1">ID Transaksi</p>
          </div>
          <div>
            <QRCode
              value={`https://wa.me/${shopInfo.phone.replace(/[^0-9]/g, "")}`}
              size={80}
            />
            <p className="text-xs font-semibold mt-1">Simpan Kontak WA</p>
          </div>
        </div>
        <p className="mt-4 font-bold text-lg text-orange-500">
          {shopInfo.footerNote}
        </p>
      </footer>
    </div>
  );
};

export default NotaTemplate;
