import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

const repositoryName = "local-notion-ai";

export default defineConfig({
  base: `/${repositoryName}/`,
  plugins: [preact()],
  build: {
    outDir: "docs",
    assetsDir: "assets",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js"
      }
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
