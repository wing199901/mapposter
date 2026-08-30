import type { PosterTheme } from "@/lib/types"

const ROAD_WIDTHS: Record<string, number> = {
  motorway: 1.2,
  motorway_link: 1.0,
  trunk: 1.0,
  primary: 1.0,
  secondary: 0.8,
  tertiary: 0.6,
  residential: 0.4,
  living_street: 0.4,
  unclassified: 0.5,
  service: 0.35,
}

export function roadColor(theme: PosterTheme, highway?: string): string {
  switch (highway) {
    case "motorway":
    case "motorway_link":
      return theme.road_motorway
    case "trunk":
    case "primary":
      return theme.road_primary
    case "secondary":
      return theme.road_secondary
    case "tertiary":
      return theme.road_tertiary
    case "residential":
    case "living_street":
      return theme.road_residential
    default:
      return theme.road_default
  }
}

export function roadWidth(highway?: string, scale = 1): number {
  const base = highway ? (ROAD_WIDTHS[highway] ?? 0.5) : 0.5
  return base * scale
}

export function roadZIndex(highway?: string): number {
  switch (highway) {
    case "motorway":
    case "motorway_link":
      return 5
    case "trunk":
    case "primary":
      return 4
    case "secondary":
      return 3
    case "tertiary":
      return 2
    default:
      return 1
  }
}
