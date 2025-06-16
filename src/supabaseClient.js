import { createClient } from "@supabase/supabase-js";

// Ambil URL dan Key dari 'Secrets' yang akan Anda atur nanti
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Buat dan ekspor client supabase untuk digunakan di seluruh aplikasi
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
