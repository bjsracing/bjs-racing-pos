# Plan: Fitur 5 — AI Business Advisor Chatbot (Asisten Keuangan Dashboard)

## Tujuan
Widget chat "CFO virtual" untuk pemilik bengkel di Dashboard. Pemilik bertanya bebas (bahasa santai) tentang performa toko, laba rugi, produk terlaris, stok mati, saran margin; AI menjawab dengan insight berbasis data nyata dari Supabase.

## Keputusan Desain (sudah dikonfirmasi user)
- **Konteks data:** 1 RPC Supabase baru `get_ai_business_context(start_date, end_date)` yang mengembalikan agregat **lengkap + tren time-series** dalam sekali panggil (JSON).
- **Akses:** Hanya role `admin`/`owner` (pakai `getUserRole()` yang sudah ada).
- **Toggle:** Kunci baru `advisor_enabled` di tabel `ai_config` (konsisten dgn `pos_copilot_enabled`), dikelola dari halaman Manajemen AI.
- **Riwayat chat:** **Stateless** — tiap pertanyaan berdiri sendiri, tidak ada histori multi-turn, tidak ada tabel DB baru untuk chat.
- **UX:** Floating chat bubble di pojok kanan bawah **Dashboard** + 3-4 tombol pertanyaan cepat (quick prompts).
- **Model & keamanan:** Pakai infra yang sudah ada — `callGeminiWithFallback` (`src/lib/geminiProxy.js`) → Edge Function `gemini-proxy` (Gemini + fallback NVIDIA). API key tetap di server. `systemInstruction` didukung proxy.

## Arsitektur & Pola yang Diikuti
- Hook + komponen, mengikuti pola `useWhatsAppDraft.js` + modal.
- AI dipanggil via `callGeminiWithFallback({ contents, systemInstruction, generationConfig }, signal)`.
- Respons AI berupa **teks biasa** (bukan JSON), `temperature` ~0.5, `maxOutputTokens` ~800.
- Konteks bisnis dikirim ke AI sebagai teks JSON ringkas dalam `contents` user part; persona CFO di `systemInstruction`.

---

## Task List (urutan implementasi)

### 1. Migrasi SQL: RPC `get_ai_business_context`
- File baru: `supabase/migrations/<timestamp>_create_ai_business_context.sql` (ikuti konvensi timestamp existing, mis. `20250720000000_...`).
- Buat `FUNCTION public.get_ai_business_context(start_date timestamptz, end_date timestamptz) RETURNS jsonb` dengan `LANGUAGE sql STABLE SECURITY DEFINER` (samakan gaya RPC dashboard lain).
- Bangun `jsonb_build_object` dari sub-agregat, sedapat mungkin **memanggil ulang RPC yang sudah ada** agar tidak menduplikasi logika:
  - `laba_rugi` → hasil `calculate_profit_loss(start_date, end_date)` (omzet, HPP, laba kotor/bersih).
  - `metrik` → `get_dashboard_metrics(start_date, end_date)` (sales_value, profit_value, transactions_count) + `rata_rata_transaksi`.
  - `metrik_periode_sebelumnya` → `get_dashboard_metrics` untuk periode setara sebelum `start_date` (durasi sama) untuk perbandingan naik/turun.
  - `top_produk_terlaris` → `get_best_selling_products(start_date, end_date)` limit 10.
  - `produk_stok_rendah` → query `products` `status='Aktif' AND stok>0 AND stok<=stok_min` limit 10.
  - `produk_habis` → `products` `status='Aktif' AND stok=0` limit 10 (urut by terlaris all-time bila memungkinkan).
  - `penjualan_per_merek` → `get_sales_by_brand(start_date, end_date)` top 8.
  - `margin_per_kategori` → `get_profit_margin_by_category(start_date, end_date)`.
  - `tren_time_series` → tren penjualan harian/mingguan dalam rentang (boleh reuse `get_dashboard_charts_data` `daily_sales`, atau agregasi `date_trunc('day'/'week', created_at)` dari transaksi). Simpan ringkas (mis. maksimal ~30 titik) agar payload/token terkendali.
  - `generated_at` → `now()`.
