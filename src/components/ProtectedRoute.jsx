import { useEffect, useState, useRef } from "react"; // Tambahkan useRef
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ session, children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  // Gunakan useRef untuk mencegah validasi berulang
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true; // Komponen telah dimuat

    // Fungsi async untuk memvalidasi sesi
    const validateSession = async () => {
      // Pastikan hanya berjalan jika komponen sudah dimuat dan sesi ada
      if (!isMounted.current || !session) {
        if (isMounted.current) {
          setIsSessionValid(false);
          setIsValidating(false);
        }
        return;
      }

      // Coba perbarui sesi secara paksa
      const { data, error } = await supabase.auth.refreshSession();

      if (isMounted.current) {
        if (error || !data.session) {
          console.log(
            "Sesi tidak valid atau telah dihapus, mengarahkan ke halaman login.",
          );
          setIsSessionValid(false);
        } else {
          setIsSessionValid(true);
        }
        setIsValidating(false);
      }
    };

    validateSession();

    // Cleanup function: Set isMounted menjadi false saat komponen dilepas
    return () => {
      isMounted.current = false;
    };
  }, [session]);

  if (isValidating) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-800 text-white">
        Memvalidasi Sesi...
      </div>
    );
  }

  return isSessionValid ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
