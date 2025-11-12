import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ fondamentale per far funzionare su Vercel
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
