import type { PosterTheme } from "@/lib/types"

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
 * Fixed stroke for the SVG Poster.
 * Preview line width stays a zoom interpolation in the map style.
 */
export function exportStrokeWidthForLayer(layerId: string): number {
  switch (layerId) {
    case "road-motorway":
      return 4
    case "road-bridge-deck":
      return 3.2
    case "road-ferry":
      return 1.4
    case "road-primary":
      return 3
    case "road-secondary":
      return 2.2
    case "road-tertiary":
      return 1.6
    case "road-residential":
      return 1
    case "waterway":
      return 1.2
    default:
      return 1.2
  }
}
