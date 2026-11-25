import { EXPORT_ATTRIBUTION } from "@/features/tiles/constants"
import { posterFontStack } from "@/lib/notoFonts"
import { formatCoordinates, formatPosterDisplayLines } from "@/lib/scriptDetection"
import type { DisplayLabels, Viewport } from "@/lib/types"

import {
  createCanvasTextMeasurer,
  fitPairLineTypography,
  pairLineMaxWidthPx,
  placeRuleSpan,
  type FittedPairLineTypography,
} from "./pairLineTypography"
import {
  posterTypographyLayout,
  type PosterFontSizes,
  type PosterTextFromBottom,
} from "./posterTypographyLayout"

export interface PosterLettering {
  city: FittedPairLineTypography
  country: FittedPairLineTypography
  rule: { x1: number; x2: number; widthPx: number }
  coordinates: string
  attribution: string
  fonts: PosterFontSizes
  fromBottom: PosterTextFromBottom
  lineWidth: number
  fadeBottomStart: number
  fontStack: string
  cityApplyLatinTracking: boolean
  countryApplyLatinTracking: boolean
}

export function primaryFontFamily(fontStack: string): string {
  const first = fontStack.split(",")[0]?.trim() ?? fontStack
  return first.replace(/^["']|["']$/g, "")
}

export function posterGlyphs(lettering: PosterLettering): string {
  const raw = [
    lettering.city.local,
    lettering.city.latin ?? "",
    lettering.country.local,
    lettering.country.latin ?? "",
    lettering.coordinates,
    lettering.attribution,
  ].join("")
  return Array.from(new Set(Array.from(raw))).join("")
}

export function buildPosterLettering(options: {
  widthPx: number
  heightPx: number
  display: DisplayLabels
  fontFamily: string
  viewport: Viewport
  measure?: (text: string, fontSize: number, weight: number) => number
  ctx?: CanvasRenderingContext2D
}): PosterLettering {
  const layout = posterTypographyLayout(options.widthPx, options.heightPx)
  const lines = formatPosterDisplayLines(options.display)
  const fontStack = posterFontStack(options.fontFamily, options.display.scriptFamily)
  const measure =
    options.measure ??
    (options.ctx ? createCanvasTextMeasurer(fontStack, options.ctx) : () => 0)

  const fit = (role: "city" | "country", local?: string, latin?: string, baseFontSize?: number) =>
    fitPairLineTypography({
      role,
      baseFontSize: baseFontSize ?? layout.fonts[role],
      local,
      latin,
      maxWidthPx: pairLineMaxWidthPx(options.widthPx),
      measure,
    })

  const city = fit("city", lines.city.local, lines.city.latin, layout.fonts.city)
  const country = fit("country", lines.country.local, lines.country.latin, layout.fonts.country)

  return {
    city,
    country,
    rule: placeRuleSpan(options.widthPx, city.widthPx),
    coordinates: formatCoordinates(options.viewport.latitude, options.viewport.longitude),
    attribution: EXPORT_ATTRIBUTION,
    fonts: layout.fonts,
    fromBottom: layout.fromBottom,
    lineWidth: layout.lineWidth,
    fadeBottomStart: layout.fadeBottomStart,
    fontStack,
    cityApplyLatinTracking: !lines.city.latin && lines.city.applyLatinTracking,
    countryApplyLatinTracking: !lines.country.latin && lines.country.applyLatinTracking,
  }
}
