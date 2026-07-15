# ROADMAP PENGEMBANGAN FITUR AGENT AI (BJS RACING POS)
Dokumen ini menyajikan rencana strategis, arsitektur teknis, dan langkah-langkah implementasi detail untuk menerapkan **9 Fitur Kecerdasan Buatan (AI) Unggulan** di aplikasi **BJS Racing POS**. Rencana ini dirancang secara bertahap menggunakan model **Google Gemini Flash Latest** (Gratis/Sangat Ekonomis) dan ekosistem **Supabase**.

---

## Ringkasan Eksekutif
Integrasi AI Agent di sistem POS ini bertujuan untuk memecahkan tantangan khas industri bengkel motor: kesibukan fisik mekanik/kasir, kompleksitas kompatibilitas ribuan suku cadang (*spareparts*), lambatnya input nota pemasok manual, retensi pelanggan, prediksi stok, fraud kasir, dan pengamanan margin profit terhadap inflasi.

Dengan membagi pengembangan menjadi **4 Tahap Besar**, kita akan membangun sistem POS terpintar yang mandiri, bernilai tinggi, dan siap dipasarkan sebagai produk SaaS premium berkelas enterprise.

```
[TAHAP 1: CORE AI]       ──► [TAHAP 2: INVENTORY & CONTEXT]
- AI Voice POS (M1)          - AI OCR Nota Supplier (M3-4)
- AI WhatsApp Draft (M2)     - AI Semantic Search pgvector (M5)
                             - AI Business Analyst Chatbot (M6)
                                      │
[TAHAP 4: ENTERPRISE & SECURITY] ◄── [TAHAP 3: PREDICTIVE & CRM]
- AI Loss Prevention (M11-12) - AI Predictive CRM (M7-8)
- AI Dynamic Pricing (M13-14) - AI Demand Forecasting (M9-10)
```

---

## TAHAP 1: CORE AI INTEGRATION (Fase Fondasi — Minggu 1-2)

### Fitur 1: AI Voice POS (Asisten Kasir Tanpa Mengetik)
*   **Estimasi Waktu:** 1 Minggu (Dasar sudah siap, tinggal integrasi UI)
*   **Halaman Terkait:** `src/pages/Pos.jsx`
*   **Tujuan:** Memproses perintah ucapan kasir menggunakan suara dalam Bahasa Indonesia menjadi aksi state keranjang belanja (`cart`).
*   **Langkah Implementasi Detail:**
    1.  **Migrasi Kode:** Pindahkan berkas `useAIPosAgent.js` ke `src/hooks/` dan `AIAssistantModal.jsx` ke `src/components/`.
    2.  **Pembuatan Wrapper State:** Buat fungsi penanganan tambah barang dinamis `handleAddProductFromAI` di `Pos.jsx` (untuk menangani kuantitas dinamis).
    3.  **Pembuatan Tombol Pemicu:** Pasang tombol berikon robot/mic di Header POS di samping tombol "Catat Permintaan" untuk memicu modal.

### Fitur 2: AI Auto-Draft WhatsApp Reply (Permintaan Pelanggan)
*   **Estimasi Waktu:** 1 Minggu
*   **Halaman Terkait:** `src/pages/PermintaanPelanggan.jsx`
*   **Tujuan:** Menyusun draf pesan WhatsApp balasan secara otomatis yang ramah, profesional, dan solutif berdasarkan permintaan produk kosong.
*   **Langkah Implementasi Detail:**
    1.  **Skema Data Permintaan:** Membaca data dari tabel `permintaan_pelanggan` (nama produk diminta, kategori, catatan).
    2.  **Pembuatan Prompt Penyusunan Draft:** Gunakan model Gemini dengan system prompt khusus untuk menyusun draf pesan penawaran barang alternatif.
    3.  **Integrasi Tombol WhatsApp Share:** Buat tombol "Hubungi via WA" di tabel permintaan pelanggan. Saat diklik, pemicu akan meminta Gemini membuat draf pesan, lalu menggunakan API `window.open("https://api.whatsapp.com/send?phone=...&text=" + encodeURIComponent(draftText))`.

---

## TAHAP 2: CONTEXTUAL & INVENTORY AI (Fase Operasional — Minggu 3-6)

