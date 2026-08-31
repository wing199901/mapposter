export const onRequestGet: PagesFunction<Env> = async (context) => {
  const city = new URL(context.request.url).searchParams.get("city")?.trim()
  const country = new URL(context.request.url).searchParams.get("country")?.trim()

  if (!city || !country) {
    return Response.json({ error: "city and country are required" }, { status: 400 })
  }

  const { readEdgeGeocode, writeEdgeGeocode } = await import("../lib/edgeCache")

  const cached = await readEdgeGeocode(context.env, city, country)
  if (cached) {
    return Response.json(
      {
        latitude: cached.latitude,
        longitude: cached.longitude,
        displayName: cached.displayName,
      },
      { headers: { "X-Cache": "HIT" } },
    )
  }

  const query = encodeURIComponent(`${city}, ${country}`)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "mapposter-web/1.0 (Cloudflare Pages; contact@example.com)",
        Accept: "application/json",
      },
    },
  )

  if (!response.ok) {
    return Response.json({ error: "Nominatim request failed" }, { status: 502 })
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>
  const first = results[0]
  if (!first) {
    return Response.json({ error: "No results found" }, { status: 404 })
  }

  const payload = {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    displayName: first.display_name,
  }

  await writeEdgeGeocode(context.env, city, country, payload)

  return Response.json(payload, { headers: { "X-Cache": "MISS" } })
}
