# ROADMAP PENGEMBANGAN FITUR AGENT AI (BJS RACING POS)
Dokumen ini menyajikan rencana strategis, arsitektur teknis, dan langkah-langkah implementasi detail untuk menerapkan 5 fitur unggulan berbasis kecerdasan buatan (AI) di aplikasi **BJS Racing POS**. Rencana ini dirancang secara bertahap menggunakan model **Google Gemini Flash Latest** (Gratis/Sangat Ekonomis) dan ekosistem **Supabase**.

---

## Ringkasan Eksekutif
Integrasi AI Agent di sistem POS ini bertujuan untuk memecahkan tantangan khas industri bengkel motor: kesibukan fisik mekanik/kasir, kompleksitas kompatibilitas ribuan suku cadang (*spareparts*), lambatnya input nota pemasok manual, dan kesulitan pemilik toko menganalisis laporan keuangan yang rumit. 

Dengan membagi pengembangan menjadi **5 Fase**, kita akan membangun sistem POS terpintar yang mandiri dan berdaya saing tinggi.

```
[FASE 1] AI Voice POS (1 Mgg)  ──► [FASE 2] AI WA Draft (1 Mgg)  ──► [FASE 3] AI OCR Nota (2 Mgg)
                                                                             │
[FASE 5] AI Analyst (2 Mgg)   ◄──  [FASE 4] AI Semantic Search (3 Mgg) ◄─────┘
```

---

## DETAIL FASE PENGEMBANGAN

### FASE 1: AI Voice POS (Asisten Kasir Tanpa Mengetik)
*   **Estimasi Waktu:** 1 Minggu
*   **Tingkat Kesulitan:** Rendah (Fondasi kode & API sudah dibuat!)
*   **Halaman Terkait:** `src/pages/Pos.jsx`
*   **Tujuan:** Memproses perintah ucapan kasir menggunakan suara dalam Bahasa Indonesia menjadi aksi state keranjang belanja (`cart`).

#### Langkah Implementasi Detail:
1.  **Migrasi Kode:** Pindahkan berkas `useAIPosAgent.js` ke `src/hooks/` dan `AIAssistantModal.jsx` ke `src/components/`.
2.  **Pembuatan Wrapper State:** Buat fungsi penanganan tambah barang dinamis `handleAddProductFromAI` di `Pos.jsx` (untuk menangani kuantitas dinamis).
3.  **Pembuatan Tombol Pemicu:** Pasang tombol berikon robot/mic di Header POS di samping tombol "Catat Permintaan" untuk memicu modal.
4.  **Uji Coba & Kalibrasi:** Lakukan tes percakapan lisan untuk skenario:
    *   *Skenario Tambah:* "Tambah oli mpx2 satu botol"
    *   *Skenario Edit Kuantitas:* "Ubah jumlah oli mpx2 jadi lima"
    *   *Skenario Hapus:* "Hapus kampas rem dari keranjang"
    *   *Skenario Reset:* "Kosongkan keranjang belanja"

---

### FASE 2: AI Auto-Draft WhatsApp Reply (Permintaan Pelanggan)
*   **Estimasi Waktu:** 1 Minggu
*   **Tingkat Kesulitan:** Rendah
*   **Halaman Terkait:** `src/pages/PermintaanPelanggan.jsx`
*   **Tujuan:** Menyusun draft balasan WhatsApp yang persuasif, ramah, dan solutif ketika pelanggan bertanya tentang ketersediaan barang (termasuk memberikan rekomendasi alternatif jika barang kosong).

#### Langkah Implementasi Detail:
1.  **Skema Data Permintaan:** Membaca data dari tabel `permintaan_pelanggan` (nama produk diminta, kategori, catatan).
2.  **Pembuatan Prompt Penyusunan Draft:** Gunakan model Gemini dengan system prompt khusus:
    ```text
    "Anda adalah Sales Customer Service yang ramah dari BJS Racing. Buatlah draf balasan WhatsApp yang sangat sopan dan persuasif untuk membalas pertanyaan pelanggan mengenai ketersediaan barang. Jika barang tidak ada, tawarkan alternatif produk [Alternatif] dengan harga [Harga]."
    ```
3.  **Integrasi Tombol WhatsApp Share:** Buat tombol "Hubungi via WA" di tabel permintaan pelanggan. Saat diklik, pemicu akan meminta Gemini membuat draf pesan, lalu menggunakan API `window.open("https://api.whatsapp.com/send?phone=...&text=" + encodeURIComponent(draftText))` mirip seperti kode `PurchaseOrderShareModal.jsx` Anda.

