import type { PosterTheme } from "@/lib/types"

/**
 * Canonical Poster stroke weights (export px) plus Preview zoom-interpolation bases.
 * Export uses `poster`; Preview `roadLayer` interpolates around `previewBase`.
 * Intentional gap (ADR 0008): Preview width still changes with zoom; Poster stays fixed.
 */
export const LAYER_STROKE = {
  "road-motorway": { poster: 4, previewBase: 2.8 },
  "road-bridge-deck": { poster: 3.2, previewBase: 2.4 },
  "road-primary": { poster: 3, previewBase: 2 },
  "road-secondary": { poster: 2.2, previewBase: 1.4 },
  "road-tertiary": { poster: 1.6, previewBase: 1 },
  "road-residential": { poster: 1, previewBase: 0.6 },
  "road-ferry": { poster: 1.4, previewBase: 1 },
  "road-rail": { poster: 1.2, previewBase: 1.2 },
  "road-default": { poster: 1.2, previewBase: 0.8 },
  waterway: { poster: 1.2, previewBase: 1.2 },
} as const

export type StrokeLayerId = keyof typeof LAYER_STROKE

/** Default Poster stroke when a layer id is absent from LAYER_STROKE. */
export const DEFAULT_POSTER_STROKE_WEIGHT = 1.2

/** Buildings fill opacity shared by Preview MapLibre style and SVG Poster. */
export const BUILDINGS_FILL_OPACITY = 0.85

/** SVG stroke style aligned with MapLibre Preview (`line-cap` / `line-join`). */
export const POSTER_STROKE_LINECAP = "butt" as const
export const POSTER_STROKE_LINEJOIN = "miter" as const

/** Theme color for a map-layer id. Preview and SVG export both read this. */
export function themeColorForLayer(theme: PosterTheme, layerId: string): string {
  switch (layerId) {
    case "water":
    case "water-detail":
    case "waterway":
      return theme.water
    case "parks":
    case "parks-landcover":
      return theme.parks
    case "buildings":
      return theme.buildings
    case "road-motorway":
    case "road-bridge-deck":
      return theme.road_motorway
    case "road-primary":
      return theme.road_primary
    case "road-secondary":
      return theme.road_secondary
    case "road-tertiary":
      return theme.road_tertiary
    case "road-residential":
      return theme.road_residential
    case "road-ferry":
    case "road-rail":
    case "road-default":
      return theme.road_default
    default:
      return theme.road_default
  }
}

/**
 * Fixed stroke for the SVG Poster (poster-px).
 * Preview line width stays a zoom interpolation around previewStrokeBaseForLayer.
 */
export function exportStrokeWidthForLayer(layerId: string): number {
  if (layerId in LAYER_STROKE) {
    return LAYER_STROKE[layerId as StrokeLayerId].poster
  }
  return DEFAULT_POSTER_STROKE_WEIGHT
}

/** Preview MapLibre line-width interpolation base for a road / waterway layer. */
export function previewStrokeBaseForLayer(layerId: string): number {
  if (layerId in LAYER_STROKE) {
    return LAYER_STROKE[layerId as StrokeLayerId].previewBase
  }
  return DEFAULT_POSTER_STROKE_WEIGHT
}
