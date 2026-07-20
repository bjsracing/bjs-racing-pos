import { supabase } from "../supabaseClient.js";
import { callGeminiWithFallback } from "./geminiProxy.js";

const PRICING_SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: `Kamu adalah AI Pricing Advisor untuk toko sparepart otomotif BJS Racing.

TUGASMU:
- Analisis kenaikan harga beli dari supplier
- Tentukan apakah harga jual perlu dinaikkan
- Berikan rekomendasi harga jual baru yang optimal

ATURAN:
- Pertahankan margin minimal sebesar margin default kategori
- Jika HET > harga_jual saat ini, pertimbangkan naik ke HET
- Jika HET < harga_jual saat ini, pertahan atau turunkan sedikit
- Berikan alasan yang jelas dan singkat
- Selalu jawab dalam format JSON murni tanpa markdown code block

OUTPUT JSON:
{
  "recommended_price": <number>,
  "margin_pct": <number>,
  "reason": "<alasan singkat dalam Bahasa Indonesia>",
  "confidence": "high|medium|low"
}`,
    },
  ],
};

let cachedMargins = null;
let marginsCacheTimestamp = 0;
const MARGINS_CACHE_TTL = 300000;

export async function getMarginByKategori(kategori) {
  const now = Date.now();
  if (cachedMargins && now - marginsCacheTimestamp < MARGINS_CACHE_TTL) {
    return cachedMargins[kategori] ?? cachedMargins["default"] ?? 10;
  }

  try {
    const { data } = await supabase
      .from("margin_settings")
      .select("kategori, margin_pct")
      .eq("is_active", true);

    if (data) {
      cachedMargins = {};
      data.forEach((row) => {
        cachedMargins[row.kategori] = row.margin_pct;
      });
      marginsCacheTimestamp = now;
      return cachedMargins[kategori] ?? cachedMargins["default"] ?? 10;
    }
  } catch (_) {
    // fallback
  }

  return 10;
}

export async function getAllMargins() {
  const { data, error } = await supabase
    .from("margin_settings")
    .select("*")
    .order("id");

  if (error) throw error;
  return data || [];
}

export async function upsertMargin(kategori, margin_pct, description = "") {
  const { data, error } = await supabase
    .from("margin_settings")
    .upsert(
      { kategori, margin_pct, description, is_active: true },
      { onConflict: "kategori" },
    )
    .select()
    .single();

  if (error) throw error;

  cachedMargins = null;
  return data;
}

export async function deleteMargin(kategori) {
  if (kategori === "default") throw new Error("Tidak bisa menghapus margin default");

  const { error } = await supabase
    .from("margin_settings")
    .delete()
    .eq("kategori", kategori);

  if (error) throw error;
  cachedMargins = null;
}

export async function detectPriceChange(productId, newHargaBeli) {
  const { data: product } = await supabase
    .from("products")
    .select("harga_beli, harga_jual, nama, kode, merek, kategori")
    .eq("id", productId)
    .single();

  if (!product) return null;

  const oldHargaBeli = product.harga_beli;
  if (oldHargaBeli === newHargaBeli) return null;

  const pctIncrease = oldHargaBeli > 0
    ? ((newHargaBeli - oldHargaBeli) / oldHargaBeli) * 100
    : 0;

  return {
    product,
    oldHargaBeli,
    newHargaBeli,
    pctIncrease,
    changed: true,
  };
}

export async function fetchHET(productName, merek) {
  try {
    const searchQuery = `harga eceran tertinggi (HET) ${merek ? merek + " " : ""}${productName} Indonesia`;

    const response = await callGeminiWithFallback({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Cari di Google harga eceran tertinggi (HET) untuk produk: "${searchQuery}". Berikan dalam format JSON: {"het": <angka>, "source": "<sumber informasi>"}. Jika tidak ditemukan, berikan {"het": null, "source": "tidak ditemukan"}.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      },
      useGoogleSearch: true,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Gagal fetch HET:", err.message);
  }

  return { het: null, source: "tidak tersedia" };
}

export async function analyzePricing(context) {
  const {
    productName,
    productCode,
    merek,
    kategori,
    oldHargaBeli,
    newHargaBeli,
    pctIncrease,
    currentHargaJual,
    marginPct,
    hetReference,
  } = context;

  const prompt = `KONTEKS:
- Nama Produk: ${productName} (${productCode}) ${merek || ""}
- Kategori: ${kategori || "-"}
- Harga Beli Lama: Rp ${oldHargaBeli.toLocaleString("id-ID")}
- Harga Beli Baru: Rp ${newHargaBeli.toLocaleString("id-ID")}
- Persentase Kenaikan: ${pctIncrease.toFixed(1)}%
- Margin Default Kategori (${kategori || "default"}): ${marginPct}%
- Harga Jual Saat Ini: Rp ${(currentHargaJual || 0).toLocaleString("id-ID")}${hetReference ? `\n- HET Referensi: Rp ${hetReference.toLocaleString("id-ID")}` : ""}

Tentukan harga jual baru yang optimal.`;

  try {
    const response = await callGeminiWithFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: PRICING_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        recommended_price: result.recommended_price || currentHargaJual,
        margin_pct: result.margin_pct || marginPct,
        reason: result.reason || "Tidak ada alasan tersedia",
        confidence: result.confidence || "medium",
        het_reference: hetReference || null,
      };
    }
  } catch (err) {
    console.error("AI pricing analysis error:", err);
  }

  const fallbackPrice = Math.ceil(newHargaBeli * (1 + marginPct / 100));
  return {
    recommended_price: fallbackPrice,
    margin_pct: marginPct,
    reason: `Kalkulasi manual: Harga beli baru Rp ${newHargaBeli.toLocaleString("id-ID")} + ${marginPct}% margin = Rp ${fallbackPrice.toLocaleString("id-ID")}`,
    confidence: "low",
    het_reference: hetReference || null,
  };
}

export async function savePriceHistory(record) {
  const { data, error } = await supabase
    .from("price_history")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingPriceReviews() {
  const { data, error } = await supabase
    .from("price_history")
    .select("*, products(id, nama, kode, merek, kategori, harga_beli, harga_jual)")
    .eq("action", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updatePriceHistoryAction(id, action) {
  const { error } = await supabase
    .from("price_history")
    .update({ action })
    .eq("id", id);

  if (error) throw error;
}

export async function isDynamicPricingEnabled() {
  const { data } = await supabase
    .from("ai_config")
    .select("value")
    .eq("key", "dynamic_pricing_enabled")
    .single();

  return data?.value === "true";
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
