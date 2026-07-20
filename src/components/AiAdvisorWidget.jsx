import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiX,
  FiSend,
  FiLoader,
  FiMessageSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { useAiAdvisor } from "../hooks/useAiAdvisor.js";

const QUICK_PROMPTS = [
  "Bagaimana performa toko pada periode ini?",
  "Produk apa yang stok mati / habis?",
  "Beri saran untuk meningkatkan margin keuntungan.",
  "Apa produk terlaris saya?",
];

/**
 * Floating AI Business Advisor (CFO) untuk Dashboard.
 * Hanya dirender untuk admin/owner & saat toggle advisor_enabled aktif (dikontrol parent).
 *
 * Props:
 *  - startDate, endDate: rentang tanggal aktif dari Dashboard (konteks mengikuti filter).
 */
function AiAdvisorWidget({ startDate, endDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState([]); // {role, text}[] tampilan sesi (tidak dikirim balik ke AI)
  const { ask, isLoading, error, setError, activeProvider } = useAiAdvisor();

  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  // Batalkan request yang sedang berjalan saat panel ditutup / unmount.
  const cancelPending = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const handleClose = () => {
    cancelPending();
    setIsOpen(false);
  };

  const submitQuestion = useCallback(
    async (question) => {
      const text = (question || "").trim();
      if (!text || isLoading) return;

      cancelPending();
      const controller = new AbortController();
      abortRef.current = controller;

      setInputText("");
      setError?.(null);
      setConversation((prev) => [...prev, { role: "user", text }]);

      const result = await ask(
        text,
        { startDate, endDate },
        controller.signal,
      );

      if (controller.signal.aborted) return;
      if (result) {
        setConversation((prev) => [...prev, { role: "ai", text: result }]);
      }
      abortRef.current = null;
    },
    [ask, isLoading, startDate, endDate, cancelPending, setError],
  );

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-full shadow-xl transition-all hover:scale-105 duration-200"
          title="Tanya AI Business Advisor"
        >
          <span className="text-lg">🤖</span>
          <span className="hidden sm:inline text-sm">AI Advisor</span>
        </button>
      )}

      {/* Panel chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col h-[520px] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 p-1.5 rounded-lg">🤖</span>
                <div>
                  <h2 className="font-bold text-base leading-tight">
                    AI Business Advisor
                  </h2>
                  <p className="text-[11px] text-orange-100">
                    Penasihat keuangan BJS Racing
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                title="Tutup"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div
              ref={scrollRef}
              className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50"
            >
              {conversation.length === 0 && !isLoading && (
                <div className="text-center text-xs text-slate-500 py-2 bg-white rounded-lg shadow-sm border border-slate-100 px-3">
                  💡 Tanya apa saja soal performa toko Anda, atau pilih
                  pertanyaan cepat di bawah.
                </div>
              )}

              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl px-4 py-3 text-sm shadow-sm flex items-center space-x-2 border border-slate-100">
                    <FiLoader className="animate-spin text-orange-500" size={16} />
                    <span className="text-slate-500 font-medium">
                      Menganalisis data toko...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
                  <FiAlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="flex-1">
                    <strong>Error:</strong> {error}
                  </span>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            {conversation.length === 0 && (
              <div className="px-3 pb-2 bg-slate-50 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => submitQuestion(p)}
                    disabled={isLoading}
                    className="text-[11px] bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-full px-2.5 py-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <FiMessageSquare size={10} />
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !isLoading &&
                    submitQuestion(inputText)
                  }
                  placeholder="Ketik pertanyaan Anda..."
                  className="flex-grow p-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm transition-all focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={() => submitQuestion(inputText)}
                  disabled={isLoading || !inputText.trim()}
                  className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <FiSend size={16} />
                </button>
              </div>
              {activeProvider && (
                <p className="text-[10px] text-slate-400 mt-1.5 px-1 flex items-center gap-1">
                  <span className="text-base leading-none">🤖</span>
                  <span className="font-medium">
                    {activeProvider.model || activeProvider.provider}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={
                      activeProvider.provider === "nvidia"
                        ? "text-green-500"
                        : "text-blue-400"
                    }
                  >
                    {activeProvider.provider === "nvidia"
                      ? "NVIDIA NIM"
                      : "Google Gemini"}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AiAdvisorWidget;
