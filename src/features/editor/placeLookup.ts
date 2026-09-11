import type { GeocodeResult, Viewport } from "@/lib/types"

export function shouldSkipAutomaticPlaceLookup(input: {
  hydratedFromShareHash: boolean
  centerLocked: boolean
  placeEditedByUser: boolean
}): boolean {
  if (input.placeEditedByUser) {
    return false
  }

  return input.hydratedFromShareHash || input.centerLocked
}

export function viewportFromPlaceLookup(
  current: { viewport: Viewport; centerLocked: boolean },
  result: Pick<GeocodeResult, "latitude" | "longitude" | "suggestedRadiusMeters">,
): Viewport {
  if (current.centerLocked) {
    return { ...current.viewport }
  }

  return {
    ...current.viewport,
    latitude: result.latitude,
    longitude: result.longitude,
    radiusMeters: result.suggestedRadiusMeters ?? current.viewport.radiusMeters,
  }
}
