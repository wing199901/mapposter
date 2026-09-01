import { describe, expect, it } from "vitest"

import { EXPORT_PRESETS, inchesToPixels } from "@/features/export/presets"
import { posterTypographyLayout } from "@/features/tiles/posterTypographyLayout"

function baselineGap(heightPx: number, higherFromBottom: number, lowerFromBottom: number): number {
  return (higherFromBottom - lowerFromBottom) * heightPx
}

describe("posterTypographyLayout export presets", () => {
  it.each(EXPORT_PRESETS.map((preset) => [preset.id, preset.widthInches, preset.heightInches, preset.label]))(
    "%s (%s) keeps stacked text readable",
    (_id, widthInches, heightInches) => {
      const widthPx = inchesToPixels(widthInches)
      const heightPx = inchesToPixels(heightInches)
      const layout = posterTypographyLayout(widthPx, heightPx)
      const { fonts, fromBottom, fadeBottomStart } = layout

      expect(fromBottom.city).toBeGreaterThan(fromBottom.line)
      expect(fromBottom.line).toBeGreaterThan(fromBottom.country)
      expect(fromBottom.country).toBeGreaterThan(fromBottom.coordinates)
      expect(fromBottom.coordinates).toBeGreaterThan(fromBottom.attribution)

      expect(baselineGap(heightPx, fromBottom.city, fromBottom.country)).toBeGreaterThan(
        fonts.city * 0.35,
      )
      expect(baselineGap(heightPx, fromBottom.country, fromBottom.coordinates)).toBeGreaterThan(
        fonts.country * 0.35,
      )

      expect(fonts.city).toBeLessThanOrEqual(Math.round(Math.min(widthPx, heightPx) * 0.055) + 1)
      expect(fadeBottomStart).toBeGreaterThanOrEqual(0.38)
      expect(fadeBottomStart).toBeLessThanOrEqual(0.78)
    },
  )

  it("scales landscape wallpaper typography from height, not width", () => {
    const layout = posterTypographyLayout(3840, 2160)
    expect(layout.fonts.city).toBeLessThan(150)
    expect(layout.fonts.city).toBeGreaterThan(100)
  })
})
