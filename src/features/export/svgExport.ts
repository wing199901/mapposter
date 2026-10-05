import { outsideBoundaryMaskPath } from "@/features/boundary/projectBoundaryToScreen"
import type { Feature, GeoJsonProperties, Geometry } from "geojson"
import type { Map } from "maplibre-gl"

import type { DisplayLabels, PosterLayerVisibility, PosterTheme, Viewport } from "@/lib/types"
import { DPI } from "@/lib/types"

import { MAP_BAND_HEIGHT_RATIO } from "@/features/tiles/constants"
import { inlinePosterFont } from "@/features/export/inlinePosterFont"
import type { FittedPairLineTypography } from "@/features/tiles/pairLineTypography"
import {
  buildPosterLettering,
  posterGlyphs,
  primaryFontFamily,
  type PosterLettering,
} from "@/features/tiles/posterLettering"
import { POSTER_ATTRIBUTION_FROM_RIGHT } from "@/features/tiles/posterTypographyLayout"
import {
  posterVignetteSvgDefs,
  posterVignetteSvgRects,
} from "@/features/tiles/posterVignette"
import {
  BUILDINGS_FILL_OPACITY,
  POSTER_STROKE_LINECAP,
  POSTER_STROKE_LINEJOIN,
  exportStrokeWidthForLayer,
  themeColorForLayer,
} from "@/features/tiles/themePaint"
import { mapFeatureLayerIds } from "@/features/tiles/themeToMapStyle"
import { latinTrackingLetterSpacing } from "@/lib/scriptDetection"

export interface PosterLayout {
  widthPx: number
  heightPx: number
  mapHeightPx: number
}

