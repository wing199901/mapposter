import type { GeocodeQuery, GeocodeResult } from "@/lib/types"

import {
  geocodeCacheKey,
  readGeocodeCache,
  writeGeocodeCache,
  type GeocodeBundle,
} from "./cache"

const NOMINATIM_BASE = "/api/geocode"

export interface GeocodeCityIo {
  fetchImpl?: typeof fetch
  readCache?: (key: string) => Promise<GeocodeBundle | undefined>
  writeCache?: (key: string, bundle: GeocodeBundle) => Promise<void>
}

function resultFromBundle(bundle: GeocodeBundle): GeocodeResult {
  return {
    latitude: bundle.latitude,
    longitude: bundle.longitude,
    displayName: bundle.displayName,
    placeLocalName: bundle.placeLocalName,
    placeLatinName: bundle.placeLatinName,
    countryLocalName: bundle.countryLocalName,
    countryLatinName: bundle.countryLatinName,
    countryCode: bundle.countryCode,
    suggestedRadiusMeters: bundle.suggestedRadiusMeters,
    osmType: bundle.osmType,
    osmId: bundle.osmId,
  }
}

export async function geocodeCity(query: GeocodeQuery, io: GeocodeCityIo = {}): Promise<GeocodeResult> {
  const fetchImpl = io.fetchImpl ?? fetch
  const readCache = io.readCache ?? readGeocodeCache
  const writeCache = io.writeCache ?? writeGeocodeCache
  const key = geocodeCacheKey(query)

  try {
    const cached = await readCache(key)
    if (cached) {
      return resultFromBundle(cached)
    }
  } catch {
    // A broken browser cache must not block a fresh lookup.
  }

  const params = new URLSearchParams({
    city: query.city,
    country: query.country,
  })

  const response = await fetchImpl(`${NOMINATIM_BASE}?${params.toString()}`)
  const payload = (await response.json()) as GeocodeResult | { error: string }
  if (!response.ok || "error" in payload) {
    const message = "error" in payload ? payload.error : `Geocoding failed (${response.status})`
    throw new Error(`${response.status}:${message}`)
  }

  try {
    await writeCache(key, { ...payload, fetchedAt: Date.now() })
  } catch {
    // The lookup result is still valid if the browser cannot store it.
  }

  return payload
}

export async function geocodeDirect(
  latitude: number,
  longitude: number,
): Promise<GeocodeResult> {
  return {
    latitude,
    longitude,
    displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
  }
}
