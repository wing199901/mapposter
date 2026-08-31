/// <reference path="../../functions/env.d.ts" />

import { describe, expect, it } from "vitest"

import { readEdgeGeocode, writeEdgeGeocode, type EdgeCacheEnv } from "../../functions/lib/edgeCache"
import { edgeGeocodeKvKey } from "../../shared/proxyCacheKeys"

function createMockKv() {
  const store = new Map<string, string>()
  const kv = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value)
    },
  }
  return { kv, store }
}

describe("edge geocode cache", () => {
  it("returns null when kv binding is missing", async () => {
    const result = await readEdgeGeocode({}, "Paris", "France")
    expect(result).toBeNull()
  })

  it("writes and reads geocode entries", async () => {
    const { kv } = createMockKv()
    const env = { PROXY_CACHE: kv } as EdgeCacheEnv

    await writeEdgeGeocode(env, "Paris", "France", {
      latitude: 48.8566,
      longitude: 2.3522,
      displayName: "Paris, France",
    })

    const cached = await readEdgeGeocode(env, "Paris", "France")
    expect(cached).toMatchObject({
      latitude: 48.8566,
      longitude: 2.3522,
      displayName: "Paris, France",
    })
    expect(cached?.fetchedAt).toEqual(expect.any(Number))
  })

  it("uses shared edge kv keys", async () => {
    const { kv, store } = createMockKv()
    const env = { PROXY_CACHE: kv } as EdgeCacheEnv

    await writeEdgeGeocode(env, " Tokyo ", " Japan ", {
      latitude: 35.6762,
      longitude: 139.6503,
      displayName: "Tokyo, Japan",
    })

    expect(store.has(edgeGeocodeKvKey("Tokyo", "Japan"))).toBe(true)
  })
})
