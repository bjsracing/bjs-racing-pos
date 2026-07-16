# TESTING FITUR AGENT AI — BJS RACING POS
**Tanggal:** 16 Juli 2026  
**Status:** Fitur 1 & 2 terimplementasi — menunggu Fitur 3-9

---

## Prasyarat
- [ ] Dev server berjalan (`npm run dev`)
- [ ] Buka `http://localhost:3000/pos`
- [ ] Pastikan tombol **"AI Copilot"** (gradient orange→merah) terlihat di header

---

## FITUR 1: AI Voice POS (Voice-to-Cart)

### 1.1 Input Teks Biasa
| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Tambah 1 barang | ketik: `tambah oli shell` | Produk "OLI SHELL" muncul di cart qty 1 |
| 2 | Tambah beberapa barang | ketik: `tambah oli mpx2 2 botol` | Produk muncul di cart qty 2 |
| 3 | Tambah multiple items | ketik: `masukin oli shell 2 sama kampas rem 1` | 2 produk muncul di cart |
| 4 | Hapus barang | ketik: `hapus oli shell` | Produk terhapus dari cart |
| 5 | Kosongkan cart | ketik: `kosongkan keranjang` | Cart kosong |
| 6 | Ubah quantity | ketik: `ubah jumlah mpx2 jadi 5` | Quantity berubah jadi 5 |
| 7 | Produk tidak ditemukan | ketik: `tambah ban mobil` | Error message: "Produk tidak ditemukan" |
| 8 | Produk ambigu | ketik: `tambah kampas rem` | Tampil 3+ opsi produk untuk dipilih |

### 1.2 Input Suara (Voice)
| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 9 | Klik mic → bicara | ucapkan: "tambah oli shell 2" | Interim text muncul, final text trigger search |
| 10 | Mic unsupported | browser tidak support mic | Tombol mic tidak tampil |
| 11 | Izin mic ditolak | block mic access | Alert: "Izinkan akses mikrofon" |

### 1.3 Stock Validation
| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 12 | Stok cukup | qty < stok | Item berhasil ditambah |
| 13 | Stok tidak cukup | qty > stok | Alert: "Stok tidak cukup! Tersedia: X" |
| 14 | Item sudah di cart, qty tambah | qty existing + qty baru > stok | Alert stok tidak cukup |

### 1.4 Ambiguous Handling
| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 15 | 1 produk match | spesifik nama | Langsung ditambah ke cart |
| 16 | 3+ produk match | nama umum | Tampil 3 opsi dengan harga, user pilih salah satu |

---

## FITUR 2: AI Auto-Draft WhatsApp Reply

### Prasyarat Fitur 2
- [ ] Buka `http://localhost:3000/pos`
- [ ] Klik tombol "Catat Permintaan"
- [ ] Pastikan input "Nomor WhatsApp Pelanggan" muncul di form

### 2.1 Catat Permintaan dengan Nomor WA
| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1 | Catat permintaan + nomor WA | Nama: "Kampas Rem Vario", Kategori: "Kampas Rem", WA: "08123456789" | Permintaan tersimpan di DB, `nomor_whatsapp` = `08123456789` | ✅ |
| 2 | Catat permintaan tanpa WA | Nama: "Oli Federal", Kategori: "Oli", WA: kosong | Permintaan tersimpan, `nomor_whatsapp` = NULL | ✅ |
| 3 | Validasi field wajib | Nama kosong | Alert: "Nama produk tidak boleh kosong" | ✅ |

### 2.2 Hubungi via WhatsApp
| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4 | Klik tombol "Hubungi via WA" | Request dengan nomor WA ada | `WhatsAppDraftModal` terbuka, AI mulai generate draft | ✅ |
| 5 | AI generate draft | Kategori valid, ada alternatif | Draft pesan muncul: sapaan + produk + harga + alternatif + penutup | ✅ |
| 6 | AI generate tanpa alternatif | Kategori tidak ada di DB | Draft muncul dengan "Tidak ada alternatif saat ini" | ✅ |
| 7 | Loading state | Saat AI generate | Spinner "AI sedang menyusun pesan..." muncul | ✅ |

### 2.3 Edit & Kirim Pesan
| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8 | Edit draft pesan | Ubah text di textarea | Pesan ter-update | ✅ |
| 9 | Copy pesan | Klik "Copy Pesan" | Pesan ter-copy ke clipboard, tombol jadi "Tersalin!" | ✅ |
| 10 | Buka WhatsApp | Klik "Buka WhatsApp" | Browser buka `wa.me/{nomor}?text={draft}` di tab baru | ✅ |

