export type PairLineRole = "city" | "country"

export const PAIR_LINE_SAFE_WIDTH_RATIO = 0.9

export interface PairLineWeights {
  local: number
  latin: number
}

export interface FittedPairLineTypography {
  /** Shared size for local and latin after fit. */
  fontSize: number
  localFontSize: number
  latinFontSize: number
  localWeight: number
  latinWeight: number
  gapPx: number
  local: string
  latin?: string
}

export function pairLineWeights(role: PairLineRole): PairLineWeights {
  if (role === "city") {
    return { local: 700, latin: 500 }
  }
  return { local: 500, latin: 400 }
}

function baseGapPx(role: PairLineRole, baseFontSize: number): number {
  if (role === "city") {
    return Math.max(8, Math.round(baseFontSize * 0.2))
  }
  return Math.max(6, Math.round(baseFontSize * 0.18))
}

export function pairLineMaxWidthPx(posterWidthPx: number): number {
  return Math.max(1, posterWidthPx * PAIR_LINE_SAFE_WIDTH_RATIO)
}

/**
 * Fit a bilingual name-pair line: same font size for local + latin, lighter latin weight.
 * If the line exceeds maxWidthPx, scale the whole line down together.
 */
export function fitPairLineTypography(options: {
  role: PairLineRole
  baseFontSize: number
  local?: string
  latin?: string
  maxWidthPx: number
  measure: (text: string, fontSize: number, weight: number) => number
}): FittedPairLineTypography {
  const local = options.local?.trim() ?? ""
  const latin = options.latin?.trim() || undefined
  const weights = pairLineWeights(options.role)
  const minFontSize = 8
  let fontSize = options.baseFontSize

  const measureLineWidth = (size: number) => {
    const gap =
      local && latin ? Math.max(4, Math.round(baseGapPx(options.role, options.baseFontSize) * (size / options.baseFontSize))) : 0
    const localWidth = local ? options.measure(local, size, weights.local) : 0
    const latinWidth = latin ? options.measure(latin, size, weights.latin) : 0
    return { width: localWidth + gap + latinWidth, gap }
  }

  let fitted = measureLineWidth(fontSize)
  while (fitted.width > options.maxWidthPx && fontSize > minFontSize) {
    fontSize -= 1
    fitted = measureLineWidth(fontSize)
  }

  return {
    fontSize,
    localFontSize: fontSize,
    latinFontSize: fontSize,
    localWeight: weights.local,
    latinWeight: weights.latin,
    gapPx: fitted.gap,
    local,
    latin,
  }
}

export function createCanvasTextMeasurer(
  fontStack: string,
  ctx: CanvasRenderingContext2D,
): (text: string, fontSize: number, weight: number) => number {
  return (text, fontSize, weight) => {
    ctx.font = `${weight} ${fontSize}px ${fontStack}`
    return ctx.measureText(text).width
  }
}

export function fitPairLineTypographyForPoster(options: {
  role: PairLineRole
  baseFontSize: number
  local?: string
  latin?: string
  posterWidthPx: number
  fontStack: string
  ctx: CanvasRenderingContext2D
}): FittedPairLineTypography {
  return fitPairLineTypography({
    role: options.role,
    baseFontSize: options.baseFontSize,
    local: options.local,
    latin: options.latin,
    maxWidthPx: pairLineMaxWidthPx(options.posterWidthPx),
    measure: createCanvasTextMeasurer(options.fontStack, options.ctx),
  })
}
