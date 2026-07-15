# PRODUCT REQUIREMENT DOCUMENT (PRD)
## IMPLEMENTASI FITUR AGENT AI — BJS RACING POS (9 FITUR UNGGULAN)

**Status:** Draft - Approved  
**Tanggal:** 16 Juli 2026  
**Penulis:** Arena.ai Agent Mode  
**Target Platform:** React SPA Frontend + Supabase Backend  
**Model AI Utama:** Google Gemini Flash Latest (`gemini-flash-latest`) + Supabase `pgvector`  

---

## 1. PENDAHULUAN & TUJUAN PRODUK
Dokumen Spesifikasi Produk (PRD) ini menjabarkan spesifikasi fungsional dan teknis untuk mengintegrasikan **9 Fitur Kecerdasan Buatan (AI)** ke dalam aplikasi **BJS Racing POS**. Tujuannya adalah mentransformasikan POS konvensional menjadi sebuah platform SaaS pintar otomotif kelas dunia (Enterprise-Grade) yang prediktif, preventif, serta mampu memicu efisiensi kerja kasir, kenyamanan pelanggan, dan proteksi keuntungan bagi pemilik toko.

---

## 2. DAFTAR & SPESIFIKASI DETIL 9 FITUR AI

### FITUR 1: AI Voice-to-Command / Voice Ordering (Voice POS)
*   **Kategori:** Core POS Optimization (Fase 1)
*   **Tujuan:** Memungkinkan kasir menginput, mengubah kuantitas, dan menghapus barang dari keranjang belanja secara verbal (suara lisan) tanpa perlu mengetik manual.
*   **User Story:** *"Sebagai Kasir, saya ingin menyebutkan barang dan jumlahnya langsung lewat mikrofon ketika tangan saya sedang sibuk mengemas barang, agar keranjang belanja terisi otomatis."*
*   **Spesifikasi Fungsional:**
    *   Tombol pemicu rekaman suara di halaman POS utama.
    *   Mengonversi suara ke teks Bahasa Indonesia menggunakan Web Speech API.
    *   Mengekstrak maksud (intent) dan entitas (nama barang, kuantitas) dalam format JSON murni.
    *   Pencarian fuzzy otomatis di tabel `products` Supabase untuk mencocokkan item.
    *   Memicu dialog pilihan jika terdapat beberapa produk yang ambigu.
*   **Skema Respons JSON AI yang Diharapkan:**
    ```json
    [
      { "action": "ADD_TO_CART", "search_query": "oli shell helix", "quantity": 2 },
      { "action": "REMOVE_FROM_CART", "search_query": "kampas rem bendix" }
    ]
    ```

---

### FITUR 2: AI Auto-Draft WhatsApp Reply (Permintaan Pelanggan)
*   **Kategori:** Customer Engagement & Sales (Fase 1)
*   **Tujuan:** Menyusun draf pesan WhatsApp balasan secara otomatis yang ramah, profesional, dan solutif berdasarkan permintaan produk pelanggan (termasuk rekomendasi alternatif produk yang relevan).
*   **User Story:** *"Sebagai Kasir, saya ingin sistem menyusun draf pesan WhatsApp secara otomatis yang menawarkan barang alternatif ketika pelanggan menanyakan suku cadang yang stoknya kosong, agar penjualan tidak hilang."*
*   **Spesifikasi Fungsional:**
    *   Tombol "Hubungi via WA" di halaman `PermintaanPelanggan.jsx`.
    *   AI membaca rincian permintaan produk kosong.
    *   AI mencari alternatif produk terdekat di database yang berstatus aktif.
    *   AI menyusun pesan persuasif, ramah, dan menyertakan rincian harga barang alternatif tersebut.
    *   Memicu tautan WhatsApp Web (`api.whatsapp.com`) untuk mengirim pesan dengan sekali klik.

---

### FITUR 3: AI Multimodal OCR Nota Pembelian (Restocking Otomatis)
*   **Kategori:** Inventory Management (Fase 2)
*   **Tujuan:** Memindai foto nota pembelian fisik dari supplier, membaca data tabel barang di dalamnya, dan langsung memasukkan datanya ke dalam form draf pembelian stok masuk.
*   **User Story:** *"Sebagai Kasir, saya ingin mengambil foto nota kertas dari supplier dan membiarkan sistem mengisi form pembelian stok masuk secara otomatis, agar saya tidak perlu mengetik puluhan baris item secara manual."*
*   **Spesifikasi Fungsional:**
    *   Komponen upload gambar atau tombol aktifkan kamera/webcam di `FormPembelian.jsx`.
    *   Kompresi gambar otomatis sisi klien (<1MB) menggunakan `browser-image-compression`.
    *   Pengiriman data gambar ke model multimodal Gemini Flash Latest.
    *   Mengekstrak data kolom: Nama Suku Cadang, Kuantitas, dan Harga Beli (Modal) menjadi data terstruktur.
