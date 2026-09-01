import type { Map } from "maplibre-gl"
import JSZip from "jszip"

import {
  buildPosterSvg,
  posterLayoutFromInches,
  svgStringToPngBlob,
  svgToBlob,
  type BuildPosterSvgOptions,
} from "@/features/export/svgExport"
import { loadTheme, THEME_IDS } from "@/features/themes/themeRegistry"
import { themeToMapStyle } from "@/features/tiles/themeToMapStyle"
import { waitForMapIdle } from "@/features/tiles/waitForMapIdle"
import type { PosterConfig } from "@/lib/types"

function buildSvgOptions(
  config: PosterConfig,
  boundaryGeometry: BuildPosterSvgOptions["boundaryGeometry"],
): BuildPosterSvgOptions {
  return {
    layerVisibility: config.layerVisibility,
    boundaryMaskEnabled: config.boundaryMaskEnabled,
    boundaryGeometry,
  }
}

async function applyThemeAndWait(map: Map, config: PosterConfig, themeId?: string) {
  const theme = loadTheme(themeId ?? config.themeId, config.customTheme)
  map.setStyle(themeToMapStyle(theme, { layerVisibility: config.layerVisibility }))
  await waitForMapIdle(map)
  return theme
}

export async function exportPosterSvg(
  map: Map,
  config: PosterConfig,
  boundaryGeometry: BuildPosterSvgOptions["boundaryGeometry"] = null,
): Promise<Blob> {
  await waitForMapIdle(map)
  const theme = loadTheme(config.themeId, config.customTheme)
  const layout = posterLayoutFromInches(config.widthInches, config.heightInches)
  const svg = buildPosterSvg(
    map,
    theme,
    config.viewport,
    config.display,
    config.fontFamily,
    layout,
    buildSvgOptions(config, boundaryGeometry),
  )
  return svgToBlob(svg)
}

export async function exportPosterPng(
  map: Map,
  config: PosterConfig,
  boundaryGeometry: BuildPosterSvgOptions["boundaryGeometry"] = null,
): Promise<Blob> {
  await waitForMapIdle(map)
  const theme = loadTheme(config.themeId, config.customTheme)
  const layout = posterLayoutFromInches(config.widthInches, config.heightInches)
  const svg = buildPosterSvg(
    map,
    theme,
    config.viewport,
    config.display,
    config.fontFamily,
    layout,
    buildSvgOptions(config, boundaryGeometry),
  )
  return svgStringToPngBlob(svg, layout.widthPx, layout.heightPx)
}

export async function exportAllThemesZip(
  map: Map,
  config: PosterConfig,
  boundaryGeometry: BuildPosterSvgOptions["boundaryGeometry"] = null,
): Promise<Blob> {
  const zip = new JSZip()
  const layout = posterLayoutFromInches(config.widthInches, config.heightInches)
  const city = config.display.city.replace(/\s+/g, "_")
  const svgOptions = buildSvgOptions(config, boundaryGeometry)

  for (const themeId of THEME_IDS) {
    const theme = await applyThemeAndWait(map, config, themeId)
    const svg = buildPosterSvg(
      map,
      theme,
      config.viewport,
      config.display,
      config.fontFamily,
      layout,
      svgOptions,
    )
    zip.file(`${city}_${themeId}.svg`, svg)
    const png = await svgStringToPngBlob(svg, layout.widthPx, layout.heightPx)
    zip.file(`${city}_${themeId}.png`, png)
  }

  await applyThemeAndWait(map, config)
  return zip.generateAsync({ type: "blob" })
}
