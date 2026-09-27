import { describe, expect, it } from "vitest"

import {
  handleBoundaryProxy,
  handleGeocodeProxy,
  type EdgeProxyCache,
  type GeocodeProxyBody,
} from "../../shared/proxyHandler"

function memoryCache(): EdgeProxyCache & { geocodeWrites: number } {
  const geocode = new Map<string, GeocodeProxyBody>()
  const cache: EdgeProxyCache & { geocodeWrites: number } = {
    geocodeWrites: 0,
    async readGeocode(city, country) {
      return geocode.get(`${city}:${country}`) ?? null
    },
    async writeGeocode(city, country, body) {
      cache.geocodeWrites += 1
      geocode.set(`${city}:${country}`, body)
    },
    async readBoundary() {
      return null
    },
    async writeBoundary() {},
  }
  return cache
}

const kyoto: GeocodeProxyBody = {
  latitude: 35,
  longitude: 135,
  displayName: "Kyoto, Japan",
  placeLocalName: "京都",
}

describe("proxy handler", () => {
  it("serves a cached geocode without calling Nominatim", async () => {
    const cache = memoryCache()
    await handleGeocodeProxy(new URLSearchParams({ city: "Kyoto", country: "Japan" }), cache, async () => ({
      ok: true,
      result: kyoto,
    }))

    let calls = 0
    const hit = await handleGeocodeProxy(
      new URLSearchParams({ city: "Kyoto", country: "Japan" }),
      cache,
      async () => {
        calls += 1
        return { ok: false, status: 500, error: "should not run" }
      },
    )

    expect(hit.status).toBe(200)
    expect(hit.headers["X-Cache"]).toBe("HIT")
    expect(hit.body).toMatchObject({ placeLocalName: "京都" })
    expect(calls).toBe(0)
  })

  it("passes a rate limit through as 429", async () => {
    const result = await handleGeocodeProxy(
      new URLSearchParams({ city: "Kyoto", country: "Japan" }),
      memoryCache(),
      async () => ({ ok: false, status: 429, error: "slow" }),
    )
    expect(result.status).toBe(429)
    expect(result.body).toEqual({ error: "slow" })
  })

  it("returns 502 when the geocode upstream throws", async () => {
    const cache = memoryCache()
    const result = await handleGeocodeProxy(
      new URLSearchParams({ city: "Kyoto", country: "Japan" }),
      cache,
      async () => {
        throw new Error("offline")
      },
    )
    expect(result.status).toBe(502)
    expect(cache.geocodeWrites).toBe(0)
  })

  it("rejects a boundary lookup without an osm id", async () => {
    const result = await handleBoundaryProxy(
      new URLSearchParams({ osmType: "relation" }),
      memoryCache(),
      async () => ({ ok: false, status: 500, error: "nope" }),
    )
    expect(result.status).toBe(400)
  })
})