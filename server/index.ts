import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

import { processEdgeCache } from "../shared/devEdgeGeocodeCache.ts"
import {
  fetchNominatimGeocode,
  NOMINATIM_DEFAULT_CONTACT_EMAIL,
  resolveBoundaryForMask,
} from "../shared/nominatim.ts"
import { handleBoundaryProxy, handleGeocodeProxy } from "../shared/proxyHandler.ts"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const distDir = join(__dirname, "..", "dist")
const port = Number(process.env.APP_PORT ?? 7200)
const contactEmail = process.env.GEOCODE_CONTACT_EMAIL?.trim() || NOMINATIM_DEFAULT_CONTACT_EMAIL

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
}

async function readStatic(pathname: string): Promise<{ body: Buffer; contentType: string } | null> {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "")
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath)

  try {
    const body = await readFile(filePath)
    const ext = extname(filePath)
    return { body, contentType: mimeTypes[ext] ?? "application/octet-stream" }
  } catch {
    try {
      const body = await readFile(join(distDir, "index.html"))
      return { body, contentType: "text/html; charset=utf-8" }
    } catch {
      return null
    }
  }
}

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers })
  response.end(JSON.stringify(body))
}

createServer((request, response) => {
  void (async () => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`)

    if (url.pathname === "/api/geocode" && request.method === "GET") {
      const result = await handleGeocodeProxy(url.searchParams, processEdgeCache, (city, country) =>
        fetchNominatimGeocode(city, country, contactEmail),
      )
      sendJson(response, result.status, result.body, result.headers)
      return
    }

    if (url.pathname === "/api/boundary" && request.method === "GET") {
      const result = await handleBoundaryProxy(
        url.searchParams,
        processEdgeCache,
        (osmType, osmId, radiusMeters) =>
          resolveBoundaryForMask(osmType, osmId, contactEmail, radiusMeters),
      )
      sendJson(response, result.status, result.body, result.headers)
      return
    }

    const asset = await readStatic(url.pathname)
    if (!asset) {
      response.writeHead(404)
      response.end("Not found")
      return
    }

    response.writeHead(200, { "Content-Type": asset.contentType })
    response.end(asset.body)
  })()
}).listen(port, () => {
  console.log(`mapposter self-host listening on http://0.0.0.0:${port}`)
})