---

### FASE 3: AI Multimodal OCR Nota Pembelian (Restocking Otomatis)
*   **Estimasi Waktu:** 2 Minggu
*   **Tingkat Kesulitan:** Sedang
*   **Halaman Terkait:** `src/pages/FormPembelian.jsx`
*   **Tujuan:** Memindai foto nota fisik dari supplier, mengekstrak tabel barang, lalu otomatis mengisi baris input pembelian tanpa kasir perlu mengetik satu per satu.

#### Langkah Implementasi Detail:
1.  **Penambahan Komponen Upload Kamera:** Tambahkan input file atau akses webcam di `FormPembelian.jsx` untuk mengambil foto nota.
2.  **Optimasi Kompresi Gambar:** Gunakan library `browser-image-compression` (sudah terpasang di package.json Anda!) untuk memperkecil ukuran foto nota di bawah 1MB sebelum dikirim ke AI, agar proses upload cepat dan menghemat kuota token.
3.  **Integrasi Multimodal Gemini:** Kirim data gambar (format *base64* atau *blob*) ke API Gemini dengan `responseMimeType: "application/json"` dan system prompt:
    ```text
    "Analisis gambar nota pembelian dari supplier bengkel ini. Ekstrak data tabel barang yang dibeli menjadi JSON murni berstruktur:
    [
      { "nama_barang": "string", "kuantitas": number, "harga_beli": number }
    ]"
    ```
4.  **Auto-Fill Form State:** Baca hasil JSON dari Gemini, lalu iterasi array tersebut untuk melakukan `.push` otomatis ke dalam state daftar item pembelian di `FormPembelian.jsx`.

---

### FASE 4: AI-Powered Sparepart Compatibility & Semantic Search
*   **Estimasi Waktu:** 3 Minggu (Memerlukan modifikasi database Supabase)
*   **Tingkat Kesulitan:** Tinggi
*   **Halaman Terkait:** `src/pages/Produk.jsx`, `src/pages/Pos.jsx`
*   **Tujuan:** Memungkinkan pencarian produk berbasis makna (Semantic Search) dan memberikan jawaban otomatis tentang kecocokan suku cadang antar-motor (misalnya kampas rem motor A cocok untuk motor B).

