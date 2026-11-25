import { DEFAULT_CONFIG } from "@/features/editor/defaultPosterConfig"
import type { PosterConfig } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"
import { encodePosterState } from "@/lib/urlState"

/**
 * Seed bilingual share URLs for README / growth loops.
 * Hashes are stable for a given config snapshot; prefer centerLocked so
 * opening a link does not re-geocode and rewrite radius/labels.
 */
export interface ShareDemo {
  id: string
  label: string
  hint: string
  config: PosterConfig
}

function demoConfig(
  patch: Pick<
    PosterConfig,
    "geocode" | "viewport" | "display" | "fontFamily" | "themeId"
  >,
): PosterConfig {
  return {
    ...DEFAULT_CONFIG,
    ...patch,
    centerLocked: true,
    widthInches: 12,
    heightInches: 16,
    layerVisibility: DEFAULT_LAYER_VISIBILITY,
    boundaryMaskEnabled: false,
    customTheme: undefined,
    placeOsmType: undefined,
    placeOsmId: undefined,
  }
}

export const SHARE_DEMO_CONFIGS: ShareDemo[] = [
  {
    id: "hong-kong",
    label: "Hong Kong",
    hint: "香港 · Noto Sans HK · noir",
    config: demoConfig({
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
    }),
  },
  {
    id: "kyoto",
    label: "Kyoto",
    hint: "京都 · Noto Sans JP · japanese_ink",
    config: demoConfig({
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
    }),
  },
  {
    id: "taipei",
    label: "Taipei",
    hint: "臺北 · Noto Sans TC · blueprint",
    config: demoConfig({
      geocode: { city: "Taipei", country: "Taiwan" },
      viewport: { latitude: 25.033, longitude: 121.5654, radiusMeters: 12000 },
      display: {
        city: "臺北",
        cityLatin: "Taipei",
        country: "台灣",
        countryLatin: "Taiwan",
        scriptFamily: "tc",
        hasPlaceLocalName: true,
      },
      fontFamily: "Noto Sans TC",
      themeId: "blueprint",
    }),
  },
  {
    id: "seoul",
    label: "Seoul",
    hint: "서울 · Noto Sans KR · midnight_blue",
    config: demoConfig({
      geocode: { city: "Seoul", country: "South Korea" },
      viewport: { latitude: 37.5665, longitude: 126.978, radiusMeters: 14000 },
      display: {
        city: "서울",
        cityLatin: "Seoul",
        country: "대한민국",
        countryLatin: "South Korea",
        scriptFamily: "kr",
        hasPlaceLocalName: true,
      },
      fontFamily: "Noto Sans KR",
      themeId: "midnight_blue",
    }),
  },
  {
    id: "tokyo",
    label: "Tokyo",
    hint: "東京 · Noto Sans JP · japanese_ink",
    config: demoConfig({
      geocode: { city: "Tokyo", country: "Japan" },
      viewport: { latitude: 35.6762, longitude: 139.6503, radiusMeters: 18000 },
      display: {
        city: "東京",
        cityLatin: "Tokyo",
        country: "日本",
        countryLatin: "Japan",
        scriptFamily: "jp",
        hasPlaceLocalName: true,
      },
      fontFamily: "Noto Sans JP",
      themeId: "japanese_ink",
    }),
  },
]

export function shareDemoHash(config: PosterConfig): string {
  return encodePosterState(config)
}

export function shareDemoPath(config: PosterConfig): string {
  return `#p=${shareDemoHash(config)}`
}
