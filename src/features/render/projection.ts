import type { MapShape, Viewport } from "@/lib/types"

const EARTH_RADIUS = 6378137
const CIRCULAR_INSET = 0.04
const RECTANGULAR_PADDING = 0.08

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
  clip: { cx: number; cy: number; radius: number } | null
}

export function fitToCanvas(
  projector: Projector,
  width: number,
  height: number,
  mapShape: MapShape = "circular",
): CanvasFit {
  const { minX, maxX, minY, maxY } = projector.bounds
  const dataWidth = maxX - minX
  const dataHeight = maxY - minY

  if (mapShape === "rectangular") {
    const padX = dataWidth * RECTANGULAR_PADDING
    const padY = dataHeight * RECTANGULAR_PADDING
    const scale = Math.min(
      width / (dataWidth + padX * 2),
      height / (dataHeight + padY * 2),
    )
    const offsetX = (width - (dataWidth + padX * 2) * scale) / 2
    const offsetY = (height - (dataHeight + padY * 2) * scale) / 2

    return {
      project([x, y]) {
        return [
          offsetX + (x - minX + padX) * scale,
          offsetY + (y - minY + padY) * scale,
        ]
      },
      clip: null,
    }
  }

  const targetWidth = width * (1 - CIRCULAR_INSET * 2)
  const scale = targetWidth / dataWidth
  const offsetX = (width - dataWidth * scale) / 2
  const offsetY = (height - dataHeight * scale) / 2

  return {
    project([x, y]) {
      return [offsetX + (x - minX) * scale, offsetY + (y - minY) * scale]
    },
    clip: {
      cx: width / 2,
      cy: height / 2,
      radius: (width / 2) * (1 - CIRCULAR_INSET),
    },
  }
}