### 2.4 Format Nomor WhatsApp
| # | Test Case | Input | Expected Output | Status |
|---|-----------|-------|-----------------|--------|
| 11 | Format 08xxx | `08123456789` | `wa.me/628123456789` | ✅ |
| 12 | Format 62xxx | `628123456789` | `wa.me/628123456789` | ✅ |
| 13 | Format +62xxx | `+628123456789` | `wa.me/628123456789` | ✅ |
| 14 | Format dengan strip | `0881-0116-69213` | `wa.me/62881011669213` | ✅ |
| 15 | Nomor kosong | (kosong) | Alert: "Masukkan nomor WhatsApp" | ✅ |

### 2.5 Search Alternatif
| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 16 | Alternatif ditemukan | kategori: "Kampas Rem" | Array produk dengan harga urut | ✅ |
| 17 | Kategori tidak ada | kategori: "XCategoryNotFound" | Array kosong `[]` | ✅ |
| 18 | Exclude produk dicari | exclude: "Kampas Rem Vario 150" | Produk yang nama-nya mengandung "Kampas Rem Vario 150" tidak diikutsertakan | ✅ |

### 2.6 Error Handling
| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 19 | Gemini API error | API key kosong | Error: "API Key Gemini belum dikonfigurasi" | ✅ |
| 20 | Gemini API rate limit | Quota habis | Error: pesan error dari Gemini | ✅ |
| 21 | DB error | Koneksi putus | Error ditangkap, tidak crash | ✅ |

---

## FITUR 3: AI OCR Nota Pembelian

### Prasyarat Fitur 3
- [ ] Dev server berjalan (`npm run dev`)
- [ ] Buka `http://localhost:3000/pembelian`
- [ ] Pastikan `VITE_GEMINI_API_KEY` terkonfigurasi di `.env`
- [ ] Pastikan ada minimal 1 supplier di database
- [ ] Pastikan ada minimal 10 produk aktif di database
- [ ] Siapkan 2-3 foto nota supplier (bisa foto asli atau contoh)

### 3.1 Akses & Visibility Tombol
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 1 | Tombol muncul di Create Mode | Buka `/pembelian` (PO baru) | Tombol "📷 Import Nota" terlihat di samping "Tambah Produk" | |
| 2 | Tombol muncul di Edit Mode | Buka `/pembelian/:poId` (PO edit) | Tombol "📷 Import Nota" terlihat | |
| 3 | Validasi supplier kosong | Di Create Mode, tanpa pilih supplier, klik "Import Nota" | Alert: "Pilih supplier terlebih dahulu sebelum import nota." | |
| 4 | Validasi supplier terpilih | Pilih supplier dulu, baru klik "Import Nota" | Modal NotaOcr terbuka | |

### 3.2 Upload & Preview Gambar
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 5 | Pilih Gambar | Klik "Pilih Gambar" → pilih file JPG/PNG | File picker terbuka, gambar terpilih, preview muncul | |
| 6 | Kamera | Klik "Kamera" (di HP) | Kamera terbuka, foto terambil, preview muncul | |
| 7 | Info file | Gambar terpilih | Nama file dan ukuran (KB) ditampilkan | |
| 8 | Ganti Gambar | Klik "Ganti Gambar" | Preview hilang, area upload muncul lagi, state reset | |
| 9 | Format salah | Pilih file PDF atau non-gambar | Tidak diproses (input accept="image/*") | |

### 3.3 Proses OCR & Loading
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 10 | Loading state | Upload gambar nota | Spinner "Mengkompresi gambar..." → "Membaca nota & mencocokkan produk..." | |
| 11 | Waktu proses | Upload gambar nota valid | Proses selesai dalam 1-5 detik | |
| 12 | API key kosong | Set `VITE_GEMINI_API_KEY` kosong di `.env`, restart dev | Error: "API Key Gemini belum dikonfigurasi." | |
| 13 | Gambar buram | Upload gambar sangat buram/tidak terbaca | AI tetap mencoba ekstrak (hasil mungkin tidak akurat) | |
| 14 | Gambar kosong/putih | Upload gambar kosong | Error atau 0 item hasil OCR | |

### 3.4 Hasil OCR & Confidence Badge
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 15 | High confidence (≥80%) | Upload nota dengan produk yang jelas | Badge hijau ✓ {confidence}% + border hijau | |
| 16 | Medium confidence (60-79%) | Upload nota dengan nama samar | Badge kuning ⚠ {confidence}% + border kuning | |
| 17 | Low confidence (<60%) | Upload nota dengan nama sangat berbeda | Badge merah ✗ {confidence}% + border merah + "Belum dicocokkan" | |
| 18 | Ringkasan count | Hasil OCR ada 3 high, 2 medium, 1 low | Teks: "✓ 3 cocok, ⚠ 2 ragu, ✗ 1 belum cocok" | |
| 19 | Ringkasan PO → Final | PO ada 5 item, OCR 8 item | "Ringkasan: PO 5 item → Final 8 item (+3 baru)" | |

