import { outsideBoundaryMaskPath } from "@/features/boundary/projectBoundaryToScreen"
import type { Feature, GeoJsonProperties, Geometry } from "geojson"
import type { Map } from "maplibre-gl"

import { posterFontStack } from "@/lib/notoFonts"
import { formatCoordinates, formatPosterDisplayLines } from "@/lib/scriptDetection"
import type { DisplayLabels, PosterLayerVisibility, PosterTheme, Viewport } from "@/lib/types"
import { DPI } from "@/lib/types"

import { EXPORT_ATTRIBUTION, MAP_BAND_HEIGHT_RATIO, POSTER_FADE_TOP_HEIGHT } from "@/features/tiles/constants"
import {
  POSTER_ATTRIBUTION_FROM_RIGHT,
  posterTypographyLayout,
} from "@/features/tiles/posterTypographyLayout"
import {
  posterVignetteSvgDefs,
  posterVignetteSvgRects,
} from "@/features/tiles/posterVignette"
import { mapFeatureLayerIds } from "@/features/tiles/themeToMapStyle"

export interface PosterLayout {
  widthPx: number
  heightPx: number
  mapHeightPx: number
}

export interface BuildPosterSvgOptions {
  layerVisibility?: PosterLayerVisibility
  boundaryMaskEnabled?: boolean
  boundaryGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
}

export function posterLayoutFromInches(widthInches: number, heightInches: number): PosterLayout {
  const widthPx = Math.round(widthInches * DPI)
  const heightPx = Math.round(heightInches * DPI)
  return {
    widthPx,
    heightPx,
    mapHeightPx: Math.round(heightPx * MAP_BAND_HEIGHT_RATIO),
  }
}

function projectCoord(map: Map, coord: [number, number]): [number, number] {
  const point = map.project(coord)
  return [point.x, point.y]
}

