import type { Plugin } from "vite"

/// <reference path="./functions/env.d.ts" />

import { processEdgeCache } from "./shared/devEdgeGeocodeCache.js"
import {
  fetchNominatimGeocode,
  resolveBoundaryForMask,
} from "./shared/nominatim.js"
import { handleBoundaryProxy, handleGeocodeProxy } from "./shared/proxyHandler.js"

function sendJson(
  res: import("http").ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
  res.end(JSON.stringify(body))
}

export function devApiProxyPlugin(): Plugin {
  return {
    name: "dev-api-proxy",
    configureServer(server) {
      server.middlewares.use("/api/geocode", (req, res) => {
        void (async () => {
          try {
            if (req.method !== "GET") {
              sendJson(res, 405, { error: "Method not allowed" })
              return
            }

            const url = new URL(req.url ?? "", "http://localhost")
            const result = await handleGeocodeProxy(url.searchParams, processEdgeCache, (city, country) =>
              fetchNominatimGeocode(city, country),
            )
            sendJson(res, result.status, result.body, result.headers)
          } catch {
            sendJson(res, 502, { error: "Geocoding failed" })
          }
        })()
      })

      server.middlewares.use("/api/boundary", (req, res) => {
        void (async () => {
          try {
            if (req.method !== "GET") {
              sendJson(res, 405, { error: "Method not allowed" })
              return
            }

            const url = new URL(req.url ?? "", "http://localhost")
            const result = await handleBoundaryProxy(
              url.searchParams,
              processEdgeCache,
              (osmType, osmId, radiusMeters) =>
                resolveBoundaryForMask(osmType, osmId, undefined, radiusMeters),
            )
            sendJson(res, result.status, result.body, result.headers)
          } catch {
            sendJson(res, 502, { error: "Boundary lookup failed" })
          }
        })()
      })
    },
  }
}
