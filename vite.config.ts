import { defineConfig } from "vite";
import { voidPlugin } from "void";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    voidPlugin(),
  ],
});
