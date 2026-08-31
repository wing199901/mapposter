import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { exportAllThemesZip, exportPosterPng } from "@/features/export/batchExport"
import { geocodeCity } from "@/features/geocode/nominatim"
import {
  geocodeCacheKey,
  osmCacheKey,
  readGeocodeCache,
  readOsmCache,
  writeGeocodeCache,
  writeOsmCache,
} from "@/features/osm/cache"
import { fetchOsmFeatures } from "@/features/osm/overpass"
import {
  bitmapToObjectUrl,
  renderPreviewInWorker,
  renderPreviewOnMainThread,
  revokePreviewUrl,
  shouldRenderPreviewInWorker,
} from "@/features/render/posterPreview"
import { loadPosterFont } from "@/features/render/typography"
import { loadTheme } from "@/features/themes/themeRegistry"
import type { GenerationProgress, OsmFeature, PosterConfig, Viewport } from "@/lib/types"
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
}

const PREVIEW_DEBOUNCE_MS = 150

function initialConfig(): PosterConfig {
  return readStateFromLocation() ?? loadPosterState() ?? DEFAULT_CONFIG
}

function previewDimensions(config: PosterConfig): { widthPx: number; heightPx: number } {
  const previewWidth = 720
  return {
    widthPx: previewWidth,
    heightPx: Math.round(previewWidth * (config.heightInches / config.widthInches)),
  }
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
  const previewUrlRef = useRef("")

  const theme = useMemo(
    () => loadTheme(config.themeId, config.customTheme),
    [config.customTheme, config.themeId],
  )

  const previewStyleKey = useMemo(
    () =>
      JSON.stringify({
        themeId: config.themeId,
        customTheme: config.customTheme,
        display: config.display,
        fontFamily: config.fontFamily,
        viewport: config.viewport,
        widthInches: config.widthInches,
        heightInches: config.heightInches,
      }),
    [
      config.customTheme,
      config.display,
      config.fontFamily,
      config.heightInches,
      config.themeId,
      config.viewport,
      config.widthInches,
    ],
  )

  const setPreviewObjectUrl = useCallback((nextUrl: string) => {
    if (previewUrlRef.current) {
      revokePreviewUrl(previewUrlRef.current)
    }
    previewUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }, [])

  const renderPreview = useCallback(
    async (nextFeatures: OsmFeature[], nextConfig: PosterConfig) => {
      const { widthPx, heightPx } = previewDimensions(nextConfig)
      const input = {
        features: nextFeatures,
        theme: loadTheme(nextConfig.themeId, nextConfig.customTheme),
        viewport: nextConfig.viewport,
        display: nextConfig.display,
        fontFamily: nextConfig.fontFamily,
        widthPx,
        heightPx,
        previewScale: 0.5,
      }

      try {
        if (shouldRenderPreviewInWorker(nextFeatures.length)) {
          const bitmap = await renderPreviewInWorker(input)
          const nextUrl = await bitmapToObjectUrl(bitmap)
          setPreviewObjectUrl(nextUrl)
          return
        }

        const nextUrl = await renderPreviewOnMainThread(input)
        setPreviewObjectUrl(nextUrl)
      } catch {
        const nextUrl = await renderPreviewOnMainThread(input)
        setPreviewObjectUrl(nextUrl)
      }
    },
    [setPreviewObjectUrl],
  )

  const resolveViewport = useCallback(
    async (
      currentConfig: PosterConfig,
    ): Promise<{ viewport: Viewport; geocodeCacheHit: boolean; skippedGeocode: boolean }> => {
      const city = currentConfig.geocode.city.trim()
      const country = currentConfig.geocode.country.trim()

      if (!city || !country) {
        return {
          viewport: currentConfig.viewport,
          geocodeCacheHit: false,
          skippedGeocode: true,
        }
      }

      const cacheKey = geocodeCacheKey({ city, country })
      const cached = await readGeocodeCache(cacheKey)
      if (cached?.suggestedRadiusMeters != null) {
        return {
          viewport: {
            ...currentConfig.viewport,
            ...(currentConfig.centerLocked
              ? {}
              : {
                  latitude: cached.latitude,
                  longitude: cached.longitude,
                }),
            radiusMeters: cached.suggestedRadiusMeters,
          },
          geocodeCacheHit: true,
          skippedGeocode: false,
        }
      }

      const result = await geocodeCity({ city, country })
      await writeGeocodeCache(cacheKey, {
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: result.displayName,
        suggestedRadiusMeters: result.suggestedRadiusMeters,
        fetchedAt: Date.now(),
      })

      return {
        viewport: {
          ...currentConfig.viewport,
          ...(currentConfig.centerLocked
            ? {}
            : {
                latitude: result.latitude,
                longitude: result.longitude,
              }),
          radiusMeters:
            result.suggestedRadiusMeters ?? currentConfig.viewport.radiusMeters,
        },
        geocodeCacheHit: false,
        skippedGeocode: false,
      }
    },
    [],
  )

  const generate = useCallback(async (skipGeocode = false) => {
    setError(null)

    try {
      let geocodeMessage = "Geocoding city…"
      setProgress({ phase: "geocoding", message: geocodeMessage, progress: 0.08 })

      const { viewport: resolvedViewport, geocodeCacheHit, skippedGeocode } = skipGeocode
        ? {
            viewport: config.viewport,
            geocodeCacheHit: false,
            skippedGeocode: true,
          }
        : await resolveViewport(config)

      if (skippedGeocode) {
        geocodeMessage = "Using manual coordinates"
      } else if (geocodeCacheHit) {
        geocodeMessage = "Using cached geocode"
      }

      setProgress({ phase: "geocoding", message: geocodeMessage, progress: 0.12 })

      const nextViewport = resolvedViewport
      if (!skippedGeocode) {
        setConfig((current) => ({
          ...current,
          viewport: nextViewport,
          display: {
            city: config.geocode.city,
            country: config.geocode.country,
          },
        }))
      }

      const cacheKey = osmCacheKey(
        nextViewport.latitude,
        nextViewport.longitude,
        nextViewport.radiusMeters,
      )
      let nextFeatures = await readOsmCache(cacheKey)

      if (!nextFeatures) {
        setProgress({
          phase: "fetching",
          message: "Fetching OpenStreetMap data…",
          progress: 0.35,
        })
        const fetched = await fetchOsmFeatures(nextViewport)
        nextFeatures = { features: fetched, fetchedAt: Date.now() }
        await writeOsmCache(cacheKey, nextFeatures)
      } else {
        setProgress({
          phase: "fetching",
          message: "Using cached map data",
          progress: 0.35,
        })
      }

      setFeatures(nextFeatures.features)
      setProgress({ phase: "rendering", message: "Rendering preview…", progress: 0.75 })

      const mergedConfig = { ...config, viewport: nextViewport }
      await loadPosterFont(mergedConfig.fontFamily)
      await renderPreview(nextFeatures.features, mergedConfig)
      savePosterState(mergedConfig)
      writeStateToLocation(mergedConfig)

      setProgress({ phase: "done", message: "Poster ready", progress: 1 })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Generation failed"
      setError(message)
      setProgress({ phase: "error", message })
    }
  }, [config, renderPreview, resolveViewport])

  const exportCurrent = useCallback(async () => {
    if (features.length === 0) {
      throw new Error("Generate a poster before exporting")
    }

    setProgress({ phase: "exporting", message: "Exporting PNG…", progress: 0.92 })
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

    setProgress({ phase: "exporting", message: "Exporting all themes…", progress: 0.92 })
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
    const timer = window.setTimeout(() => {
      savePosterState(config)
      writeStateToLocation(config)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [config])

  useEffect(() => {
    if (features.length === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        await loadPosterFont(config.fontFamily)
        await renderPreview(features, config)
      })()
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [config, features, previewStyleKey, renderPreview])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        revokePreviewUrl(previewUrlRef.current)
      }
    }
  }, [])

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
