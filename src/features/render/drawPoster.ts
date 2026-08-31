import type { DisplayLabels, OsmFeature, PosterTheme, Viewport } from "@/lib/types"

import { createProjector, fitToCanvas } from "@/features/render/projection"
import { roadColor, roadWidth, roadZIndex } from "@/features/render/roadStyle"
import { drawTypography } from "@/features/render/typography"

export type DrawableCanvas = HTMLCanvasElement | OffscreenCanvas
type DrawableContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface DrawPosterInput {
  features: OsmFeature[]
  theme: PosterTheme
  viewport: Viewport
  display: DisplayLabels
  fontFamily: string
  widthPx: number
  heightPx: number
  previewScale?: number
}

function drawGradientFade(
  ctx: DrawableContext,
  width: number,
  height: number,
  color: string,
): void {
  const top = ctx.createLinearGradient(0, 0, 0, height * 0.18)
  top.addColorStop(0, color)
  top.addColorStop(1, `${color}00`)
  ctx.fillStyle = top
  ctx.fillRect(0, 0, width, height * 0.18)

  const bottom = ctx.createLinearGradient(0, height * 0.72, 0, height)
  bottom.addColorStop(0, `${color}00`)
  bottom.addColorStop(1, color)
  ctx.fillStyle = bottom
  ctx.fillRect(0, height * 0.72, width, height * 0.28)
}

function drawPolygon(
  ctx: DrawableContext,
  points: Array<[number, number]>,
  fill: string,
): void {
  if (points.length < 3) {
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0]![0], points[0]![1])
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index]![0], points[index]![1])
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function drawPolyline(
  ctx: DrawableContext,
  points: Array<[number, number]>,
  stroke: string,
  lineWidth: number,
): void {
  if (points.length < 2) {
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0]![0], points[0]![1])
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index]![0], points[index]![1])
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.stroke()
}

export function drawPoster(canvas: DrawableCanvas, input: DrawPosterInput): void {
  const {
    features,
    theme,
    viewport,
    display,
    fontFamily,
    widthPx,
    heightPx,
    previewScale = 1,
  } = input

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable")
  }

  canvas.width = widthPx
  canvas.height = heightPx

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, widthPx, heightPx)

  const projector = createProjector(viewport)
  const mapHeight = heightPx * 0.78
  const canvasFit = fitToCanvas(projector, widthPx, mapHeight)
  const toCanvas = (point: [number, number]) => canvasFit.project(point)
  const roadScale = Math.max(1.5, widthPx / 1200) * previewScale

  const water = features.filter((feature) => feature.layer === "water")
  const parks = features.filter((feature) => feature.layer === "parks")
  const roads = features
    .filter((feature) => feature.layer === "roads")
    .sort(
      (left, right) =>
        roadZIndex(left.tags.highway) - roadZIndex(right.tags.highway),
    )

  for (const feature of water) {
    if (feature.geometry.type !== "polygon") {
      continue
    }
    const points = feature.geometry.coordinates.map(([lat, lon]) =>
      toCanvas(projector.project(lat, lon)),
    )
    drawPolygon(ctx, points, theme.water)
  }

  for (const feature of parks) {
    if (feature.geometry.type !== "polygon") {
      continue
    }
    const points = feature.geometry.coordinates.map(([lat, lon]) =>
      toCanvas(projector.project(lat, lon)),
    )
    drawPolygon(ctx, points, theme.parks)
  }

  for (const feature of roads) {
    if (feature.geometry.type !== "line") {
      continue
    }
    const points = feature.geometry.coordinates.map(([lat, lon]) =>
      toCanvas(projector.project(lat, lon)),
    )
    drawPolyline(
      ctx,
      points,
      roadColor(theme, feature.tags.highway),
      roadWidth(feature.tags.highway, roadScale),
    )
  }

  drawGradientFade(ctx, widthPx, heightPx, theme.gradient_color)
  drawTypography(ctx as CanvasRenderingContext2D, widthPx, heightPx, {
    theme,
    viewport,
    display,
    fontFamily,
  })
}

export function canvasToPngBlob(canvas: DrawableCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG export failed"))
        return
      }
      resolve(blob)
    }, "image/png")
  })
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png")
}
