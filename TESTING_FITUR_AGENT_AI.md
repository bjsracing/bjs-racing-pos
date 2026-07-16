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

*Belum diimplementasikan — testing setelah Fitur 3 selesai*

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

### Catatan Testing
- **Browser:** Chrome/Edge (recommended untuk Web Speech API)
- **Mikrofon:** Pastikan mikrofon aktif dan izin diberikan
- **Koneksi internet:** Diperlukan untuk Gemini API
- **Stok:** Pastikan ada produk dengan stok > 0 dan stok = 0 untuk testing
- **WhatsApp:** Test "Buka WhatsApp" akan buka wa.me — pastikan WhatsApp Web aktif

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

### Log Error
Jika ada error, catat di sini:
```
Test #: 
Error: 
Screenshot: 
```
