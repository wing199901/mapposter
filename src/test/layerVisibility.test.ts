import { describe, expect, it } from "vitest"

import { loadTheme } from "@/features/themes/themeRegistry"
import {
  DEFAULT_LAYER_VISIBILITY,
  type PosterLayerVisibility,
} from "@/lib/types"
import { mapFeatureLayerIds, themeToMapStyle } from "@/features/tiles/themeToMapStyle"

function visibility(overrides: Partial<PosterLayerVisibility>): PosterLayerVisibility {
  return { ...DEFAULT_LAYER_VISIBILITY, ...overrides }
}

describe("layer visibility map style", () => {
  it("includes buildings layer when enabled", () => {
    const theme = loadTheme("terracotta")
    const style = themeToMapStyle(theme, {
      layerVisibility: visibility({ buildings: true }),
    })
    expect(style.layers.some((layer) => layer.id === "buildings")).toBe(true)
  })

  it("omits disabled road classes", () => {
    const theme = loadTheme("terracotta")
    const style = themeToMapStyle(theme, {
      layerVisibility: visibility({ roadMotorway: false, shipRoutes: false }),
    })
    expect(style.layers.some((layer) => layer.id === "road-motorway")).toBe(false)
    expect(style.layers.some((layer) => layer.id === "road-ferry")).toBe(false)
    expect(style.layers.some((layer) => layer.id === "road-primary")).toBe(true)
  })

  it("mapFeatureLayerIds reflects visibility toggles", () => {
    const ids = mapFeatureLayerIds({
      layerVisibility: visibility({ water: false, rail: true, shipRoutes: false }),
    })
    expect(ids).not.toContain("water")
    expect(ids).toContain("road-rail")
    expect(ids).not.toContain("road-ferry")
  })
})
