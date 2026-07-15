// /home/user/bjs-racing-pos-review/useAIPosAgent.js
import { useState, useCallback } from "react";
import { supabase } from "../supabaseClient.js"; // sesuaikan import path dengan proyek Anda

/**
 * Custom Hook untuk memproses perintah suara/teks kasir menggunakan AI Agent
 * Mendukung Google Gemini (Cloud Gratis) atau Ollama (Lokal Offline-First)
 */
export function useAIPosAgent({
  onAddProductToCart,     // Fungsi dari Pos.jsx untuk menambahkan produk ke cart: (product, qty) => void
  onUpdateCartQuantity,   // Fungsi dari Pos.jsx untuk mengubah qty: (productId, qty) => void
  onRemoveFromCart,       // Fungsi dari Pos.jsx untuk menghapus item dari cart: (productId) => void
  onClearCart,            // Fungsi dari Pos.jsx untuk mereset/mengosongkan cart: () => void
  aiProvider = "gemini",   // "gemini" atau "ollama"
  geminiApiKey = "",      // Masukkan API key jika menggunakan provider "gemini" di frontend
  ollamaUrl = "http://localhost:11434" // URL Ollama lokal
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [aiActions, setAiActions] = useState([]);

  // Fungsi internal untuk mencari produk di Supabase berdasarkan nama dari hasil parse AI
  const findBestMatchingProduct = async (searchQuery) => {
    try {
      // 1. Lakukan query pencarian teks ke tabel products di Supabase
      // Menggunakan ilike atau text search untuk mencocokkan nama produk
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("nama", `%${searchQuery}%`)
        .eq("status", "Aktif")
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Gagal melakukan pencarian produk di database:", err);
      return [];
    }
  };

  /**
   * Mengirim teks ucapan kasir ke AI Agent untuk diparsing menjadi JSON Actions
   */
  const processCommand = useCallback(async (inputText) => {
    if (!inputText || !inputText.trim()) return;

    setIsProcessing(true);
    setError(null);
    setAiActions([]);

    const systemPrompt = `Anda adalah AI POS Agent untuk toko bengkel motor "BJS Racing".
Tugas Anda adalah menganalisis ucapan atau ketikan dari kasir dan menerjemahkannya ke dalam daftar aksi terstruktur dalam format JSON.

Anda dapat mengenali aksi-aksi berikut:
1. ADD_TO_CART: Kasir ingin menambah/membeli barang. Contoh: "tambah oli shell helix 2 botol" atau "beli kampas rem bendix 1".
2. UPDATE_QUANTITY: Kasir ingin mengubah kuantitas barang yang ada di keranjang. Contoh: "ubah jumlah mpx2 jadi 5" atau "tambah mpx2 3 biji lagi".
3. REMOVE_FROM_CART: Kasir ingin membatalkan/menghapus barang dari keranjang. Contoh: "hapus oli mpx2" atau "batalkan kampas rem".
4. CLEAR_CART: Kasir ingin mengosongkan keranjang. Contoh: "kosongkan keranjang", "reset transaksi", atau "batal semua".

ATURAN OUTPUT:
- Harus mengembalikan data dalam format JSON array murni tanpa komentar, penjelasan, atau markdown wrapper (seperti \`\`\`json ... \`\`\`).
- Skema JSON wajib berupa array objek dengan format:
  [
    {
      "action": "ADD_TO_CART" | "UPDATE_QUANTITY" | "REMOVE_FROM_CART" | "CLEAR_CART",
      "search_query": "nama produk atau merek yang dicari secara spesifik dalam bahasa Indonesia",
      "quantity": angka_integer (jumlah barang, default 1 jika tidak disebutkan),
      "notes": "catatan opsional (seperti warna pilok, merek khusus, tipe motor)"
    }
  ]

Contoh input: "masukin oli federal mpx2 dua botol sama pilok diton hitam doff satu"
Contoh output:
[
  {"action": "ADD_TO_CART", "search_query": "oli federal mpx2", "quantity": 2, "notes": ""},
  {"action": "ADD_TO_CART", "search_query": "pilok diton hitam doff", "quantity": 1, "notes": "hitam doff"}
]`;

    try {
      let parsedActions = [];

      // ==========================================
      // INTEGRASI GOOGLE GEMINI 1.5 FLASH (API)
      // ==========================================
      if (aiProvider === "gemini") {
        if (!geminiApiKey) {
          throw new Error("API Key Google Gemini belum dikonfigurasi.");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemPrompt },
                  { text: `Input Kasir: "${inputText}"` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json" // Memaksa Gemini mengembalikan JSON valid
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || "Gagal menghubungi Gemini API");
        }

        const resData = await response.json();
        const aiResponseText = resData.candidates[0].content.parts[0].text;
        parsedActions = JSON.parse(aiResponseText.trim());
      } 
      // ==========================================
      // INTEGRASI OLLAMA (LOKAL OFFLINE-FIRST)
      // ==========================================
      else if (aiProvider === "ollama") {
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen2.5:3b", // Anda bisa ganti ke llama3 atau qwen2.5:7b sesuai kekuatan PC kasir
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Input Kasir: "${inputText}"` }
            ],
            stream: false,
            options: {
              temperature: 0.1 // Menjaga determinisme respons format JSON
            }
          })
        });

        if (!response.ok) {
          throw new Error("Gagal menghubungi server Ollama lokal. Pastikan Ollama sudah dijalankan.");
        }

        const resData = await response.json();
        const aiResponseText = resData.message.content;
        
        // Membersihkan markdown tag jika ada (karena model kecil kadang lalai tidak memberikan raw JSON)
        let cleanText = aiResponseText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        }
        parsedActions = JSON.parse(cleanText);
      }

      if (!Array.isArray(parsedActions)) {
        throw new Error("Format respon AI tidak valid (bukan array).");
      }

      setAiActions(parsedActions);

      // ==========================================
      // EKSEKUSI AKSI PADA POS STATE
      // ==========================================
      const executionSummary = [];

      for (const item of parsedActions) {
        const { action, search_query, quantity, notes } = item;

        if (action === "CLEAR_CART") {
          if (onClearCart) {
            onClearCart();
            executionSummary.push({ status: "success", message: "Keranjang berhasil dikosongkan." });
          }
          continue;
        }

        // Cari produk di Supabase terlebih dahulu untuk ADD_TO_CART, UPDATE, dll.
        const matchedProducts = await findBestMatchingProduct(search_query);

        if (matchedProducts.length === 0) {
          executionSummary.push({
            status: "not_found",
            message: `Produk dengan pencarian "${search_query}" tidak ditemukan di database.`
          });
          continue;
        }

        // Jika ada 1 kecocokan pasti (tidak ambigu)
        if (matchedProducts.length === 1) {
          const product = matchedProducts[0];

          if (action === "ADD_TO_CART") {
            if (onAddProductToCart) {
              onAddProductToCart(product, quantity);
              executionSummary.push({
                status: "success",
                message: `Berhasil menambahkan ${quantity} x ${product.nama} ke keranjang.`
              });
            }
          } else if (action === "UPDATE_QUANTITY") {
            if (onUpdateCartQuantity) {
              onUpdateCartQuantity(product.id, quantity);
              executionSummary.push({
                status: "success",
                message: `Berhasil mengubah kuantitas ${product.nama} menjadi ${quantity}.`
              });
            }
          } else if (action === "REMOVE_FROM_CART") {
            if (onRemoveFromCart) {
              onRemoveFromCart(product.id);
              executionSummary.push({
                status: "success",
                message: `Berhasil menghapus ${product.nama} dari keranjang.`
              });
            }
          }
        } 
        // Jika kecocokan ambigu (ada beberapa produk bermiripan)
        else {
          executionSummary.push({
            status: "ambiguous",
            query: search_query,
            quantity: quantity,
            options: matchedProducts,
            message: `Ditemukan beberapa produk yang cocok untuk "${search_query}". Silakan pilih salah satu.`
          });
        }
      }

      return executionSummary;

    } catch (err) {
      console.error("AI POS Agent error:", err);
      setError(err.message || "Terjadi kesalahan saat memproses perintah AI.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiProvider, geminiApiKey, ollamaUrl, onAddProductToCart, onUpdateCartQuantity, onRemoveFromCart, onClearCart]);

  return {
    processCommand,
    isProcessing,
    error,
    aiActions,
  };
}
