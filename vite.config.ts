import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: {
    outDir: "dist/intro",
    minify: true,
    emptyOutDir: false,
    rolldownOptions: {
      input: "src/intro.tsx",
      output: { entryFileNames: "intro.js", assetFileNames: "intro.[ext]" },
    },
    // React and Three.js are bundled so the deployed site needs no runtime CDN.
  },
})
