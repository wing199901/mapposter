import type { PosterTheme } from "@/lib/types"

import autumn from "@/themes/autumn.json"
import blueprint from "@/themes/blueprint.json"
import contrastZones from "@/themes/contrast_zones.json"
import copperPatina from "@/themes/copper_patina.json"
import emerald from "@/themes/emerald.json"
import forest from "@/themes/forest.json"
import gradientRoads from "@/themes/gradient_roads.json"
import japaneseInk from "@/themes/japanese_ink.json"
import midnightBlue from "@/themes/midnight_blue.json"
import monochromeBlue from "@/themes/monochrome_blue.json"
import neonCyberpunk from "@/themes/neon_cyberpunk.json"
import noir from "@/themes/noir.json"
import ocean from "@/themes/ocean.json"
import pastelDream from "@/themes/pastel_dream.json"
import sunset from "@/themes/sunset.json"
import terracotta from "@/themes/terracotta.json"
import warmBeige from "@/themes/warm_beige.json"

const DEFAULT_THEME: PosterTheme = {
  name: "Default",
  description: "Fallback theme",
  bg: "#FFFFFF",
  text: "#000000",
  gradient_color: "#FFFFFF",
  water: "#C0C0C0",
  parks: "#F0F0F0",
  road_motorway: "#0A0A0A",
  road_primary: "#1A1A1A",
  road_secondary: "#2A2A2A",
  road_tertiary: "#3A3A3A",
  road_residential: "#4A4A4A",
  road_default: "#3A3A3A",
}

export const THEME_REGISTRY: Record<string, PosterTheme> = {
  autumn: autumn as PosterTheme,
  blueprint: blueprint as PosterTheme,
  contrast_zones: contrastZones as PosterTheme,
  copper_patina: copperPatina as PosterTheme,
  emerald: emerald as PosterTheme,
  forest: forest as PosterTheme,
  gradient_roads: gradientRoads as PosterTheme,
  japanese_ink: japaneseInk as PosterTheme,
  midnight_blue: midnightBlue as PosterTheme,
  monochrome_blue: monochromeBlue as PosterTheme,
  neon_cyberpunk: neonCyberpunk as PosterTheme,
  noir: noir as PosterTheme,
  ocean: ocean as PosterTheme,
  pastel_dream: pastelDream as PosterTheme,
  sunset: sunset as PosterTheme,
  terracotta: terracotta as PosterTheme,
  warm_beige: warmBeige as PosterTheme,
}

export const THEME_IDS = Object.keys(THEME_REGISTRY).sort()

export function loadTheme(themeId: string, customTheme?: PosterTheme): PosterTheme {
  if (customTheme) {
    return { ...DEFAULT_THEME, ...customTheme }
  }

  return THEME_REGISTRY[themeId] ?? THEME_REGISTRY.terracotta ?? DEFAULT_THEME
}

export function listThemes(): Array<{ id: string; theme: PosterTheme }> {
  return THEME_IDS.map((id) => ({ id, theme: THEME_REGISTRY[id]! }))
}

export function createEmptyCustomTheme(baseId = "terracotta"): PosterTheme {
  const base = loadTheme(baseId)
  return structuredClone(base)
}
