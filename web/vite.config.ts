import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  // 部署到 GitHub Pages 時，base 改為 "/govpay/" 或使用環境變數
  base: process.env.VITE_BASE_PATH ?? "/",
  build: {
    outDir: "dist",
  },
});
