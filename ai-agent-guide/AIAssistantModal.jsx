// /home/user/bjs-racing-pos-review/AIAssistantModal.jsx
import { useState, useEffect } from "react";
import { FiX, FiMic, FiSend, FiLoader, FiCheckCircle, FiAlertCircle, FiPlus } from "react-icons/fi";
import { useAIPosAgent } from "./useAIPosAgent.js";
import { useVoiceSearch } from "../bjs-racing-pos/src/hooks/useVoiceSearch.js"; // sesuaikan import path dengan proyek Anda

/**
 * Komponen Modal Asisten Kasir AI (AI POS Assistant)
 * Menyediakan UI untuk kasir mengobrol atau menggunakan suara untuk memesan barang/mengekstrak aksi POS
 */
function AIAssistantModal({
  isOpen,
  onClose,
  cart,
  onAddProductToCart,     // (product, qty) => void
  onUpdateCartQuantity,   // (productId, qty) => void
  onRemoveFromCart,       // (productId) => void
  onClearCart,            // () => void
}) {
  const [inputText, setInputText] = useState("");
  const [logs, setLogs] = useState([]); // Menyimpan histori percakapan / log aksi
  const [ambiguousMatch, setAmbiguousMatch] = useState(null); // Menyimpan pilihan produk jika ambigu

  // Ganti nilai API Key ini dengan API key Anda dari Google AI Studio
  // Catatan: Disarankan dipindahkan ke serverless function / backend demi keamanan produksi
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_FREE_GEMINI_API_KEY";

  // Inisialisasi useAIPosAgent Hook
  const { processCommand, isProcessing, error } = useAIPosAgent({
    onAddProductToCart,
    onUpdateCartQuantity,
    onRemoveFromCart,
    onClearCart,
    aiProvider: "gemini", // atau "ollama" untuk lokal
    geminiApiKey: GEMINI_API_KEY,
  });

  // Inisialisasi Voice Search Hook bawaan proyek
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript
  } = useVoiceSearch({
    lang: "id-ID",
    onResult: (finalTranscript) => {
      setInputText(finalTranscript);
      handleSubmitCommand(finalTranscript);
    }
  });

  // Update input text saat suara ditranskrip secara real-time
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  if (!isOpen) return null;

  const handleSubmitCommand = async (textToProcess) => {
    const text = textToProcess || inputText;
    if (!text.trim()) return;

    setAmbiguousMatch(null);
    setLogs((prev) => [...prev, { sender: "user", text }]);
    setInputText("");

    // Proses teks ucapan kasir menggunakan AI Agent
    const results = await processCommand(text);

    if (results) {
      results.forEach((res) => {
        if (res.status === "success") {
          setLogs((prev) => [...prev, { sender: "ai", status: "success", text: res.message }]);
        } else if (res.status === "not_found") {
          setLogs((prev) => [...prev, { sender: "ai", status: "error", text: res.message }]);
        } else if (res.status === "ambiguous") {
          setLogs((prev) => [...prev, { sender: "ai", status: "warning", text: res.message }]);
          // Jika ambigu, simpan data ke state untuk ditampilkan sebagai tombol opsi pilihan produk
          setAmbiguousMatch({
            query: res.query,
            quantity: res.quantity,
            options: res.options
          });
        }
      });
    } else {
      setLogs((prev) => [
        ...prev,
        { sender: "ai", status: "error", text: "Maaf, AI gagal menganalisis instruksi Anda." }
      ]);
    }
  };

  // Handler jika kasir mengklik salah satu produk alternatif hasil pencarian ambigu
  const handleSelectAmbiguousProduct = (product, quantity) => {
    if (onAddProductToCart) {
      onAddProductToCart(product, quantity);
      setLogs((prev) => [
        ...prev,
        { sender: "ai", status: "success", text: `Berhasil menambahkan ${quantity} x ${product.nama} (Pilihan Manual) ke keranjang.` }
      ]);
    }
    setAmbiguousMatch(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-[550px] border border-slate-100 overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 p-1.5 rounded-lg animate-pulse">🤖</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">AI POS Copilot</h2>
              <p className="text-xs text-orange-100">BJS Racing - Smart Checkout Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Layar Chat Log */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50">
          <div className="text-center text-xs text-slate-400 py-1 bg-white rounded-md shadow-sm border border-slate-100">
            💡 Cobalah ucapkan: <span className="italic font-semibold text-slate-600">"Masukkan oli shell 2 botol sama pilok merah 1"</span>
          </div>

          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm shadow-sm ${
                  log.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : log.status === "success"
                    ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-tl-none"
                    : log.status === "error"
                    ? "bg-rose-50 text-rose-800 border-l-4 border-rose-500 rounded-tl-none"
                    : "bg-amber-50 text-amber-800 border-l-4 border-amber-500 rounded-tl-none"
                }`}
              >
                <div className="flex items-start space-x-1.5">
                  {log.sender === "ai" && (
                    <span className="mt-0.5">
                      {log.status === "success" && <FiCheckCircle className="text-emerald-500" />}
                      {log.status === "error" && <FiAlertCircle className="text-rose-500" />}
                      {log.status === "warning" && <FiAlertCircle className="text-amber-500" />}
                    </span>
                  )}
                  <p>{log.text}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Menampilkan Pilihan Produk Jika Ambigu */}
          {ambiguousMatch && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 shadow-inner">
              <p className="text-xs font-bold text-amber-900">Pilih produk yang paling sesuai:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {ambiguousMatch.options.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectAmbiguousProduct(prod, ambiguousMatch.quantity)}
                    className="flex justify-between items-center text-left text-xs bg-white hover:bg-orange-100 p-2.5 rounded-lg border border-slate-200 hover:border-orange-300 transition-all font-medium text-slate-700"
                  >
                    <span>
                      {prod.nama} <span className="text-blue-600 italic">({prod.merek || "Tanpa Merek"})</span>
                    </span>
                    <span className="text-orange-600 font-bold flex items-center space-x-1">
                      <span>Rp {prod.harga_jual?.toLocaleString("id-ID")}</span>
                      <FiPlus className="ml-1 bg-orange-500 text-white rounded p-0.5" size={16} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl px-4 py-3 text-sm shadow-sm flex items-center space-x-2 border border-slate-100">
                <FiLoader className="animate-spin text-orange-500" size={18} />
                <span className="text-slate-500 font-medium">Asisten AI sedang berpikir...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
              <FiAlertCircle size={18} className="flex-shrink-0" />
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
          {isSupported ? (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-full transition-all duration-300 ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600"
              }`}
              title={isListening ? "Hentikan perekaman suara" : "Gunakan perintah suara (Bahasa Indonesia)"}
            >
              <FiMic size={20} className={isListening ? "scale-110" : ""} />
            </button>
          ) : (
            <span className="text-xs text-slate-400 max-w-[50px] leading-tight text-center">Mic unsupported</span>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitCommand()}
            placeholder={isListening ? "Mendengarkan suara Anda..." : "Ketik perintah di sini (cth: 'tambah oli shell 2')"}
            className="flex-grow p-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm transition-all focus:outline-none"
            disabled={isProcessing}
          />

          <button
            onClick={() => handleSubmitCommand()}
            disabled={isProcessing || !inputText.trim()}
            className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-orange-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <FiSend size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default AIAssistantModal;
