// src/components/CustomerRequestModal.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { FiX } from "react-icons/fi";

function CustomerRequestModal({ isOpen, onClose }) {
  const [productName, setProductName] = useState("");
  const [notes, setNotes] = useState("");
  const [kategori, setKategori] = useState("");
  const [nomorWhatsapp, setNomorWhatsapp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Nama produk tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("permintaan_pelanggan").insert({
        nama_produk_diminta: productName,
        catatan: notes,
        kategori: kategori,
        nomor_whatsapp: nomorWhatsapp || null,
      });

      if (error) throw error;

      alert("Permintaan berhasil dicatat!");
      setProductName("");
      setNotes("");
      setKategori("");
      setNomorWhatsapp("");
      onClose();
    } catch (error) {
      console.error("Gagal mencatat permintaan:", error);
      alert("Terjadi kesalahan saat mencatat permintaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Catat Permintaan Produk</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
          >
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="productName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nama Produk yang Dicari
              </label>
              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Kampas Rem Vario 150"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Catatan (Merek, Tipe, Warna, dll)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Merek AHM"
                rows="3"
                className="w-full p-2 border rounded-lg"
              ></textarea>
            </div>
            {/* ... (setelah div untuk input Catatan) ... */}
            <div>
              <label
                htmlFor="kategori"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Kategori (Opsional)
              </label>
              <input
                id="kategori"
                type="text"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="Cth: Onderdil, Oli, Pilok"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label
                htmlFor="nomorWhatsapp"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nomor WhatsApp Pelanggan (Opsional)
              </label>
              <input
                id="nomorWhatsapp"
                type="tel"
                value={nomorWhatsapp}
                onChange={(e) => setNomorWhatsapp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full p-2 border rounded-lg"
              />
              <p className="text-xs text-slate-400 mt-1">
                Untuk mengirim info produk/alternatif via WhatsApp
              </p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t rounded-b-lg flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-slate-400"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Permintaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerRequestModal;
