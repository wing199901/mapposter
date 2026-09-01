export const onRequestGet: PagesFunction<Env> = async (context) => {
  const city = new URL(context.request.url).searchParams.get("city")?.trim()
  const country = new URL(context.request.url).searchParams.get("country")?.trim()

  if (!city || !country) {
    return Response.json({ error: "city and country are required" }, { status: 400 })
  }

  const { readEdgeGeocode, writeEdgeGeocode } = await import("../lib/edgeCache")
  const { geocodeFromNominatim } = await import("../lib/nominatim")

  const cached = await readEdgeGeocode(context.env, city, country)
  if (cached) {
    return Response.json(
      {
        latitude: cached.latitude,
        longitude: cached.longitude,
        displayName: cached.displayName,
        suggestedRadiusMeters: cached.suggestedRadiusMeters,
        osmType: cached.osmType,
        osmId: cached.osmId,
      },
      { headers: { "X-Cache": "HIT" } },
    )
  }

  const upstream = await geocodeFromNominatim(city, country, context.env)
  if (!upstream.ok) {
    const status =
      upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502
    return Response.json(
      { error: upstream.error },
      {
        status,
        headers: { "X-Upstream-Status": String(upstream.status) },
      },
    )
  }

  await writeEdgeGeocode(context.env, city, country, upstream.result)

  return Response.json(upstream.result, {
    headers: {
      "X-Cache": "MISS",
      "X-Upstream-Status": "200",
    },
  })
}
