import JSZip from "jszip"

import { loadTheme } from "@/features/themes/themeRegistry"
import { inchesToPixels } from "@/features/export/presets"
import { drawPoster, canvasToPngBlob } from "@/features/render/drawPoster"
import type { OsmFeature, PosterConfig } from "@/lib/types"
import { THEME_IDS } from "@/features/themes/themeRegistry"

export async function exportPosterPng(
  config: PosterConfig,
  features: OsmFeature[],
  previewScale = 1,
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const { widthPx, heightPx } = {
    widthPx: inchesToPixels(config.widthInches),
    heightPx: inchesToPixels(config.heightInches),
  }

  drawPoster(canvas, {
    features,
    theme: loadTheme(config.themeId, config.customTheme),
    viewport: config.viewport,
    display: config.display,
    fontFamily: config.fontFamily,
    widthPx,
    heightPx,
    previewScale,
  })

  return canvasToPngBlob(canvas)
}

export async function exportAllThemesZip(
  config: PosterConfig,
  features: OsmFeature[],
): Promise<Blob> {
  const zip = new JSZip()
  const { widthPx, heightPx } = {
    widthPx: inchesToPixels(config.widthInches),
    heightPx: inchesToPixels(config.heightInches),
  }

  for (const themeId of THEME_IDS) {
    const canvas = document.createElement("canvas")
    drawPoster(canvas, {
      features,
      theme: loadTheme(themeId),
      viewport: config.viewport,
      display: config.display,
      fontFamily: config.fontFamily,
      widthPx,
      heightPx,
    })

    const blob = await canvasToPngBlob(canvas)
    zip.file(`${config.display.city}_${themeId}.png`, blob)
  }

  return zip.generateAsync({ type: "blob" })
}
