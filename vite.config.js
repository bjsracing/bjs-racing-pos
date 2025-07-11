import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Wajib ada agar Replit bisa mendeteksi server
    allowedHosts: [
      ".replit.dev", // Izinkan semua alamat dari Replit
    ],
  },
});