export interface BuildPosterSvgOptions {
  layerVisibility?: PosterLayerVisibility
  boundaryMaskEnabled?: boolean
  boundaryGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  /** Raster fallback draws Display labels with canvas, so the SVG map omits text. */
  omitTypography?: boolean
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

/** Canvas PNG fallback when font inlining fails — same lettering model + Latin tracking as Preview/SVG. */
export function drawPosterTypography(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayout,
  theme: PosterTheme,
  lettering: PosterLettering,
): void {
  const { widthPx, heightPx } = layout
  const y = (fromBottomFraction: number) => heightPx * (1 - fromBottomFraction)

  ctx.fillStyle = theme.text
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"

  drawFittedPairLine(
    ctx,
    lettering.city,
    lettering.fontStack,
    widthPx / 2,
    y(lettering.fromBottom.city),
    lettering.cityApplyLatinTracking,
  )

  ctx.strokeStyle = theme.text
  ctx.globalAlpha = 0.8
  ctx.lineWidth = lettering.lineWidth
  ctx.beginPath()
  ctx.moveTo(lettering.rule.x1, y(lettering.fromBottom.line))
  ctx.lineTo(lettering.rule.x2, y(lettering.fromBottom.line))
  ctx.stroke()
  ctx.globalAlpha = 1

  drawFittedPairLine(
    ctx,
    lettering.country,
    lettering.fontStack,
    widthPx / 2,
    y(lettering.fromBottom.country),
    lettering.countryApplyLatinTracking,
  )

  ctx.letterSpacing = "0px"
  ctx.font = `400 ${lettering.fonts.coordinates}px ${lettering.fontStack}`
  ctx.globalAlpha = 0.8
  ctx.fillText(lettering.coordinates, widthPx / 2, y(lettering.fromBottom.coordinates))
  ctx.globalAlpha = 1

  ctx.font = `400 ${lettering.fonts.attribution}px ${lettering.fontStack}`
  ctx.globalAlpha = 0.5
  ctx.textAlign = "right"
  ctx.fillText(
    lettering.attribution,
    widthPx * (1 - POSTER_ATTRIBUTION_FROM_RIGHT),
    y(lettering.fromBottom.attribution),
  )
  ctx.globalAlpha = 1
}

export function drawFittedPairLine(
  ctx: CanvasRenderingContext2D,
  fitted: FittedPairLineTypography,
  fontStack: string,
  centerX: number,
  baselineY: number,
  applyLatinTracking = false,
): void {
  ctx.letterSpacing = latinTrackingLetterSpacing(applyLatinTracking)

  if (!fitted.latin) {
    ctx.textAlign = "center"
    ctx.font = `${fitted.localWeight} ${fitted.fontSize}px ${fontStack}`
    ctx.fillText(fitted.local, centerX, baselineY)
    ctx.letterSpacing = "0px"
    return
  }

  // Pair lines never apply Latin-only tracking (spaces already in the latin string).
  ctx.letterSpacing = "0px"
  ctx.font = `${fitted.localWeight} ${fitted.fontSize}px ${fontStack}`
  const localWidth = ctx.measureText(fitted.local).width
  ctx.font = `${fitted.latinWeight} ${fitted.fontSize}px ${fontStack}`
  const latinWidth = ctx.measureText(fitted.latin).width
  const startX = centerX - (localWidth + fitted.gapPx + latinWidth) / 2

  ctx.textAlign = "left"
  ctx.font = `${fitted.localWeight} ${fitted.fontSize}px ${fontStack}`
  ctx.fillText(fitted.local, startX, baselineY)
  ctx.font = `${fitted.latinWeight} ${fitted.fontSize}px ${fontStack}`
  ctx.fillText(fitted.latin, startX + localWidth + fitted.gapPx, baselineY)
  ctx.textAlign = "center"
}

function letteringForPoster(
  layout: PosterLayout,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
): PosterLettering {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d") ?? undefined
  return buildPosterLettering({
    widthPx: layout.widthPx,
    heightPx: layout.heightPx,
    display,
    fontFamily,
    viewport,
    ctx,
  })
}

/** Rasterize one SVG Poster. Canvas draws labels only if font inlining fails. */
export async function rasterizePosterSvg(
  svg: string,
  map: Map,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
  layout: PosterLayout,
  options: BuildPosterSvgOptions = {},
): Promise<Blob> {
  const lettering = letteringForPoster(layout, viewport, display, fontFamily)
  const inlined = await inlinePosterFont(svg, {
    fontFamily: primaryFontFamily(lettering.fontStack),
    characters: posterGlyphs(lettering),
  })
  if (inlined) {
    return svgStringToPngBlob(inlined, layout.widthPx, layout.heightPx)
  }

  const mapOnly = buildPosterSvg(
    map,
    theme,
    viewport,
    display,
    fontFamily,
    layout,
    { ...options, omitTypography: true },
    lettering,
  )
  const blob = await svgStringToPngBlob(mapOnly, layout.widthPx, layout.heightPx)
  const url = URL.createObjectURL(blob)
  try {
    const image = await loadImage(url)
    const canvas = document.createElement("canvas")
    canvas.width = layout.widthPx
    canvas.height = layout.heightPx
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Canvas not supported")
    }
    ctx.drawImage(image, 0, 0, layout.widthPx, layout.heightPx)
    drawPosterTypography(ctx, layout, theme, lettering)
    return canvasToPngBlob(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** PNG is the SVG Poster rasterized at export pixels. */
export async function buildPosterPng(
  map: Map,
  theme: PosterTheme,
  viewport: Viewport,
  display: DisplayLabels,
  fontFamily: string,
  layout: PosterLayout,
  options: BuildPosterSvgOptions = {},
): Promise<Blob> {
  const svg = buildPosterSvg(map, theme, viewport, display, fontFamily, layout, options)
  return rasterizePosterSvg(svg, map, theme, viewport, display, fontFamily, layout, options)
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

function pairText(fitted: FittedPairLineTypography): string {
  const local = escapeXml(fitted.local)
  if (!fitted.latin) {
    return local
  }
  return `${local}<tspan dx="${fitted.gapPx}" font-size="${fitted.fontSize}" font-weight="${fitted.latinWeight}">${escapeXml(fitted.latin)}</tspan>`
}

function latinTrackingAttr(apply: boolean): string {
  return apply ? ` letter-spacing="${latinTrackingLetterSpacing(true)}"` : ""
}

function typographySvg(layout: PosterLayout, theme: PosterTheme, lettering: PosterLettering): string {
  const { widthPx, heightPx } = layout
  const y = (fromBottomFraction: number) => heightPx * (1 - fromBottomFraction)
  const fontStack = escapeXml(lettering.fontStack)

  return `
    <text x="${widthPx / 2}" y="${y(lettering.fromBottom.city)}" fill="${theme.text}" font-family="${fontStack}" font-size="${lettering.city.fontSize}" font-weight="${lettering.city.localWeight}" text-anchor="middle" dominant-baseline="alphabetic"${latinTrackingAttr(lettering.cityApplyLatinTracking)}>${pairText(lettering.city)}</text>
    <line x1="${lettering.rule.x1}" y1="${y(lettering.fromBottom.line)}" x2="${lettering.rule.x2}" y2="${y(lettering.fromBottom.line)}" stroke="${theme.text}" stroke-width="${lettering.lineWidth}" stroke-opacity="0.8" />
    <text x="${widthPx / 2}" y="${y(lettering.fromBottom.country)}" fill="${theme.text}" font-family="${fontStack}" font-size="${lettering.country.fontSize}" font-weight="${lettering.country.localWeight}" text-anchor="middle" dominant-baseline="alphabetic"${latinTrackingAttr(lettering.countryApplyLatinTracking)}>${pairText(lettering.country)}</text>
    <text x="${widthPx / 2}" y="${y(lettering.fromBottom.coordinates)}" fill="${theme.text}" fill-opacity="0.8" font-family="${fontStack}" font-size="${lettering.fonts.coordinates}" font-weight="400" text-anchor="middle" dominant-baseline="alphabetic">${escapeXml(lettering.coordinates)}</text>
    <text x="${widthPx * (1 - POSTER_ATTRIBUTION_FROM_RIGHT)}" y="${y(lettering.fromBottom.attribution)}" fill="${theme.text}" fill-opacity="0.5" font-family="${fontStack}" font-size="${lettering.fonts.attribution}" font-weight="400" text-anchor="end" dominant-baseline="alphabetic">${escapeXml(lettering.attribution)}</text>
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
  lettering: PosterLettering = letteringForPoster(layout, viewport, display, fontFamily),
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
    const strokeWidth = exportStrokeWidthForLayer(layerId)
    const fillOpacity =
      layerId === "buildings" ? ` fill-opacity="${BUILDINGS_FILL_OPACITY}"` : ""
    const paint = isLine
      ? `fill="none" stroke="${themeColorForLayer(theme, layerId)}" stroke-width="${(strokeWidth / scaleX).toFixed(3)}" stroke-linecap="${POSTER_STROKE_LINECAP}" stroke-linejoin="${POSTER_STROKE_LINEJOIN}"`
      : `fill="${themeColorForLayer(theme, layerId)}"${fillOpacity} stroke="none"`
    groups.push(
      `<g id="${layerId}" transform="scale(${scaleX} ${scaleY})">${paths.map((path) => `<path d="${path}" ${paint} />`).join("")}</g>`,
    )
  }

  let mapContent = groups.join("")

  if (options.boundaryMaskEnabled && options.boundaryGeometry) {
    const maskPathData = outsideBoundaryMaskPath(map, options.boundaryGeometry)
    mapContent += `<g id="boundary-mask" transform="scale(${scaleX} ${scaleY})"><path d="${maskPathData}" fill="${theme.bg}" fill-rule="evenodd" stroke="none" /></g>`
  }

  const gradient = `
    <defs>
      ${posterVignetteSvgDefs(theme.gradient_color)}
    </defs>
    ${posterVignetteSvgRects(layout.widthPx, layout.heightPx, lettering.fadeBottomStart)}
  `
  const typography = options.omitTypography ? "" : typographySvg(layout, theme, lettering)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.widthPx}" height="${layout.heightPx}" viewBox="0 0 ${layout.widthPx} ${layout.heightPx}">
  <rect width="100%" height="100%" fill="${theme.bg}" />
  <g transform="translate(0, 0)">${mapContent}</g>
  ${gradient}
  ${typography}
</svg>`
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
