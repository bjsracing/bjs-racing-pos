import { Navigate } from "react-router-dom";

function ProtectedRoute({ session, children }) {
  if (!session) {
    // Jika tidak ada sesi login, paksa kembali ke halaman login
    return <Navigate to="/login" replace />;
  }
  // Jika ada sesi, tampilkan halaman yang diminta
  return children;
}
export default ProtectedRoute;