### Fitur 3: AI Multimodal OCR Nota Pembelian (Restocking Otomatis)
*   **Estimasi Waktu:** 2 Minggu
*   **Halaman Terkait:** `src/pages/FormPembelian.jsx`
*   **Tujuan:** Memindai foto nota fisik dari supplier, mengekstrak tabel barang, lalu otomatis mengisi baris input pembelian tanpa kasir perlu mengetik satu per satu.
*   **Langkah Implementasi Detail:**
    1.  **Penambahan Komponen Upload Kamera:** Tambahkan input file atau akses webcam di `FormPembelian.jsx` untuk mengambil foto nota.
    2.  **Optimasi Kompresi Gambar:** Gunakan library `browser-image-compression` untuk memperkecil ukuran foto nota di bawah 1MB sebelum dikirim ke AI, agar proses upload cepat dan menghemat kuota token.
    3.  **Integrasi Multimodal Gemini:** Kirim data gambar (format *base64* atau *blob*) ke API Gemini dengan `responseMimeType: "application/json"` untuk mengekstrak barang masuk ke form state.

### Fitur 4: AI-Powered Sparepart Compatibility & Semantic Search
*   **Estimasi Waktu:** 2 Minggu
*   **Halaman Terkait:** `src/pages/Produk.jsx`, `src/pages/Pos.jsx`
*   **Tujuan:** Memungkinkan pencarian produk berdasarkan kemiripan makna (Semantic Search) serta menjawab pertanyaan kecocokan/kompatibilitas suku cadang antar-motor yang berbeda.
*   **Langkah Implementasi Detail:**
    1.  **Aktifkan pgvector di Supabase:** Masuk ke SQL Editor Supabase Anda dan aktifkan ekstensi vector: `CREATE EXTENSION IF NOT EXISTS vector;`.
    2.  **Modifikasi Tabel Products:** Tambahkan kolom untuk menampung data koordinat vektor (*embedding*) deskripsi produk: `ALTER TABLE products ADD COLUMN embedding vector(1536);`.
    3.  **Generate Embeddings:** Buat Trigger Supabase untuk mengirim deskripsi produk baru ke API Embedding Gemini dan simpan hasilnya di database.
    4.  **Fungsi SQL Pencarian Kemiripan (Cosine Similarity):** Buat stored procedure (RPC) di Supabase untuk mencari produk terdekat menggunakan rumus jarak kosinus.

### Fitur 5: AI Business Advisor Chatbot (Asisten Dashboard Keuangan)
*   **Estimasi Waktu:** 1 Minggu
*   **Halaman Terkait:** `src/pages/Dashboard.jsx`, `src/pages/Reports.jsx`
*   **Tujuan:** Memberikan asisten obrolan interaktif bagi pemilik bengkel untuk merangkum performa toko, margin laba kotor, serta memberikan saran strategi bisnis berdasarkan data nyata.
*   **Langkah Implementasi Detail:**
    1.  **Pembuatan Chatbox UI:** Buat widget tombol chat terapung (*floating chat bubble*) di bagian pojok kanan bawah Dashboard.
    2.  **Aggregator Data (Konteks AI):** Ambil data agregasi bisnis (laba rugi, produk terlaris, produk menipis) dari RPC Supabase yang sudah Anda miliki secara paralel.
    3.  **Konfigurasi Prompt Analisis Bisnis:** Kirim data agregat tersebut bersama pertanyaan pemilik toko ke Gemini Flash. AI bertindak sebagai Chief Financial Officer (CFO) bengkel yang memberikan insight cerdas dan solusi konkret.

---

## TAHAP 3: PREDICTIVE & CRM AI (Fase Premium Retensi & Forecasting — Minggu 7-10)

### Fitur 6: AI Predictive Maintenance CRM (Retensi Pelanggan Otomatis)
*   **Estimasi Waktu:** 2 Minggu
*   **Tujuan:** Memprediksi masa pakai suku cadang yang telah dibeli pelanggan (seperti oli, kampas rem, ban) dan memicu pengingat servis otomatis via WhatsApp secara tepat waktu.
*   **Langkah Implementasi Detail:**
    1.  **Pelacakan Suku Cadang Habis Pakai:** Buat daftar perkiraan masa pakai tiap barang (oli = 90 hari, ban luar = 540 hari).
    2.  **Mesin Prediksi Tanggal Servis:** Analisis histori data transaksi penjualan barang berkategori habis pakai. AI memproyeksikan estimasi kilometer dan tanggal ganti servis berikutnya.
    3.  **Penyusunan Notifikasi WhatsApp Otomatis:** Buat cron job harian di Supabase (Edge Functions) untuk mendeteksi pelanggan yang masuk tanggal jatuh tempo servis, menyusun draf pesan personal, lalu memicu API WhatsApp gateway.

