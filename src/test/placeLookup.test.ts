import { describe, expect, it } from "vitest"

import {
  applyGeocodeToPoster,
  placeLookupFailureMessage,
  placeLookupSuccessMessage,
  shouldSkipAutomaticPlaceLookup,
  viewportFromPlaceLookup,
} from "@/features/editor/placeLookup"
import type { Viewport } from "@/lib/types"

const framedViewport: Viewport = {
  latitude: 22.28,
  longitude: 114.16,
  radiusMeters: 4321,
}

const suggestedResult = {
  latitude: 22.2644,
  longitude: 114.1912,
  suggestedRadiusMeters: 12000,
}

describe("shouldSkipAutomaticPlaceLookup", () => {
  it("skips mount lookup when hydrating from a share hash", () => {
    expect(
      shouldSkipAutomaticPlaceLookup({
        hydratedFromShareHash: true,
        centerLocked: false,
        placeEditedByUser: false,
      }),
    ).toBe(true)
  })

  it("skips mount lookup when the viewport is center-locked", () => {
    expect(
      shouldSkipAutomaticPlaceLookup({
        hydratedFromShareHash: false,
        centerLocked: true,
        placeEditedByUser: false,
      }),
    ).toBe(true)
  })

  it("still looks up when the user edits city or country", () => {
    expect(
      shouldSkipAutomaticPlaceLookup({
        hydratedFromShareHash: true,
        centerLocked: true,
        placeEditedByUser: true,
      }),
    ).toBe(false)
  })

  it("runs the default Search-mode lookup when unlocked and not from a share hash", () => {
    expect(
      shouldSkipAutomaticPlaceLookup({
        hydratedFromShareHash: false,
        centerLocked: false,
        placeEditedByUser: false,
      }),
    ).toBe(false)
  })
})

describe("viewportFromPlaceLookup", () => {
  it("keeps lat, lon, and radius when centerLocked", () => {
    expect(
      viewportFromPlaceLookup(
        { viewport: framedViewport, centerLocked: true },
        suggestedResult,
      ),
    ).toEqual(framedViewport)
  })

  it("applies suggested radius and place center when unlocked", () => {
    expect(
      viewportFromPlaceLookup(
        { viewport: framedViewport, centerLocked: false },
        suggestedResult,
      ),
    ).toEqual({
      latitude: suggestedResult.latitude,
      longitude: suggestedResult.longitude,
      radiusMeters: suggestedResult.suggestedRadiusMeters,
    })
  })

  it("replaces display labels and the font from a Japanese place", () => {
    const applied = applyGeocodeToPoster(
      { viewport: framedViewport, centerLocked: false, fontFamily: "Roboto" },
      { city: "京都", country: "Japan" },
      {
        latitude: 35.0116,
        longitude: 135.7681,
        displayName: "Kyoto, Japan",
        placeLocalName: "京都",
        placeLatinName: "Kyoto",
        countryLocalName: "日本",
        countryLatinName: "Japan",
        countryCode: "jp",
        suggestedRadiusMeters: 9000,
        osmType: "relation",
        osmId: 3577955,
      },
    )

    expect(applied.display.city).toBe("京都")
    expect(applied.display.cityLatin).toBe("Kyoto")
    expect(applied.fontFamily).toBe("Noto Sans JP")
    expect(applied.placeOsmId).toBe(3577955)
    expect(applied.viewport.radiusMeters).toBe(9000)
    expect(applied.geocode).toEqual({ city: "京都", country: "Japan" })
    expect(placeLookupSuccessMessage({ suggestedRadiusMeters: 9000 })).toContain("9000")
  })

  it("keeps the current font when the place has no local name", () => {
    const applied = applyGeocodeToPoster(
      { viewport: framedViewport, centerLocked: true, fontFamily: "Roboto" },
      { city: "Paris", country: "France" },
      {
        latitude: 48.85,
        longitude: 2.35,
        displayName: "Paris, France",
        placeLatinName: "Paris",
        countryLatinName: "France",
      },
    )
    expect(applied.fontFamily).toBe("Roboto")
    expect(applied.viewport).toEqual(framedViewport)
  })

  it("turns a rate limit into the busy message", () => {
    expect(placeLookupFailureMessage(new Error("429:slow"))).toContain("busy")
    expect(placeLookupFailureMessage(new Error("404:missing"))).toContain("spelling")
  })

  it("keeps the current radius when unlocked and no suggestion is present", () => {
    expect(
      viewportFromPlaceLookup(
        { viewport: framedViewport, centerLocked: false },
        { latitude: 48.85, longitude: 2.35 },
      ),
    ).toEqual({
      latitude: 48.85,
      longitude: 2.35,
      radiusMeters: framedViewport.radiusMeters,
    })
  })
})
