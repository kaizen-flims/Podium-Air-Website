import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: {
    outDir: "dist/intro",
    emptyOutDir: false,
    lib: { entry: "src/intro.tsx", formats: ["es"], fileName: () => "intro.js", cssFileName: "intro" },
    // React and Three.js are bundled so the deployed site needs no runtime CDN.
  },
})
