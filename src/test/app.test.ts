import { describe, expect, it } from "vitest"

import { formatCityLabel, isLatinScript } from "@/lib/scriptDetection"
import { decodePosterState, encodePosterState } from "@/lib/urlState"
import type { PosterConfig } from "@/lib/types"
import { loadTheme, THEME_IDS } from "@/features/themes/themeRegistry"
import { roadColor, roadWidth } from "@/features/render/roadStyle"

const sampleConfig: PosterConfig = {
  geocode: { city: "Paris", country: "France" },
  viewport: { latitude: 48.8566, longitude: 2.3522, radiusMeters: 10000 },
  themeId: "terracotta",
  display: { city: "Paris", country: "France" },
  fontFamily: "Roboto",
  widthInches: 12,
  heightInches: 16,
}

describe("theme registry", () => {
  it("loads all 17 upstream themes", () => {
    expect(THEME_IDS).toHaveLength(17)
    expect(loadTheme("terracotta").bg).toBe("#F5EDE4")
  })
})

describe("script detection", () => {
  it("spaces latin city labels", () => {
    expect(isLatinScript("Paris")).toBe(true)
    expect(formatCityLabel("Paris")).toBe("P A R I S")
  })

  it("preserves non-latin labels", () => {
    expect(isLatinScript("東京")).toBe(false)
    expect(formatCityLabel("東京")).toBe("東京")
  })
})

describe("road styling", () => {
  it("maps motorway tags to theme colors", () => {
    const theme = loadTheme("noir")
    expect(roadColor(theme, "motorway")).toBe(theme.road_motorway)
    expect(roadWidth("motorway")).toBeGreaterThan(roadWidth("residential"))
  })
})

describe("url state", () => {
  it("round-trips poster config in share links", () => {
    const encoded = encodePosterState(sampleConfig)
    const decoded = decodePosterState(encoded)
    expect(decoded).toEqual(sampleConfig)
  })
})