### 3.5 CRUD Items di Modal
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 20 | Edit Qty | Ubah qty dari 3 jadi 5 | Qty ter-update di item | |
| 21 | Edit Harga | Ubah harga dari 175000 jadi 180000 | Harga ter-update | |
| 22 | Qty minimum | Set qty = 0 atau kosong | Qty otomatis jadi 1 | |
| 23 | Harga minimum | Set harga = negatif | Harga otomatis jadi 0 | |
| 24 | Hapus item | Klik tombol 🗑 pada item | Item terhapus dari list, count berubah | |
| 25 | Tambah item manual | Klik "Tambah Item Manual" → ketik nama → klik "Tambah" | Item baru muncul di list (confidence 0, product_id null) | |
| 26 | Tambah manual + Enter | Ketik nama → tekan Enter | Item terTambah (sama seperti klik tombol) | |
| 27 | Batal tambah manual | Klik "Tambah Item Manual" → klik "Batal" | Form input manual hilang | |
| 28 | Nama manual kosong | Klik "Tambah" tanpa isi nama | Tidak ada item ditambahkan | |

### 3.6 Override Product (Ganti Produk)
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 29 | Buka product picker | Klik tombol "Ganti" pada item | Search box muncul | |
| 30 | Cari produk | Ketik nama/kode/merek (min 2 karakter) | Hasil pencarian muncul (max 8 item) | |
| 31 | Pilih produk | Klik salah satu hasil pencarian | `product_nama` berubah, confidence jadi 100%, picker tertutup | |
| 32 | Produk tidak ditemukan | Ketik "xyz123" (tidak ada di DB) | Teks "Produk tidak ditemukan" | |
| 33 | Pencarian ≤ 1 karakter | Ketik "a" | Hasil pencarian kosong (belum search) | |
| 34 | Produk tidak aktif | Cari produk yang statusnya "Diarsipkan" | Tidak muncul di hasil pencarian | |

### 3.7 Validasi Konfirmasi
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 35 | Semua matched | Semua item confidence ≥ 60 + product_id ada | Tombol "Terapkan" aktif, klik → onConfirm(items) dipanggil | |
| 36 | Ada unmatched | Ada item confidence < 60 + product_id null | Alert: "X item belum dicocokkan dengan produk database. Silakan pilih produk terlebih dahulu." | |
| 37 | Items kosong | Tidak ada hasil OCR | Tombol "Terapkan" disabled | |
| 38 | Processing | Saat AI sedang proses | Tombol "Terapkan" disabled | |
| 39 | Batal | Klik "Batal" atau tombol X | Modal tertutup, state reset | |

### 3.8 Integrasi dengan FormPembelian (Create Mode)
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 40 | Import ke PO baru | Create PO baru → pilih supplier → Import Nota → konfirmasi | Items masuk ke `orderItems`, bisa edit qty/satuan | |
| 41 | Alert berhasil | Konfirmasi OCR | Alert: "Berhasil! X item baru ditambahkan." | |
| 42 | Edit setelah import | Import Nota → ubah qty 1 item → Simpan Pesanan | PO tersimpan dengan qty yang diubah | |
| 43 | Simpan PO + OCR items | Import Nota → klik "Simpan Pesanan" | PO baru terbuat dengan items dari OCR | |

### 3.9 Integrasi dengan FormPembelian (Edit Mode / Reconcile)
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 44 | Reconcile: qty update | PO ada "Oli Shell" qty 3, Nota OCR qty 5 | Qty berubah jadi 5, catatan: "Harga nota: Rp..." | |
| 45 | Reconcile: item baru | PO tidak ada "Filter RX King", Nota OCR ada | Item baru ditambahkan ke PO | |
| 46 | Reconcile: item PO bertahan | PO ada "Pilok Diton", Nota tidak ada | Item "Pilok Diton" tetap ada di PO (tidak dihapus) | |
| 47 | Alert reconcile | Konfirmasi OCR dengan 2 update + 1 baru | Alert: "Berhasil! 2 item diupdate, 1 item baru ditambahkan." | |
| 48 | Simpan setelah reconcile | Import Nota → klik "Simpan Pesanan" | PO terupdate dengan data final dari nota | |

### 3.10 Edge Cases
| # | Test Case | Langkah | Expected Result | Status |
|---|-----------|---------|-----------------|--------|
| 49 | Nota 1 item | Upload nota hanya 1 barang | 1 item ditampilkan, bisa diatur qty/harga | |
| 50 | Nota 20+ item | Upload nota dengan banyak barang | Semua item ditampilkan, scrollable, tidak lag | |
| 51 | Duplikat item OCR | Nota punya 2 baris "Oli Shell" (duplikat) | 2 item terpisah di list (user bisa hapus 1) | |
| 52 | Harga nota = 0 | Nota tidak tertulis harga | `harga_beli` = 0, tidak ada catatan harga | |
| 53 | Buka/tutup modal berulang | Buka → tutup → buka lagi | State bersih, tidak ada data sisa dari sesi sebelumnya | |
| 54 | Network error | Matikan internet → upload nota | Error ditangkap, pesan error ditampilkan | |

