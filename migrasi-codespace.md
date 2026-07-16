Untuk melakukan migrasi dari VPS AWS ke GitHub Codespaces secara otomatis tanpa konfigurasi manual berulang kali, GitHub memiliki fitur bernama **Dev Containers**.

Dengan fitur ini, Anda bisa membuat "resep" lingkungan development. Jadi, setiap kali Codespaces dinyalakan, dia akan otomatis menginstall Supabase CLI, Vercel CLI, OpenCode CLI, dan tool lainnya.

Berikut adalah langkah-langkah praktisnya:

### 1. Gunakan File `devcontainer.json` (Otomatisasi Instalasi)
Di dalam repo GitHub Anda, buat folder baru bernama `.devcontainer` dan buat file di dalamnya bernama `devcontainer.json`. 

Isi file tersebut dengan script ini:

```json
{
  "name": "POS Dev Environment",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "postCreateCommand": "npm install -g supabase vercel opencode-cli && npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "dsznajder.es7-react-js-snippets"
      ]
    }
  }
}
```
*   **image**: Menggunakan Node.js versi 20.
*   **postCreateCommand**: Bagian ini yang **otomatis menginstall** semua CLI Anda begitu Codespace dibuat.

### 2. Memindahkan "Credentials" (Login CLI) Tanpa Login Ulang
Ini bagian terpenting. Agar Anda tidak perlu ketik `vercel login` atau `supabase login` setiap kali ganti Codespace, gunakan **Codespaces Secrets**.

**Caranya:**
1.  Buka GitHub (di browser tablet).
2.  Masuk ke **Settings** akun GitHub Anda (bukan settings repo).
3.  Cari menu **Codespaces** di sisi kiri (bawah *Developer settings* atau *Security*).
4.  Klik **New Secret**.
5.  Tambahkan secret berikut dari data yang Anda punya di VPS AWS:

    *   **VERCEL_TOKEN**: (Ambil dari dashboard Vercel > Settings > Tokens). Dengan ini, Vercel CLI otomatis terhubung.
    *   **SUPABASE_ACCESS_TOKEN**: (Ambil dari dashboard Supabase > Account Settings > Access Tokens).
    *   **OPENCODE_API_KEY**: (Jika OpenCode CLI butuh API key/token).

**Cara Pakai di Terminal Codespaces:**
Begitu Codespace terbuka, CLI tersebut biasanya langsung mengenali Token dari Environment Variable. Jika tidak, Anda tinggal jalankan perintah satu kali saja menggunakan variabel tersebut, misal:
`vercel --token $VERCEL_TOKEN`

### 3. Cara Memindahkan Config Khusus (Dotfiles)
Jika Anda punya konfigurasi custom di VPS (seperti alias di `.bashrc` atau config khusus di `.config`), GitHub punya fitur **Dotfiles**.

1.  Buat repo baru di GitHub dengan nama `dotfiles`.
2.  Masukkan file seperti `.bashrc`, `.zshrc`, atau folder config CLI Anda ke sana.
3.  Di Settings GitHub (Codespaces), aktifkan pilihan **"Automatically install dotfiles"**.

GitHub akan otomatis melakukan *clone* repo dotfiles tersebut ke setiap Codespace yang Anda buka.

### 4. Tips Tambahan untuk Pengguna Tablet
Karena Anda tidak pakai PC, melakukan koding di browser tablet kadang membuat *keyboard virtual* menutupi layar.

*   **PWA:** Saat membuka Codespaces di Chrome Android, klik titik tiga di pojok kanan atas > **Install App** atau **Add to Home Screen**. Ini akan membuat Codespaces berjalan seperti aplikasi fullscreen, memberi ruang layar lebih luas.
*   **Port Forwarding:** Karena Anda pakai Vite, aplikasi akan jalan di port 5173. Codespaces akan otomatis memberikan notifikasi pop-up untuk "Open in Browser". Anda bisa melihat live preview POS Anda langsung di tab baru tablet.

### Ringkasan Langkah Migrasi:
1.  **Di AWS:** Catat/copy semua Token (Vercel, Supabase, dll).
2.  **Di GitHub:** Masukkan Token tersebut ke **Codespaces Secrets**.
3.  **Di Repo POS:** Tambahkan file `.devcontainer/devcontainer.json` seperti di atas, lalu `git push`.
4.  **Eksekusi:** Klik **"Create Codespace"**. Tunggu 1-2 menit selagi dia menginstall semua CLI secara otomatis.
5.  **Selesai:** Lingkungan koding Anda di AWS pindah persis ke Cloud, dan Anda bisa mematikan VPS AWS Anda untuk selamanya.

### 4. Tips Tambahan untuk Pengguna Tablet
Karena Anda tidak pakai PC, melakukan koding di browser tablet kadang membuat *keyboard virtual* menutupi layar.

*   **PWA:** Saat membuka Codespaces di Chrome Android, klik titik tiga di pojok kanan atas > **Install App** atau **Add to Home Screen**. Ini akan membuat Codespaces berjalan seperti aplikasi fullscreen, memberi ruang layar lebih luas.
*   **Port Forwarding:** Karena Anda pakai Vite, aplikasi akan jalan di port 5173. Codespaces akan otomatis memberikan notifikasi pop-up untuk "Open in Browser". Anda bisa melihat live preview POS Anda langsung di tab baru tablet.

### Ringkasan Langkah Migrasi:
1.  **Di AWS:** Catat/copy semua Token (Vercel, Supabase, dll).
2.  **Di GitHub:** Masukkan Token tersebut ke **Codespaces Secrets**.
3.  **Di Repo POS:** Tambahkan file `.devcontainer/devcontainer.json` seperti di atas, lalu `git push`.
4.  **Eksekusi:** Klik **"Create Codespace"**. Tunggu 1-2 menit selagi dia menginstall semua CLI secara otomatis.
5.  **Selesai:** Lingkungan koding Anda di AWS pindah persis ke Cloud, dan Anda bisa mematikan VPS AWS Anda untuk selamanya.

Dengan cara ini, meskipun mesin Codespace dihapus dan dibuat baru, semua CLI dan konfigurasi Anda akan selalu ada secara otomatis.