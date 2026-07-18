import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { callGeminiWithFallback } from "../lib/geminiProxy.js";

function buildOcrPrompt(products, supplierName) {
  // PERBAIKAN: kecilkan daftar produk secara drastis agar AI tidak
  // kehabisan token output (penyebab respons terpotong -> item hilang).
  // 1) Prioritaskan produk milik supplier nota ini.
  // 2) Sisanya ambil produk aktif lain sebagai cadangan.
  // 3) Batasi total agar prompt tidak memakan context window.
  const MAX_PRODUCTS = 120;
  let selected = [];
  if (supplierName) {
    const bySupplier = products.filter(
      (p) =>
        p.supplier &&
        p.supplier.toLowerCase().trim() === supplierName.toLowerCase().trim(),
    );
    selected = bySupplier.slice(0, MAX_PRODUCTS);
  }
  if (selected.length < MAX_PRODUCTS) {
    const remaining = products
      .filter((p) => p.status === "Aktif" || !p.status)
      .filter((p) => !selected.includes(p));
    selected = selected.concat(remaining.slice(0, MAX_PRODUCTS - selected.length));
  }

  const productList = selected.map((p) => ({
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    merek: p.merek,
    kategori: p.kategori,
    ukuran: p.ukuran || "",
    supplier: p.supplier || "",
  }));

  if (productList.length >= MAX_PRODUCTS) {
    console.warn(
      `Nota OCR: daftar produk dibatasi ${MAX_PRODUCTS} (dari ${products.length}) untuk menghindari pemotongan respons AI.`,
    );
  }

  const supplierContext = supplierName
    ? `\nSUPPLIER NOTA INI: ${supplierName}\nProduk dari supplier ini harus DIPRIORITASKAN. Jika ada beberapa kemungkinan cocok, pilih yang supplier-nya sama dengan supplier nota.\n`
    : "";

  return `Anda adalah AI assistant toko sparepart motor "BJS Racing".

TUGAS ANDA (2 LANGKAH SEKALIGUS):
1. Baca nota pembelian fisik dari supplier. Ekstrak SEMUA item: nama barang, kuantitas, harga beli satuan. JANGAN skip SATUPUN item meskipun banyak.
2. Cocokkan tiap item dengan daftar produk database di bawah.
${supplierContext}
DATABASE PRODUK TOKO (${productList.length} produk):
${JSON.stringify(productList)}

ATURAN PENTING:
- Nama di nota SERING BERBEDA dengan database (singkatan, urutan kata). Gunakan KONTEKS merek, kategori, ukuran.
- Jika YAKIN cocok: product_id = id database, confidence > 80
- Jika RAGU: product_id = id terdekat, confidence 60-80
- Jika TIDAK BISA cocok: product_id = null, confidence < 60
- Ekstrak semua item meskipung ada yang tidak terbaca jelas.
- harga_beli = harga di nota (bukan harga jual). Jika tak ada, 0.

OUTPUT: HANYA JSON array murni, tanpa markdown/teks. Setiap objek ringkas:
[{"ocr_nama":"...","product_id":"uuid atau null","product_nama":"... atau null","confidence":85,"kuantitas":3,"harga_beli":175000}]

PENTING: Output HARUS JSON array murni. Jangan tambah teks/comment/markdown.`;
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

  const processImage = useCallback(async (file, allProducts, supplierName) => {
    if (!file) return [];

    const extractOnce = async (extraInstruction = "") => {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const base64Data = await fileToBase64(compressedFile);
      const mimeType = compressedFile.type || "image/jpeg";
      const prompt = buildOcrPrompt(allProducts, supplierName) + extraInstruction;

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
          maxOutputTokens: 8192,
        },
      });

      console.log(
        "[OCR DEBUG] provider =",
        resData._provider,
        "| model =",
        resData._model,
      );

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

      let truncated = false;
      if (cleaned.startsWith("[")) {
        const lastBracket = cleaned.lastIndexOf("]");
        if (lastBracket === -1 || lastBracket < cleaned.length - 1) {
          truncated = true;
          const safe = cleaned.replace(/,\s*$/, "");
          const objEnd = safe.lastIndexOf("}");
          cleaned = (objEnd > -1 ? safe.slice(0, objEnd + 1) : safe) + "]";
        }
      }

      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        throw new Error("Format respon AI tidak valid (bukan array).");
      }
      return { parsed, truncated };
    };

    const toItem = (item, index) => ({
      id: `ocr-${Date.now()}-${index}`,
      ocr_nama: item.ocr_nama || "",
      product_id: item.product_id || null,
      product_nama: item.product_nama || null,
      confidence: item.confidence || 0,
      kuantitas: item.kuantitas || 1,
      harga_beli: item.harga_beli || 0,
      source: "ocr",
    });

    setIsProcessing(true);
    setError(null);
    setExtractedItems([]);
    setProgress("Mengkompresi gambar...");

    try {
      setProgress("Membaca nota & mencocokkan produk...");
      const first = await extractOnce();
      let allItems = first.parsed.map((it, i) => toItem(it, i));

      // RETRY: jika AI memotong respons, minta lanjutkan dari item terakhir.
      let attempt = 1;
      const MAX_ATTEMPTS = 4;
      while (first.truncated && attempt < MAX_ATTEMPTS) {
        attempt++;
        setProgress(`Melanjutkan ekstraksi (percobaan ${attempt})...`);
        const already = allItems.length;
        const cont = await extractOnce(
          `\n\nPENTING: Respons SEBELUMNYA TERPUTUS pada item ke-${already}. LANJUTKAN dan berikan HANYA item ke-${already + 1} dan seterusnya sampai habis, dalam format JSON array yang SAMA. JANGAN ulang item sebelumnya.`,
        );
        const more = cont.parsed.map((it, i) => toItem(it, already + i));
        // gabungkan, hindari duplikat berdasarkan ocr_nama + product_id
        const seen = new Set(allItems.map((x) => `${x.ocr_nama}|${x.product_id}`));
        more.forEach((m) => {
          const key = `${m.ocr_nama}|${m.product_id}`;
          if (!seen.has(key)) {
            seen.add(key);
            allItems.push(m);
          }
        });
        if (!cont.truncated) break;
      }

      const truncatedNow = first.truncated && attempt >= MAX_ATTEMPTS;
      if (truncatedNow) {
        setError(
          `Peringatan: AI memotong respons (${allItems.length} item terambil dari beberapa percobaan). Periksa kembali & tambahkan item yang kurang, atau foto ulang nota dengan lebih jelas.`,
        );
      } else if (allItems.length === 0) {
        setError("AI tidak mengembalikan item apa pun. Coba foto ulang nota.");
      }

      setExtractedItems(allItems);
      setProgress("");
      return allItems;
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
