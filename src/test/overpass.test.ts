import { describe, expect, it, vi } from "vitest"

import { fetchOsmFeatures } from "@/features/osm/overpass"

describe("overpass query", () => {
  it("filters minor roads for medium city radii", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { query: string }
      expect(body.query).toContain('way["highway"~"')
      expect(body.query).not.toContain('way["highway"](around:10000')
      return Response.json({ elements: [] })
    })

    vi.stubGlobal("fetch", fetchMock)

    await fetchOsmFeatures({
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 10000,
    })

    vi.unstubAllGlobals()
  })

  it("keeps all roads for small radii", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { query: string }
      expect(body.query).toContain('way["highway"](around:5000')
      expect(body.query).not.toContain('way["highway"~"')
      return Response.json({ elements: [] })
    })

    vi.stubGlobal("fetch", fetchMock)

    await fetchOsmFeatures({
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 5000,
    })

    vi.unstubAllGlobals()
  })
})
