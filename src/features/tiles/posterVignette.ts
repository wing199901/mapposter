import {
  POSTER_FADE_TOP_HEIGHT,
} from "@/features/tiles/constants"

export function posterBottomVignetteCss(
  fadeBottomStart: number,
  gradientColorVar = "var(--poster-gradient)",
): string {
  const start = fadeBottomStart * 100
  return `linear-gradient(to bottom, transparent ${start}%, ${gradientColorVar} 100%)`
}

export function posterTopVignetteCss(gradientColorVar = "var(--poster-gradient)"): string {
  const end = POSTER_FADE_TOP_HEIGHT * 100
  return `linear-gradient(to bottom, ${gradientColorVar} 0%, transparent ${end}%)`
}

export function posterVignetteSvgDefs(gradientColor: string): string {
  return `
    <linearGradient id="poster-fade-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradientColor}" stop-opacity="0" />
      <stop offset="100%" stop-color="${gradientColor}" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="poster-fade-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradientColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${gradientColor}" stop-opacity="0" />
    </linearGradient>
  `
}

export function posterVignetteSvgRects(
  widthPx: number,
  heightPx: number,
  fadeBottomStart: number,
): string {
  const bottomTop = heightPx * fadeBottomStart
  const bottomHeight = heightPx - bottomTop
  const topHeight = heightPx * POSTER_FADE_TOP_HEIGHT
  return `
    <rect x="0" y="${bottomTop.toFixed(2)}" width="${widthPx}" height="${bottomHeight.toFixed(2)}" fill="url(#poster-fade-bottom)" />
    <rect x="0" y="0" width="${widthPx}" height="${topHeight.toFixed(2)}" fill="url(#poster-fade-top)" />
  `
}
