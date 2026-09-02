export interface PosterTheme {
  name: string
  description: string
  bg: string
  text: string
  gradient_color: string
  water: string
  parks: string
  buildings: string
  road_motorway: string
  road_primary: string
  road_secondary: string
  road_tertiary: string
  road_residential: string
  road_default: string
}

export interface PosterLayerVisibility {
  water: boolean
  waterway: boolean
  parks: boolean
  buildings: boolean
  roadMotorway: boolean
  roadPrimary: boolean
  roadSecondary: boolean
  roadTertiary: boolean
  roadResidential: boolean
  roadDefault: boolean
  rail: boolean
  shipRoutes: boolean
}

export const DEFAULT_LAYER_VISIBILITY: PosterLayerVisibility = {
  water: true,
  waterway: true,
  parks: true,
  buildings: false,
  roadMotorway: true,
  roadPrimary: true,
  roadSecondary: true,
  roadTertiary: true,
  roadResidential: true,
  roadDefault: true,
  rail: true,
  shipRoutes: true,
}

export interface Viewport {
  latitude: number
  longitude: number
  radiusMeters: number
}

export interface GeocodeQuery {
  city: string
  country: string
}

export type ScriptFamily = "hk" | "tc" | "sc" | "jp" | "kr"

export interface DisplayLabels {
  city: string
  country: string
  cityLatin?: string
  countryLatin?: string
  scriptFamily?: ScriptFamily
}

export interface PosterConfig {
  geocode: GeocodeQuery
  viewport: Viewport
  themeId: string
  customTheme?: PosterTheme
  display: DisplayLabels
  fontFamily: string
  /** When true, place-name lookup will not overwrite lat/lon. */
  centerLocked: boolean
  widthInches: number
  heightInches: number
  layerVisibility: PosterLayerVisibility
  /** When true, hide map features outside the geocoded place admin boundary. */
  boundaryMaskEnabled: boolean
  /** OSM reference from the last successful place geocode (for boundary lookup). */
  placeOsmType?: OsmType
  placeOsmId?: number
}

export type OsmType = "node" | "way" | "relation"

export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
  placeLocalName?: string
  placeLatinName?: string
  countryLocalName?: string
  countryLatinName?: string
  countryCode?: string
  /** Suggested map radius from place bounding box (place-name geocode). */
  suggestedRadiusMeters?: number
  osmType?: OsmType
  osmId?: number
}

export interface ExportPreset {
  id: string
  label: string
  widthInches: number
  heightInches: number
  description: string
}

export type ExportPhase = "idle" | "exporting" | "done" | "error"

export interface ExportProgress {
  phase: ExportPhase
  message: string
  progress?: number
}

/** @deprecated Use ExportProgress */
export type GenerationProgress = ExportProgress

/** @deprecated Live map replaces explicit generation phases */
export type GenerationPhase = ExportPhase

export const DPI = 300
export const MAX_INCHES = 20
