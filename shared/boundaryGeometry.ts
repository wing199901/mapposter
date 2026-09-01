import type { MultiPolygon, Polygon, Position } from "geojson"

function collectPositions(geometry: Polygon | MultiPolygon): Position[] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat()
  }
  return geometry.coordinates.flatMap((polygon) => polygon.flat())
}

export function geometryBbox(
  geometry: Polygon | MultiPolygon,
): [west: number, south: number, east: number, north: number] {
  const positions = collectPositions(geometry)
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity

  for (const [lon, lat] of positions) {
    west = Math.min(west, lon)
    south = Math.min(south, lat)
    east = Math.max(east, lon)
    north = Math.max(north, lat)
  }

  return [west, south, east, north]
}

export function geometryBboxCenter(
  geometry: Polygon | MultiPolygon,
): { latitude: number; longitude: number } {
  const [west, south, east, north] = geometryBbox(geometry)
  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
  }
}

/** Approximate max bbox dimension in meters (diagonal of the place bounding box). */
export function geometryBboxDiagonalMeters(
  geometry: Polygon | MultiPolygon,
  latitude: number,
): number {
  const [west, south, east, north] = geometryBbox(geometry)
  const latMeters = Math.abs(north - south) * 111_320
  const lonMeters =
    Math.abs(east - west) * 111_320 * Math.cos((latitude * Math.PI) / 180)
  return Math.hypot(latMeters, lonMeters)
}

/**
 * Neighborhood-level OSM ways/nodes often return a polygon far smaller than the
 * poster viewport. Masking against those would blur almost the entire map.
 */
export function boundaryNeedsEnclosingAdmin(
  geometry: Polygon | MultiPolygon,
  radiusMeters: number,
): boolean {
  const center = geometryBboxCenter(geometry)
  const diagonal = geometryBboxDiagonalMeters(geometry, center.latitude)
  return diagonal < radiusMeters * 1.5
}
