import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import type { OsmBundle } from "@/lib/types"

interface PosterCacheDb extends DBSchema {
  osm: {
    key: string
    value: OsmBundle
  }
}

const DB_NAME = "mapposter-cache"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PosterCacheDb>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PosterCacheDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("osm")
      },
    })
  }

  return dbPromise
}

export function osmCacheKey(latitude: number, longitude: number, radiusMeters: number): string {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}:${Math.round(radiusMeters)}`
}

export async function readOsmCache(key: string): Promise<OsmBundle | undefined> {
  const db = await getDb()
  return db.get("osm", key)
}

export async function writeOsmCache(key: string, bundle: OsmBundle): Promise<void> {
  const db = await getDb()
  await db.put("osm", bundle, key)
}
