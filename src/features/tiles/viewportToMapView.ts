import type { Viewport } from "@/lib/types"

const EARTH_CIRCUMFERENCE_M = 40075016.686

function metersPerPixel(latitude: number, zoom: number): number {
  const latRad = (latitude * Math.PI) / 180
  return (EARTH_CIRCUMFERENCE_M * Math.cos(latRad)) / (256 * 2 ** zoom)
}

/** Fit viewport radius into map width (diameter = 2 × radius). */
export function viewportToMapView(
  viewport: Viewport,
  mapWidthPx: number,
): { center: [number, number]; zoom: number } {
  const diameterMeters = viewport.radiusMeters * 2
  const mpp = diameterMeters / Math.max(mapWidthPx, 1)
  const latRad = (viewport.latitude * Math.PI) / 180
  const rawZoom = Math.log2((EARTH_CIRCUMFERENCE_M * Math.cos(latRad)) / (256 * mpp))
  return {
    center: [viewport.longitude, viewport.latitude],
    zoom: Math.min(16, Math.max(7, rawZoom)),
  }
}

export function mapViewToRadiusMeters(
  latitude: number,
  zoom: number,
  mapWidthPx: number,
): number {
  const mpp = metersPerPixel(latitude, zoom)
  return (mapWidthPx / 2) * mpp
}
