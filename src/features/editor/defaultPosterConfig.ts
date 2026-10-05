import type { PosterConfig } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"

/**
 * Cold-start poster when URL hash and autosave are both absent.
 * Hong Kong SAR bilingual lettering is the product’s first-session story;
 * Latin places remain first-class via search and examples.
 *
 * Viewport: harbour-centred SAR overview (22.3193°N, 114.1694°E, 30 km)
 * so Island, Kowloon, and the near New Territories read as one poster.
 */
export const DEFAULT_CONFIG: PosterConfig = {
  geocode: { city: "Hong Kong", country: "Hong Kong" },
  viewport: { latitude: 22.3193, longitude: 114.1694, radiusMeters: 30000 },
  themeId: "noir",
  display: {
    city: "香港",
    cityLatin: "Hong Kong",
    country: "香港",
    countryLatin: "Hong Kong",
    scriptFamily: "hk",
    hasPlaceLocalName: true,
  },
  fontFamily: "Noto Sans HK",
  // Skip cold-start Nominatim so the baked bilingual poster stays stable;
  // place edits and Examples still re-run lookup.
  centerLocked: true,
  widthInches: 12,
  heightInches: 16,
  layerVisibility: DEFAULT_LAYER_VISIBILITY,
  boundaryMaskEnabled: false,
}

export interface PosterExample {
  id: string
  label: string
  hint: string
  patch: Pick<
    PosterConfig,
    "geocode" | "viewport" | "display" | "fontFamily" | "themeId" | "centerLocked"
  >
}

/** Lightweight Location examples — not a gallery dashboard. */
export const POSTER_EXAMPLES: PosterExample[] = [
  {
    id: "hong-kong",
    label: "Hong Kong",
    hint: "SAR · Noto Sans HK",
    patch: {
      geocode: { city: "Hong Kong", country: "Hong Kong" },
      viewport: { latitude: 22.3193, longitude: 114.1694, radiusMeters: 30000 },
      display: {
        city: "香港",
        cityLatin: "Hong Kong",
        country: "香港",
        countryLatin: "Hong Kong",
        scriptFamily: "hk",
        hasPlaceLocalName: true,
      },
      fontFamily: "Noto Sans HK",
      themeId: "noir",
      centerLocked: true,
    },
  },
  {
    id: "kyoto",
    label: "Kyoto",
    hint: "Bilingual · Noto Sans JP",
    patch: {
      geocode: { city: "Kyoto", country: "Japan" },
      viewport: { latitude: 35.0116, longitude: 135.7681, radiusMeters: 12000 },
      display: {
        city: "京都",
        cityLatin: "Kyoto",
        country: "日本",
        countryLatin: "Japan",
        scriptFamily: "jp",
        hasPlaceLocalName: true,
      },
      fontFamily: "Noto Sans JP",
      themeId: "japanese_ink",
      centerLocked: false,
    },
  },
  {
    id: "paris",
    label: "Paris",
    hint: "Latin letter-spacing",
    patch: {
      geocode: { city: "Paris", country: "France" },
      viewport: { latitude: 48.8566, longitude: 2.3522, radiusMeters: 10000 },
      display: { city: "Paris", country: "France" },
      fontFamily: "Roboto",
      themeId: "terracotta",
      centerLocked: false,
    },
  },
]
