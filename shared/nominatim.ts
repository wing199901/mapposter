import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

import {
  boundaryNeedsEnclosingAdmin,
  geometryBboxCenter,
  geometryBboxDiagonalMeters,
} from "./boundaryGeometry.js"

export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
export const NOMINATIM_LOOKUP_URL = "https://nominatim.openstreetmap.org/lookup"
export const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
export const NOMINATIM_APP_URL = "https://mapposter.wing199901.workers.dev"
export const NOMINATIM_DEFAULT_CONTACT_EMAIL = "wing199901@users.noreply.github.com"

export const MIN_RADIUS_METERS = 4000
export const MAX_RADIUS_METERS = 50000
export const RADIUS_STEP_METERS = 500

export type NominatimOsmType = "node" | "way" | "relation"

export function buildNominatimUserAgent(contactEmail: string): string {
  return `mapposter-web/1.0 (+${NOMINATIM_APP_URL}; mailto:${contactEmail})`
}

export interface GeocodeSearchAttempt {
  q: string
  countrycodes?: string
}

export function buildGeocodeSearchAttempts(
  city: string,
  country: string,
): GeocodeSearchAttempt[] {
  const place = city.trim()
  const region = country.trim()
  if (!place || !region) {
    return []
  }

  const attempts: GeocodeSearchAttempt[] = []
  const seen = new Set<string>()

  const add = (q: string, countrycodes?: string) => {
    const key = `${q}\0${countrycodes ?? ""}`
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    attempts.push({ q, countrycodes })
  }

  const regionLower = region.toLowerCase()
  const isHongKong =
    regionLower === "hong kong" || regionLower === "hk" || region === "香港"

  if (isHongKong) {
    // Prefer HK-scoped queries first — e.g. "Hong Kong Island" vs the SAR "Hong Kong".
    add(`${place}, Hong Kong`, "hk")
    add(place, "hk")
    add(`${place}, China`, "hk")
  }

  add(`${place}, ${region}`)
  if (isHongKong) {
    add(`${place}, China`)
  }

  return attempts
}

