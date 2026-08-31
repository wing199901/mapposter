import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import type { GeocodeQuery, OsmBundle } from "@/lib/types"
import { geocodeCacheKey as sharedGeocodeCacheKey, isCacheStale } from "../../../shared/proxyCacheKeys"

export { CACHE_TTL_MS, isCacheStale } from "../../../shared/proxyCacheKeys"

export interface GeocodeBundle {
  latitude: number
  longitude: number
  displayName: string
  fetchedAt: number
}

interface PosterCacheDb extends DBSchema {
  osm: {
    key: string
    value: OsmBundle
  }
  geocode: {
    key: string
    value: GeocodeBundle
  }
}

const DB_NAME = "mapposter-cache"
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<PosterCacheDb>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PosterCacheDb>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("osm")) {
          db.createObjectStore("osm")
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains("geocode")) {
          db.createObjectStore("geocode")
        }
      },
    })
  }

  return dbPromise
}

export function osmCacheKey(latitude: number, longitude: number, radiusMeters: number): string {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}:${Math.round(radiusMeters)}`
}

export function geocodeCacheKey(query: GeocodeQuery): string {
  return sharedGeocodeCacheKey(query.city, query.country)
}

export async function readOsmCache(key: string): Promise<OsmBundle | undefined> {
  const db = await getDb()
  const bundle = await db.get("osm", key)
  if (!bundle || isCacheStale(bundle.fetchedAt)) {
    return undefined
  }
  return bundle
}

export async function writeOsmCache(key: string, bundle: OsmBundle): Promise<void> {
  const db = await getDb()
  await db.put("osm", bundle, key)
}

export async function readGeocodeCache(key: string): Promise<GeocodeBundle | undefined> {
  const db = await getDb()
  const bundle = await db.get("geocode", key)
  if (!bundle || isCacheStale(bundle.fetchedAt)) {
    return undefined
  }
  return bundle
}

export async function writeGeocodeCache(key: string, bundle: GeocodeBundle): Promise<void> {
  const db = await getDb()
  await db.put("geocode", bundle, key)
}
