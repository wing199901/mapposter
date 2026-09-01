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
    expect(ids).not.toContain("water-detail")
    expect(ids).toContain("road-rail")
    expect(ids).not.toContain("road-ferry")
  })

  it("excludes mis-tagged harbour parks and landcover that would cover water", () => {
    const theme = loadTheme("terracotta")
    const style = themeToMapStyle(theme, {
      layerVisibility: visibility({ parks: true, water: true }),
    })
    const parksLayer = style.layers.find((layer) => layer.id === "parks")
    const landcoverLayer = style.layers.find((layer) => layer.id === "parks-landcover")
    expect(JSON.stringify(parksLayer && "filter" in parksLayer ? parksLayer.filter : null)).toContain(
      "conservation",
    )
    expect(
      JSON.stringify(landcoverLayer && "filter" in landcoverLayer ? landcoverLayer.filter : null),
    ).toContain("forest")
  })

  it("uses dual water layers for full coverage and narrow-bay detail", () => {
    const theme = loadTheme("terracotta")
    const style = themeToMapStyle(theme, {
      layerVisibility: visibility({ water: true }),
    })
    const layerIds = style.layers.map((layer) => layer.id)
    const baseIdx = layerIds.indexOf("water")
    const detailIdx = layerIds.indexOf("water-detail")
    const landcoverIdx = layerIds.indexOf("parks-landcover")
    expect(baseIdx).toBeGreaterThan(-1)
    expect(detailIdx).toBeGreaterThan(landcoverIdx)
    expect(style.sources?.["openmaptiles-water-hires"]).toMatchObject({
      minzoom: 12,
    })
  })

  it("keeps bridge and major tunnel road segments for water crossings", () => {
    const theme = loadTheme("terracotta")
    const style = themeToMapStyle(theme)
    const motorwayLayer = style.layers.find((layer) => layer.id === "road-motorway")
    expect(motorwayLayer?.type).toBe("line")
    const filterJson = JSON.stringify(
      motorwayLayer && motorwayLayer.type === "line" ? motorwayLayer.filter : null,
    )
    expect(filterJson).toContain('"bridge"')
    expect(filterJson).toContain('"tunnel"')
    expect(filterJson).toContain("motorway")
    expect(style.layers.some((layer) => layer.id === "road-bridge-deck")).toBe(true)
  })
})
