import { describe, expect, it } from "vitest"

import {
  PAIR_LINE_SAFE_WIDTH_RATIO,
  fitPairLineTypography,
  pairLineWeights,
  placeRuleSpan,
} from "@/features/tiles/pairLineTypography"

describe("pairLineTypography", () => {
  it("uses the same font size for local and latin on both roles", () => {
    const measure = (text: string, fontSize: number) => text.length * fontSize * 0.1
    const city = fitPairLineTypography({
      role: "city",
      baseFontSize: 40,
      local: "香港島",
      latin: "H O N G K O N G I S L A N D",
      maxWidthPx: 2000,
      measure,
    })
    const country = fitPairLineTypography({
      role: "country",
      baseFontSize: 20,
      local: "香港",
      latin: "H O N G K O N G",
      maxWidthPx: 2000,
      measure,
    })

    expect(city.fontSize).toBe(40)
    expect(country.fontSize).toBe(20)
    expect(city.localFontSize).toBe(city.latinFontSize)
    expect(country.localFontSize).toBe(country.latinFontSize)
  })

  it("keeps place 700/500 and country 500/400 weights", () => {
    expect(pairLineWeights("city")).toEqual({ local: 700, latin: 500 })
    expect(pairLineWeights("country")).toEqual({ local: 500, latin: 400 })
  })

  it("scales the whole pair line down together when it exceeds the safe width", () => {
    const measure = (text: string, fontSize: number) => text.length * fontSize
    const fitted = fitPairLineTypography({
      role: "city",
      baseFontSize: 40,
      local: "香港島",
      latin: "H O N G K O N G I S L A N D",
      maxWidthPx: 400,
      measure,
    })

    expect(fitted.fontSize).toBeLessThan(40)
    expect(fitted.localFontSize).toBe(fitted.latinFontSize)
    expect(fitted.fontSize).toBe(fitted.localFontSize)

    const width =
      measure(fitted.local, fitted.fontSize) +
      fitted.gapPx +
      measure(fitted.latin ?? "", fitted.fontSize)
    expect(width).toBeLessThanOrEqual(400)
  })

  it("uses a 90% poster-width safe band by default", () => {
    expect(PAIR_LINE_SAFE_WIDTH_RATIO).toBe(0.9)
  })

  it("returns the measured width of the fitted pair line", () => {
    const measure = (text: string, fontSize: number) => text.length * fontSize * 0.5
    const fitted = fitPairLineTypography({
      role: "city",
      baseFontSize: 20,
      local: "香港島",
      latin: "ABC",
      maxWidthPx: 2000,
      measure,
    })
    expect(fitted.widthPx).toBe(
      measure("香港島", 20) + fitted.gapPx + measure("ABC", 20),
    )
  })

  it("centers a place rule that matches the place line width", () => {
    const span = placeRuleSpan(1000, 400)
    expect(span.widthPx).toBe(400)
    expect(span.x1).toBe(300)
    expect(span.x2).toBe(700)
  })

  it("falls back to a poster-relative rule when place width is unknown", () => {
    const span = placeRuleSpan(1000, undefined)
    expect(span.widthPx).toBe(330)
    expect(span.x1).toBe(335)
    expect(span.x2).toBe(665)
  })
})
