# Dashboard Enhancement Plan

Daftar perbaikan kartu Dashboard agar lebih profesional dan informatif.

---

## 1. Tren Mingguan → Mini Bar SVG + Arrow Indicator
**Status:** Done

Ganti tampilan teks statis jadi mini bar chart SVG 2 bar (Minggu ini vs Minggu lalu) dengan arrow animasi.

- Custom SVG bars (2 horizontal bars)
- Warna: hijau (minggu ini), abu-abu (minggu lalu)
- Arrow icon FaArrowUp/FaArrowDown + animasi
- Tampilan: `↑ 38.9% vs minggu lalu`
- Data sudah tersedia di state `weeklyTrend`

---

## 2. Penjualan & Keuntungan → Trend Mini
**Status:** Done

Tambah arrow indicator hijau/merah di bawah angka Rp untuk kartu "Penjualan" dan "Keuntungan" di ROW 1.

- Bandingkan dengan minggu lalu (data sudah ada: `thisWeekMetricsRes` vs `lastWeekMetricsRes`)
- Tambah `FaArrowUp` / `FaArrowDown` + persentase
- Warna: hijau naik, merah turun
- Sembunyikan jika data minggu lalu = 0

---

## 3. Loading Skeleton
**Status:** Done

Tambah skeleton placeholder (animasi shimmer) saat data belum load.

- Komponen `Skeleton` reusable dengan CSS `@keyframes shimmer`
- Tampilkan skeleton untuk semua kartu saat `loading = true`
- Ganti skeleton dengan data asli setelah fetch selesai

---

## 4. Aktivitas Terkini → Hover States + Badge
**Status:** Done

Perbaiki daftar "Aktivitas Terkini" di ROW 5 (kanan).

- Tambah `hover:bg-slate-50 rounded` pada setiap item
- Tambah badge jumlah item (misal: "5 item")
- Warna badge: biru untuk few items, oranye untuk banyak
- Smooth transition on hover

---

## 5. Penjualan per Merek → Doughnut + Rank
**Status:** Done

Ganti Pie chart jadi Doughnut (hole in center = total sales).

- Ubah `Pie` → `Doughnut` (tambah `cutout: "65%"`)
- Tambah total sales di tengah donut
- Tambah nomor urut ranking di legend

---

## 6. Pelanggan Terbaik → Mini Bar + Click-through
**Status:** Done

Tambah mini progress bar di bawah nama pelanggan (proporsi dari top 1).

- Progress bar: `width = (total / topCustomerTotal) * 100%`
- Warna: gradient hijau
- Klik ke detail pelanggan (jika ada halaman detail)
- Smooth hover effect

---

## 7. MetricCard Component → Reusable EnhancedCard
**Status:** Done

Buat component baru yang bisa dipakai oleh semua kartu dengan fitur:
- Circular progress (seperti Target Bulanan)
- Trend indicator
- Badge status
- Hover effect
- Konsisten dengan desain Target Bulanan

**Implementasi:**
- File baru `src/components/EnhancedCard.jsx` (reusable), props: `icon`, `title`, `value`, `color`, `progress`, `trendChange`/`trendLabel`, `badge` ({text,color}), `children`, serta dukungan `isLink`/`to`/`state`.
- Sub-komponen `CircularProgress` bergaya sama dengan Target Bulanan (warna dinamis hijau/kuning/merah berdasarkan persentase).
- Hover effect: `hover:shadow-md hover:-translate-y-0.5` dengan transition halus.
- `MetricCard` di `Dashboard.jsx` di-refactor menjadi wrapper tipis di atas `EnhancedCard`, sehingga semua kartu ROW 1 & 2 otomatis konsisten tanpa mengubah pemakaian lama.

---

## 8. Card Entrance Animation
**Status:** Pending

Staggered fade-in effect saat pertama kali load.

- CSS `@keyframes fadeInUp` dengan delay bertahap per kartu
- Pakai CSS tanpa library tambahan
- Delay: 0ms, 50ms, 100ms, dst per kartu

---

## 9. Produk Habis + Produk Aktif → Enhanced Display
**Status:** Pending

### Produk Aktif (ROW 1)
- Tambah subtitle jumlah kategori/merek di bawah angka
- Contoh: "2.510 produk" → "2.510 produk • 12 kategori"

### Produk Habis
- Tambah progress bar kecil (berapa % produk yang habis dari total)
- Tambah ikon warning berkedip jika jumlah > 10
- Hover effect pada setiap item
