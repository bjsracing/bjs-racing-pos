import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Mengizinkan SEMUA alamat subdomain dari codesandbox.io
    allowedHosts: [".csb.app"],
  },
});