*   **Skema Output JSON AI:**
    ```json
    [
      { "nama_barang": "Ban FDR Tubeless", "kuantitas": 10, "harga_beli": 185000 }
    ]
    ```

---

### FITUR 4: AI-Powered Sparepart Compatibility & Semantic Search
*   **Kategori:** Intelligent Search & Catalog (Fase 2)
*   **Tujuan:** Memungkinkan pencarian produk berdasarkan kemiripan makna (Semantic Search) serta menjawab pertanyaan kecocokan/kompatibilitas suku cadang antar-motor yang berbeda.
*   **User Story:** *"Sebagai Mekanik/Kasir Baru, saya ingin mencari kecocokan kampas rem motor Beat ke motor Scoopy tanpa harus menghafal, agar saya bisa memberikan jawaban yang akurat kepada pelanggan."*
*   **Spesifikasi Fungsional:**
    *   Memanfaatkan ekstensi **`pgvector`** di Supabase untuk menyimpan koordinat vektor (*embeddings*) produk.
    *   Mengonversi teks deskripsi produk menjadi vector embedding 1536 dimensi menggunakan Gemini Embedding API secara background via Supabase Triggers.
    *   Kasir dapat mencari dengan kata kunci bebas (contoh: *"ban anti selip untuk jalan basah"*).
    *   Sistem melakukan pencarian kedekatan vektor (*cosine similarity*) dan mengembalikan rekomendasi produk beserta alasannya.

---

### FITUR 5: AI Business Advisor Chatbot (Asisten Keuangan Dashboard)
*   **Kategori:** Business Intelligence (Fase 2)
*   **Tujuan:** Menyediakan widget obrolan interaktif bagi pemilik bengkel untuk merangkum performa toko, margin laba kotor, serta memberikan saran strategi bisnis berdasarkan data nyata.
*   **User Story:** *"Sebagai Pemilik Bengkel, saya ingin berkonsultasi mengenai laba rugi bulanan dan stok mati di toko saya lewat obrolan santai, tanpa perlu pusing membaca angka-angka grafik yang rumit."*
*   **Spesifikasi Fungsional:**
    *   Widget obrolan terapung (*floating chat bubble*) di pojok kanan bawah Dashboard.
    *   Sistem secara senyap mengirimkan data ringkasan agregat JSON (laba rugi, transaksi terakhir, daftar produk menipis, dsb) sebagai konteks dasar percakapan.
    *   AI bertindak sebagai Chief Financial Officer (CFO) bengkel yang memberikan insight cerdas dan solusi konkret.

---

### FITUR 6: AI Predictive Maintenance CRM (Retensi Pelanggan Otomatis)
*   **Kategori:** Premium Enterprise - Customer Retention (Fase 3)
*   **Tujuan:** Memprediksi masa pakai suku cadang yang telah dibeli pelanggan (seperti oli, kampas rem, ban) dan memicu pengingat servis otomatis via WhatsApp secara tepat waktu.
*   **User Story:** *"Sebagai Pemilik Bengkel, saya ingin pelanggan lama otomatis mendapatkan pengingat servis ganti oli tepat 3 bulan setelah kunjungan terakhir mereka, agar mereka terus kembali bertransaksi di bengkel saya."*
*   **Spesifikasi Fungsional:**
    *   Sistem melacak histori transaksi pembelian barang berkategori "Habis Pakai" (contoh: Oli, Kampas Rem, Rantai).
    *   AI memprediksi tanggal kedaluwarsa suku cadang berdasarkan tipe motor, riwayat pembelian, dan estimasi kilometer harian.
    *   Memicu cron-job/worker harian untuk membuat draf notifikasi personal WhatsApp.
    *   Sistem memicu pengiriman pesan via gateway WhatsApp ketika tanggal prediksi tercapai.

---

