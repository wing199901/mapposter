import { useEffect, useState } from "react"

import type { OsmType, PosterConfig } from "@/lib/types"

import { fetchPlaceBoundary } from "./fetchPlaceBoundary"

export function usePlaceBoundary(
  config: Pick<PosterConfig, "placeOsmType" | "placeOsmId" | "viewport">,
) {
  const [boundaryGeometry, setBoundaryGeometry] = useState<
    GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  >(null)
  const [boundaryAvailable, setBoundaryAvailable] = useState(false)
  const [boundaryLoading, setBoundaryLoading] = useState(false)

  useEffect(() => {
    const { placeOsmType, placeOsmId } = config
    if (!placeOsmType || placeOsmId == null) {
      setBoundaryGeometry(null)
      setBoundaryAvailable(false)
      setBoundaryLoading(false)
      return
    }

    let cancelled = false
    setBoundaryLoading(true)

    void fetchPlaceBoundary(placeOsmType, placeOsmId, config.viewport.radiusMeters)
      .then((geometry) => {
        if (cancelled) {
          return
        }
        setBoundaryGeometry(geometry)
        setBoundaryAvailable(geometry !== null)
      })
      .catch(() => {
        if (!cancelled) {
          setBoundaryGeometry(null)
          setBoundaryAvailable(false)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBoundaryLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [config.placeOsmType, config.placeOsmId, config.viewport.radiusMeters])

  return { boundaryGeometry, boundaryAvailable, boundaryLoading }
}

export function hasPlaceReference(
  config: Pick<PosterConfig, "placeOsmType" | "placeOsmId">,
): config is { placeOsmType: OsmType; placeOsmId: number } {
  return config.placeOsmType != null && config.placeOsmId != null
}
