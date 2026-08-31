import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { devApiProxyPlugin } from "./vite.dev-proxy.js"

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiProxyPlugin()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^@shared\/(.*)$/, replacement: `${path.resolve(__dirname, "./shared")}/$1` },
    ],
  },
  worker: {
    format: "es",
  },
})
