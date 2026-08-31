import { describe, expect, it } from "vitest"

import { createProjector, fitToCanvas, panViewportByDisplayDelta } from "@/features/render/projection"

const viewport = {
  latitude: 48.8566,
  longitude: 2.3522,
  radiusMeters: 10000,
}

describe("fitToCanvas", () => {
  it("covers the poster so the circular data edge is outside the frame", () => {
    const projector = createProjector(viewport)
    const width = 720
    const height = 560
    const fit = fitToCanvas(projector, width, height)

    const center = fit.project([0, 0])
    expect(center[0]).toBeCloseTo(360, 0)
    expect(center[1]).toBeCloseTo(280, 0)

    const edge = fit.project([viewport.radiusMeters, 0])
    const halfDiagonal = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
    const distanceFromCenter = Math.hypot(edge[0] - width / 2, edge[1] - height / 2)
    expect(distanceFromCenter).toBeGreaterThan(halfDiagonal)
  })
})

describe("panViewportByDisplayDelta", () => {
  it("moves longitude west when dragging the preview to the right", () => {
    const next = panViewportByDisplayDelta(viewport, 40, 0, 400, 533, 3600, 4800)
    expect(next.longitude).toBeLessThan(viewport.longitude)
    expect(next.latitude).toBeCloseTo(viewport.latitude, 8)
  })

  it("moves latitude north when dragging the preview downward", () => {
    const next = panViewportByDisplayDelta(viewport, 0, 40, 400, 533, 3600, 4800)
    expect(next.latitude).toBeGreaterThan(viewport.latitude)
    expect(next.longitude).toBeCloseTo(viewport.longitude, 8)
  })
})
