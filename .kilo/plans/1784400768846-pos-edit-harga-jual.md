# Plan: Edit Harga Jual Manual di Keranjang POS (Naik Maks +Rp10.000, Tanpa Ubah DB)

## Tujuan
Di halaman POS, pemilik ingin mengedit **harga jual per item** langsung di keranjang untuk menyesuaikan margin (mis. naikkan keuntungan), tanpa mengubah harga jual di tabel `products`. Edit hanya berlaku untuk transaksi berjalan; disimpan sebagai bagian `items` transaksi (audit aman) dan tidak menulis kembali ke DB produk.

## Keputusan Desain (sudah dikonfirmasi user)
- **Mekanisme:** Field input harga jual baru **berdampingan** dengan fitur diskon per item yang sudah ada.
- **Batasan:** Harga jual hanya boleh **NAIK** dari harga default produk, maksimal **+Rp10.000**.
  - Turun di bawah harga default → **ditolak** (revert ke harga default).
  - Naik > +Rp10.000 → **ditolak** (revert ke harga default + Rp10.000 = nilai maks).
- **Tidak ubah DB:** field `harga_jual` diubah hanya di state `cart` (item keranjang). `items: cart` tetap disimpan ke `transactions` (sudah terjadi), sehingga histori transaksi mencatat harga final. Tidak ada `supabase.from("products").update(...)` untuk harga.

## Konteks Kode (terverifikasi dari Pos.jsx)
- Item keranjang dibentuk di `addToCart`/`handleAddProductFromAI` (~baris 462-499): `{ ...product, quantity:1, discountType:"Tidak Ada", discountValue:"" }`. `product` sudah membawa `harga_jual` & `harga_beli`.
- `handleCartChange(productId, field, value)` (~baris 502) memproses `quantity`, `discountType`, `discountValue`. Perlu menangani field baru `harga_jual`.
- Render tiap item (~baris 108-197): menampilkan `item.harga_jual`, input quantity, subtotal `item.harga_jual * item.quantity`, dan baris diskon (~baris 198+).
- Subtotal transaksi dihitung ulang di `useEffect` memakai `i.harga_jual * i.quantity` lalu diskon (baris 548-558).
- `processCheckout` (~baris 577-598): `profit = Σ(harga_jual - harga_beli) * qty - diskon`, `items: cart`. Jadi edit harga jual otomatis memperbarui laba. ✅
- Diskon per item sudah ada (Nominal/Persen) — tetap berfungsi di atas harga jual baru.

## Task List (urutan implementasi)

### 1. Simpan harga default saat add-to-cart
- Di `addToCart` dan `handleAddProductFromAI`, tambahkan field `harga_jual_default: product.harga_jual` ke objek item. Ini dipakai sebagai acuan batas +Rp10.000 (agar batas dihitung dari harga asli produk, bukan dari harga yang sudah diedit sebelumnya).
- File: `src/pages/Pos.jsx` (dua tempat pembentukan item keranjang).

### 2. Handle field `harga_jual` di `handleCartChange`
- Tambahkan cabang `if (field === "harga_jual")`:
  - Parse `value` menjadi angka `num` (bersihkan non-digit, default 0).
  - Acuan: `const base = item.harga_jual_default ?? item.harga_jual;`
  - Batas bawah: `num < base` → tolak, set `uItem.harga_jual = base`.
  - Batas atas: `num > base + 10000` → tolak, set `uItem.harga_jual = base + 10000`.
  - Jika valid: `uItem.harga_jual = num`.
  - (Opsional UX) tampilkan `alert` atau set pesan sementara bila input ditolak — lihat task 4.
- Jangan ubah logika `quantity`/`discount*` yang sudah ada.

### 3. UI: input harga jual di render item keranjang
- Di blok render item (~baris 131-147 area info harga, atau di baris aksi ~148-197), tambahkan input angka `harga_jual`:
  - `type="number"`, `value={item.harga_jual}`, `min={item.harga_jual_default}`, `max={item.harga_jual_default + 10000}`.
  - `onChange={(e) => handleCartChange(item.id, "harga_jual", e.target.value)}`.
  - styled konsisten dengan input quantity (border rounded, kecil).
  - Tampilkan label "Harga" dan badge kecil jika diedit dari default, mis. `Rp10.000` vs default, warna oranye jika naik.
