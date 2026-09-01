/** @deprecated Use posterTypographyLayout().fromBottom */
export const POSTER_TEXT_FROM_BOTTOM = {
  city: 0.14,
  line: 0.125,
  country: 0.1,
  coordinates: 0.07,
  attribution: 0.02,
} as const

export const POSTER_ATTRIBUTION_FROM_RIGHT = 0.02

export interface PosterFontSizes {
  city: number
  country: number
  coordinates: number
  attribution: number
}

export interface PosterTextFromBottom {
  city: number
  line: number
  country: number
  coordinates: number
  attribution: number
}

export interface PosterTypographyLayout {
  fonts: PosterFontSizes
  lineWidth: number
  fromBottom: PosterTextFromBottom
  /** Bottom vignette fade start (fraction from top). */
  fadeBottomStart: number
}

/** Scale typography from the shorter poster edge so landscape exports stay readable. */
export function posterTypographyLayout(widthPx: number, heightPx: number): PosterTypographyLayout {
  const safeWidth = Math.max(widthPx, 1)
  const safeHeight = Math.max(heightPx, 1)
  const scaleBase = Math.min(safeWidth, safeHeight)

  const fonts: PosterFontSizes = {
    city: Math.max(14, Math.round(scaleBase * 0.055)),
    country: Math.max(11, Math.round(scaleBase * 0.028)),
    coordinates: Math.max(10, Math.round(scaleBase * 0.018)),
    attribution: Math.max(5, Math.round(scaleBase * 0.005)),
  }
  const lineWidth = Math.max(1, scaleBase * 0.0015)

  const attributionPx = safeHeight * 0.02
  const coordinatesPx =
    attributionPx + fonts.attribution * 1.4 + scaleBase * 0.012
  const countryPx = coordinatesPx + fonts.coordinates * 1.15 + scaleBase * 0.012
  const linePx = countryPx + fonts.country * 1.05 + scaleBase * 0.008
  const cityPx = linePx + scaleBase * 0.006 + 2

  const fromBottom: PosterTextFromBottom = {
    attribution: attributionPx / safeHeight,
    coordinates: coordinatesPx / safeHeight,
    country: countryPx / safeHeight,
    line: linePx / safeHeight,
    city: cityPx / safeHeight,
  }

  const textBandTopPx = cityPx + fonts.city * 1.05
  const fadeBottomStart = clamp(
    1 - (textBandTopPx + scaleBase * 0.04) / safeHeight,
    0.38,
    0.78,
  )

  return { fonts, lineWidth, fromBottom, fadeBottomStart }
}

/** @deprecated Use posterTypographyLayout().fonts */
export function posterFontSize(widthPx: number, heightPx = widthPx) {
  return posterTypographyLayout(widthPx, heightPx).fonts
}

/** @deprecated Use posterTypographyLayout().lineWidth */
export function posterLineWidth(widthPx: number, heightPx = widthPx) {
  return posterTypographyLayout(widthPx, heightPx).lineWidth
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
