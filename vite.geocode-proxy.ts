import type { Plugin } from "vite"

export function geocodeProxyPlugin(): Plugin {
  return {
    name: "geocode-proxy",
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

          const query = encodeURIComponent(`${city}, ${country}`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
            {
              headers: {
                "User-Agent": "mapposter-web/1.0 (local dev)",
                Accept: "application/json",
              },
            },
          )

          if (!response.ok) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: "Nominatim request failed" }))
            return
          }

          const results = (await response.json()) as Array<{
            lat: string
            lon: string
            display_name: string
          }>
          const first = results[0]
          if (!first) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: "No results found" }))
            return
          }

          res.setHeader("Content-Type", "application/json")
          res.end(
            JSON.stringify({
              latitude: Number(first.lat),
              longitude: Number(first.lon),
              displayName: first.display_name,
            }),
          )
        })()
      })
    },
  }
}
