import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
export const NOMINATIM_LOOKUP_URL = "https://nominatim.openstreetmap.org/lookup"
export const NOMINATIM_APP_URL = "https://mapposter.wing199901.workers.dev"
export const NOMINATIM_DEFAULT_CONTACT_EMAIL = "wing199901@users.noreply.github.com"

export const MIN_RADIUS_METERS = 4000
export const MAX_RADIUS_METERS = 50000
export const RADIUS_STEP_METERS = 500

export type NominatimOsmType = "node" | "way" | "relation"

export function buildNominatimUserAgent(contactEmail: string): string {
  return `mapposter-web/1.0 (+${NOMINATIM_APP_URL}; mailto:${contactEmail})`
}

export function buildNominatimSearchUrl(
  city: string,
  country: string,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): string {
  const params = new URLSearchParams({
    q: `${city}, ${country}`,
    format: "json",
    limit: "1",
    polygon_geojson: "1",
    polygon_threshold: "0.005",
    email: contactEmail,
  })

  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`
}

export function osmIdToLookupToken(osmType: NominatimOsmType, osmId: number): string {
  const prefix = osmType === "node" ? "N" : osmType === "way" ? "W" : "R"
  return `${prefix}${osmId}`
}

export function buildNominatimLookupUrl(
  osmType: NominatimOsmType,
  osmId: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): string {
  const params = new URLSearchParams({
    osm_ids: osmIdToLookupToken(osmType, osmId),
    format: "geojson",
    polygon_geojson: "1",
    polygon_threshold: "0.005",
    email: contactEmail,
  })

  return `${NOMINATIM_LOOKUP_URL}?${params.toString()}`
}

export function buildNominatimRequestHeaders(
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Record<string, string> {
  return {
    "User-Agent": buildNominatimUserAgent(contactEmail),
    Accept: "application/json",
    Referer: NOMINATIM_APP_URL,
  }
}

export interface NominatimSearchResult {
  latitude: number
  longitude: number
  displayName: string
  suggestedRadiusMeters: number
  osmType?: NominatimOsmType
  osmId?: number
}

/** Nominatim boundingbox: [south lat, north lat, west lon, east lon] */
export function centerFromBoundingBox(
  boundingbox: [number, number, number, number],
): { latitude: number; longitude: number } {
  const [south, north, west, east] = boundingbox
  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
  }
}

/** Nominatim boundingbox: [south lat, north lat, west lon, east lon] */
export function suggestedRadiusFromBoundingBox(
  boundingbox: [number, number, number, number],
  centerLatitude: number,
): number {
  const [south, north, west, east] = boundingbox
  const halfLatMeters = (Math.abs(north - south) / 2) * 111_320
  const halfLonMeters =
    (Math.abs(east - west) / 2) * 111_320 * Math.cos((centerLatitude * Math.PI) / 180)
  // Slight padding so the place fills the poster without clipping edges.
  const padded = Math.max(halfLatMeters, halfLonMeters) * 1.15
  const stepped = Math.round(padded / RADIUS_STEP_METERS) * RADIUS_STEP_METERS
  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, stepped))
}

function parseBoundingBox(
  raw: unknown,
): [number, number, number, number] | null {
  if (!Array.isArray(raw) || raw.length < 4) {
    return null
  }

  const values = raw.slice(0, 4).map((value) => Number(value))
  if (values.some((value) => !Number.isFinite(value))) {
    return null
  }

  return [values[0]!, values[1]!, values[2]!, values[3]!]
}

function parseOsmType(raw: unknown): NominatimOsmType | undefined {
  if (raw === "node" || raw === "way" || raw === "relation") {
    return raw
  }
  return undefined
}

export async function fetchNominatimGeocode(
  city: string,
  country: string,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Promise<
  | { ok: true; result: NominatimSearchResult }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(buildNominatimSearchUrl(city, country, contactEmail), {
    headers: buildNominatimRequestHeaders(contactEmail),
  })

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Nominatim request failed (${response.status})`,
    }
  }

  const results = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
    boundingbox?: string[]
    osm_type?: string
    osm_id?: number
  }>
  const first = results[0]
  if (!first) {
    return { ok: false, status: 404, error: "No results found" }
  }

  const pointLatitude = Number(first.lat)
  const pointLongitude = Number(first.lon)
  const bbox = parseBoundingBox(first.boundingbox)
  const center = bbox ? centerFromBoundingBox(bbox) : { latitude: pointLatitude, longitude: pointLongitude }
  const suggestedRadiusMeters = bbox
    ? suggestedRadiusFromBoundingBox(bbox, center.latitude)
    : 10000
  const osmType = parseOsmType(first.osm_type)
  const osmId = typeof first.osm_id === "number" ? first.osm_id : undefined

  return {
    ok: true,
    result: {
      latitude: center.latitude,
      longitude: center.longitude,
      displayName: first.display_name,
      suggestedRadiusMeters,
      ...(osmType && osmId != null ? { osmType, osmId } : {}),
    },
  }
}

export async function fetchNominatimBoundary(
  osmType: NominatimOsmType,
  osmId: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Promise<
  | { ok: true; geometry: Polygon | MultiPolygon }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(buildNominatimLookupUrl(osmType, osmId, contactEmail), {
    headers: buildNominatimRequestHeaders(contactEmail),
  })

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Nominatim lookup failed (${response.status})`,
    }
  }

  const payload = (await response.json()) as FeatureCollection
  const feature = payload.features?.[0]
  const geometry = feature?.geometry
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
    return { ok: false, status: 404, error: "No boundary polygon found" }
  }

  return { ok: true, geometry }
}
