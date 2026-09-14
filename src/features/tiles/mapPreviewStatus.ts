import type { Map } from "maplibre-gl"

import { OPENFREEMAP_TILEJSON } from "./constants"

export type MapPreviewPhase = "initializing" | "loading-style" | "loading-tiles" | "ready"

export interface MapPreviewStatus {
  phase: MapPreviewPhase
  ready: boolean
  tilesLoaded: boolean
  message: string
  tileSource: string
}

export const INITIAL_MAP_PREVIEW_STATUS: MapPreviewStatus = {
  phase: "initializing",
  ready: false,
  tilesLoaded: false,
  message: "Initializing map preview…",
  tileSource: OPENFREEMAP_TILEJSON,
}

export function readMapPreviewStatus(map: Map | null): MapPreviewStatus {
  if (!map) {
    return INITIAL_MAP_PREVIEW_STATUS
  }

  if (!map.loaded()) {
    return {
      phase: "loading-style",
      ready: false,
      tilesLoaded: false,
      message: "Loading map style…",
      tileSource: OPENFREEMAP_TILEJSON,
    }
  }

  if (!map.areTilesLoaded()) {
    return {
      phase: "loading-tiles",
      ready: false,
      tilesLoaded: false,
      message: "Fetching map tiles…",
      tileSource: OPENFREEMAP_TILEJSON,
    }
  }

  return {
    phase: "ready",
    ready: true,
    tilesLoaded: true,
    message: "Map ready — all tiles loaded",
    tileSource: OPENFREEMAP_TILEJSON,
  }
}

export function mapPreviewStatusesEqual(a: MapPreviewStatus, b: MapPreviewStatus): boolean {
  return (
    a.phase === b.phase &&
    a.ready === b.ready &&
    a.tilesLoaded === b.tilesLoaded &&
    a.message === b.message &&
    a.tileSource === b.tileSource
  )
}

/** Publishes only when status fields change — avoids parent re-render storms from chatty MapLibre events. */
export function createMapPreviewStatusPublisher(
  onStatusChange: (status: MapPreviewStatus) => void,
): (map: Map | null) => boolean {
  let last: MapPreviewStatus | null = null
  return (map) => {
    const next = readMapPreviewStatus(map)
    if (last && mapPreviewStatusesEqual(last, next)) {
      return false
    }
    last = next
    onStatusChange(next)
    return true
  }
}
