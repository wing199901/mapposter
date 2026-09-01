import { useEffect, useId, useState } from "react"
import type { Map } from "maplibre-gl"
import type { MultiPolygon, Polygon } from "geojson"

import { outsideBoundaryMaskPath } from "./projectBoundaryToScreen"

interface BoundaryBlurOverlayProps {
  map: Map | null
  boundary: Polygon | MultiPolygon | null
  enabled: boolean
  backgroundColor: string
}

export function BoundaryBlurOverlay({
  map,
  boundary,
  enabled,
  backgroundColor,
}: BoundaryBlurOverlayProps) {
  const maskId = useId().replace(/:/g, "")
  const [maskPath, setMaskPath] = useState<string | null>(null)

  useEffect(() => {
    if (!map || !enabled || !boundary) {
      setMaskPath(null)
      return
    }

    const update = () => {
      setMaskPath(outsideBoundaryMaskPath(map, boundary))
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

  if (!enabled || !maskPath) {
    return null
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-1 size-full"
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <path d={maskPath} fill="white" fillRule="evenodd" />
        </mask>
      </defs>
      <foreignObject width="100%" height="100%" mask={`url(#${maskId})`}>
        <div
          style={{
            width: "100%",
            height: "100%",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: `${backgroundColor}CC`,
          }}
        />
      </foreignObject>
    </svg>
  )
}
