import type { Viewport } from "@/lib/types"

const EARTH_RADIUS = 6378137
/** Extra zoom so the circular OSM fetch edge sits outside the poster corners. */
const RECTANGULAR_COVER_BLEED = 1.04
/** Map band height ratio used by drawPoster (top portion of the canvas). */
export const MAP_BAND_HEIGHT_RATIO = 0.78

export interface Projector {
  project: (latitude: number, longitude: number) => [number, number]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export function createProjector(viewport: Viewport): Projector {
  const latRad = (viewport.latitude * Math.PI) / 180
  const cosLat = Math.cos(latRad)
  const radius = viewport.radiusMeters

  const minX = -radius
  const maxX = radius
  const minY = -radius
  const maxY = radius

  return {
    bounds: { minX, maxX, minY, maxY },
    project(latitude: number, longitude: number): [number, number] {
      const x =
        ((longitude - viewport.longitude) * Math.PI) / 180 * EARTH_RADIUS * cosLat
      const y = ((latitude - viewport.latitude) * Math.PI) / 180 * EARTH_RADIUS
      return [x, -y]
    },
  }
}

export interface CanvasFit {
  project: (point: [number, number]) => [number, number]
  /** Canvas pixels per projected meter. */
  scale: number
}

/**
 * Fit the circular OSM fetch window into the poster map band by covering the
 * rectangle (upstream maptoposter style — no circular clip mask).
 */
export function fitToCanvas(
  projector: Projector,
  width: number,
  height: number,
): CanvasFit {
  const { minX, maxX, minY, maxY } = projector.bounds
  const dataWidth = maxX - minX
  const dataRadius = dataWidth / 2
  const halfDiagonal = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
  const scale = (halfDiagonal / dataRadius) * RECTANGULAR_COVER_BLEED
  const offsetX = (width - dataWidth * scale) / 2
  const offsetY = (height - (maxY - minY) * scale) / 2

  return {
    scale,
    project([x, y]) {
      return [offsetX + (x - minX) * scale, offsetY + (y - minY) * scale]
    },
  }
}

/**
 * Convert a drag on the full poster image (CSS pixels) into a new map center.
 * Dragging the content right/down moves the center west/north (standard map pan).
 */
export function panViewportByDisplayDelta(
  viewport: Viewport,
  displayDeltaX: number,
  displayDeltaY: number,
  displayWidth: number,
  displayHeight: number,
  posterWidthPx: number,
  posterHeightPx: number,
): Pick<Viewport, "latitude" | "longitude"> {
  if (displayWidth <= 0 || displayHeight <= 0) {
    return { latitude: viewport.latitude, longitude: viewport.longitude }
  }

  const canvasDeltaX = (displayDeltaX / displayWidth) * posterWidthPx
  const canvasDeltaY = (displayDeltaY / displayHeight) * posterHeightPx
  const projector = createProjector(viewport)
  const { scale } = fitToCanvas(
    projector,
    posterWidthPx,
    posterHeightPx * MAP_BAND_HEIGHT_RATIO,
  )

  if (scale <= 0) {
    return { latitude: viewport.latitude, longitude: viewport.longitude }
  }

  const metersX = canvasDeltaX / scale
  const metersY = canvasDeltaY / scale
  const latRad = (viewport.latitude * Math.PI) / 180
  const cosLat = Math.max(0.2, Math.cos(latRad))
  const metersPerDegreeLat = (EARTH_RADIUS * Math.PI) / 180
  const metersPerDegreeLon = metersPerDegreeLat * cosLat

  // Screen +x → content moves east relative to view → center moves west
  // Screen +y → content moves south relative to view → center moves north
  // (projected Y is flipped: increasing projected Y is southward on canvas)
  return {
    latitude: viewport.latitude + metersY / metersPerDegreeLat,
    longitude: viewport.longitude - metersX / metersPerDegreeLon,
  }
}
