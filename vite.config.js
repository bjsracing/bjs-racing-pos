import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [".replit.dev"], // <-- Penambahan ada di sini
  },
  appType: "spa",
});
