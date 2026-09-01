import { describe, expect, it } from "vitest"

import { buildInvertedMask } from "@/features/boundary/buildInvertedMask"

describe("buildInvertedMask", () => {
  it("creates a world polygon with the place boundary as a hole", () => {
    const boundary: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [2.25, 48.8],
          [2.45, 48.8],
          [2.45, 48.92],
          [2.25, 48.92],
          [2.25, 48.8],
        ],
      ],
    }

    const mask = buildInvertedMask(boundary)
    expect(mask.type).toBe("Polygon")
    expect(mask.coordinates).toHaveLength(2)
    expect(mask.coordinates[0]).toHaveLength(5)
    expect(mask.coordinates[1]?.[0]).toEqual([2.25, 48.8])
  })
})