### Fitur 7: AI Demand Forecasting & Smart Purchasing (Prediksi Stok Masa Depan)
*   **Estimasi Waktu:** 2 Minggu
*   **Tujuan:** Menganalisis tren penjualan musiman untuk memproyeksikan kebutuhan stok barang di masa mendatang dan memberikan usulan jumlah pembelian optimal ke supplier.
*   **Langkah Implementasi Detail:**
    1.  **Agregasi Tren Runtun Waktu (*Time-Series*):** Buat kueri SQL untuk meringkas penjualan barang per kategori secara mingguan dan bulanan.
    2.  **Proyeksi Kebutuhan Stok:** AI mendeteksi pola musiman (misal: permintaan ban naik 35% di musim hujan).
    3.  **Smart Purchasing Integration:** Tampilkan notifikasi rekomendasi restok secara proaktif di halaman `FormPembelian.jsx` lengkap dengan estimasi waktu habisnya stok berjalan.

---

## TAHAP 4: SECURITY & MARGIN OPTIMIZATION AI (Fase Enterprise — Minggu 11-14)

### Fitur 8: AI Loss Prevention & Cashier Anomaly Detection (Deteksi Fraud Kasir)
*   **Estimasi Waktu:** 2 Minggu
*   **Tujuan:** Memantau aktivitas kasir secara real-time di latar belakang untuk mendeteksi tindakan mencurigakan (seperti pembatalan item sepihak setelah terima uang) demi mengamankan pendapatan bengkel.
*   **Langkah Implementasi Detail:**
    1.  **Pembuatan Log Aktivitas Kasir (Audit Trail):** Rekam setiap aksi klik kasir seperti `CLEAR_CART`, `REMOVE_FROM_CART`, dan manipulasi diskon manual ke tabel `cashier_audit_logs`.
    2.  **Mesin Analisis Pola Kecurigaan:** AI secara berkala (misal tiap jam/hari) melakukan scanning pada log aktivitas kasir dan menghitung skor anomali.
    3.  **Silent Alarm Telegram/WhatsApp:** Jika skor anomali di atas 80, picu Supabase Edge Function untuk mengirimkan pesan peringatan mendetail kepada pemilik bengkel.

### Fitur 9: AI Dynamic Pricing Engine (Sistem Harga Dinamis Pengoptimal Margin)
*   **Estimasi Waktu:** 2 Minggu
*   **Tujuan:** Otomatis menghitung dan merekomendasikan harga jual optimal ketika mendeteksi adanya kenaikan harga modal dari supplier, demi mengamankan margin keuntungan toko.
*   **Langkah Implementasi Detail:**
    1.  **Pemicu Deteksi Kenaikan Modal:** Ketika kasir menyimpan nota pembelian di `FormPembelian.jsx` dan harga beli terdeteksi lebih tinggi dari harga beli sebelumnya di tabel `products`.
    2.  **Analisis Elastisitas Margin AI:** AI menganalisis sensitivitas harga barang tersebut terhadap volume penjualan historis.
    3.  **Auto-Rekomendasi Harga Jual Baru:** Menampilkan pop-up dialog di halaman kelola produk untuk mengonfirmasi harga jual baru agar laba bersih toko tidak tergerus inflasi secara tidak sengaja.

---

## ARSITEKTUR KEAMANAN & DEPLOYMENT PRODUKSI
Demi menjaga keamanan kredensial dan keandalan sistem saat aplikasi **BJS Racing POS** ini dideploy secara publik (misal di Vercel), ikuti standar keamanan berikut:
1.  **Amankan API Key menggunakan Supabase Edge Functions (Proksi Serverless):** Sangat dilarang menaruh `VITE_GEMINI_API_KEY` langsung di sisi klien React pada tahap produksi. Semua pemanggilan API diprosikan melalui serverless function Supabase yang aman.
2.  **Akurasi JSON:** Model AI harus dikonfigurasi dengan suhu rendah (`temperature: 0.1`) untuk menjamin konsistensi format JSON murni tanpa bumbu teks tambahan.
3.  **Offline Resiliency:** Sistem harus menyediakan opsi fallback ke pemrosesan lokal (seperti pencarian teks standar) jika koneksi internet terputus, untuk menjaga kasir tetap bisa bertransaksi.
