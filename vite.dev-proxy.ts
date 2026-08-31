import type { Plugin } from "vite"

/// <reference path="./functions/env.d.ts" />

import {
  readDevEdgeGeocode,
  writeDevEdgeGeocode,
} from "./shared/devEdgeGeocodeCache.js"
import { fetchNominatimGeocode as requestNominatimGeocode } from "./shared/nominatim.js"

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
]

async function proxyOverpassQuery(query: string): Promise<Response> {
  const attempts = await Promise.allSettled(
    OVERPASS_ENDPOINTS.map(async (endpoint) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "mapposter-web/1.0 (Overpass proxy)",
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        throw new Error(`Overpass error ${response.status} from ${endpoint}`)
      }

      return response.json()
    }),
  )

  const success = attempts.find((result) => result.status === "fulfilled")
  if (success && success.status === "fulfilled") {
    return Response.json(success.value)
  }

  const message = attempts
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason))
    .join("; ")

  return Response.json({ error: message || "All Overpass endpoints failed" }, { status: 502 })
}

async function fetchNominatimGeocode(city: string, country: string) {
  const upstream = await requestNominatimGeocode(city, country)
  if (!upstream.ok) {
    return {
      status: (upstream.status === 404 ? 404 : 502) as 404 | 502,
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

export function devApiProxyPlugin(): Plugin {
  return {
    name: "dev-api-proxy",
    configureServer(server) {
      server.middlewares.use("/api/geocode", (req, res) => {
        void (async () => {
          if (req.method !== "GET") {
            res.statusCode = 405
            res.end(JSON.stringify({ error: "Method not allowed" }))
            return
          }

          const url = new URL(req.url ?? "", "http://localhost")
          const city = url.searchParams.get("city")?.trim()
          const country = url.searchParams.get("country")?.trim()

          if (!city || !country) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: "city and country are required" }))
            return
          }

          const cached = readDevEdgeGeocode(city, country)
          if (cached) {
            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.setHeader("X-Cache", "HIT")
            res.end(
              JSON.stringify({
                latitude: cached.latitude,
                longitude: cached.longitude,
                displayName: cached.displayName,
              }),
            )
            return
          }

          const result = await fetchNominatimGeocode(city, country)
          if (result.status !== 200) {
            res.statusCode = result.status
            res.setHeader("X-Upstream-Status", String(result.upstreamStatus))
            res.end(JSON.stringify(result.body))
            return
          }

          writeDevEdgeGeocode(city, country, result.body)

          res.statusCode = 200
          res.setHeader("Content-Type", "application/json")
          res.setHeader("X-Cache", "MISS")
          res.setHeader("X-Upstream-Status", "200")
          res.end(JSON.stringify(result.body))
        })()
      })

      server.middlewares.use("/api/overpass", (req, res) => {
        void (async () => {
          if (req.method !== "POST") {
            res.statusCode = 405
            res.end(JSON.stringify({ error: "Method not allowed" }))
            return
          }

          const chunks: Buffer[] = []
          await new Promise<void>((resolve, reject) => {
            req.on("data", (chunk: Buffer) => chunks.push(chunk))
            req.on("end", () => resolve())
            req.on("error", reject)
          })

          let query = ""
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString()) as { query?: string }
            query = body.query?.trim() ?? ""
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: "Invalid JSON body" }))
            return
          }

          if (!query) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: "query is required" }))
            return
          }

          const proxyResponse = await proxyOverpassQuery(query)
          res.statusCode = proxyResponse.status
          res.setHeader("Content-Type", "application/json")
          res.end(await proxyResponse.text())
        })()
      })
    },
  }
}
