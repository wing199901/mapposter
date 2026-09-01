export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const osmType = url.searchParams.get("osmType")?.trim()
  const osmIdRaw = url.searchParams.get("osmId")?.trim()
  const osmId = osmIdRaw ? Number(osmIdRaw) : NaN
  const radiusRaw = url.searchParams.get("radiusMeters")?.trim()
  const radiusMeters = radiusRaw ? Number(radiusRaw) : undefined

  if (!osmType || !Number.isFinite(osmId)) {
    return Response.json({ error: "osmType and osmId are required" }, { status: 400 })
  }

  if (osmType !== "node" && osmType !== "way" && osmType !== "relation") {
    return Response.json({ error: "osmType must be node, way, or relation" }, { status: 400 })
  }

  if (radiusMeters != null && (!Number.isFinite(radiusMeters) || radiusMeters <= 0)) {
    return Response.json({ error: "radiusMeters must be a positive number" }, { status: 400 })
  }

  const { readEdgeBoundary, writeEdgeBoundary } = await import("../lib/edgeCache")
  const { boundaryFromNominatim } = await import("../lib/nominatim")

  const cached = await readEdgeBoundary(context.env, osmType, osmId, radiusMeters)
  if (cached) {
    return Response.json(
      { geometry: cached.geometry },
      { headers: { "X-Cache": "HIT" } },
    )
  }

  const upstream = await boundaryFromNominatim(osmType, osmId, context.env, radiusMeters)
  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502
    return Response.json(
      { error: upstream.error },
      {
        status,
        headers: { "X-Upstream-Status": String(upstream.status) },
      },
    )
  }

  await writeEdgeBoundary(context.env, osmType, osmId, upstream.geometry, radiusMeters)

  return Response.json(
    { geometry: upstream.geometry },
    {
      headers: {
        "X-Cache": "MISS",
        "X-Upstream-Status": "200",
      },
    },
  )
}
