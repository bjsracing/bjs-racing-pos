# PANDUAN INTEGRASI AI AGENT KE HALAMAN POS
Dokumen ini menjelaskan langkah-langkah praktis untuk mengintegrasikan **AI POS Copilot (AIAssistantModal)** ke dalam halaman kasir utama Anda (`src/pages/Pos.jsx`).

---

## Langkah 1: Pindahkan Berkas Kode AI ke Proyek Anda
Pastikan Anda menyalin kedua berkas bantuan yang telah kami buat ke struktur folder proyek Anda:
1.  Salin `useAIPosAgent.js` ke folder kustom hooks Anda:
    `src/hooks/useAIPosAgent.js`
2.  Salin `AIAssistantModal.jsx` ke folder komponen Anda:
    `src/components/AIAssistantModal.jsx`

---

## Langkah 2: Tambahkan Environment Variable untuk API Key
Jika Anda memilih menggunakan **Google Gemini** (Opsi Cloud Gratis), tambahkan API key Anda ke file konfigurasi lingkungan Anda:
### Pada berkas `.env` (di root proyek):
```env
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx_contoh_key
```
*(Ingat: Jangan publish berkas `.env` ini ke GitHub publik! Masukkan berkas `.env` ke `.gitignore` Anda).*

Jika menggunakan **Ollama (Lokal)**, pastikan aplikasi Ollama berjalan di latar belakang PC kasir dengan model Qwen 2.5 (`ollama run qwen2.5:3b`). Anda tidak memerlukan API Key!

---

## Langkah 3: Impor dan Pasang Modal AI di `src/pages/Pos.jsx`
Buka berkas `src/pages/Pos.jsx` Anda dan ikuti langkah-langkah pengeditan berikut:

### 1. Tambahkan Impor Komponen di Bagian Atas
Cari bagian impor komponen dan tambahkan impor untuk `AIAssistantModal`:
```javascript
// ... Impor komponen Anda yang lain ...
import HeldTransactionsModal from "../components/HeldTransactionsModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";
import CustomerRequestModal from "../components/CustomerRequestModal.jsx";

// TAMBAHKAN IMPOR INI:
import AIAssistantModal from "../components/AIAssistantModal.jsx";
```

### 2. Definisikan State Baru untuk Membuka/Menutup Modal AI
Cari bagian definisi state di dalam fungsi komponen `Pos()` (sekitar baris 276 dekat `isRequestModalOpen`) dan tambahkan state `isAiModalOpen`:
```javascript
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // TAMBAHKAN STATE INI:
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
```

### 3. Buat Fungsi Wrapper Penanganan Tambah Barang AI (AI Add To Cart Wrapper)
Karena fungsi `handleAddToCart` bawaan Anda saat ini menerima objek produk dan secara default memberikan quantity = 1, buatlah fungsi wrapper sederhana ini di dalam `Pos.jsx` agar AI bisa menambah barang dengan kuantitas dinamis:
```javascript
  // TAMBAHKAN WRAPPER INI (di bawah fungsi handleAddToCart Anda):
  const handleAddProductFromAI = (product, qty) => {
    // 1. Tambahkan produk ke keranjang menggunakan fungsi bawaan Anda
    handleAddToCart(product);
    
    // 2. Jika kuantitas yang diminta AI lebih dari 1, update kuantitasnya
    if (qty > 1) {
      setTimeout(() => {
        handleCartChange(product.id, "quantity", qty);
      }, 50); // delay kecil memastikan item sudah masuk state cart terlebih dahulu
    }
  };
```

### 4. Render Komponen Modal AI di Bagian JSX
Gulir ke bawah hingga bagian rendering modal (di dalam `return (...)` baris sekitar 600) dan letakkan komponen `<AIAssistantModal>` di sana:
```javascript
      {/* Modal Permintaan Pelanggan */}
      <CustomerRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* TAMBAHKAN MODAL AI ASSISTANT DI SINI: */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        cart={cart}
        onAddProductToCart={handleAddProductFromAI}
        onUpdateCartQuantity={(id, qty) => handleCartChange(id, "quantity", qty)}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCart([])}
      />
```

### 5. Tambahkan Tombol untuk Membuka AI Assistant di Header POS
Temukan bagian header atau tombol navigasi di dalam JSX Anda (misalnya dekat tombol "Permintaan Pelanggan" / "Cari Nota") dan tambahkan tombol interaktif berikon robot/mikrofon untuk membuka asisten AI:
```javascript
            {/* Contoh meletakkan tombol AI di sebelah tombol Catat Permintaan */}
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm shadow-md transition-all hover:scale-105 duration-200"
            >
              Catat Permintaan
            </button>

            {/* TAMBAHKAN TOMBOL AI DI SINI: */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm shadow-md transition-all hover:scale-105 duration-200"
            >
              🤖 AI Copilot Kasir
            </button>
```

---

## Langkah 4: Uji Coba Integrasi!
1.  Jalankan server development lokal Anda: `npm run dev`
2.  Buka halaman POS Anda, klik tombol **🤖 AI Copilot Kasir**.
3.  Uji dengan perintah mengetik atau tekan tombol mic dan katakan:
    *   *"tolong masukin oli mpx 2 botol"*
    *   *"tambah oli shell helix 3"*
    *   *"hapus oli mpx"*
    *   *"kosongkan keranjang"*
4.  Perhatikan bagaimana sistem secara cerdas mengenali maksud ucapan Anda, mencari produk yang paling cocok dari database Supabase Anda, dan mengupdate keranjang belanja kasir secara real-time!

---
Jika Anda menemui kendala seputar konfigurasi CORS untuk Ollama lokal atau integrasi API, silakan hubungi tim kami kembali. Selamat mencoba fitur revolusioner AI POS Anda!
