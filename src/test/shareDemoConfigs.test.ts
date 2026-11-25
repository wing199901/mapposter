import { describe, expect, it } from "vitest"

import {
  SHARE_DEMO_CONFIGS,
  shareDemoHash,
  shareDemoPath,
} from "@/features/editor/shareDemoConfigs"
import { decodePosterState } from "@/lib/urlState"

describe("shareDemoConfigs", () => {
  it("seeds five bilingual city demos", () => {
    expect(SHARE_DEMO_CONFIGS).toHaveLength(5)
    expect(SHARE_DEMO_CONFIGS.map((item) => item.id)).toEqual([
      "hong-kong",
      "kyoto",
      "taipei",
      "seoul",
      "tokyo",
    ])
  })

  it("encodes stable #p= hashes that round-trip", () => {
    for (const demo of SHARE_DEMO_CONFIGS) {
      expect(demo.config.display.hasPlaceLocalName).toBe(true)
      expect(demo.config.centerLocked).toBe(true)
      expect(demo.config.display.cityLatin).toBeTruthy()
      expect(demo.config.display.scriptFamily).toBeTruthy()

      const hash = shareDemoHash(demo.config)
      expect(hash.length).toBeGreaterThan(40)
      expect(shareDemoPath(demo.config)).toBe(`#p=${hash}`)

      const decoded = decodePosterState(hash)
      expect(decoded?.geocode).toEqual(demo.config.geocode)
      expect(decoded?.viewport).toEqual(demo.config.viewport)
      expect(decoded?.display.city).toBe(demo.config.display.city)
      expect(decoded?.display.cityLatin).toBe(demo.config.display.cityLatin)
      expect(decoded?.fontFamily).toBe(demo.config.fontFamily)
      expect(decoded?.themeId).toBe(demo.config.themeId)
      expect(decoded?.centerLocked).toBe(true)
    }
  })
})
