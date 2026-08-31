import type { OsmFeature, Viewport } from "@/lib/types"

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

function highwaySelector(viewport: Viewport): string {
  const { latitude, longitude, radiusMeters } = viewport
  const around = `around:${Math.round(radiusMeters)},${latitude},${longitude}`

  if (radiusMeters <= 6000) {
    return `way["highway"](${around})`
  }

  if (radiusMeters <= 12000) {
    return `way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street)$"](${around})`
  }

  return `way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"](${around})`
}

function buildQuery(viewport: Viewport): string {
  const { latitude, longitude, radiusMeters } = viewport
  const around = `around:${Math.round(radiusMeters)},${latitude},${longitude}`

  return `[out:json][timeout:90];
(
  ${highwaySelector(viewport)};
  relation["natural"="water"](${around});
  way["natural"="water"](${around});
  way["waterway"](${around});
  relation["leisure"="park"](${around});
  way["leisure"="park"](${around});
  way["landuse"="grass"](${around});
  way["landuse"="forest"](${around});
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

async function fetchFromProxy(query: string): Promise<OsmFeature[]> {
  const response = await fetch("/api/overpass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? `Overpass proxy failed (${response.status})`)
  }

  const payload = (await response.json()) as OverpassResponse
  return toFeatures(payload)
}

export async function fetchOsmFeatures(viewport: Viewport): Promise<OsmFeature[]> {
  const query = buildQuery(viewport)
  return fetchFromProxy(query)
}
