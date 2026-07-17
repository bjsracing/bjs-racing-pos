import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { callGeminiWithFallback } from "../lib/geminiProxy.js";

function buildOcrPrompt(products) {
  const activeProducts = products.filter((p) => p.status === "Aktif");
  if (activeProducts.length > 500) {
    console.warn(
      `Nota OCR: ${activeProducts.length} produk aktif — prompt mungkin melebihi batas token.`,
    );
  }
  const productList = activeProducts.slice(0, 500).map((p) => ({
      id: p.id,
      kode: p.kode,
      nama: p.nama,
      merek: p.merek,
      kategori: p.kategori,
      ukuran: p.ukuran || "",
    }));

  return `Anda adalah AI assistant toko sparepart motor "BJS Racing".

TUGAS ANDA (2 LANGKAH SEKALIGUS):
1. Baca/gambar nota pembelian fisik dari supplier. Ekstrak SEMUA item barang: nama barang, kuantitas, dan harga beli satuan.
2. Cocokkan setiap item hasil ekstrak dengan daftar produk database toko di bawah ini.

DATABASE PRODUK TOKO:
${JSON.stringify(productList)}

ATURAN PENTING:
- Nama produk di nota supplier SERINGKALI BERBEDA dengan nama di database (singkatan, urutan kata, dll)
- Gunakan KONTEKS merek, kategori, ukuran, dan tipe motor untuk melakukan pencocokan
- Contoh: "SHELL HX7 5W30" = "Oli Shell Helix HX7 5W-30 1L", "KAMPAS REM BX VARIO" = "Kampas Rem Bendix Vario 125"
- Jika YAKIN cocok: isi product_id dengan id produk dari database, confidence > 80
- Jika RAGU: isi product_id dengan id produk terdekat, confidence 60-80
- Jika TIDAK BISA cocokkan: product_id = null, confidence < 60
- Jika ada item yang tidak terbaca dengan jelas, tetap ekstrak sebaik mungkin
- Harga beli adalah harga yang tertera di nota (bukan harga jual)
- Jika harga tidak tertera di nota, set harga_beli = 0

FORMAT OUTPUT JSON (array objek murni, tanpa markdown, tanpa penjelasan):
[
  {
    "ocr_nama": "nama barang seperti tertulis di nota",
    "product_id": "uuid produk database atau null",
    "product_nama": "nama produk di database yang cocok atau null",
    "confidence": 85,
    "kuantitas": 3,
    "harga_beli": 175000
  }
]

PENTING: Output HARUS berupa JSON array murni. Jangan tambahkan teks penjelasan, comment, atau markdown wrapper.`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useNotaOcr() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");

  const processImage = useCallback(async (file, allProducts) => {
    if (!file) return [];

    setIsProcessing(true);
    setError(null);
    setExtractedItems([]);
    setProgress("Mengkompresi gambar...");

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setProgress("Membaca nota & mencocokkan produk...");
      const base64Data = await fileToBase64(compressedFile);

      const mimeType = compressedFile.type || "image/jpeg";
      const prompt = buildOcrPrompt(allProducts);

      const resData = await callGeminiWithFallback({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      if (
        !resData.candidates ||
        resData.candidates.length === 0 ||
        !resData.candidates[0].content
      ) {
        throw new Error(
          "AI tidak dapat memproses gambar ini. Coba dengan gambar yang lebih jelas.",
        );
      }
      const aiText = resData.candidates[0].content.parts[0].text;
      let cleaned = aiText.trim();
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      }
      let parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error("Format respon AI tidak valid (bukan array).");
      }

      parsed = parsed.map((item, index) => ({
        id: `ocr-${Date.now()}-${index}`,
        ocr_nama: item.ocr_nama || "",
        product_id: item.product_id || null,
        product_nama: item.product_nama || null,
        confidence: item.confidence || 0,
        kuantitas: item.kuantitas || 1,
        harga_beli: item.harga_beli || 0,
        source: "ocr",
      }));

      setExtractedItems(parsed);
      setProgress("");
      return parsed;
    } catch (err) {
      console.error("Nota OCR error:", err);
      setError(err.message || "Gagal memproses gambar nota.");
      setProgress("");
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExtractedItems([]);
    setError(null);
    setProgress("");
  }, []);

  return {
    isProcessing,
    extractedItems,
    setExtractedItems,
    error,
    progress,
    processImage,
    reset,
  };
}
