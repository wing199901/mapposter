import { describe, expect, it } from "vitest"

import { DEFAULT_CONFIG, POSTER_EXAMPLES } from "@/features/editor/defaultPosterConfig"

describe("defaultPosterConfig", () => {
  it("cold-starts on bilingual Hong Kong SAR with Noto Sans HK", () => {
    expect(DEFAULT_CONFIG.geocode).toEqual({ city: "Hong Kong", country: "Hong Kong" })
    expect(DEFAULT_CONFIG.display.city).toBe("香港")
    expect(DEFAULT_CONFIG.display.cityLatin).toBe("Hong Kong")
    expect(DEFAULT_CONFIG.display.country).toBe("香港")
    expect(DEFAULT_CONFIG.display.countryLatin).toBe("Hong Kong")
    expect(DEFAULT_CONFIG.display.scriptFamily).toBe("hk")
    expect(DEFAULT_CONFIG.display.hasPlaceLocalName).toBe(true)
    expect(DEFAULT_CONFIG.fontFamily).toBe("Noto Sans HK")
    expect(DEFAULT_CONFIG.centerLocked).toBe(true)
    expect(DEFAULT_CONFIG.viewport.latitude).toBeCloseTo(22.3193, 3)
    expect(DEFAULT_CONFIG.viewport.longitude).toBeCloseTo(114.1694, 3)
    expect(DEFAULT_CONFIG.viewport.radiusMeters).toBe(30000)
  })

  it("offers HK, Kyoto, and Paris examples without bloating to a gallery", () => {
    expect(POSTER_EXAMPLES).toHaveLength(3)
    expect(POSTER_EXAMPLES.map((item) => item.id)).toEqual(["hong-kong", "kyoto", "paris"])
    expect(POSTER_EXAMPLES[0]?.patch.geocode.city).toBe("Hong Kong")
    expect(POSTER_EXAMPLES[0]?.hint).toMatch(/SAR/i)
    expect(POSTER_EXAMPLES[1]?.patch.display.scriptFamily).toBe("jp")
    expect(POSTER_EXAMPLES[2]?.patch.display.hasPlaceLocalName).toBeUndefined()
  })
})
