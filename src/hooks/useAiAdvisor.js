import { useState, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient.js";
import { callGeminiWithFallback } from "../lib/geminiProxy.js";

const SYSTEM_PROMPT_CFO = `Anda adalah CFO sekaligus penasihat bisnis untuk toko bengkel motor "BJS Racing".
Tugas Anda: membantu pemilik memahami performa toko dan memberi saran strategi yang praktis.

ATURAN:
1. Jawab dalam Bahasa Indonesia yang santai, ringkas, dan mudah dipahami pemilik toko (bukan bahasa akuntansi rumit).
2. Gunakan HANYA data yang diberikan dalam blok "DATA BISNIS". Jangan mengarang angka atau fakta.
3. Jika data tidak cukup untuk menjawab, katakan terus terang dan sarankan data apa yang perlu dilihat.
4. Sertakan angka Rp yang relevan (format ribuan, contoh: Rp1.250.000) untuk mendukung jawaban.
5. Selalu tutup dengan 1-3 saran konkret yang bisa langsung ditindaklanjuti bila relevan.
6. Jawaban singkat dan padat (maksimal ~6 kalimat atau poin). Jangan gunakan tabel markdown.
7. Nada positif namun jujur; jika ada masalah (laba turun, stok mati), sampaikan dengan jelas beserta solusinya.`;

/**
 * Hook untuk AI Business Advisor (CFO chatbot) di Dashboard.
 * Stateless: setiap pertanyaan berdiri sendiri (tidak mengirim histori percakapan).
 */
export function useAiAdvisor() {
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);

  // Cache konteks per rentang tanggal agar tidak fetch berulang untuk rentang sama.
  const contextCacheRef = useRef({ key: null, data: null });

  const fetchContext = useCallback(async (startDate, endDate) => {
    const key = `${startDate?.toISOString?.() || startDate}|${endDate?.toISOString?.() || endDate}`;
    if (contextCacheRef.current.key === key && contextCacheRef.current.data) {
      return contextCacheRef.current.data;
    }
    const { data, error: rpcError } = await supabase.rpc(
      "get_ai_business_context",
      {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      },
    );
    if (rpcError) throw rpcError;
    contextCacheRef.current = { key, data };
    return data;
  }, []);

  const ask = useCallback(
    async (question, { startDate, endDate } = {}, signal) => {
      const sanitized = (question || "").trim().slice(0, 500);
      if (!sanitized) return "";

      setIsLoading(true);
      setError(null);
      setAnswer("");

      try {
        let context = null;
        try {
          context = await fetchContext(startDate, endDate);
        } catch (ctxErr) {
          console.error("Gagal mengambil konteks bisnis:", ctxErr);
        }

        const contextText = context
          ? "DATA BISNIS (JSON):\n" + JSON.stringify(context)
          : "DATA BISNIS: (tidak tersedia — jelaskan keterbatasan ini kepada pemilik dan minta coba lagi).";

        const resData = await callGeminiWithFallback(
          {
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT_CFO }] },
            contents: [
              {
                role: "user",
                parts: [
                  { text: contextText },
                  { text: "PERTANYAAN PEMILIK: " + sanitized },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 800,
            },
          },
          signal,
        );

        const candidate = resData.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text?.trim();
        if (!text) {
          throw new Error(
            "AI tidak menghasilkan jawaban. Kemungkinan konten diblokir filter keamanan. Coba lagi.",
          );
        }
        setAnswer(text);
        return text;
      } catch (err) {
        if (err.name === "AbortError") return "";
        console.error("AI Advisor error:", err);
        setError(err.message || "Gagal mendapatkan jawaban dari AI.");
        return "";
      } finally {
        setIsLoading(false);
      }
    },
    [fetchContext],
  );

  return { ask, isLoading, answer, error, setError };
}
