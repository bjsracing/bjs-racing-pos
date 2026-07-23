# Plan: Verifikasi Default Pelanggan di Halaman POS

## Konteks
User meminta konfirmasi bahwa perilaku pelanggan di halaman POS sudah sesuai yang diinginkan: setiap buka halaman POS atau setelah transaksi sukses, default pelanggan tetap "Pelanggan Umum", tetapi pengguna tetap bebas mengganti pelanggan sebelum menyelesaikan transaksi.

## Verifikasi
Setelah audit `Pos.jsx`, perilaku saat ini **sudah sesuai persis** dengan permintaan:

| Skenario | Lokasi Kode | Perilaku |
|-----------|-------------|----------|
| Buka halaman POS (fresh mount) | `Pos.jsx:322` | `selectedCustomer` diinisialisasi `{ id: null, nama_pelanggan: "Pelanggan Umum" }` |
| Ganti pelanggan | `Pos.jsx:455-465` (`selectCustomer`) + UI `840-900` | User bisa cari dan pilih pelanggan lain; UI menampilkan nama pelanggan terpilih |
| Transaksi sukses + tanpa struk | `Pos.jsx:681` | Memanggil `resetPage()` |
| Transaksi sukses + dengan struk, lalu tutup modal struk | `Pos.jsx:793-796` | Memanggil `resetPage()` lewat `onClose` `ReceiptModal` |
| Isi ulang form setelah transaksi | `Pos.jsx:612-623` (`resetPage`) | `setSelectedCustomer({ id: null, nama_pelanggan: "Pelanggan Umum" })` |

## Keputusan
Tidak ada perubahan kode yang diperlukan. Perilaku default "Pelanggan Umum" sudah terjamin di setiap mount dan reset transaksi, dan pengguna tetap dapat mengganti pelanggan kapan saja sebelum checkout.

## Langkah Validasi (opsional, manual)
1. Buka halaman POS → pastikan default terlihat "Pelanggan Umum"
2. Cari dan pilih pelanggan lain
3. Selesaikan transaksi (lunas atau hutang)
4. Tutup struk (atau lewati) → pastikan kembali ke "Pelanggan Umum"

## Risiko / Catatan
Tidak ada risiko. Tidak ada dependensi eksternal atau perubahan skema yang diperlukan.