#### Langkah Implementasi Detail:
1.  **Aktifkan pgvector di Supabase:** Masuk ke SQL Editor Supabase Anda dan aktifkan ekstensi vector:
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```
2.  **Modifikasi Tabel Products:** Tambahkan kolom untuk menampung data koordinat vektor (*embedding*) deskripsi produk:
    ```sql
    ALTER TABLE products ADD COLUMN embedding vector(1536); -- 1536 dimensi adalah standar embedding Google
    ```
3.  **Generate Embeddings (Background Script):** Buat Edge Function di Supabase yang otomatis dipicu (`TRIGGER`) setiap kali ada produk baru ditambahkan atau diubah. Edge function ini mengirim deskripsi produk ke API Embedding Gemini dan menyimpan hasilnya di kolom `embedding`.
4.  **Fungsi SQL Pencarian Kemiripan (Cosine Similarity):** Buat stored procedure (RPC) di Supabase untuk mencari produk terdekat menggunakan rumus jarak kosinus:
    ```sql
    CREATE OR REPLACE FUNCTION match_products (
      query_embedding vector(1536),
      match_threshold float,
      match_count int
    ) RETURNS SETOF products AS $$
      SELECT *
      FROM products
      WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
      ORDER BY products.embedding <=> query_embedding LIMIT match_count;
    $$ LANGUAGE sql STABLE;
    ```
5.  **Integrasi Frontend:** Di halaman pencarian POS, gunakan kueri embedding ini agar pencarian kasir tidak kaku. Contoh: Kasir mengetik *"oli matik dingin"* -> Sistem bisa memunculkan oli dengan deskripsi *"membantu meredam panas mesin motor matic"* walaupun kata "dingin" tidak tertulis langsung di nama produk.

---

### FASE 5: AI Business Advisor Chatbot
*   **Estimasi Waktu:** 2 Minggu
*   **Tingkat Kesulitan:** Sedang
*   **Halaman Terkait:** `src/pages/Dashboard.jsx`, `src/pages/Reports.jsx`
*   **Tujuan:** Memberikan asisten obrolan interaktif bagi pemilik bengkel untuk merangkum performa toko, margin laba kotor, dan memberikan rekomendasi restock produk.

#### Langkah Implementasi Detail:
1.  **Pembuatan Chatbox UI:** Buat widget tombol chat terapung (*floating chat bubble*) di bagian pojok kanan bawah Dashboard.
2.  **Aggregator Data (Konteks AI):** Saat chatbox dibuka, sistem secara latar belakang mengambil data agregasi bisnis:
    *   Total penjualan dan laba rugi bulan ini (dari RPC `get_dashboard_metrics` Anda).
    *   Daftar produk terlaris (dari RPC `get_best_selling_products` Anda).
    *   Daftar produk yang stoknya di bawah batas minimal (`stok <= stok_min`).
3.  **Konfigurasi Prompt Analisis Bisnis:** Kirim data agregat tersebut bersama pertanyaan pemilik toko ke Gemini. Berikan peran kepada AI sebagai:
    ```text
    "Anda adalah CFO dan Analis Bisnis Otomotif berpengalaman. Tugas Anda adalah membaca data keuangan toko [Data_Agregat_JSON] dan menjawab pertanyaan pemilik toko secara analitis, memberikan saran aksi bisnis yang konkret, serta menggunakan bahasa Indonesia yang santun."
    ```
4.  **Render Rekomendasi:** Tampilkan jawaban teks analitis dari AI di chatbox lengkap dengan link navigasi ke halaman relevan (misalnya jika AI menyarankan membeli produk X, sertakan tombol *"Klik di sini untuk membuat PO"*).

---

## ARSITEKTUR KEAMANAN & DEPLOYMENT PRODUKSI

Demi menjaga keamanan kredensial dan keandalan sistem saat aplikasi **BJS Racing POS** ini dideploy secara publik (misal di Vercel), ikuti standar keamanan berikut:

### 1. Amankan API Key menggunakan Supabase Edge Functions (Proksi Serverless)
Sangat dilarang menaruh `VITE_GEMINI_API_KEY` langsung di sisi klien React pada tahap produksi.
*   **Cara Mengatasinya:** Buatlah satu fungsi serverless di Supabase (Edge Function) bernama `gemini-proxy`.
*   **Aliran Data:** 
    `React Frontend (Client)` ──► `Supabase Edge Function` (Membawa API Key aman di level Server) ──► `Google Gemini API`
*   **Perintah CLI Supabase untuk deploy:**
    ```bash
    supabase functions new gemini-proxy
    supabase secrets set VITE_GEMINI_API_KEY=AIzaSyB...
    supabase functions deploy gemini-proxy
    ```

### 2. Pengaturan Batasan Laju Request (Rate Limiting)
Untuk mencegah eksploitasi kuota API gratis Anda oleh pengguna yang tidak berhak:
*   Terapkan pembatasan kueri di Supabase Edge Function Anda maksimal **10 request per menit per akun pengguna** menggunakan Row Level Security (RLS) atau token autentikasi JWT Supabase.

---

## JADWAL PELAKSANAAN & MILESTONES

| Fase | Nama Fitur | Durasi | Target Output |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **AI Voice POS** | 1 Minggu | Kasir bisa menginput, mengedit, dan menghapus barang dari keranjang POS via suara 100% lancar. |
| **Fase 2** | **AI WhatsApp Draft** | 1 Minggu | Tombol "Kirim Rekomendasi" di menu Permintaan Pelanggan otomatis menyusun kalimat promosi dan membuka WhatsApp Web. |
| **Fase 3** | **AI Multimodal OCR** | 2 Minggu | Tombol kamera di halaman Pembelian sukses membaca foto nota supplier dan mengisi tabel draf barang masuk. |
| **Fase 4** | **AI Compatibility Search** | 3 Minggu | Database Supabase mendukung pencarian berbasis makna (Semantic Search) menggunakan pgvector. |
| **Fase 5** | **AI Business Advisor** | 2 Minggu | Pemilik bengkel bisa berkonsultasi mengenai laporan laba rugi dan stok menumpuk lewat widget chat interaktif. |

---
*Dokumen Roadmap ini dibuat untuk menjadi acuan standar pengembangan tim BJS Racing POS. Seluruh file pendukung kode awal untuk Fase 1 telah tersedia dan siap dipasang di folder `ai-agent-guide/`.*