- `GRANT EXECUTE ON FUNCTION public.get_ai_business_context(timestamptz, timestamptz) TO authenticated;`
- **Verifikasi dulu** signature persis RPC yang dipanggil (`calculate_profit_loss`, `get_dashboard_metrics`, `get_best_selling_products`, `get_sales_by_brand`, `get_profit_margin_by_category`, `get_dashboard_charts_data`) di DB/migrasi sebelum menyusun, agar nama kolom & parameter cocok. Jika ada RPC yang ternyata tidak ada di repo migrations, inline query-nya.
- Catatan deploy: RPC harus dijalankan/di-deploy ke Supabase (via `supabase db push`/SQL editor) sebelum frontend berfungsi.

### 2. Tambah toggle `advisor_enabled` di konfigurasi AI
- `supabase/migrations/<timestamp>_create_ai_business_context.sql` (atau migrasi terpisah): `INSERT INTO ai_config (key, value, description, type, grp) VALUES ('advisor_enabled','true','Aktifkan AI Business Advisor (Dashboard)','boolean','feature') ON CONFLICT (key) DO NOTHING;`
- `src/config/aiConfig.js`: tambah `advisor_enabled: "true"` ke `AI_CONFIG_DEFAULTS`.
- `src/pages/ManajemenModelAI.jsx` (~baris 356-359): tambah item `{ key: "advisor_enabled", label: "AI Business Advisor", desc: "Asisten CFO di Dashboard" }` ke array feature toggles (auto-render).

### 3. Hook baru: `src/hooks/useAiAdvisor.js`
- State: `isLoading`, `answer`, `error`.
- `fetchContext(startDate, endDate)`: panggil `supabase.rpc("get_ai_business_context", {...})`, return objek JSON (atau null jika error).
- `ask(question, { startDate, endDate }, signal)`:
  1. Ambil konteks via `fetchContext` (boleh cache per-rentang dalam ref agar tidak fetch berulang tiap pertanyaan dalam sesi/rentang sama).
  2. Susun `systemInstruction` persona CFO (lihat prompt di bawah).
  3. `contents`: 1 user turn berisi (a) blok konteks bisnis sebagai teks JSON, (b) pertanyaan user. (Stateless → tidak ada turn sebelumnya.)
  4. Panggil `callGeminiWithFallback(payload, signal)`; ambil `candidates[0].content.parts[0].text`.
  5. Set `answer`; handle `AbortError` diam-diam; set `error` untuk lainnya.
- Batasi panjang `question` (mis. slice 500 char) seperti pola `useAIPosAgent` (sanitasi input).

**System prompt (persona CFO, ringkas):**
- "Anda adalah CFO/penasihat bisnis untuk bengkel motor BJS Racing. Jawab dalam Bahasa Indonesia yang santai, ringkas, dan actionable. Gunakan HANYA data yang diberikan; jika data tidak cukup, katakan terus terang. Sertakan angka Rp bila relevan, dan beri 1-3 saran konkret. Jangan mengarang data. Jangan pakai markdown tabel yang rumit."

### 4. Komponen baru: `src/components/AiAdvisorWidget.jsx`
- Props: `startDate`, `endDate` (dari state Dashboard agar konteks mengikuti filter aktif; default bulan berjalan bila tidak ada).
- Floating bubble pojok kanan bawah (`fixed bottom-6 right-6 z-50`), ikon robot/chat, gaya konsisten (gradient orange, mirip `AIAssistantModal`).
- Klik bubble → buka panel chat (popover/kartu mengambang ~360px), berisi:
  - Header "AI Business Advisor" + tombol close.
  - Area jawaban (render `answer`, indikator loading "sedang menganalisis...", tampilkan `error`).
  - **Quick prompts** (3-4 tombol): "Bagaimana performa bulan ini?", "Produk apa yang stok mati?", "Saran tingkatkan margin?", "Apa produk terlaris saya?".
  - Input teks + tombol kirim (Enter submit). Optional: tombol mic pakai `useVoiceSearch` (konsisten, opsional — bisa fase lanjutan).
- Pakai `AbortController` untuk membatalkan request saat panel ditutup/pertanyaan baru.
- Stateless: menampilkan jawaban terakhir saja (boleh tampung daftar Q/A dalam state lokal sesi untuk tampilan, tapi tidak dikirim balik ke AI).