### FITUR 7: AI Demand Forecasting & Smart Purchasing (Prediksi Stok Masa Depan)
*   **Kategori:** Premium Enterprise - Inventory Analytics (Fase 3)
*   **Tujuan:** Menganalisis tren penjualan musiman untuk memproyeksikan kebutuhan stok barang di masa mendatang dan memberikan usulan jumlah pembelian optimal ke supplier.
*   **User Story:** *"Sebagai Pemilik Toko, saya ingin sistem merekomendasikan jumlah stok yang harus dibeli menjelang musim hujan/Lebaran, agar saya tidak kehabisan barang terlaris atau menumpuk barang yang tidak laku."*
*   **Spesifikasi Fungsional:**
    *   Membaca tren penjualan runtun waktu (*time-series*) dari tabel transaksi dan log stok.
    *   AI mengidentifikasi akselerasi penjualan dan pola musiman (contoh: penjualan ban naik saat musim hujan, oli naik saat musim mudik).
    *   Menampilkan rekomendasi restok proaktif di menu pengadaan barang (`FormPembelian`).
*   **Skema Analitis AI:**
    ```text
    "Stok ban FDR Anda saat ini 5 unit. AI memprediksi volume penjualan akan naik 35% bulan depan karena musim hujan. Disarankan membeli 25 unit tambahan untuk mengamankan kebutuhan 30 hari ke depan."
    ```

---

### FITUR 8: AI Loss Prevention & Cashier Anomaly Detection (Deteksi Fraud Kasir)
*   **Kategori:** Premium Enterprise - Internal Security (Fase 4)
*   **Tujuan:** Memantau aktivitas kasir secara real-time di latar belakang untuk mendeteksi tindakan mencurigakan (seperti pembatalan item sepihak setelah terima uang) demi mengamankan pendapatan bengkel.
*   **User Story:** *"Sebagai Pemilik Bengkel yang memiliki banyak cabang, saya ingin mendeteksi fraud kasir yang membatalkan transaksi setelah menerima uang cash tanpa pengawasan saya, agar pendapatan toko aman."*
*   **Spesifikasi Fungsional:**
    *   Menganalisis log audit kasir (seperti menunda transaksi, menghapus item dari cart, atau merubah nominal diskon manual secara terus-menerus).
    *   AI menghitung *Anomaly Score* (0-100) berdasarkan pola transaksi kasir.
    *   Mengirim notifikasi peringatan senyap (*silent alert*) ke Telegram/WhatsApp pemilik toko jika skor di atas batas aman (>80) disertai ringkasan rincian dugaan kecurangan.

---

### FITUR 9: AI Dynamic Pricing Engine (Sistem Harga Dinamis Pengoptimal Margin)
*   **Kategori:** Premium Enterprise - Margin Optimization (Fase 4)
*   **Tujuan:** Otomatis menghitung dan merekomendasikan harga jual optimal ketika mendeteksi adanya kenaikan harga modal dari supplier, demi mengamankan margin keuntungan toko.
*   **User Story:** *"Sebagai Pemilik Toko, saya ingin sistem langsung menyarankan harga jual eceran baru yang ideal ketika harga modal sparepart dari supplier naik, agar margin profit saya tidak tergerus inflasi secara tidak sengaja."*
*   **Spesifikasi Fungsional:**
    *   Pemicu otomatis saat terjadi transaksi pembelian dari supplier dengan harga unit yang naik.
    *   AI menghitung margin keuntungan bersih saat ini.
    *   AI menganalisis elastisitas harga produk (apakah sensitif jika dinaikkan?) dan harga modal baru.
    *   AI memberikan rekomendasi harga eceran baru di modal harga produk atau `SpecialPriceModal.jsx`.

---

## 3. KEBUTUHAN NON-FUNGSIONAL (SECURITY & PERFORMANCE)
1.  **Keamanan API Key:** `VITE_GEMINI_API_KEY` tidak boleh diekspos di client-side pada tahap produksi. Semua pemanggilan API harus diprosikan melalui **Supabase Edge Functions**.
2.  **Latensi Respons:** Respons AI untuk *Voice POS* dan *Semantic Search* harus selesai dalam waktu kurang dari **1,5 detik** untuk menjamin kenyamanan operasional kasir.
3.  **Akurasi JSON:** Model AI harus dikonfigurasi dengan suhu rendah (`temperature: 0.1`) untuk menjamin konsistensi format JSON murni tanpa ada bumbu teks penjelas.
4.  **Offline Resiliency:** Sistem harus menyediakan opsi fallback ke pemrosesan lokal (seperti pencarian teks standar) jika koneksi internet terputus, untuk menjaga kasir tetap bisa bertransaksi.
