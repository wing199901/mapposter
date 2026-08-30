import type { GeocodeQuery, GeocodeResult } from "@/lib/types"

const NOMINATIM_BASE = "/api/geocode"

export async function geocodeCity(query: GeocodeQuery): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    city: query.city,
    country: query.country,
  })

  const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`)
  }

  const payload = (await response.json()) as GeocodeResult | { error: string }
  if ("error" in payload) {
    throw new Error(payload.error)
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
