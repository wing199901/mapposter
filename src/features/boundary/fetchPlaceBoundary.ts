import type { OsmType } from "@/lib/types"

import {
  placeBoundaryCacheKey,
  readBoundaryCache,
  writeBoundaryCache,
} from "@/features/geocode/cache"

const BOUNDARY_BASE = "/api/boundary"

export async function fetchPlaceBoundary(
  osmType: OsmType,
  osmId: number,
  radiusMeters?: number,
): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon | null> {
  const cacheKey = placeBoundaryCacheKey(osmType, osmId, radiusMeters)
  const cached = await readBoundaryCache(cacheKey)
  if (cached) {
    return cached.geometry
  }

  const params = new URLSearchParams({
    osmType,
    osmId: String(osmId),
  })
  if (radiusMeters != null) {
    params.set("radiusMeters", String(radiusMeters))
  }

  const response = await fetch(`${BOUNDARY_BASE}?${params.toString()}`)
  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as
    | { geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon }
    | { error: string }

  if (!("geometry" in payload)) {
    return null
  }

  await writeBoundaryCache(cacheKey, {
    geometry: payload.geometry,
    fetchedAt: Date.now(),
  })

  return payload.geometry
}
