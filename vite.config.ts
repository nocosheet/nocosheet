import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), voidPlugin()],
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts", "pnpm-lock.yaml", ".void/**", ".cloudflare/**"],
    sortPackageJson: true,
    sortImports: {
      newlinesBetween: true,
      customGroups: [
        { groupName: "react", elementNamePattern: ["react", "react-dom", "react-dom/*"] },
        { groupName: "tanstack", elementNamePattern: ["@tanstack/*"] },
      ],
      groups: [
        "react",
        "tanstack",
        ["builtin", "external"],
        "internal",
        ["parent", "sibling", "index"],
        "unknown",
      ],
    },
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts", ".void/**", ".cloudflare/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
