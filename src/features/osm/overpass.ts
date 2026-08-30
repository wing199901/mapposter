import type { OsmFeature, Viewport } from "@/lib/types"

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
]

type OverpassElement = {
  type: "way" | "relation" | "node"
  id: number
  tags?: Record<string, string>
  geometry?: Array<{ lat: number; lon: number }>
  members?: Array<{
    type: string
    ref: number
    role: string
    geometry?: Array<{ lat: number; lon: number }>
  }>
}

type OverpassResponse = {
  elements: OverpassElement[]
}

function buildQuery(viewport: Viewport): string {
  const { latitude, longitude, radiusMeters } = viewport

  return `[out:json][timeout:90];
(
  way["highway"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  relation["natural"="water"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  way["natural"="water"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  way["waterway"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  relation["leisure"="park"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  way["leisure"="park"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  way["landuse"="grass"](around:${Math.round(radiusMeters)},${latitude},${longitude});
  way["landuse"="forest"](around:${Math.round(radiusMeters)},${latitude},${longitude});
);
out geom;`
}

function geometryFromElement(element: OverpassElement): Array<[number, number]> | null {
  if (element.geometry && element.geometry.length >= 2) {
    return element.geometry.map((point) => [point.lat, point.lon])
  }

  if (element.members) {
    for (const member of element.members) {
      if (member.geometry && member.geometry.length >= 2) {
        return member.geometry.map((point) => [point.lat, point.lon])
      }
    }
  }

  return null
}

function classifyElement(element: OverpassElement): OsmFeature["layer"] | null {
  const tags = element.tags ?? {}

  if (tags.highway) {
    return "roads"
  }

  if (tags.natural === "water" || tags.waterway) {
    return "water"
  }

  if (tags.leisure === "park" || tags.landuse === "grass" || tags.landuse === "forest") {
    return "parks"
  }

  return null
}

function toFeatures(response: OverpassResponse): OsmFeature[] {
  const features: OsmFeature[] = []

  for (const element of response.elements) {
    const layer = classifyElement(element)
    const coordinates = geometryFromElement(element)
    if (!layer || !coordinates) {
      continue
    }

    const isPolygon = layer !== "roads" && coordinates.length >= 3
    features.push({
      id: `${element.type}/${element.id}`,
      layer,
      geometry: isPolygon
        ? { type: "polygon", coordinates }
        : { type: "line", coordinates },
      tags: element.tags ?? {},
    })
  }

  return features
}

async function fetchFromEndpoint(endpoint: string, query: string): Promise<OsmFeature[]> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass error ${response.status} from ${endpoint}`)
  }

  const payload = (await response.json()) as OverpassResponse
  return toFeatures(payload)
}

export async function fetchOsmFeatures(viewport: Viewport): Promise<OsmFeature[]> {
  const query = buildQuery(viewport)
  const attempts = await Promise.allSettled(
    OVERPASS_ENDPOINTS.map((endpoint) => fetchFromEndpoint(endpoint, query)),
  )

  const success = attempts.find((result) => result.status === "fulfilled")
  if (success && success.status === "fulfilled") {
    return success.value
  }

  const message = attempts
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason))
    .join("; ")

  throw new Error(message || "All Overpass endpoints failed")
}