export function buildNominatimSearchUrl(
  attempt: GeocodeSearchAttempt,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): string {
  const params = new URLSearchParams({
    q: attempt.q,
    format: "json",
    limit: "1",
    namedetails: "1",
    addressdetails: "1",
    email: contactEmail,
  })

  if (attempt.countrycodes) {
    params.set("countrycodes", attempt.countrycodes)
  }

  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`
}

export function osmIdToLookupToken(osmType: NominatimOsmType, osmId: number): string {
  const prefix = osmType === "node" ? "N" : osmType === "way" ? "W" : "R"
  return `${prefix}${osmId}`
}

export function buildNominatimReverseUrl(
  latitude: number,
  longitude: number,
  zoom: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): string {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "geojson",
    polygon_geojson: "1",
    zoom: String(zoom),
    email: contactEmail,
  })

  return `${NOMINATIM_REVERSE_URL}?${params.toString()}`
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
  placeLocalName?: string
  placeLatinName: string
  countryLocalName?: string
  countryLatinName: string
  countryCode?: string
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

type NominatimSearchHit = {
  lat: string
  lon: string
  display_name: string
  namedetails?: Record<string, string>
  address?: Record<string, string>
  boundingbox?: string[]
  osm_type?: string
  osm_id?: number
}

type NominatimResolvedNames = Pick<
  NominatimSearchResult,
  "placeLocalName" | "placeLatinName" | "countryLocalName" | "countryLatinName" | "countryCode"
>

const PLACE_LOCAL_KEYS = ["name:zh-Hant", "name:zh", "name:ja", "name:ko"] as const
const PLACE_LATIN_KEYS = ["name:en", "name:latin"] as const
const LATIN_RANGE = /[\u0000-\u024F]/u

function pickFirstString(
  source: Record<string, string> | undefined,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = source?.[key]?.trim()
    if (value) {
      return value
    }
  }
  return undefined
}

function isMostlyLatin(text: string): boolean {
  const letters = [...text].filter((char) => /\p{L}/u.test(char))
  if (letters.length === 0) {
    return true
  }
  const latinCount = letters.filter((char) => LATIN_RANGE.test(char)).length
  return latinCount / letters.length > 0.8
}

function fallbackNameFromDisplayName(displayName: string, index: number): string | undefined {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  return parts[index]
}

function countryKeysForPlaceLocal(localKey: typeof PLACE_LOCAL_KEYS[number] | undefined): string[] {
  switch (localKey) {
    case "name:zh-Hant":
      return ["country:zh-Hant", "country:zh"]
    case "name:zh":
      return ["country:zh", "country:zh-Hant"]
    case "name:ja":
      return ["country:ja"]
    case "name:ko":
      return ["country:ko"]
    default:
      return []
  }
}

export function parseNominatimNameDetails(
  hit: Pick<NominatimSearchHit, "display_name" | "namedetails" | "address">,
): NominatimResolvedNames {
  const placeLocalKey = PLACE_LOCAL_KEYS.find((key) => hit.namedetails?.[key]?.trim())
  const placeLocalName = placeLocalKey ? hit.namedetails?.[placeLocalKey]?.trim() : undefined
  const placeLatinName =
    pickFirstString(hit.namedetails, PLACE_LATIN_KEYS) ??
    fallbackNameFromDisplayName(hit.display_name, 0) ??
    hit.display_name

  const countryLatinName =
    pickFirstString(hit.address, ["country:en"]) ??
    (hit.address?.country && isMostlyLatin(hit.address.country) ? hit.address.country.trim() : undefined) ??
    fallbackNameFromDisplayName(hit.display_name, 2) ??
    placeLatinName

  if (!placeLocalName) {
    return {
      placeLocalName: undefined,
      placeLatinName,
      countryLocalName: undefined,
      countryLatinName,
      countryCode: hit.address?.country_code?.trim(),
    }
  }

  const countryLocalName =
    pickFirstString(hit.address, countryKeysForPlaceLocal(placeLocalKey)) ??
    (hit.address?.country?.trim() || undefined)

  return {
    placeLocalName,
    placeLatinName,
    countryLocalName,
    countryLatinName,
    countryCode: hit.address?.country_code?.trim(),
  }
}

function parseNominatimSearchHit(hit: NominatimSearchHit | undefined): NominatimSearchResult | null {
  if (!hit) {
    return null
  }

  const pointLatitude = Number(hit.lat)
  const pointLongitude = Number(hit.lon)
  const bbox = parseBoundingBox(hit.boundingbox)
  const center = bbox
    ? centerFromBoundingBox(bbox)
    : { latitude: pointLatitude, longitude: pointLongitude }
  const suggestedRadiusMeters = bbox
    ? suggestedRadiusFromBoundingBox(bbox, center.latitude)
    : 10000
  const osmType = parseOsmType(hit.osm_type)
  const osmId = typeof hit.osm_id === "number" ? hit.osm_id : undefined
  const names = parseNominatimNameDetails(hit)

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    displayName: hit.display_name,
    ...names,
    suggestedRadiusMeters,
    ...(osmType && osmId != null ? { osmType, osmId } : {}),
  }
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function fetchNominatimGeocode(
  city: string,
  country: string,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Promise<
  | { ok: true; result: NominatimSearchResult }
  | { ok: false; status: number; error: string }
> {
  const attempts = buildGeocodeSearchAttempts(city, country)
  if (attempts.length === 0) {
    return { ok: false, status: 400, error: "city and country are required" }
  }

  for (let index = 0; index < attempts.length; index += 1) {
    if (index > 0) {
      await sleepMs(1100)
    }

    const attempt = attempts[index]!
    const response = await fetch(buildNominatimSearchUrl(attempt, contactEmail), {
      headers: buildNominatimRequestHeaders(contactEmail),
    })

    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        error: "Nominatim rate limit — try again shortly",
      }
    }

    if (!response.ok) {
      continue
    }

    const results = (await response.json()) as NominatimSearchHit[]
    const parsed = parseNominatimSearchHit(results[0])
    if (parsed) {
      return { ok: true, result: parsed }
    }
  }

  return { ok: false, status: 404, error: "No results found" }
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

export async function fetchNominatimReverseBoundary(
  latitude: number,
  longitude: number,
  zoom: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Promise<
  | { ok: true; geometry: Polygon | MultiPolygon }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    buildNominatimReverseUrl(latitude, longitude, zoom, contactEmail),
    {
      headers: buildNominatimRequestHeaders(contactEmail),
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Nominatim reverse failed (${response.status})`,
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

const ENCLOSING_ADMIN_MIN_ZOOM = 8
const ENCLOSING_ADMIN_MAX_ZOOM = 12

export async function fetchEnclosingAdminBoundary(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
): Promise<Polygon | MultiPolygon | null> {
  const minDiagonal = radiusMeters * 1.2
  const maxDiagonal = radiusMeters * 6
  let fallback: Polygon | MultiPolygon | null = null

  for (let zoom = ENCLOSING_ADMIN_MAX_ZOOM; zoom >= ENCLOSING_ADMIN_MIN_ZOOM; zoom -= 1) {
    const result = await fetchNominatimReverseBoundary(
      latitude,
      longitude,
      zoom,
      contactEmail,
    )
    if (!result.ok) {
      continue
    }

    const diagonal = geometryBboxDiagonalMeters(result.geometry, latitude)
    if (diagonal >= minDiagonal && diagonal <= maxDiagonal) {
      return result.geometry
    }

    if (diagonal >= minDiagonal) {
      fallback = result.geometry
    }
  }

  return fallback
}

export async function resolveBoundaryForMask(
  osmType: NominatimOsmType,
  osmId: number,
  contactEmail = NOMINATIM_DEFAULT_CONTACT_EMAIL,
  radiusMeters?: number,
): Promise<
  | { ok: true; geometry: Polygon | MultiPolygon }
  | { ok: false; status: number; error: string }
> {
  const primary = await fetchNominatimBoundary(osmType, osmId, contactEmail)
  if (!primary.ok) {
    return primary
  }

  if (
    radiusMeters == null ||
    !boundaryNeedsEnclosingAdmin(primary.geometry, radiusMeters)
  ) {
    return primary
  }

  const center = geometryBboxCenter(primary.geometry)
  const enclosing = await fetchEnclosingAdminBoundary(
    center.latitude,
    center.longitude,
    radiusMeters,
    contactEmail,
  )

  if (enclosing) {
    return { ok: true, geometry: enclosing }
  }

  return primary
}
