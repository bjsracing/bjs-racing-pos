import React, { useState, useEffect, useRef } from "react";
import { FiX, FiLoader, FiCopy, FiMessageCircle, FiCheck } from "react-icons/fi";
import { useWhatsAppDraft } from "../hooks/useWhatsAppDraft.js";

function WhatsAppDraftModal({ isOpen, onClose, request }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);
  const { draftMessage, draftedMessage, setDraftedMessage, isDrafting, error, searchAlternatives } =
    useWhatsAppDraft();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !request) return;

    let cancelled = false;
    setPhoneNumber(request.nomor_whatsapp || "");
    setDraftedMessage("");
    setCopied(false);

    const controller = new AbortController();

    const generateDraft = async () => {
      const alternatives = await searchAlternatives(
        request.kategori,
        request.nama_produk_diminta,
      );
      if (cancelled) return;
      await draftMessage(request, alternatives, controller.signal);
    };
    generateDraft();

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, request, searchAlternatives, draftMessage, setDraftedMessage]);

  if (!isOpen || !request) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftedMessage);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = draftedMessage;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } else {
          alert("Gagal menyalin pesan. Silakan salin manual.");
        }
      } catch {
        alert("Gagal menyalin pesan. Silakan salin manual.");
      }
    }
  };

  const handleOpenWhatsApp = () => {
    if (!phoneNumber.trim()) {
      alert("Masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      alert("Nomor telepon tidak valid. Masukkan 8-15 digit angka.");
      return;
    }
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }
    const encodedMessage = encodeURIComponent(draftedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <FiMessageCircle size={20} />
            <h2 className="text-xl font-bold">Draf Pesan WhatsApp</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-100">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Produk Diminta
            </label>
            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
              {request.nama_produk_diminta}
              {request.kategori && (
                <span className="text-slate-400 ml-2">({request.kategori})</span>
              )}
            </p>
            {request.catatan && (
              <p className="text-xs text-slate-400 mt-1 italic">
                Catatan: "{request.catatan}"
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nomor WhatsApp Pelanggan
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pesan yang Disarankan AI
            </label>
            {isDrafting ? (
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
                <FiLoader className="animate-spin text-green-500" size={18} />
                <span>AI sedang menyusun pesan...</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            ) : (
              <textarea
                value={draftedMessage}
                onChange={(e) => setDraftedMessage(e.target.value)}
                rows={8}
                className="w-full p-3 border rounded-lg text-sm bg-green-50 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t rounded-b-lg flex flex-col sm:flex-row justify-end gap-2">
          <button
            onClick={handleCopy}
            disabled={!draftedMessage || isDrafting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {copied ? <FiCheck size={16} className="text-green-600" /> : <FiCopy size={16} />}
            {copied ? "Tersalin!" : "Copy Pesan"}
          </button>
          <button
            onClick={handleOpenWhatsApp}
            disabled={!draftedMessage || isDrafting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <FiMessageCircle size={16} />
            Buka WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(WhatsAppDraftModal);