### 5. Integrasi ke Dashboard
- `src/pages/Dashboard.jsx`:
  - Import `AiAdvisorWidget` dan `getUserRole` (sudah dipakai di file untuk `userRole`).
  - Render `<AiAdvisorWidget startDate={dateRange[0]} endDate={dateRange[1]} />` **hanya jika** `(userRole === "admin" || userRole === "owner")` DAN toggle `advisor_enabled === "true"`.
  - Ambil status toggle: baca dari `ai_config` (mis. lewat `fetchAiConfig()` atau query kunci `advisor_enabled`) saat mount; simpan di state `advisorEnabled`.
  - `userRole` sudah tersedia di Dashboard (state `userRole` + `getUserRole()`), manfaatkan kembali.

---

## Prompt & Payload (kontrak teknis)
```js
callGeminiWithFallback({
  systemInstruction: { parts: [{ text: SYSTEM_PROMPT_CFO }] },
  contents: [{
    role: "user",
    parts: [
      { text: "DATA BISNIS (JSON):\n" + JSON.stringify(context) },
      { text: "PERTANYAAN PEMILIK: " + sanitizedQuestion },
    ],
  }],
  generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
}, signal)
```

## Failure Modes & Penanganan
- **RPC error / kosong:** tampilkan pesan ramah, jangan panggil AI tanpa konteks (atau kirim konteks minimal + beri tahu keterbatasan).
- **AI rate limit:** sudah ditangani `callGeminiWithFallback` (fallback NVIDIA).
- **AbortError:** abaikan diam-diam (panel ditutup / pertanyaan baru).
- **Payload token besar:** batasi jumlah baris tiap agregat (limit 8-10) dan titik time-series (~30) di RPC.
- **Akses tak berhak:** widget tidak dirender untuk non-admin/owner; RPC tetap `GRANT` ke `authenticated` (data agregat, bukan PII) — jika perlu lebih ketat, tambahkan cek role di dalam RPC (opsional, catat sebagai peningkatan).

## Rollout
1. Deploy migrasi SQL (RPC + seed `advisor_enabled`) ke Supabase.
2. Merge perubahan frontend (hook, komponen, integrasi Dashboard, config).
3. Aktifkan/nonaktifkan via Manajemen AI (`advisor_enabled`).
4. Tidak ada perubahan pada Edge Function `gemini-proxy` (sudah mendukung text + systemInstruction).

## Validasi
- `npm run build` sukses.
- Login sebagai admin/owner → bubble muncul di Dashboard; sebagai kasir → tidak muncul.
- Toggle `advisor_enabled=false` di Manajemen AI → bubble hilang.
- Klik quick prompt "Bagaimana performa bulan ini?" → jawaban menyebut angka omzet/laba yang cocok dengan kartu Dashboard periode sama.
- Ganti filter tanggal Dashboard → konteks jawaban mengikuti rentang tersebut.
- Uji RPC langsung di SQL editor Supabase: `select get_ai_business_context(now()-interval '30 days', now());` mengembalikan JSON lengkap.
- Uji fallback: simulasi rate limit Gemini → jawaban tetap keluar via NVIDIA.
- Tutup panel saat loading → tidak ada error state React (AbortController bekerja).

## Catatan Implementasi
- Butuh agent implementasi (edit source + jalankan migrasi/`supabase db push`). Plan-mode tidak mengeksekusi.
- Verifikasi signature RPC existing sebelum menulis `get_ai_business_context`; sesuaikan nama kolom output agar tidak error.
- Pertimbangkan menandai Fitur 5 sebagai referensi di `ai-agent-guide` bila diinginkan (dokumentasi opsional, bukan bagian wajib).

## Berkas yang Disentuh
- Baru: `supabase/migrations/<timestamp>_create_ai_business_context.sql`
- Baru: `src/hooks/useAiAdvisor.js`
- Baru: `src/components/AiAdvisorWidget.jsx`
- Ubah: `src/config/aiConfig.js` (default `advisor_enabled`)
- Ubah: `src/pages/ManajemenModelAI.jsx` (toggle baru)
- Ubah: `src/pages/Dashboard.jsx` (render widget + baca toggle/role)

## Open Questions (non-blocking)
- Apakah quick prompts perlu dapat dikonfigurasi pemilik, atau cukup hardcode? (Asumsi: hardcode.)
- Apakah perlu tombol mic (voice) di widget pada rilis pertama? (Asumsi: opsional/fase lanjutan.)
