import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import type { GeocodeQuery } from "@/lib/types"
import {
  boundaryCacheKey,
  geocodeCacheKey as sharedGeocodeCacheKey,
  isCacheStale,
} from "../../../shared/proxyCacheKeys"

export { CACHE_TTL_MS, isCacheStale } from "../../../shared/proxyCacheKeys"

export interface GeocodeBundle {
  latitude: number
  longitude: number
  displayName: string
  placeLocalName?: string
  placeLatinName?: string
  countryLocalName?: string
  countryLatinName?: string
  countryCode?: string
  suggestedRadiusMeters?: number
  osmType?: "node" | "way" | "relation"
  osmId?: number
  fetchedAt: number
}

export interface BoundaryBundle {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  fetchedAt: number
}

interface PosterCacheDb extends DBSchema {
  geocode: {
    key: string
    value: GeocodeBundle
  }
  boundary: {
    key: string
    value: BoundaryBundle
  }
}

const DB_NAME = "mapposter-cache"
const DB_VERSION = 4

let dbPromise: Promise<IDBPDatabase<PosterCacheDb>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PosterCacheDb>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 3) {
          const legacyStores = Array.from(db.objectStoreNames as unknown as string[])
          if (legacyStores.includes("osm")) {
            ;(db as unknown as IDBDatabase).deleteObjectStore("osm")
          }
        }
        if (!db.objectStoreNames.contains("geocode")) {
          db.createObjectStore("geocode")
        }
        if (!db.objectStoreNames.contains("boundary")) {
          db.createObjectStore("boundary")
        }
      },
    })
  }

  return dbPromise
}

export function geocodeCacheKey(query: GeocodeQuery): string {
  return sharedGeocodeCacheKey(query.city, query.country)
}

export function placeBoundaryCacheKey(
  osmType: string,
  osmId: number,
  radiusMeters?: number,
): string {
  return boundaryCacheKey(osmType, osmId, radiusMeters)
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

export async function readBoundaryCache(key: string): Promise<BoundaryBundle | undefined> {
  const db = await getDb()
  const bundle = await db.get("boundary", key)
  if (!bundle || isCacheStale(bundle.fetchedAt)) {
    return undefined
  }
  return bundle
}

export async function writeBoundaryCache(key: string, bundle: BoundaryBundle): Promise<void> {
  const db = await getDb()
  await db.put("boundary", bundle, key)
}