- Pastikan subtotal (`item.harga_jual * item.quantity`) ikut berubah otomatis (sudah dihitung dari `harga_jual`).
- Pastikan perhitungan diskon tetap benar: diskon dihitung dari `harga_jual` (sudah demikian). Verifikasi `discountValue > harga_jual` guard (baris 513) masih masuk akal — mungkin perlu clamp diskon ke harga jual baru (tidak wajib di plan ini, catat sebagai perhatian).

### 4. Feedback penolakan (opsional, disarankan)
- Jika input melebihi batas, selain revert, beri tahu kasir secara singkat (mis. `alert("Harga jual hanya boleh naik maksimal Rp10.000 dari harga awal.")` atau inline hint). Pilih salah satu; default: `alert` singkat agar eksplisit.

### 5. Verifikasi tidak ada tulisan ke DB produk
- Pastikan tidak ada pemanggilan `.from("products").update({ harga_jual })` di flow checkout/add. Yang ada: `products.update({ stok: item.stok - quantity })` (stok) — biarkan. Harga tidak di-update.

## Batasan & Aturan Validasi (rangkuman)
- `min = harga_jual_default` ; `max = harga_jual_default + 10000`.
- Di bawah `min` → revert ke `min`.
- Di atas `max` → revert ke `max`.
- Antara `min`–`max` → diterima.
- Harga jual diedit **hanya di cart**; tidak persist ke tabel produk.
- Laba transaksi otomatis ikut (sudah dihitung dari `harga_jual - harga_beli`).

## Failure Modes
- Input kosong/non-numerik → parse ke 0 → akan di-revert ke `min` (aman).
- `harga_jual_default` undefined (item lama tanpa field) → fallback ke `item.harga_jual` saat itu; tetap aman karena task 1 mengisi field untuk semua item baru. Untuk item dari "held transaction" lama, pastikan `harga_jual_default` diisi saat restore (lihat `setCart(heldTransaction.cart_data)` ~baris 664) — jika `cart_data` lama tidak punya field, fallback ke `item.harga_jual`.
- Diskon > harga jual baru → cek guard diskon (baris 513) agar tidak negatif; clamp `discountValue` ke `harga_jual`.

## Rollout
- Perubahan murni frontend (`src/pages/Pos.jsx`). Tidak ada migrasi DB, tidak ada RPC baru.
- Cukup `npm run build` untuk verifikasi.

## Validasi
1. `npm run build` sukses.
2. Tambah produk ke keranjang → input harga jual muncul dengan nilai = harga default.
3. Naikkan +5.000 → diterima; subtotal & laba naik; histori transaksi menyimpan harga baru.
4. Naikkan +15.000 → **ditolak**, harga kembali ke `default + 10.000`; pesan peringatan muncul.
5. Turunkan di bawah default → **ditolak**, kembali ke default.
6. Edit quantity & diskon tetap berfungsi normal di atas harga baru.
7. Cek DB `products`: harga_jual produk **tidak berubah** setelah checkout.
8. Restore transaksi "held" lama masih tampil benar (fallback `harga_jual_default`).

## Berkas yang Disentuh
- Ubah: `src/pages/Pos.jsx`
  - `addToCart` & `handleAddProductFromAI` (tambah `harga_jual_default`).
  - `handleCartChange` (branch `harga_jual` + validasi batas).
  - Render item keranjang (input harga jual + label/badge).
  - (Perhatian) guard diskon vs harga jual baru.
  - (Perhatian) restore held transaction fallback `harga_jual_default`.

## Open Questions (non-blocking)
- Apakah batas Rp10.000 ingin bisa dikonfigurasi pemilik (setting) atau hardcode? (Asumsi: hardcode sesuai instruksi user.)
- Apakah perlu menampilkan selisih "naik RpX" secara visual di tiap item? (Asumsi: ya, badge oranye kecil.)
- Apakah feedback penolakan pakai `alert` atau inline hint? (Asumsi: `alert` singkat.)
