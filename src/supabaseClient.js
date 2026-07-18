import { createClient } from "@supabase/supabase-js";

// Ambil URL dan Key dari 'Secrets' yang akan Anda atur nanti
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Buat dan ekspor client supabase untuk digunakan di seluruh aplikasi.
// - autoRefreshToken: otomatis memperbarui JWT sebelum/saat expire (penting
//   agar request tidak ditolak 401 setelah tab lama di-background).
// - persistSession: simpan sesi di localStorage agar bertahan antar reload.
// - detectSessionInUrl: false karena kita pakai login via password (bukan magic link).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
