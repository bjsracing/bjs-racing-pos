// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ session, children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      if (!session) {
        setIsSessionValid(false);
        setIsValidating(false);
        return;
      }

      // Ini adalah kunci untuk mendeteksi token yang sudah tidak valid
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.log(
          "Sesi tidak valid atau telah dihapus, mengarahkan ke halaman login.",
        );
        setIsSessionValid(false);
      } else {
        setIsSessionValid(true);
      }
      setIsValidating(false);
    };

    validateSession();
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
