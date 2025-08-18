import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ session, children }) {
  // 1. State untuk mengelola proses validasi sesi
  const [isValidating, setIsValidating] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    // 2. Fungsi async untuk memvalidasi sesi
    const validateSession = async () => {
      // Jika session null (tidak ada sesi), langsung anggap tidak valid
      if (!session) {
        setIsSessionValid(false);
        setIsValidating(false);
        return;
      }

      // 3. Coba perbarui sesi secara paksa
      // Ini adalah kunci untuk mendeteksi token yang sudah tidak valid
      const { data, error } = await supabase.auth.refreshSession();

      // 4. Periksa hasil refresh sesi
      // Jika ada error atau sesi tidak valid, atur isSessionValid ke false
      if (error || !data.session) {
        console.log(
          "Sesi tidak valid atau telah dihapus, mengarahkan ke halaman login.",
        );
        setIsSessionValid(false);
      } else {
        // Jika refresh berhasil, sesi masih valid
        setIsSessionValid(true);
      }
      setIsValidating(false);
    };

    validateSession();
  }, [session]); // Jalankan efek ini setiap kali props 'session' berubah

  // 5. Tampilkan loading screen saat sedang memvalidasi
  if (isValidating) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-800 text-white">
        Memvalidasi Sesi...
      </div>
    );
  }

  // 6. Tampilkan children jika sesi valid, jika tidak, arahkan ke login
  return isSessionValid ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
