import { useEffect, useState, type CSSProperties } from "react"
import type { Map } from "maplibre-gl"
import type { MultiPolygon, Polygon } from "geojson"

import { insideBoundaryClipPath } from "./projectBoundaryToScreen"

/** Screen-space clip path for the place boundary; updates on map move/zoom/resize. */
export function useBoundaryScreenClipPath(
  map: Map | null,
  boundary: Polygon | MultiPolygon | null,
  enabled: boolean,
): string | null {
  const [clipPath, setClipPath] = useState<string | null>(null)

  useEffect(() => {
    if (!map || !enabled || !boundary) {
      setClipPath(null)
      return
    }

    const update = () => {
      setClipPath(insideBoundaryClipPath(map, boundary))
    }

    update()
    map.on("move", update)
    map.on("zoom", update)
    map.on("resize", update)
    map.on("idle", update)

    return () => {
      map.off("move", update)
      map.off("zoom", update)
      map.off("resize", update)
      map.off("idle", update)
    }
  }, [boundary, enabled, map])

  return clipPath
}

export function boundaryClipStyle(clipPath: string | null): CSSProperties | undefined {
  if (!clipPath) {
    return undefined
  }
  const value = `path(evenodd, '${clipPath}')`
  return {
    clipPath: value,
    WebkitClipPath: value,
  }
}
