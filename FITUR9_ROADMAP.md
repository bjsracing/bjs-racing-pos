# FITUR 9: AI Dynamic Pricing Engine — Roadmap Implementasi

**Status:** Selesai (Fase 1-2)
**Tanggal:** 20 Juli 2026
**Target:** Sistem Harga Dinamis Pengoptimal Margin

---

## RINGKASAN EKSEKUTIF

Sistem yang merekomendasikan harga jual optimal ketika harga beli dari supplier naik.
Menggunakan AI (Gemini) dengan Google Search grounding untuk fetch HET (Harga Eceran Tertinggi),
ditambah margin management per kategori produk.

---

## FASE YANG SUDAH DIIMPLEMENTASI

| Step | Fase | Status | File |
|------|------|--------|------|
| 1 | DB Migration | ✅ | `supabase/migrations/20260720000000_create_dynamic_pricing.sql` |
| 2 | Core Logic | ✅ | `src/lib/dynamicPricing.js` |
| 3 | Edge Function | ✅ | `supabase/functions/gemini-proxy/index.ts` (Google Search grounding) |
| 4 | Client Proxy | ✅ | `src/lib/geminiProxy.js` (useGoogleSearch param) |
| 5 | UI Badge | ✅ | `src/components/DynamicPricingBadge.jsx` |
| 6 | UI Modal | ✅ | `src/components/DynamicPricingModal.jsx` |
| 7 | Margin Page | ✅ | `src/pages/ManajemenMargin.jsx` |
| 8 | ProductModal Integ | ✅ | `src/components/ProductModal.jsx` |
| 9 | Dashboard Card | ✅ | `src/pages/Dashboard.jsx` (Harga Perlu Review) |
| 10 | Route + Navbar | ✅ | `src/App.jsx`, `src/components/Navbar.jsx` |

---

## DATABASE

### Tabel `margin_settings`
- `kategori` (TEXT UNIQUE) — nama kategori
- `margin_pct` (NUMERIC) — margin dalam persen
- `description` (TEXT) — keterangan
- `is_active` (BOOLEAN) — status aktif

### Tabel `price_history`
- `product_id` (UUID → products.id)
- `old_harga_beli` / `new_harga_beli` — harga beli lama/baru
- `old_harga_jual` / `new_harga_jual` — harga jual lama/baru
- `het_reference` — HET dari Google Search
- `recommended_price` — harga rekomendasi AI
- `ai_reason` — alasan dari AI
- `ai_confidence` — high/medium/low
- `source` — 'po_receipt' | 'manual_edit' | 'ocr'
- `action` — 'pending' | 'accepted' | 'rejected' | 'edited'

---

## MARGIN DEFAULTS

| Kategori | Margin | Keterangan |
|----------|--------|------------|
| Oli | 10% | Volume tinggi, sensitif harga |
| Pelumas | 10% | Mirip oli |
| Ban | 12% | Komoditas, kompetitif |
| Kampas Rem | 15% | Wear part |
| Shoes | 15% | Wear part |
| Aki | 15% | Moderate |
| Accu | 15% | Moderate |
| Sparepart | 20% | Hard part, specialist |
| Mesin | 20% | Specialist |
| Kelistrikan | 20% | Specialist |
| Aksesoris | 25% | High perceived value |
| default | 10% | Fallback |

---

## CARA KERJA

### Flow: Edit Harga Beli di ProductModal
1. User edit harga_beli di ProductModal
2. DynamicPricingBadge muncul jika harga berubah
3. Klik badge → DynamicPricingModal terbuka
4. AI fetch HET via Google Search grounding
5. AI analisis dan rekomendasikan harga jual baru
6. User bisa: Terapkan / Tolak / Edit Manual
7. Record disimpan ke price_history

### Flow: Dashboard "Harga Perlu Review"
1. Dashboard fetch pending price_history records
2. Tampilkan kartu "Harga Perlu Review" dengan daftar produk
3. User bisa review langsung dari Dashboard

---

## GOOGLE SEARCH GROUNDING (GRATIS)

Edge function `gemini-proxy` sekarang mendukung `useGoogleSearch: true`.
Ketika diaktifkan, Gemini akan otomatis mencari di Google dan menyertakan
sumber informasi. Tidak perlu API key tambahan.

---

## NAVIGASI

- **Pengaturan Margin** → `/manajemen-margin` (admin/owner only)
- **Manajemen AI** → `/manajemen-ai` (admin/owner only)

---

## FUTURE ENHANCEMENTS (Belum Diimplementasi)

- Trigger saat PO diterima (FormPembelian)
- Badge di FormPembelian untuk item yang harganya naik
- Integrasikan price_history action tracking ke UI
- Notifikasi real-time untuk harga perlu review
