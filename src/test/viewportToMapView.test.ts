import { describe, expect, it } from "vitest"

import { mapViewToRadiusMeters, viewportToMapView } from "@/features/tiles/viewportToMapView"

describe("viewportToMapView", () => {
  it("derives zoom from radius and map width", () => {
    const view = viewportToMapView(
      { latitude: 48.8566, longitude: 2.3522, radiusMeters: 10000 },
      640,
    )
    expect(view.center).toEqual([2.3522, 48.8566])
    expect(view.zoom).toBeGreaterThan(7)
    expect(view.zoom).toBeLessThanOrEqual(16)
  })

  it("round-trips radius within tolerance", () => {
    const viewport = { latitude: 22.3193, longitude: 114.1694, radiusMeters: 25000 }
    const mapWidth = 800
    const view = viewportToMapView(viewport, mapWidth)
    const radius = mapViewToRadiusMeters(viewport.latitude, view.zoom, mapWidth)
    expect(Math.abs(radius - viewport.radiusMeters) / viewport.radiusMeters).toBeLessThan(0.05)
  })
})
