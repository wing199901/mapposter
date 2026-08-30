import { formatCityLabel, formatCoordinates, isLatinScript } from "@/lib/scriptDetection"
import type { DisplayLabels, PosterTheme, Viewport } from "@/lib/types"

export interface TypographyInput {
  theme: PosterTheme
  viewport: Viewport
  display: DisplayLabels
  fontFamily: string
}

export async function loadPosterFont(family: string): Promise<void> {
  if (!family || family === "Roboto") {
    return
  }

  const id = `poster-font-${family.replace(/\s+/g, "-")}`
  if (document.getElementById(id)) {
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`
  document.head.appendChild(link)

  await document.fonts.load(`700 48px "${family}"`)
}

export function drawTypography(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: TypographyInput,
): void {
  const { theme, viewport, display, fontFamily } = input
  const city = formatCityLabel(display.city)
  const country = display.country
  const coords = formatCoordinates(viewport.latitude, viewport.longitude)
  const fontStack = `"${fontFamily}", "Roboto", system-ui, sans-serif`

  ctx.save()
  ctx.fillStyle = theme.text
  ctx.textAlign = "center"

  ctx.font = `700 ${Math.round(width * 0.055)}px ${fontStack}`
  ctx.fillText(city, width / 2, height * 0.86)

  ctx.strokeStyle = theme.text
  ctx.lineWidth = Math.max(1, width * 0.0015)
  ctx.beginPath()
  ctx.moveTo(width * 0.35, height * 0.875)
  ctx.lineTo(width * 0.65, height * 0.875)
  ctx.stroke()

  ctx.font = `500 ${Math.round(width * 0.028)}px ${fontStack}`
  ctx.fillText(country, width / 2, height * 0.905)

  ctx.font = `400 ${Math.round(width * 0.018)}px ${fontStack}`
  ctx.fillText(coords, width / 2, height * 0.935)

  ctx.textAlign = "right"
  ctx.font = `400 ${Math.round(width * 0.012)}px ${fontStack}`
  ctx.fillText("© OpenStreetMap contributors", width * 0.97, height * 0.975)

  ctx.restore()

  if (isLatinScript(city)) {
    void city
  }
}