---

## FITUR 4: AI Semantic Search

*Belum diimplementasikan — testing setelah Fitur 4 selesai*

---

## FITUR 5: AI Business Advisor Chatbot

*Belum diimplementasikan — testing setelah Fitur 5 selesai*

---

## FITUR 6: AI Predictive CRM

*Belum diimplementasikan — testing setelah Fitur 6 selesai*

---

## FITUR 7: AI Demand Forecasting

*Belum diimplementasikan — testing setelah Fitur 7 selesai*

---

## FITUR 8: AI Loss Prevention

*Belum diimplementasikan — testing setelah Fitur 8 selesai*

---

## FITUR 9: AI Dynamic Pricing

*Belum diimplementasikan — testing setelah Fitur 9 selesai*

---

## Checklist Keseluruhan

### Fitur 1: AI Voice POS
- [ ] Test 1-8: Input teks
- [ ] Test 9-11: Input suara
- [ ] Test 12-14: Stock validation
- [ ] Test 15-16: Ambiguous handling

### Fitur 2: AI Auto-Draft WhatsApp Reply
- [x] Test 1-3: Catat permintaan dengan/without nomor WA
- [x] Test 4-7: Hubungi via WA — modal, AI draft, loading state
- [x] Test 8-10: Edit, copy, buka WhatsApp
- [x] Test 11-15: Format nomor WhatsApp
- [x] Test 16-18: Search alternatif
- [x] Test 19-21: Error handling

### Fitur 3: AI OCR Nota Pembelian
- [ ] Test 1-4: Akses & Visibility tombol
- [ ] Test 5-9: Upload & Preview gambar
- [ ] Test 10-14: Proses OCR & Loading
- [ ] Test 15-19: Hasil OCR & Confidence Badge
- [ ] Test 20-28: CRUD Items di Modal
- [ ] Test 29-34: Override Product (Ganti Produk)
- [ ] Test 35-39: Validasi Konfirmasi
- [ ] Test 40-43: Integrasi Create Mode
- [ ] Test 44-48: Integrasi Edit Mode (Reconcile)
- [ ] Test 49-54: Edge Cases

### Catatan Testing
- **Browser:** Chrome/Edge (recommended untuk Web Speech API)
- **Mikrofon:** Pastikan mikrofon aktif dan izin diberikan
- **Koneksi internet:** Diperlukan untuk Gemini API
- **Stok:** Pastikan ada produk dengan stok > 0 dan stok = 0 untuk testing
- **WhatsApp:** Test "Buka WhatsApp" akan buka wa.me — pastikan WhatsApp Web aktif
- **Nota:** Siapkan foto nota supplier asli atau contoh untuk testing OCR
- **Supplier:** Pastikan ada minimal 1 supplier di database

### Cara Testing Fitur 1
1. Buka `http://localhost:3000/pos`
2. Klik tombol **"AI Copilot"**
3. Ketik perintah atau klik 🎤 lalu bicara
4. Amati hasil di cart dan chat log
5. Centang test case yang berhasil, tandai yang gagal

### Cara Testing Fitur 2
1. Buka `http://localhost:3000/pos` → Klik "Catat Permintaan"
2. Isi: Nama Produk, Kategori, **Nomor WhatsApp** (opsional)
3. Buka `http://localhost:3000/permintaan-pelanggan`
4. Klik tombol **"Hubungi via WA"** di request card
5. AI generate draft → Edit jika perlu
6. Klik "Copy Pesan" atau "Buka WhatsApp"

### Cara Testing Fitur 3
**Create Mode:**
1. Buka `http://localhost:3000/pembelian` → Klik "Buat Pesanan Baru"
2. Pilih supplier
3. Klik "📷 Import Nota"
4. Upload foto nota supplier → tunggu proses OCR
5. Review hasil: edit qty/harga, ganti produk, hapus item
6. Klik "Terapkan ke Pesanan"
7. Items muncul di form → klik "Simpan Pesanan"

**Edit Mode (Reconcile):**
1. Buka PO yang sudah ada (klik edit di `/pembelian`)
2. Klik "📷 Import Nota"
3. Upload foto nota aktual dari supplier
4. Review reconciliasi: qty update, item baru, item PO tanpa nota
5. Konfirmasi → klik "Simpan Perubahan"

### Log Error
Jika ada error, catat di sini:
```
Test #: 
Error: 
Screenshot: 
```
