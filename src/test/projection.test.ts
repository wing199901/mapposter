import { describe, expect, it } from "vitest"

import { createProjector, fitToCanvas } from "@/features/render/projection"

const viewport = {
  latitude: 48.8566,
  longitude: 2.3522,
  radiusMeters: 10000,
}

describe("fitToCanvas", () => {
  it("full-bleeds circular maps to poster width", () => {
    const projector = createProjector(viewport)
    const fit = fitToCanvas(projector, 720, 560, "circular")

    expect(fit.clip).not.toBeNull()
    expect(fit.clip?.cx).toBe(360)
    expect(fit.clip?.cy).toBe(280)
    expect(fit.clip?.radius).toBeCloseTo(345.6, 0)

    const center = fit.project([0, 0])
    expect(center[0]).toBeCloseTo(360, 0)
    expect(center[1]).toBeCloseTo(280, 0)
  })

  it("uses padded rectangular fit without clip", () => {
    const projector = createProjector(viewport)
    const fit = fitToCanvas(projector, 720, 560, "rectangular")

    expect(fit.clip).toBeNull()

    const center = fit.project([0, 0])
    expect(center[0]).toBeCloseTo(360, 0)
    expect(center[1]).toBeCloseTo(280, 0)
  })
})
