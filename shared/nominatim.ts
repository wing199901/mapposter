export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
export const NOMINATIM_APP_URL = "https://mapposter.wing199901.workers.dev"
export const NOMINATIM_DEFAULT_CONTACT_EMAIL = "wing199901@users.noreply.github.com"

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
    email: contactEmail,
  })

  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`
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
  }>
  const first = results[0]
  if (!first) {
    return { ok: false, status: 404, error: "No results found" }
  }

  return {
    ok: true,
    result: {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    },
  }
}
