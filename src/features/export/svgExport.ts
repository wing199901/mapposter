import type { Feature, GeoJsonProperties, Geometry } from "geojson"
import type { Map } from "maplibre-gl"

import { buildInvertedMask } from "@/features/boundary/buildInvertedMask"
import { formatCityLabel, formatCoordinates } from "@/lib/scriptDetection"
import type { DisplayLabels, PosterLayerVisibility, PosterTheme, Viewport } from "@/lib/types"
import { DPI } from "@/lib/types"

import { EXPORT_ATTRIBUTION, MAP_BAND_HEIGHT_RATIO } from "@/features/tiles/constants"
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
  const city = formatCityLabel(display.city)
  const country = display.country
  const coords = formatCoordinates(viewport.latitude, viewport.longitude)
  const fontStack = `${fontFamily}, Roboto, system-ui, sans-serif`

  return `
    <text x="${widthPx / 2}" y="${heightPx * 0.86}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${Math.round(widthPx * 0.055)}" font-weight="700" text-anchor="middle">${escapeXml(city)}</text>
    <line x1="${widthPx * 0.35}" y1="${heightPx * 0.875}" x2="${widthPx * 0.65}" y2="${heightPx * 0.875}" stroke="${theme.text}" stroke-width="${Math.max(1, widthPx * 0.0015)}" />
    <text x="${widthPx / 2}" y="${heightPx * 0.905}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${Math.round(widthPx * 0.028)}" font-weight="500" text-anchor="middle">${escapeXml(country)}</text>
    <text x="${widthPx / 2}" y="${heightPx * 0.935}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${Math.round(widthPx * 0.018)}" font-weight="400" text-anchor="middle">${escapeXml(coords)}</text>
    <text x="${widthPx * 0.97}" y="${heightPx * 0.975}" fill="${theme.text}" font-family="${escapeXml(fontStack)}" font-size="${Math.round(widthPx * 0.012)}" font-weight="400" text-anchor="end">${escapeXml(EXPORT_ATTRIBUTION)}</text>
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
  const mapWidth = map.getCanvas().width
  const mapHeight = map.getCanvas().height
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
      ? `fill="none" stroke="${themeForLayer(theme, layerId)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${themeForLayer(theme, layerId)}" stroke="none"`
    groups.push(
      `<g id="${layerId}" transform="scale(${scaleX} ${scaleY})">${paths.map((path) => `<path d="${path}" ${paint} />`).join("")}</g>`,
    )
  }

  if (options.boundaryMaskEnabled && options.boundaryGeometry) {
    const maskGeometry = buildInvertedMask(options.boundaryGeometry)
    const maskPaths = geometryToPaths(map, maskGeometry)
    if (maskPaths.length > 0) {
      groups.push(
        `<g id="boundary-mask" transform="scale(${scaleX} ${scaleY})">${maskPaths.map((path) => `<path d="${path}" fill="${theme.bg}" stroke="none" />`).join("")}</g>`,
      )
    }
  }

  const gradient = `
    <defs>
      <linearGradient id="poster-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.gradient_color}" stop-opacity="0" />
        <stop offset="100%" stop-color="${theme.gradient_color}" stop-opacity="1" />
      </linearGradient>
    </defs>
    <rect x="0" y="${layout.mapHeightPx * 0.45}" width="${layout.widthPx}" height="${layout.heightPx - layout.mapHeightPx * 0.45}" fill="url(#poster-fade)" />
  `

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.widthPx}" height="${layout.heightPx}" viewBox="0 0 ${layout.widthPx} ${layout.heightPx}">
  <rect width="100%" height="100%" fill="${theme.bg}" />
  <g transform="translate(0, 0)">${groups.join("")}</g>
  ${gradient}
  ${typographySvg(layout, theme, viewport, display, fontFamily)}
</svg>`
}

function strokeWidthForLayer(layerId: string): number {
  switch (layerId) {
    case "road-motorway":
      return 4
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
    case "waterway":
      return theme.water
    case "parks":
    case "parks-landcover":
      return theme.parks
    case "buildings":
      return theme.buildings
    case "road-motorway":
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
