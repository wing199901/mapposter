import { describe, expect, it } from "vitest"

import {
  boundaryNeedsEnclosingAdmin,
  geometryBboxDiagonalMeters,
} from "../../shared/boundaryGeometry"

describe("boundaryGeometry", () => {
  it("detects tiny place polygons that are smaller than the poster viewport", () => {
    const tinyNeighborhood: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [114.2140726, 22.3226389],
          [114.2142808, 22.3226389],
          [114.2142808, 22.3242956],
          [114.2140726, 22.3242956],
          [114.2140726, 22.3226389],
        ],
      ],
    }

    const diagonal = geometryBboxDiagonalMeters(tinyNeighborhood, 22.323)
    expect(diagonal).toBeLessThan(500)
    expect(boundaryNeedsEnclosingAdmin(tinyNeighborhood, 4000)).toBe(true)
  })

  it("keeps city-scale relation boundaries without upgrading", () => {
    const cityScale: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [113.8, 22.15],
          [114.5, 22.15],
          [114.5, 22.56],
          [113.8, 22.56],
          [113.8, 22.15],
        ],
      ],
    }

    expect(boundaryNeedsEnclosingAdmin(cityScale, 4000)).toBe(false)
  })
})
