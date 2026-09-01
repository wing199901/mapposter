import { describe, expect, it } from "vitest"

import { viewportToMapView } from "@/features/tiles/viewportToMapView"

describe("export map framing", () => {
  it("keeps the same geographic radius when capture width changes", () => {
    const viewport = {
      latitude: 22.3,
      longitude: 114.2,
      radiusMeters: 32_000,
    }
    const preview = viewportToMapView(viewport, 1138)
    const capture = viewportToMapView(viewport, 2560)

    expect(capture.zoom).toBeGreaterThan(preview.zoom)
    expect(capture.center).toEqual(preview.center)
  })
})
