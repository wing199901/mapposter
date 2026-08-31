export interface PosterTheme {
  name: string
  description: string
  bg: string
  text: string
  gradient_color: string
  water: string
  parks: string
  road_motorway: string
  road_primary: string
  road_secondary: string
  road_tertiary: string
  road_residential: string
  road_default: string
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

export interface DisplayLabels {
  city: string
  country: string
}

export type MapShape = "circular" | "rectangular"

export interface PosterConfig {
  geocode: GeocodeQuery
  viewport: Viewport
  themeId: string
  customTheme?: PosterTheme
  display: DisplayLabels
  fontFamily: string
  mapShape: MapShape
  widthInches: number
  heightInches: number
}

export interface ExportPreset {
  id: string
  label: string
  widthInches: number
  heightInches: number
  description: string
}

export type OsmGeometry =
  | { type: "line"; coordinates: Array<[number, number]> }
  | { type: "polygon"; coordinates: Array<[number, number]> }

export interface OsmFeature {
  id: string
  layer: "water" | "parks" | "roads"
  geometry: OsmGeometry
  tags: Record<string, string>
}

export interface OsmBundle {
  features: OsmFeature[]
  fetchedAt: number
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
}

export type GenerationPhase =
  | "idle"
  | "geocoding"
  | "fetching"
  | "rendering"
  | "exporting"
  | "done"
  | "error"

export interface GenerationProgress {
  phase: GenerationPhase
  message: string
  progress?: number
}

export interface PosterRenderResult {
  previewDataUrl: string
  widthPx: number
  heightPx: number
}

export const DPI = 300
export const MAX_INCHES = 20
