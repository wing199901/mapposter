import { describe, expect, it } from "vitest"

import {
  exportStrokeWidthForLayer,
  themeColorForLayer,
} from "@/features/tiles/themePaint"
import type { PosterTheme } from "@/lib/types"

const theme: PosterTheme = {
  name: "fixture",
  description: "fixture",
  bg: "#111111",
  text: "#222222",
  gradient_color: "#333333",
  water: "#0000ff",
  parks: "#00aa00",
  buildings: "#888888",
  road_motorway: "#ff0000",
  road_primary: "#ff8800",
  road_secondary: "#cccc00",
  road_tertiary: "#00cccc",
  road_residential: "#cc00cc",
  road_default: "#ffffff",
}

describe("theme paint", () => {
  it("uses one Theme color for water, water detail, and waterway", () => {
    expect(themeColorForLayer(theme, "water")).toBe("#0000ff")
    expect(themeColorForLayer(theme, "water-detail")).toBe("#0000ff")
    expect(themeColorForLayer(theme, "waterway")).toBe("#0000ff")
  })

  it("maps motorway and bridge deck to the motorway color", () => {
    expect(themeColorForLayer(theme, "road-motorway")).toBe("#ff0000")
    expect(themeColorForLayer(theme, "road-bridge-deck")).toBe("#ff0000")
  })

  it("maps ferry and rail to the default road color", () => {
    expect(themeColorForLayer(theme, "road-ferry")).toBe("#ffffff")
    expect(themeColorForLayer(theme, "road-rail")).toBe("#ffffff")
  })

  it("keeps SVG stroke widths constant per map-layer id", () => {
    expect(exportStrokeWidthForLayer("road-motorway")).toBe(4)
    expect(exportStrokeWidthForLayer("road-primary")).toBe(3)
    expect(exportStrokeWidthForLayer("road-residential")).toBe(1)
    expect(exportStrokeWidthForLayer("waterway")).toBe(1.2)
  })
})
