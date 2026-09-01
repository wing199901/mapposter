import type { Polygon, Position } from "geojson"

const WORLD_OUTER_RING: Position[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
]

function reverseRing(ring: Position[]): Position[] {
  return [...ring].reverse()
}

export function buildInvertedMask(boundary: Polygon | GeoJSON.MultiPolygon): Polygon {
  if (boundary.type === "Polygon") {
    const holes = boundary.coordinates.map((ring) => reverseRing(ring))
    return {
      type: "Polygon",
      coordinates: [WORLD_OUTER_RING, ...holes],
    }
  }

  const holes = boundary.coordinates.flatMap((polygon) =>
    polygon.map((ring) => reverseRing(ring)),
  )

  return {
    type: "Polygon",
    coordinates: [WORLD_OUTER_RING, ...holes],
  }
}

export function boundaryToFeatureCollection(
  boundary: Polygon | GeoJSON.MultiPolygon,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: buildInvertedMask(boundary),
      },
    ],
  }
}
