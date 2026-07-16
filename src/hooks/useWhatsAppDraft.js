import { useState, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { callGeminiProxy } from "../lib/geminiProxy.js";

export function useWhatsAppDraft() {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedMessage, setDraftedMessage] = useState("");
  const [error, setError] = useState(null);

  const searchAlternatives = useCallback(async (kategori, excludeProductName) => {
    if (!kategori) return [];
    try {
      const { data, error } = await supabase
        .from("products")
        .select("nama, merek, harga_jual, stok")
        .eq("kategori", kategori)
        .eq("status", "Aktif")
        .gt("stok", 0)
        .order("harga_jual", { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data || []).filter(
        (p) => !p.nama.toLowerCase().includes(excludeProductName.toLowerCase()),
      );
    } catch (err) {
      console.error("Gagal mencari alternatif:", err);
      return [];
    }
  }, []);

  const draftMessage = useCallback(async (request, alternatives, signal) => {
    setIsDrafting(true);
    setError(null);
    setDraftedMessage("");

    const alternativesText =
      alternatives.length > 0
        ? alternatives
            .map(
              (a, i) =>
                `${i + 1}. ${a.nama}${a.merek ? " (" + a.merek + ")" : ""} - Rp${a.harga_jual?.toLocaleString("id-ID")}`,
            )
            .join("\n")
        : "Tidak ada alternatif saat ini";

    const systemPrompt = `Anda adalah asisten customer service toko bengkel motor "BJS Racing" yang ramah dan profesional.

Tugas Anda: Buat draf pesan WhatsApp untuk membalas permintaan pelanggan.

ATURAN:
1. Sapaan ramah (Halo Kak, Sob, atau Mas)
2. Konfirmasi produk yang dicari + harga jika tersedia
3. Jika ada alternatif produk: sebutkan 2-3 alternatif terdekat beserta harganya
4. Penutup yang mengundang datang ke toko
5. Gunakan emoji secukupnya (tidak berlebihan)
6. Panjang: 3-5 kalimat saja
7. Bahasa Indonesia informal yang sopan dan ramah
8. JANGAN gunakan markdown, cukup plain text

Contoh output yang baik:
Halo Kak! Terima kasih sudah hubungi BJS Racing. Untuk Kampas Rem Vario 150 yang Kakak cari, kami ready stok ya dengan harga Rp35.000. Selain itu kami juga punya alternatif lain: Kampas Rem Bendix (Rp42.000) dan Kampas Rem AHM (Rp38.000). Yuk langsung mampir ke toko kami! 😊`;

    const userMessage = `Permintaan pelanggan:
- Produk dicari: ${request.nama_produk_diminta}
- Catatan: ${request.catatan || "Tidak ada catatan"}
- Kategori: ${request.kategori || "Tidak diketahui"}

Produk alternatif yang tersedia:
${alternativesText}

Toko: BJS Racing
Nomor WA: ${import.meta.env.VITE_SHOP_WHATSAPP || "0881011669213"}`;

    try {
      const resData = await callGeminiProxy({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }, signal);

      const candidate = resData.candidates?.[0];
      const message = candidate?.content?.parts?.[0]?.text?.trim();
      if (!message) {
        throw new Error("AI tidak menghasilkan pesan. Coba lagi.");
      }
      setDraftedMessage(message);
      return message;
    } catch (err) {
      if (err.name === "AbortError") return "";
      console.error("WhatsApp draft error:", err);
      setError(err.message || "Gagal membuat draf pesan.");
      return "";
    } finally {
      setIsDrafting(false);
    }
  }, []);

  return {
    searchAlternatives,
    draftMessage,
    draftedMessage,
    setDraftedMessage,
    isDrafting,
    error,
  };
}