function ringToPath(map: Map, ring: Array<[number, number]>): string {
  if (ring.length === 0) {
    return ""
  }
  const [firstX, firstY] = projectCoord(map, ring[0]!)
  const rest = ring
    .slice(1)
    .map((coord) => {
      const [x, y] = projectCoord(map, coord)
      return `L ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
  return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${rest} Z`
}

function geometryToPaths(map: Map, geometry: Geometry): string[] {
  if (geometry.type === "LineString") {
    const coords = geometry.coordinates as Array<[number, number]>
    if (coords.length < 2) {
      return []
    }
    const [firstX, firstY] = projectCoord(map, coords[0]!)
    const rest = coords
      .slice(1)
      .map((coord) => {
        const [x, y] = projectCoord(map, coord)
        return `L ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(" ")
    return [`M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${rest}`]
  }

  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.flatMap((line) =>
      geometryToPaths(map, { type: "LineString", coordinates: line }),
    )
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(map, ring as Array<[number, number]>))
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((poly) =>
      geometryToPaths(map, { type: "Polygon", coordinates: poly }),
    )
  }

  return []
}

function hexWithAlpha(hex: string, alpha: number): string {
  const channel = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${channel}`
}

function drawPosterVignette(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayout,
  theme: PosterTheme,
  fadeBottomStart: number,
): void {
  const { widthPx, heightPx } = layout
  const bottomTop = heightPx * fadeBottomStart
  const bottomGrad = ctx.createLinearGradient(0, bottomTop, 0, heightPx)
  bottomGrad.addColorStop(0, hexWithAlpha(theme.gradient_color, 0))
  bottomGrad.addColorStop(1, theme.gradient_color)
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, bottomTop, widthPx, heightPx - bottomTop)

  const topHeight = heightPx * POSTER_FADE_TOP_HEIGHT
  const topGrad = ctx.createLinearGradient(0, 0, 0, topHeight)
  topGrad.addColorStop(0, hexWithAlpha(theme.gradient_color, 0.9))
  topGrad.addColorStop(1, hexWithAlpha(theme.gradient_color, 0))
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, widthPx, topHeight)
}

function drawPosterTypography(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayout,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
): void {
  const { widthPx, heightPx } = layout
  const lines = formatPosterDisplayLines(display)
  const coords = formatCoordinates(viewport.latitude, viewport.longitude)
  const fontStack = posterFontStack(fontFamily, display.scriptFamily)
  const typography = posterTypographyLayout(widthPx, heightPx)
  const { fonts, lineWidth, fromBottom } = typography
  const y = (fromBottomFraction: number) => heightPx * (1 - fromBottomFraction)

  ctx.fillStyle = theme.text
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"

  if (lines.city.latin) {
    const cityLatinFontSize = Math.max(fonts.country, Math.round(fonts.city * 0.45))
    ctx.font = `700 ${fonts.city}px ${fontStack}`
    const localWidth = ctx.measureText(lines.city.local).width
    ctx.font = `500 ${cityLatinFontSize}px ${fontStack}`
    const latinWidth = ctx.measureText(lines.city.latin).width
    const gap = Math.max(8, Math.round(fonts.country * 0.3))
    const startX = widthPx / 2 - (localWidth + gap + latinWidth) / 2
    ctx.font = `700 ${fonts.city}px ${fontStack}`
    ctx.fillText(lines.city.local, startX + localWidth / 2, y(fromBottom.city))
    ctx.font = `500 ${cityLatinFontSize}px ${fontStack}`
    ctx.fillText(lines.city.latin, startX + localWidth + gap + latinWidth / 2, y(fromBottom.city))
  } else {
    ctx.font = `700 ${fonts.city}px ${fontStack}`
    ctx.fillText(lines.city.local, widthPx / 2, y(fromBottom.city))
  }

  ctx.strokeStyle = theme.text
  ctx.globalAlpha = 0.8
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(widthPx * 0.35, y(fromBottom.line))
  ctx.lineTo(widthPx * 0.65, y(fromBottom.line))
  ctx.stroke()
  ctx.globalAlpha = 1

  if (lines.country.latin) {
    const countryLatinFontSize = Math.max(fonts.coordinates, Math.round(fonts.country * 0.65))
    ctx.font = `500 ${fonts.country}px ${fontStack}`
    const localWidth = ctx.measureText(lines.country.local).width
    ctx.font = `400 ${countryLatinFontSize}px ${fontStack}`
    const latinWidth = ctx.measureText(lines.country.latin).width
    const gap = Math.max(6, Math.round(fonts.country * 0.25))
    const startX = widthPx / 2 - (localWidth + gap + latinWidth) / 2
    ctx.font = `500 ${fonts.country}px ${fontStack}`
    ctx.fillText(lines.country.local, startX + localWidth / 2, y(fromBottom.country))
    ctx.font = `400 ${countryLatinFontSize}px ${fontStack}`
    ctx.fillText(
      lines.country.latin,
      startX + localWidth + gap + latinWidth / 2,
      y(fromBottom.country),
    )
  } else {
    ctx.font = `500 ${fonts.country}px ${fontStack}`
    ctx.fillText(lines.country.local, widthPx / 2, y(fromBottom.country))
  }

  ctx.font = `400 ${fonts.coordinates}px ${fontStack}`
  ctx.globalAlpha = 0.8
  ctx.fillText(coords, widthPx / 2, y(fromBottom.coordinates))
  ctx.globalAlpha = 1

  ctx.font = `400 ${fonts.attribution}px ${fontStack}`
  ctx.globalAlpha = 0.5
  ctx.textAlign = "right"
  ctx.fillText(
    EXPORT_ATTRIBUTION,
    widthPx * (1 - POSTER_ATTRIBUTION_FROM_RIGHT),
    y(fromBottom.attribution),
  )
  ctx.globalAlpha = 1
}

/** Raster export from the live MapLibre canvas so PNG matches preview (water, roads, zoom). */
export async function buildPosterPngFromMapCanvas(
  map: Map,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
  layout: PosterLayout,
  options: BuildPosterSvgOptions = {},
): Promise<Blob> {
  map.triggerRepaint()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

  const mapCanvas = map.getCanvas()
  const mapCssWidth = map.getContainer().clientWidth
  const mapCssHeight = map.getContainer().clientHeight
  const scaleX = layout.widthPx / mapCssWidth
  const scaleY = layout.mapHeightPx / mapCssHeight

  const canvas = document.createElement("canvas")
  canvas.width = layout.widthPx
  canvas.height = layout.heightPx
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Canvas not supported")
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, layout.widthPx, layout.heightPx)

  ctx.drawImage(
    mapCanvas,
    0,
    0,
    mapCanvas.width,
    mapCanvas.height,
    0,
    0,
    layout.widthPx,
    layout.mapHeightPx,
  )

  if (options.boundaryMaskEnabled && options.boundaryGeometry) {
    const maskPath = new Path2D(outsideBoundaryMaskPath(map, options.boundaryGeometry))
    ctx.save()
    ctx.scale(scaleX, scaleY)
    ctx.fillStyle = theme.bg
    ctx.fill(maskPath, "evenodd")
    ctx.restore()
  }

  const typography = posterTypographyLayout(layout.widthPx, layout.heightPx)
  drawPosterVignette(ctx, layout, theme, typography.fadeBottomStart)
  drawPosterTypography(ctx, layout, theme, viewport, display, fontFamily)

  return canvasToPngBlob(canvas)
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function typographySvg(
  layout: PosterLayout,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
): string {
  const { widthPx, heightPx } = layout
  const lines = formatPosterDisplayLines(display)
  const coords = formatCoordinates(viewport.latitude, viewport.longitude)
  const fontStack = posterFontStack(fontFamily, display.scriptFamily)
  const typography = posterTypographyLayout(widthPx, heightPx)
  const { fonts, lineWidth, fromBottom } = typography

  const y = (fromBottomFraction: number) => heightPx * (1 - fromBottomFraction)
  const cityLatinSize = Math.max(fonts.country, Math.round(fonts.city * 0.45))
  const countryLatinSize = Math.max(fonts.coordinates, Math.round(fonts.country * 0.65))
  const cityGap = Math.max(8, Math.round(fonts.country * 0.3))
  const countryGap = Math.max(6, Math.round(fonts.country * 0.25))

  return `
    <text x="${widthPx / 2}" y="${y(fromBottom.city)}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${fonts.city}" font-weight="700" text-anchor="middle" dominant-baseline="alphabetic">${escapeXml(lines.city.local)}${lines.city.latin ? `<tspan dx="${cityGap}" font-size="${cityLatinSize}" font-weight="500">${escapeXml(lines.city.latin)}</tspan>` : ""}</text>
    <line x1="${widthPx * 0.35}" y1="${y(fromBottom.line)}" x2="${widthPx * 0.65}" y2="${y(fromBottom.line)}" stroke="${theme.text}" stroke-width="${lineWidth}" />
    <text x="${widthPx / 2}" y="${y(fromBottom.country)}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${fonts.country}" font-weight="500" text-anchor="middle" dominant-baseline="alphabetic">${escapeXml(lines.country.local)}${lines.country.latin ? `<tspan dx="${countryGap}" font-size="${countryLatinSize}" font-weight="400">${escapeXml(lines.country.latin)}</tspan>` : ""}</text>
    <text x="${widthPx / 2}" y="${y(fromBottom.coordinates)}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${fonts.coordinates}" font-weight="400" text-anchor="middle" dominant-baseline="alphabetic">${escapeXml(coords)}</text>
    <text x="${widthPx * (1 - POSTER_ATTRIBUTION_FROM_RIGHT)}" y="${y(fromBottom.attribution)}" fill="${theme.text}" fill-opacity="0.5" font-family="${escapeXml(fontStack)}" font-size="${fonts.attribution}" font-weight="400" text-anchor="end" dominant-baseline="alphabetic">${escapeXml(EXPORT_ATTRIBUTION)}</text>
  `
}

export function buildPosterSvg(
  map: Map,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
  layout: PosterLayout,
  options: BuildPosterSvgOptions = {},
): string {
  const mapWidth = map.getContainer().clientWidth
  const mapHeight = map.getContainer().clientHeight
  const scaleX = layout.widthPx / mapWidth
  const scaleY = layout.mapHeightPx / mapHeight

  const groups: string[] = []

  const layerIds = mapFeatureLayerIds({ layerVisibility: options.layerVisibility })

  for (const layerId of layerIds) {
    const features = map.queryRenderedFeatures(undefined, { layers: [layerId] }) as Array<
      Feature<Geometry, GeoJsonProperties>
    >
    const paths = features.flatMap((feature) => {
      if (!feature.geometry) {
        return []
      }
      return geometryToPaths(map, feature.geometry)
    })
    if (paths.length === 0) {
      continue
    }
    const isLine = layerId.startsWith("road") || layerId === "waterway"
    const strokeWidth = strokeWidthForLayer(layerId)
    const paint = isLine
      ? `fill="none" stroke="${themeForLayer(theme, layerId)}" stroke-width="${(strokeWidth / scaleX).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${themeForLayer(theme, layerId)}" stroke="none"`
    groups.push(
      `<g id="${layerId}" transform="scale(${scaleX} ${scaleY})">${paths.map((path) => `<path d="${path}" ${paint} />`).join("")}</g>`,
    )
  }

  let mapContent = groups.join("")

  if (options.boundaryMaskEnabled && options.boundaryGeometry) {
    const maskPathData = outsideBoundaryMaskPath(map, options.boundaryGeometry)
    mapContent += `<g id="boundary-mask" transform="scale(${scaleX} ${scaleY})"><path d="${maskPathData}" fill="${theme.bg}" fill-rule="evenodd" stroke="none" /></g>`
  }

  const typography = posterTypographyLayout(layout.widthPx, layout.heightPx)

  const gradient = `
    <defs>
      ${posterVignetteSvgDefs(theme.gradient_color)}
    </defs>
    ${posterVignetteSvgRects(layout.widthPx, layout.heightPx, typography.fadeBottomStart)}
  `

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.widthPx}" height="${layout.heightPx}" viewBox="0 0 ${layout.widthPx} ${layout.heightPx}">
  <rect width="100%" height="100%" fill="${theme.bg}" />
  <g transform="translate(0, 0)">${mapContent}</g>
  ${gradient}
  ${typographySvg(layout, theme, viewport, display, fontFamily)}
</svg>`
}

function strokeWidthForLayer(layerId: string): number {
  switch (layerId) {
    case "road-motorway":
      return 4
    case "road-bridge-deck":
      return 3.2
    case "road-ferry":
      return 1.4
    case "road-primary":
      return 3
    case "road-secondary":
      return 2.2
    case "road-tertiary":
      return 1.6
    case "road-residential":
      return 1
    case "waterway":
      return 1.2
    default:
      return 1.2
  }
}

function themeForLayer(theme: PosterTheme, layerId: string): string {
  switch (layerId) {
    case "water":
    case "water-detail":
    case "waterway":
      return theme.water
    case "parks":
    case "parks-landcover":
      return theme.parks
    case "buildings":
      return theme.buildings
    case "road-motorway":
    case "road-bridge-deck":
      return theme.road_motorway
    case "road-ferry":
      return theme.road_default
    case "road-primary":
      return theme.road_primary
    case "road-secondary":
      return theme.road_secondary
    case "road-tertiary":
      return theme.road_tertiary
    case "road-residential":
      return theme.road_residential
    default:
      return theme.road_default
  }
}

export async function svgStringToPngBlob(svg: string, widthPx: number, heightPx: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
  try {
    const image = await loadImage(url)
    const canvas = document.createElement("canvas")
    canvas.width = widthPx
    canvas.height = heightPx
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Canvas not supported")
    }
    ctx.drawImage(image, 0, 0, widthPx, heightPx)
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("PNG export failed"))
          return
        }
        resolve(blob)
      }, "image/png")
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load SVG image"))
    img.src = url
  })
}

export function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
}
