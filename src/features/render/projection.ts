import type { Viewport } from "@/lib/types"

const EARTH_RADIUS = 6378137

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

export function fitToCanvas(
  projector: Projector,
  width: number,
  height: number,
  paddingRatio = 0.08,
): (point: [number, number]) => [number, number] {
  const { minX, maxX, minY, maxY } = projector.bounds
  const dataWidth = maxX - minX
  const dataHeight = maxY - minY
  const padX = dataWidth * paddingRatio
  const padY = dataHeight * paddingRatio
  const scale = Math.min(
    width / (dataWidth + padX * 2),
    height / (dataHeight + padY * 2),
  )
  const offsetX = (width - (dataWidth + padX * 2) * scale) / 2
  const offsetY = (height - (dataHeight + padY * 2) * scale) / 2

  return ([x, y]) => [
    offsetX + (x - minX + padX) * scale,
    offsetY + (y - minY + padY) * scale,
  ]
}
