# LAPORAN REVIEW REPOSITORY: BJS RACING POS
**Fokus:** Integrasi Fitur AI Agent Menggunakan Model AI Gratis atau Open-Source  
**Tanggal:** 16 Juli 2026  
**Peninjau:** Arena.ai Agent Mode  

---

## 1. Pendahuluan & Apresiasi Codebase
Setelah mengkloning dan menganalisis kode sumber di repository **[bjs-racing-pos](https://github.com/bjsracing/bjs-racing-pos)**, kami ingin memberikan apresiasi yang tinggi kepada tim pengembang. Aplikasi Point of Sale (POS) ini dibangun dengan arsitektur yang sangat rapi, modular, dan mengikuti standar modern industri.

### Keunggulan Utama Codebase Saat Ini:
*   **Arsitektur Teknologi yang Tepat:** Kombinasi **React + Vite** sebagai frontend SPA (Single Page Application) yang sangat ringan dan cepat, serta **Tailwind CSS** untuk antarmuka yang responsif dan estetik.
*   **Integrasi Supabase yang Optimal:** Penanganan query database langsung melalui `@supabase/supabase-js` dilakukan secara rapi. Penggunaan **Stored Procedures / RPC (Remote Procedure Call)** seperti `get_dashboard_metrics` dan `get_best_selling_products` di `src/pages/Dashboard.jsx` adalah *best practice* yang luar biasa karena menggeser beban kalkulasi berat ke sisi PostgreSQL, menghemat bandwidth, dan menjaga keamanan logika bisnis.
*   **Fitur POS Lengkap:** Adanya fitur transaksi tertunda (*held transactions*), manajemen kasir, pengeluaran, permintaan pelanggan, cetak dokumen PDF, hingga export/import Excel menunjukkan aplikasi ini siap pakai untuk operasional nyata.
*   **Fondasi Voice Search Sudah Ada:** Di `src/hooks/useVoiceSearch.js`, Anda telah mengimplementasikan Web Speech API (`window.SpeechRecognition`) untuk mencari produk di halaman `Produk.jsx`. Ini merupakan modal awal yang luar biasa untuk melangkah ke level berikutnya: **AI POS Agent**.

---

## 2. Peluang & Konsep Integrasi AI Agent di POS
Mengubah pencarian suara biasa (yang hanya mencocokkan kata kunci teks secara kaku) menjadi sebuah **AI Agent** berarti memberikan kemampuan bagi sistem untuk:
1.  **Memahami maksud (intent) kasir** yang diucapkan dengan bahasa sehari-hari/slang (*Natural Language Processing*).
2.  **Mengekstrak entitas** seperti nama produk, jumlah barang, merek, atau instruksi transaksi.
3.  **Melakukan aksi otomatis (Action-driven AI)**, seperti menambah barang ke keranjang, merubah kuantitas, merekomendasikan produk alternatif, atau memberikan ringkasan analisis keuangan toko secara lisan/tulisan.

### 3 Skenario AI Agent Terbaik untuk BJS Racing POS:

### A. AI Voice-to-Command / Voice Ordering (Halaman POS)
Kasir seringkali sibuk melayani pembeli dan tidak sempat mengetik atau mencari produk satu per satu.
*   **Cara Kerja:** Kasir menekan tombol mic di halaman POS, lalu berkata: *"Masukkan oli shell mpx2 dua botol sama kampas rem depan vario satu set"*.
*   **Peran AI Agent:** Menganalisis teks ucapan tersebut, mengekstrak daftar barang dan jumlah, lalu otomatis memasukkannya ke state `cart` di `Pos.jsx`.

### B. AI Business Analyst & Advisor (Halaman Dashboard)
Pemilik bengkel/toko seringkali kesulitan membaca grafik yang rumit dan ingin jawaban instan mengenai kondisi tokonya.
*   **Cara Kerja:** Pemilik mengetik di chatbox dashboard: *"Produk apa saja yang paling menguntungkan bulan ini dan mana yang stoknya harus segera dibeli?"*.
*   **Peran AI Agent:** Membaca statistik penjualan saat ini (menggunakan data RPC/Supabase) dan memberikan ringkasan analisis bisnis secara cerdas lengkap dengan sarannya.

### C. AI Customer Request Matcher & Alternative Suggester (Halaman Permintaan Pelanggan)
Saat pelanggan menanyakan sparepart yang sedang kosong, kasir bisa mencatatnya di `permintaan_pelanggan`.
*   **Cara Kerja:** Kasir mencatatkan *"Kampas rem vario 150 murah"*.
*   **Peran AI Agent:** Menganalisis database produk aktif (`products`), lalu menyarankan alternatif produk yang serupa atau kompatibel (misalnya *"Kita punya kampas rem merek Bendix atau AHM yang cocok untuk Vario 150 dengan harga mulai Rp 35.000"*).

---

## 3. Pilihan Model AI Gratis & Open-Source
Untuk menerapkan AI Agent tanpa mengeluarkan biaya bulanan yang besar (atau bahkan gratis total), berikut adalah 3 opsi arsitektur terbaik yang sangat relevan untuk BJS Racing POS:

### Opsi 1: Google Gemini Flash Latest (Rekomendasi Utama Cloud API - GRATIS)
Google menyediakan **Google AI Studio** dengan kuota gratis (*Free Tier*) yang sangat melimpah untuk model **Gemini Flash Latest** (`gemini-flash-latest`).
*   **Kelebihan:** 
    *   **Gratis total** hingga 15 Request per Menit (RPM), 1.500 Request per Hari (RPD), dan 1 juta Token per menit. Sangat cukup untuk operasional POS satu toko bengkel.
    *   Menggunakan alias model dinamis terbaru dari Google yang otomatis terupdate tanpa mematahkan kompatibilitas kode di masa depan.
    *   Sangat cerdas dalam memahami bahasa Indonesia informal dan istilah otomotif/bengkel.
    *   Mendukung **Structured JSON Output** (memaksa model mengeluarkan format JSON yang konsisten, sehingga sangat mudah di-parse di React).
*   **Cara Implementasi:** Hubungkan langsung via REST API atau SDK `@google/generative-ai`.

### Opsi 2: Ollama (Rekomendasi Utama Lokal & Offline-First - GRATIS & Open-Source)
Jika POS Anda dijalankan secara lokal di PC kasir dan membutuhkan keandalan tinggi tanpa bergantung pada koneksi internet yang sering tidak stabil di bengkel.
*   **Kelebihan:**
    *   **100% Gratis & Open-Source**, tanpa limitasi kuota API.
    *   **Offline-First & Data Privasi Terjaga:** Semua data transaksi dan produk diproses secara lokal di komputer toko, tidak dikirim ke internet.
    *   Model rekomendasi: **Qwen 2.5 (3B atau 7B Instruct)** atau **Llama 3 (8B Instruct)**. Qwen 2.5 sangat direkomendasikan karena memiliki performa pemahaman bahasa Indonesia yang luar biasa untuk ukurannya yang kecil.
*   **Cara Implementasi:** Instal Ollama di PC kasir, lalu jalankan model (`ollama run qwen2.5:3b`). React dapat menembak langsung ke `http://localhost:11434/api/generate` (Ollama menyediakan CORS default atau bisa dikonfigurasi).

### Opsi 3: Groq Cloud API (Super Cepat - GRATIS Free Tier)
Groq adalah penyedia cloud inference dengan kecepatan luar biasa menggunakan teknologi LPU.
*   **Kelebihan:**
    *   Inference super cepat (kurang dari 200 milidetik per response), memberikan pengalaman instan saat kasir berbicara.
    *   Menawarkan model open-source terbaik seperti **Llama 3.1 8B** secara gratis pada tier ujicobanya.
*   **Kelebihan/Kekurangan:** Latensi sangat rendah, namun kuota gratis sewaktu-waktu bisa dibatasi atau berubah jika masa promosi selesai.

---

## 4. Arsitektur Teknis Integrasi AI di React (Client-Side)
Untuk mengintegrasikan AI Agent ke dalam `src/pages/Pos.jsx` secara efisien dan aman tanpa membebani performa aplikasi, kita menggunakan metode **"Query & Action Parser" (Natural Language-to-POS-Action)**.

### Alur Kerja (Workflow):
1.  **Input Suara/Teks:** Kasir mengklik tombol mic di samping input pencarian barang. Web Speech API (menggunakan hook seperti `useVoiceSearch.js`) mendengarkan dan mengubah suara menjadi teks bahasa Indonesia.
2.  **Kirim ke AI Parser:** Teks hasil transkrip dikirim ke model AI (Gemini atau Ollama) bersama dengan **System Prompt** khusus.
3.  **Parsing Output JSON:** AI Agent mengembalikan respon terstruktur berupa daftar aksi JSON. Contoh:
    ```json
    [
      { "action": "ADD_TO_CART", "search_query": "oli shell mpx2", "quantity": 2 },
      { "action": "ADD_TO_CART", "search_query": "kampas rem vario", "quantity": 1 }
    ]
    ```
4.  **Eksekusi Aksi di React:** Kode React Anda membaca instruksi tersebut:
    *   Untuk setiap item `ADD_TO_CART`, aplikasi mencari produk yang paling cocok dari tabel `products` di Supabase secara otomatis (menggunakan fuzzy text search atau query SQL sederhana).
    *   Jika produk ditemukan, panggil `handleAddToCart(product)`. Jika ada duplikasi, panggil `handleCartChange(id, "quantity", item.quantity + X)`.
    *   Jika produk ambigu (misal ada 3 jenis kampas rem vario), AI Agent akan memicu modal pencarian/pilihan untuk memudahkan kasir memilih varian yang tepat.

---

## 5. Berkas Implementasi Contoh (Kami Sediakan!)
Di dalam direktori review ini, kami telah membuatkan 2 file kode siap pakai yang dirancang khusus menyesuaikan struktur kode Anda saat ini (`Pos.jsx` dan `supabaseClient.js`):

1.  **`useAIPosAgent.js`** (di `/home/user/bjs-racing-pos-review/useAIPosAgent.js`): 
    Sebuah React Hook kustom yang menangani komunikasi dengan API AI (dilengkapi opsi beralih antara Google Gemini API gratis atau Ollama lokal) dan menerjemahkan kalimat lisan kasir menjadi sekumpulan aksi terstruktur.
2.  **`AIAssistantModal.jsx`** (di `/home/user/bjs-racing-pos-review/AIAssistantModal.jsx`): 
    Komponen modal asisten AI interaktif dengan UI modern (menggunakan Tailwind CSS & React Icons) yang dapat diintegrasikan langsung ke halaman `Pos.jsx` Anda agar kasir bisa memberikan perintah suara maupun mengetik obrolan secara alami.

---

## 6. Tips Keamanan & Pengelolaan API Key
*   **Jangan Simpan API Key di Client-side untuk Produksi:** Menyimpan `GEMINI_API_KEY` langsung di file `.env` frontend (Vite) sangat berbahaya jika aplikasi dideploy secara publik (misal di Vercel/Netlify), karena API Key tersebut dapat diintip dari tab Network di browser oleh pengguna lain.
*   **Gunakan Supabase Edge Functions (Solusi Terbaik & Gratis):** 
    Supabase menyediakan fitur **Edge Functions** (serverless gratis). Anda bisa membuat fungsi serverless sederhana di Supabase (ditulis dengan Deno/TypeScript) yang bertindak sebagai proksi aman. Kode React hanya perlu memanggil:
    ```javascript
    const { data, error } = await supabase.functions.invoke('ai-pos-agent', {
      body: { prompt: textTranscript }
    });
    ```
    Lalu Supabase Edge Function tersebutlah yang menyimpan `GEMINI_API_KEY` di level server yang aman dan menembak API Google Gemini secara rahasia.
*   **Gunakan Port Lokal untuk Ollama:** Jika Anda memilih **Ollama**, jalankan Ollama secara lokal di jaringan bengkel Anda. Anda tidak memerlukan API Key sama sekali! Anda hanya perlu menembak endpoint port lokal IP kasir (misal `http://localhost:11434/api/generate`) yang aman karena hanya bisa diakses dalam jaringan Wi-Fi lokal bengkel tersebut.

---

### Kesimpulan
Menambahkan fitur AI Agent ke dalam **BJS Racing POS** bukan hanya mungkin, tetapi sangat mudah dan murah berkat arsitektur modular yang sudah Anda bangun dan melimpahnya model open-source/gratis saat ini. Kami sangat menyarankan untuk mencoba implementasi menggunakan **Google Gemini Flash Latest** (`gemini-flash-latest`) untuk fase uji coba online, dan beralih ke **Ollama (Qwen 2.5 3B/7B)** jika mengincar operasional offline di dalam bengkel fisik.

Silakan periksa berkas contoh kode `useAIPosAgent.js` dan `AIAssistantModal.jsx` yang telah kami buat untuk memulai integrasi ini!
