import { displayLabelsFromGeocodeResult } from "@/features/geocode/displayLabels"
import { notoFamilyForScript } from "@/lib/notoFonts"
import type { DisplayLabels, GeocodeResult, Viewport } from "@/lib/types"

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

export function placeLookupSuccessMessage(result: Pick<GeocodeResult, "suggestedRadiusMeters">): string {
  if (result.suggestedRadiusMeters != null) {
    return `Suggested map radius ${Math.round(result.suggestedRadiusMeters)} m from place size. The preview updates live.`
  }
  return "Place found. The preview updates live."
}

export function placeLookupFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ""
  if (message.startsWith("429:")) {
    return "Geocoding service is busy — wait a moment and try again."
  }
  return "Place lookup failed — check spelling, or use Coordinates."
}

export function applyGeocodeToPoster(
  current: { viewport: Viewport; centerLocked: boolean; fontFamily: string },
  query: { city: string; country: string },
  result: GeocodeResult,
): {
  geocode: { city: string; country: string }
  display: DisplayLabels
  fontFamily: string
  placeOsmType: GeocodeResult["osmType"]
  placeOsmId: number | undefined
  viewport: Viewport
} {
  const display = displayLabelsFromGeocodeResult(result)
  return {
    geocode: { city: query.city, country: query.country },
    display,
    fontFamily: display.scriptFamily != null ? notoFamilyForScript(display.scriptFamily) : current.fontFamily,
    placeOsmType: result.osmType,
    placeOsmId: result.osmId,
    viewport: viewportFromPlaceLookup(current, result),
  }
}
