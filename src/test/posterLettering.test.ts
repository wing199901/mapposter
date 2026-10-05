import { describe, expect, it } from "vitest"

import { buildPosterLettering, posterGlyphs, primaryFontFamily } from "@/features/tiles/posterLettering"

const viewport = { latitude: 35, longitude: 135.5, radiusMeters: 8000 }

describe("poster lettering", () => {
  it("shrinks a place line that cannot fit the poster width", () => {
    const lettering = buildPosterLettering({
      widthPx: 1000,
      heightPx: 1500,
      display: { city: "Kyoto", country: "Japan" },
      fontFamily: "Roboto",
      viewport,
      measure: () => 1000,
    })

    expect(lettering.city.fontSize).toBe(8)
    expect(lettering.coordinates).toBe("35.0000° N, 135.5000° E")
  })

  it("matches the rule to a place line that fits", () => {
    const lettering = buildPosterLettering({
      widthPx: 1000,
      heightPx: 1500,
      display: { city: "Kyoto", country: "Japan" },
      fontFamily: "Roboto",
      viewport,
      measure: () => 120,
    })

    expect(lettering.city.fontSize).toBe(lettering.fonts.city)
    expect(lettering.rule.widthPx).toBe(120)
    expect(lettering.rule.x1).toBe(440)
    expect(lettering.rule.x2).toBe(560)
  })

  it("collects the glyphs that a raster copy must embed", () => {
    const lettering = buildPosterLettering({
      widthPx: 1000,
      heightPx: 1500,
      display: {
        city: "京都",
        cityLatin: "KYOTO",
        country: "日本",
        countryLatin: "JAPAN",
        hasPlaceLocalName: true,
        scriptFamily: "jp",
      },
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })

    expect(primaryFontFamily(lettering.fontStack)).toBe("Noto Sans JP")
    expect(posterGlyphs(lettering)).toContain("京")
    expect(posterGlyphs(lettering)).toContain("K")
    expect(posterGlyphs(lettering)).not.toMatch(/(.)\1/)
  })

  it("wires Latin-only country tracking flags for Preview and SVG", () => {
    const lettering = buildPosterLettering({
      widthPx: 1000,
      heightPx: 1500,
      display: { city: "Paris", country: "France" },
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })

    expect(lettering.city.local).toBe("P A R I S")
    expect(lettering.country.local).toBe("F R A N C E")
    expect(lettering.cityApplyLatinTracking).toBe(true)
    expect(lettering.countryApplyLatinTracking).toBe(true)
  })

  it("does not apply CSS tracking on CJK display pairs", () => {
    const lettering = buildPosterLettering({
      widthPx: 1000,
      heightPx: 1500,
      display: {
        city: "香港",
        cityLatin: "Hong Kong",
        country: "中國",
        countryLatin: "China",
        hasPlaceLocalName: true,
        scriptFamily: "hk",
      },
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })

    expect(lettering.cityApplyLatinTracking).toBe(false)
    expect(lettering.countryApplyLatinTracking).toBe(false)
    expect(lettering.city.fontSize).toBe(lettering.city.latinFontSize)
    expect(lettering.country.fontSize).toBe(lettering.country.latinFontSize)
    expect(lettering.country.localWeight).toBeLessThan(lettering.city.localWeight)
    expect(lettering.country.latinWeight).toBeLessThan(lettering.country.localWeight)
  })
})
