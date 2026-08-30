import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { geocodeProxyPlugin } from "./vite.geocode-proxy.js"

export default defineConfig({
  plugins: [react(), tailwindcss(), geocodeProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
})
