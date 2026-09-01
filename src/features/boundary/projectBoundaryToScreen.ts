import type { Map } from "maplibre-gl"
import type { MultiPolygon, Polygon, Position } from "geojson"

function ringToScreenPath(map: Map, ring: Position[]): string {
  if (ring.length === 0) {
    return ""
  }
  const [first, ...rest] = ring
  const start = map.project([first![0], first![1]])
  const segments = rest.map((coord) => {
    const point = map.project([coord[0], coord[1]])
    return `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  })
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} ${segments.join(" ")} Z`
}

function polygonToScreenPaths(map: Map, polygon: Polygon): string[] {
  return polygon.coordinates.map((ring) => ringToScreenPath(map, ring))
}

/** Screen-space paths for the place boundary polygon rings. */
export function boundaryScreenPaths(
  map: Map,
  boundary: Polygon | MultiPolygon,
): string[] {
  if (boundary.type === "Polygon") {
    return polygonToScreenPaths(map, boundary)
  }
  return boundary.coordinates.flatMap((polygon) =>
    polygonToScreenPaths(map, { type: "Polygon", coordinates: polygon }),
  )
}

/** @deprecated Use boundaryScreenPaths */
export function boundaryHolePaths(
  map: Map,
  boundary: Polygon | MultiPolygon,
): string[] {
  return boundaryScreenPaths(map, boundary)
}

/** Screen-space even-odd path clipping to the place boundary (land only). */
export function insideBoundaryClipPath(
  map: Map,
  boundary: Polygon | MultiPolygon,
): string {
  return boundaryScreenPaths(map, boundary).join(" ")
}

/** Screen-space path covering the map viewport (outer ring for even-odd mask). */
export function mapViewportOuterPath(map: Map): string {
  const canvas = map.getCanvas()
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  return `M 0 0 H ${width} V ${height} H 0 Z`
}

export function outsideBoundaryMaskPath(
  map: Map,
  boundary: Polygon | MultiPolygon,
): string {
  const outer = mapViewportOuterPath(map)
  const holes = boundaryScreenPaths(map, boundary)
  return [outer, ...holes].join(" ")
}
