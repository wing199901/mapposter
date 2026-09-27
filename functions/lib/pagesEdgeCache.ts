import type { EdgeProxyCache, GeocodeProxyBody } from "../../shared/proxyHandler"
import { readEdgeBoundary, readEdgeGeocode, writeEdgeBoundary, writeEdgeGeocode } from "./edgeCache"

export function pagesEdgeCache(env: Parameters<typeof readEdgeGeocode>[0]): EdgeProxyCache {
  return {
    async readGeocode(city, country) {
      const cached = await readEdgeGeocode(env, city, country)
      if (!cached) {
        return null
      }
      const body: GeocodeProxyBody = {
        latitude: cached.latitude,
        longitude: cached.longitude,
        displayName: cached.displayName,
        placeLocalName: cached.placeLocalName,
        placeLatinName: cached.placeLatinName,
        countryLocalName: cached.countryLocalName,
        countryLatinName: cached.countryLatinName,
        countryCode: cached.countryCode,
        suggestedRadiusMeters: cached.suggestedRadiusMeters,
        osmType: cached.osmType,
        osmId: cached.osmId,
      }
      return body
    },
    async writeGeocode(city, country, body) {
      await writeEdgeGeocode(env, city, country, body)
    },
    async readBoundary(osmType, osmId, radiusMeters) {
      const cached = await readEdgeBoundary(env, osmType, osmId, radiusMeters)
      return cached?.geometry ?? null
    },
    async writeBoundary(osmType, osmId, geometry, radiusMeters) {
      await writeEdgeBoundary(env, osmType, osmId, geometry, radiusMeters)
    },
  }
}
