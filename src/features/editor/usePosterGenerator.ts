import { useCallback, useEffect, useMemo, useState } from "react"

import { exportAllThemesZip, exportPosterPng } from "@/features/export/batchExport"
import { geocodeCity } from "@/features/geocode/nominatim"
import { osmCacheKey, readOsmCache, writeOsmCache } from "@/features/osm/cache"
import { fetchOsmFeatures } from "@/features/osm/overpass"
import { loadPosterFont } from "@/features/render/typography"
import { drawPoster, canvasToDataUrl } from "@/features/render/drawPoster"
import { loadTheme } from "@/features/themes/themeRegistry"
import type { GenerationProgress, OsmFeature, PosterConfig } from "@/lib/types"
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
  widthInches: 12,
  heightInches: 16,
}

function initialConfig(): PosterConfig {
  return readStateFromLocation() ?? loadPosterState() ?? DEFAULT_CONFIG
}

export function usePosterGenerator() {
  const [config, setConfig] = useState<PosterConfig>(initialConfig)
  const [features, setFeatures] = useState<OsmFeature[]>([])
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: "idle",
    message: "Ready",
  })
  const [error, setError] = useState<string | null>(null)

  const theme = useMemo(
    () => loadTheme(config.themeId, config.customTheme),
    [config.customTheme, config.themeId],
  )

  const renderPreview = useCallback(
    (nextFeatures: OsmFeature[], nextConfig: PosterConfig) => {
      const canvas = document.createElement("canvas")
      const previewWidth = 720
      const previewHeight = Math.round(
        previewWidth * (nextConfig.heightInches / nextConfig.widthInches),
      )

      drawPoster(canvas, {
        features: nextFeatures,
        theme: loadTheme(nextConfig.themeId, nextConfig.customTheme),
        viewport: nextConfig.viewport,
        display: nextConfig.display,
        fontFamily: nextConfig.fontFamily,
        widthPx: previewWidth,
        heightPx: previewHeight,
        previewScale: 0.75,
      })

      setPreviewUrl(canvasToDataUrl(canvas))
    },
    [],
  )

  const generate = useCallback(async () => {
    setError(null)
    setProgress({ phase: "geocoding", message: "Geocoding city…" })

    try {
      let viewport = config.viewport
      if (config.geocode.city && config.geocode.country) {
        const result = await geocodeCity(config.geocode)
        viewport = {
          ...viewport,
          latitude: result.latitude,
          longitude: result.longitude,
        }
        setConfig((current) => ({
          ...current,
          viewport,
          display: {
            city: current.display.city || config.geocode.city,
            country: current.display.country || config.geocode.country,
          },
        }))
      }

      setProgress({ phase: "fetching", message: "Fetching OpenStreetMap data…", progress: 0.35 })
      const cacheKey = osmCacheKey(viewport.latitude, viewport.longitude, viewport.radiusMeters)
      let nextFeatures = await readOsmCache(cacheKey)
      if (!nextFeatures) {
        const fetched = await fetchOsmFeatures(viewport)
        nextFeatures = { features: fetched, fetchedAt: Date.now() }
        await writeOsmCache(cacheKey, nextFeatures)
      }

      setFeatures(nextFeatures.features)
      setProgress({ phase: "rendering", message: "Rendering preview…", progress: 0.75 })

      const mergedConfig = { ...config, viewport }
      await loadPosterFont(mergedConfig.fontFamily)
      renderPreview(nextFeatures.features, mergedConfig)
      savePosterState(mergedConfig)
      writeStateToLocation(mergedConfig)

      setProgress({ phase: "done", message: "Poster ready", progress: 1 })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Generation failed"
      setError(message)
      setProgress({ phase: "error", message })
    }
  }, [config, renderPreview])

  const exportCurrent = useCallback(async () => {
    if (features.length === 0) {
      throw new Error("Generate a poster before exporting")
    }

    setProgress({ phase: "exporting", message: "Exporting PNG…" })
    const blob = await exportPosterPng(config, features)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${config.display.city}_${config.themeId}.png`
    anchor.click()
    URL.revokeObjectURL(url)
    setProgress({ phase: "done", message: "Export complete" })
  }, [config, features])

  const exportAllThemes = useCallback(async () => {
    if (features.length === 0) {
      throw new Error("Generate a poster before batch export")
    }

    setProgress({ phase: "exporting", message: "Exporting all themes…" })
    const blob = await exportAllThemesZip(config, features)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${config.display.city}_all_themes.zip`
    anchor.click()
    URL.revokeObjectURL(url)
    setProgress({ phase: "done", message: "Batch export complete" })
  }, [config, features])

  useEffect(() => {
    savePosterState(config)
    writeStateToLocation(config)
  }, [config])

  return {
    config,
    setConfig,
    theme,
    features,
    previewUrl,
    progress,
    error,
    generate,
    exportCurrent,
    exportAllThemes,
    pixelSize: posterPixelSize(config),
  }
}
