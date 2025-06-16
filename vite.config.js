import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Secara eksplisit mengizinkan host dari CodeSandbox sesuai pesan error
    // PASTIKAN ANDA MENGGANTI URL DI BAWAH INI DENGAN URL DARI PREVIEW ANDA JIKA BERBEDA
    allowedHosts: ["9y9scj-5173.csb.app"],
  },
});
