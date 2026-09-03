import type { Plugin } from "vite"

/// <reference path="./functions/env.d.ts" />

import {
  readDevEdgeBoundary,
  readDevEdgeGeocode,
  writeDevEdgeBoundary,
  writeDevEdgeGeocode,
} from "./shared/devEdgeGeocodeCache.js"
import {
  fetchNominatimGeocode as requestNominatimGeocode,
  resolveBoundaryForMask,
} from "./shared/nominatim.js"

async function fetchNominatimGeocode(city: string, country: string) {
  const upstream = await requestNominatimGeocode(city, country)
  if (!upstream.ok) {
    return {
      status: (upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502) as
        | 404
        | 429
        | 502,
      upstreamStatus: upstream.status,
      body: { error: upstream.error },
    }
  }

  return {
    status: 200 as const,
    upstreamStatus: 200,
    body: upstream.result,
  }
}

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
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" })
            return
          }

          const url = new URL(req.url ?? "", "http://localhost")
          const city = url.searchParams.get("city")?.trim()
          const country = url.searchParams.get("country")?.trim()

          if (!city || !country) {
            sendJson(res, 400, { error: "city and country are required" })
            return
          }

          const cached = readDevEdgeGeocode(city, country)
          if (cached) {
            sendJson(
              res,
              200,
              {
                latitude: cached.latitude,
                longitude: cached.longitude,
                displayName: cached.displayName,
                placeLocalName: cached.placeLocalName,
                placeLatinName: cached.placeLatinName,
                countryLocalName: cached.countryLocalName,
                countryLatinName: cached.countryLatinName,
                countryCode: cached.countryCode,
                suggestedRadiusMeters: cached.suggestedRadiusMeters,
                osmType: cached.osmType,
                osmId: cached.osmId,
              },
              { "X-Cache": "HIT" },
            )
            return
          }

          const result = await fetchNominatimGeocode(city, country)
          if (result.status !== 200) {
            sendJson(res, result.status, result.body, {
              "X-Upstream-Status": String(result.upstreamStatus),
            })
            return
          }

          writeDevEdgeGeocode(city, country, result.body)

          sendJson(res, 200, result.body, {
            "X-Cache": "MISS",
            "X-Upstream-Status": "200",
          })
        })()
      })

      server.middlewares.use("/api/boundary", (req, res) => {
        void (async () => {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" })
            return
          }

          const url = new URL(req.url ?? "", "http://localhost")
          const osmType = url.searchParams.get("osmType")?.trim()
          const osmIdRaw = url.searchParams.get("osmId")?.trim()
          const osmId = osmIdRaw ? Number(osmIdRaw) : NaN
          const radiusRaw = url.searchParams.get("radiusMeters")?.trim()
          const radiusMeters = radiusRaw ? Number(radiusRaw) : undefined

          if (!osmType || !Number.isFinite(osmId)) {
            sendJson(res, 400, { error: "osmType and osmId are required" })
            return
          }

          if (osmType !== "node" && osmType !== "way" && osmType !== "relation") {
            sendJson(res, 400, { error: "osmType must be node, way, or relation" })
            return
          }

          if (radiusMeters != null && (!Number.isFinite(radiusMeters) || radiusMeters <= 0)) {
            sendJson(res, 400, { error: "radiusMeters must be a positive number" })
            return
          }

          const cached = readDevEdgeBoundary(osmType, osmId, radiusMeters)
          if (cached) {
            sendJson(res, 200, { geometry: cached.geometry }, { "X-Cache": "HIT" })
            return
          }

          const upstream = await resolveBoundaryForMask(osmType, osmId, undefined, radiusMeters)
          if (!upstream.ok) {
            sendJson(
              res,
              upstream.status === 404 ? 404 : 502,
              { error: upstream.error },
              { "X-Upstream-Status": String(upstream.status) },
            )
            return
          }

          writeDevEdgeBoundary(osmType, osmId, upstream.geometry, radiusMeters)

          sendJson(
            res,
            200,
            { geometry: upstream.geometry },
            {
              "X-Cache": "MISS",
              "X-Upstream-Status": "200",
            },
          )
        })()
      })
    },
  }
}
