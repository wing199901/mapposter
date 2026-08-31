import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { devApiProxyPlugin } from "./vite.dev-proxy.js"

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
})
