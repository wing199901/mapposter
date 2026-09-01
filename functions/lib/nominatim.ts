import {
  fetchNominatimBoundary,
  fetchNominatimGeocode,
  NOMINATIM_DEFAULT_CONTACT_EMAIL,
} from "../../shared/nominatim"

export function resolveGeocodeContactEmail(env: { GEOCODE_CONTACT_EMAIL?: string }): string {
  const configured = env.GEOCODE_CONTACT_EMAIL?.trim()
  return configured || NOMINATIM_DEFAULT_CONTACT_EMAIL
}

export async function geocodeFromNominatim(
  city: string,
  country: string,
  env: { GEOCODE_CONTACT_EMAIL?: string },
) {
  return fetchNominatimGeocode(city, country, resolveGeocodeContactEmail(env))
}

export async function boundaryFromNominatim(
  osmType: "node" | "way" | "relation",
  osmId: number,
  env: { GEOCODE_CONTACT_EMAIL?: string },
) {
  return fetchNominatimBoundary(osmType, osmId, resolveGeocodeContactEmail(env))
}
