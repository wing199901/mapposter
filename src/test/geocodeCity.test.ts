import { describe, expect, it } from "vitest"

import type { GeocodeBundle } from "@/features/geocode/cache"
import { geocodeCity } from "@/features/geocode/nominatim"

describe("geocodeCity cache", () => {
  it("returns a fresh lookup and then the stored result without fetching again", async () => {
    const store = new Map<string, GeocodeBundle>()
    let fetches = 0
    const fetchImpl = (async () => {
      fetches += 1
      return new Response(
        JSON.stringify({
          latitude: 35.01,
          longitude: 135.77,
          displayName: "Kyoto, Japan",
          placeLocalName: "京都",
          placeLatinName: "Kyoto",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }) as typeof fetch

    const io = {
      fetchImpl,
      readCache: async (key: string) => store.get(key),
      writeCache: async (key: string, bundle: GeocodeBundle) => {
        store.set(key, bundle)
      },
    }

    const first = await geocodeCity({ city: "Kyoto", country: "Japan" }, io)
    const second = await geocodeCity({ city: "Kyoto", country: "Japan" }, io)

    expect(first.placeLocalName).toBe("京都")
    expect(second.displayName).toBe("Kyoto, Japan")
    expect(fetches).toBe(1)
    expect(store.size).toBe(1)
  })
})
