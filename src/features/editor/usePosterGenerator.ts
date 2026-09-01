import { useCallback, useEffect, useMemo, useState, type RefObject } from "react"

import {
  exportAllThemesZip,
  exportPosterPng,
  exportPosterSvg,
} from "@/features/export/batchExport"
import type { MapPosterHandle } from "@/features/tiles/mapPosterRef"
import { loadTheme } from "@/features/themes/themeRegistry"
import type { ExportProgress, PosterConfig } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"
import {
  loadPosterState,
  posterPixelSize,
  readStateFromLocation,
  savePosterState,
  writeStateToLocation,
} from "@/lib/urlState"

const DEFAULT_CONFIG: PosterConfig = {
  geocode: { city: "Paris", country: "France" },
  viewport: { latitude: 48.8566, longitude: 2.3522, radiusMeters: 10000 },
  themeId: "terracotta",
  display: { city: "Paris", country: "France" },
  fontFamily: "Roboto",
  centerLocked: false,
  widthInches: 12,
  heightInches: 16,
  layerVisibility: DEFAULT_LAYER_VISIBILITY,
  boundaryMaskEnabled: false,
}

function initialConfig(): PosterConfig {
  return readStateFromLocation() ?? loadPosterState() ?? DEFAULT_CONFIG
}

export function usePosterGenerator(
  mapRef: RefObject<MapPosterHandle | null>,
  getBoundaryGeometry: () => GeoJSON.Polygon | GeoJSON.MultiPolygon | null = () => null,
) {
  const [config, setConfig] = useState<PosterConfig>(initialConfig)
  const [mapReady, setMapReady] = useState(false)
  const [progress, setProgress] = useState<ExportProgress>({
    phase: "idle",
    message: "Ready",
  })
  const [error, setError] = useState<string | null>(null)

  const theme = useMemo(
    () => loadTheme(config.themeId, config.customTheme),
    [config.customTheme, config.themeId],
  )

  const requireMap = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) {
      throw new Error("Wait for the map to finish loading before exporting")
    }
    return map
  }, [mapReady, mapRef])

  const exportCurrentPng = useCallback(async () => {
    setError(null)
    setProgress({ phase: "exporting", message: "Exporting PNG…", progress: 0.5 })
    const map = requireMap()
    const blob = await exportPosterPng(map, config, getBoundaryGeometry())
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${config.display.city}_${config.themeId}.png`
    anchor.click()
    URL.revokeObjectURL(url)
    setProgress({ phase: "done", message: "Export complete", progress: 1 })
  }, [config, getBoundaryGeometry, requireMap])

  const exportCurrentSvg = useCallback(async () => {
    setError(null)
    setProgress({ phase: "exporting", message: "Exporting SVG…", progress: 0.5 })
    const map = requireMap()
    const blob = await exportPosterSvg(map, config, getBoundaryGeometry())
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${config.display.city}_${config.themeId}.svg`
    anchor.click()
    URL.revokeObjectURL(url)
    setProgress({ phase: "done", message: "Export complete", progress: 1 })
  }, [config, getBoundaryGeometry, requireMap])

  const exportAllThemes = useCallback(async () => {
    setError(null)
    setProgress({ phase: "exporting", message: "Exporting all themes…", progress: 0.5 })
    const map = requireMap()
    const blob = await exportAllThemesZip(map, config, getBoundaryGeometry())
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${config.display.city}_all_themes.zip`
    anchor.click()
    URL.revokeObjectURL(url)
    setProgress({ phase: "done", message: "Batch export complete", progress: 1 })
  }, [config, getBoundaryGeometry, requireMap])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      savePosterState(config)
      writeStateToLocation(config)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [config])

  return {
    config,
    setConfig,
    theme,
    mapReady,
    setMapReady,
    progress,
    error,
    setError,
    exportCurrentPng,
    exportCurrentSvg,
    exportAllThemes,
    pixelSize: posterPixelSize(config),
  }
}
