import type { MultiPolygon, Polygon } from "geojson"

export interface GeocodeProxyBody {
  latitude: number
  longitude: number
  displayName: string
  placeLocalName?: string
  placeLatinName?: string
  countryLocalName?: string
  countryLatinName?: string
  countryCode?: string
  suggestedRadiusMeters?: number
  osmType?: "node" | "way" | "relation"
  osmId?: number
}

export type BoundaryGeometry = Polygon | MultiPolygon

export interface ProxyResult {
  status: number
  body: unknown
  headers: Record<string, string>
}

export interface EdgeProxyCache {
  readGeocode(city: string, country: string): Promise<GeocodeProxyBody | null>
  writeGeocode(city: string, country: string, body: GeocodeProxyBody): Promise<void>
  readBoundary(
    osmType: string,
    osmId: number,
    radiusMeters?: number,
  ): Promise<BoundaryGeometry | null>
  writeBoundary(
    osmType: string,
    osmId: number,
    geometry: BoundaryGeometry,
    radiusMeters?: number,
  ): Promise<void>
}

export type GeocodeUpstream = (
  city: string,
  country: string,
) => Promise<{ ok: true; result: GeocodeProxyBody } | { ok: false; status: number; error: string }>

export type BoundaryUpstream = (
  osmType: "node" | "way" | "relation",
  osmId: number,
  radiusMeters?: number,
) => Promise<{ ok: true; geometry: BoundaryGeometry } | { ok: false; status: number; error: string }>

function geocodeBody(value: GeocodeProxyBody): GeocodeProxyBody {
  return {
    latitude: value.latitude,
    longitude: value.longitude,
    displayName: value.displayName,
    placeLocalName: value.placeLocalName,
    placeLatinName: value.placeLatinName,
    countryLocalName: value.countryLocalName,
    countryLatinName: value.countryLatinName,
    countryCode: value.countryCode,
    suggestedRadiusMeters: value.suggestedRadiusMeters,
    osmType: value.osmType,
    osmId: value.osmId,
  }
}

export async function handleGeocodeProxy(
  searchParams: URLSearchParams,
  cache: EdgeProxyCache,
  geocode: GeocodeUpstream,
): Promise<ProxyResult> {
  const city = searchParams.get("city")?.trim()
  const country = searchParams.get("country")?.trim()
  if (!city || !country) {
    return { status: 400, body: { error: "city and country are required" }, headers: {} }
  }

  const cached = await cache.readGeocode(city, country)
  if (cached) {
    return { status: 200, body: geocodeBody(cached), headers: { "X-Cache": "HIT" } }
  }

  let upstream: Awaited<ReturnType<GeocodeUpstream>>
  try {
    upstream = await geocode(city, country)
  } catch {
    return { status: 502, body: { error: "Geocoding failed" }, headers: {} }
  }
  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502
    return {
      status,
      body: { error: upstream.error },
      headers: { "X-Upstream-Status": String(upstream.status) },
    }
  }

  const body = geocodeBody(upstream.result)
  await cache.writeGeocode(city, country, body)
  return {
    status: 200,
    body,
    headers: { "X-Cache": "MISS", "X-Upstream-Status": "200" },
  }
}

export async function handleBoundaryProxy(
  searchParams: URLSearchParams,
  cache: EdgeProxyCache,
  boundary: BoundaryUpstream,
): Promise<ProxyResult> {
  const osmType = searchParams.get("osmType")?.trim()
  const osmIdRaw = searchParams.get("osmId")?.trim()
  const osmId = osmIdRaw ? Number(osmIdRaw) : NaN
  const radiusRaw = searchParams.get("radiusMeters")?.trim()
  const radiusMeters = radiusRaw ? Number(radiusRaw) : undefined

  if (!osmType || !Number.isFinite(osmId)) {
    return { status: 400, body: { error: "osmType and osmId are required" }, headers: {} }
  }

  if (osmType !== "node" && osmType !== "way" && osmType !== "relation") {
    return { status: 400, body: { error: "osmType must be node, way, or relation" }, headers: {} }
  }

  if (radiusMeters != null && (!Number.isFinite(radiusMeters) || radiusMeters <= 0)) {
    return { status: 400, body: { error: "radiusMeters must be a positive number" }, headers: {} }
  }

  const cached = await cache.readBoundary(osmType, osmId, radiusMeters)
  if (cached) {
    return { status: 200, body: { geometry: cached }, headers: { "X-Cache": "HIT" } }
  }

  let upstream: Awaited<ReturnType<BoundaryUpstream>>
  try {
    upstream = await boundary(osmType, osmId, radiusMeters)
  } catch {
    return { status: 502, body: { error: "Boundary lookup failed" }, headers: {} }
  }
  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502
    return {
      status,
      body: { error: upstream.error },
      headers: { "X-Upstream-Status": String(upstream.status) },
    }
  }

  await cache.writeBoundary(osmType, osmId, upstream.geometry, radiusMeters)
  return {
    status: 200,
    body: { geometry: upstream.geometry },
    headers: { "X-Cache": "MISS", "X-Upstream-Status": "200" },
  }
}
