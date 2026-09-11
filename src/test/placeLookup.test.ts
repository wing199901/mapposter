import { describe, expect, it } from "vitest"

import {
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
