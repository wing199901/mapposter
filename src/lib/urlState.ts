import type { PosterConfig } from "@/lib/types"
import { DPI } from "@/lib/types"

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
  widthInches: number
  heightInches: number
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
    widthInches: config.widthInches,
    heightInches: config.heightInches,
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
    widthInches: state.widthInches,
    heightInches: state.heightInches,
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
