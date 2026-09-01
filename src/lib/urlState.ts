import type { PosterConfig, PosterLayerVisibility } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY, DPI } from "@/lib/types"

const STORAGE_KEY = "mapposter:autosave"

export interface SerializedPosterState {
  geocodeCity: string
  geocodeCountry: string
  latitude: number
  longitude: number
  radiusMeters: number
  themeId: string
  customTheme?: PosterConfig["customTheme"]
  displayCity: string
  displayCountry: string
  fontFamily: string
  centerLocked?: boolean
  widthInches: number
  heightInches: number
  layerVisibility?: PosterLayerVisibility
  boundaryMaskEnabled?: boolean
  placeOsmType?: PosterConfig["placeOsmType"]
  placeOsmId?: number
  /** @deprecated Migrated to layerVisibility.shipRoutes */
  showShipRoutes?: boolean
  /** @deprecated Ignored — rectangular framing only (upstream-compatible). */
  mapShape?: string
}

function migrateLayerVisibility(state: SerializedPosterState): PosterLayerVisibility {
  if (state.layerVisibility) {
    return { ...DEFAULT_LAYER_VISIBILITY, ...state.layerVisibility }
  }

  const shipRoutes = state.showShipRoutes ?? true
  return { ...DEFAULT_LAYER_VISIBILITY, shipRoutes }
}

export function serializePosterState(config: PosterConfig): SerializedPosterState {
  return {
    geocodeCity: config.geocode.city,
    geocodeCountry: config.geocode.country,
    latitude: config.viewport.latitude,
    longitude: config.viewport.longitude,
    radiusMeters: config.viewport.radiusMeters,
    themeId: config.themeId,
    customTheme: config.customTheme,
    displayCity: config.display.city,
    displayCountry: config.display.country,
    fontFamily: config.fontFamily,
    centerLocked: config.centerLocked,
    widthInches: config.widthInches,
    heightInches: config.heightInches,
    layerVisibility: config.layerVisibility,
    boundaryMaskEnabled: config.boundaryMaskEnabled,
    placeOsmType: config.placeOsmType,
    placeOsmId: config.placeOsmId,
  }
}

export function deserializePosterState(state: SerializedPosterState): PosterConfig {
  return {
    geocode: {
      city: state.geocodeCity,
      country: state.geocodeCountry,
    },
    viewport: {
      latitude: state.latitude,
      longitude: state.longitude,
      radiusMeters: state.radiusMeters,
    },
    themeId: state.themeId,
    customTheme: state.customTheme,
    display: {
      city: state.displayCity,
      country: state.displayCountry,
    },
    fontFamily: state.fontFamily,
    centerLocked: state.centerLocked ?? false,
    widthInches: state.widthInches,
    heightInches: state.heightInches,
    layerVisibility: migrateLayerVisibility(state),
    boundaryMaskEnabled: state.boundaryMaskEnabled ?? false,
    placeOsmType: state.placeOsmType,
    placeOsmId: state.placeOsmId,
  }
}

export function encodePosterState(config: PosterConfig): string {
  const payload = serializePosterState(config)
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

export function decodePosterState(encoded: string): PosterConfig | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const payload = JSON.parse(json) as SerializedPosterState
    return deserializePosterState(payload)
  } catch {
    return null
  }
}

export function readStateFromLocation(): PosterConfig | null {
  const hash = window.location.hash.replace(/^#/, "")
  if (!hash.startsWith("p=")) {
    return null
  }

  return decodePosterState(hash.slice(2))
}

export function writeStateToLocation(config: PosterConfig): void {
  const encoded = encodePosterState(config)
  const next = `#p=${encoded}`
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", next)
  }
}

export function savePosterState(config: PosterConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializePosterState(config)))
}

export function loadPosterState(): PosterConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return deserializePosterState(JSON.parse(raw) as SerializedPosterState)
  } catch {
    return null
  }
}

export function posterPixelSize(config: PosterConfig): { widthPx: number; heightPx: number } {
  return {
    widthPx: Math.round(config.widthInches * DPI),
    heightPx: Math.round(config.heightInches * DPI),
  }
}
