import { describe, expect, it } from "vitest"

import { formatCityLabel, isLatinScript } from "@/lib/scriptDetection"
import { decodePosterState, deserializePosterState, encodePosterState } from "@/lib/urlState"
import type { PosterConfig } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"
import { loadTheme, THEME_IDS } from "@/features/themes/themeRegistry"
import { mapFeatureLayerIds, themeToMapStyle } from "@/features/tiles/themeToMapStyle"

const sampleConfig: PosterConfig = {
  geocode: { city: "Paris", country: "France" },
  viewport: { latitude: 48.8566, longitude: 2.3522, radiusMeters: 10000 },
  themeId: "terracotta",
  display: { city: "Paris", country: "France" },
  fontFamily: "Roboto",
  centerLocked: false,
  widthInches: 12,
  heightInches: 16,
  layerVisibility: DEFAULT_LAYER_VISIBILITY,
  boundaryMaskEnabled: false,
  placeOsmType: "relation",
  placeOsmId: 7444,
}

describe("theme registry", () => {
  it("loads all 17 upstream themes", () => {
    expect(THEME_IDS).toHaveLength(17)
    expect(loadTheme("terracotta").bg).toBe("#F5EDE4")
    expect(loadTheme("terracotta").buildings).toBeTruthy()
  })
})

describe("script detection", () => {
  it("spaces latin city labels", () => {
    expect(isLatinScript("Paris")).toBe(true)
    expect(formatCityLabel("Paris")).toBe("P A R I S")
  })

  it("preserves word gaps in multi-word latin city labels", () => {
    expect(formatCityLabel("Kwun Tong")).toBe("K W U N\u2003T O N G")
    expect(formatCityLabel("New York")).toBe("N E W\u2003Y O R K")
  })

  it("preserves non-latin labels", () => {
    expect(isLatinScript("東京")).toBe(false)
    expect(formatCityLabel("東京")).toBe("東京")
  })
})

describe("map style", () => {
  it("maps poster theme colors to MapLibre layers", () => {
    const theme = loadTheme("noir")
    const style = themeToMapStyle(theme)
    expect(style.layers.some((layer) => layer.id === "background")).toBe(true)
    expect(style.layers.some((layer) => layer.id === "road-motorway")).toBe(true)
    expect(style.layers.some((layer) => layer.id === "buildings")).toBe(false)
    const motorway = style.layers.find((layer) => layer.id === "road-motorway")
    expect(motorway?.type).toBe("line")
    if (motorway?.type === "line") {
      expect(motorway.paint?.["line-color"]).toBe(theme.road_motorway)
    }
  })

  it("includes buildings when layer visibility enables them", () => {
    const theme = loadTheme("noir")
    const style = themeToMapStyle(theme, {
      layerVisibility: { ...DEFAULT_LAYER_VISIBILITY, buildings: true },
    })
    expect(style.layers.some((layer) => layer.id === "buildings")).toBe(true)
  })

  it("omits ferry layer when ship routes are disabled", () => {
    const theme = loadTheme("terracotta")
    const withFerry = themeToMapStyle(theme, {
      layerVisibility: { ...DEFAULT_LAYER_VISIBILITY, shipRoutes: true },
    })
    const withoutFerry = themeToMapStyle(theme, {
      layerVisibility: { ...DEFAULT_LAYER_VISIBILITY, shipRoutes: false },
    })
    expect(withFerry.layers.some((layer) => layer.id === "road-ferry")).toBe(true)
    expect(withoutFerry.layers.some((layer) => layer.id === "road-ferry")).toBe(false)
    expect(
      mapFeatureLayerIds({
        layerVisibility: { ...DEFAULT_LAYER_VISIBILITY, shipRoutes: false },
      }),
    ).not.toContain("road-ferry")
  })
})

describe("url state", () => {
  it("round-trips poster config in share links", () => {
    const encoded = encodePosterState(sampleConfig)
    const decoded = decodePosterState(encoded)
    expect(decoded).toEqual(sampleConfig)
  })

  it("ignores deprecated mapShape on legacy share links", () => {
    const legacy = {
      geocodeCity: "Paris",
      geocodeCountry: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 10000,
      themeId: "terracotta",
      displayCity: "Paris",
      displayCountry: "France",
      fontFamily: "Roboto",
      mapShape: "circular",
      widthInches: 12,
      heightInches: 16,
    }

    expect(deserializePosterState(legacy)).toMatchObject({
      geocode: sampleConfig.geocode,
      themeId: sampleConfig.themeId,
      layerVisibility: DEFAULT_LAYER_VISIBILITY,
      boundaryMaskEnabled: false,
    })
  })

  it("defaults centerLocked to false for legacy share links", () => {
    const legacy = {
      geocodeCity: "Paris",
      geocodeCountry: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 10000,
      themeId: "terracotta",
      displayCity: "Paris",
      displayCountry: "France",
      fontFamily: "Roboto",
      widthInches: 12,
      heightInches: 16,
    }

    expect(deserializePosterState(legacy).centerLocked).toBe(false)
  })

  it("migrates legacy showShipRoutes to layerVisibility.shipRoutes", () => {
    const legacyOff = {
      geocodeCity: "Paris",
      geocodeCountry: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 10000,
      themeId: "terracotta",
      displayCity: "Paris",
      displayCountry: "France",
      fontFamily: "Roboto",
      widthInches: 12,
      heightInches: 16,
      showShipRoutes: false,
    }

    expect(deserializePosterState(legacyOff).layerVisibility.shipRoutes).toBe(false)
    expect(deserializePosterState(legacyOff).layerVisibility.buildings).toBe(false)
  })
})
