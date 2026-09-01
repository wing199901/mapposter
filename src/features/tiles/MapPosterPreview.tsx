import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { syncBoundaryMaskLayer } from "@/features/boundary/syncBoundaryMaskLayer"
import { formatCityLabel, formatCoordinates } from "@/lib/scriptDetection"
import type { PosterConfig, PosterTheme } from "@/lib/types"

import { EXPORT_ATTRIBUTION, MAP_BAND_HEIGHT_RATIO } from "./constants"
import type { MapPosterHandle } from "./mapPosterRef"
import { previewDisplaySize } from "./previewDisplaySize"
import { themeToMapStyle } from "./themeToMapStyle"
import { mapViewToRadiusMeters, viewportToMapView } from "./viewportToMapView"
import { waitForMapIdle } from "./waitForMapIdle"

interface MapPosterPreviewProps {
  config: PosterConfig
  theme: PosterTheme
  boundaryGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  onViewportChange: (patch: Partial<PosterConfig["viewport"]>) => void
  onReadyChange: (ready: boolean) => void
}

export const MapPosterPreview = forwardRef<MapPosterHandle, MapPosterPreviewProps>(
  function MapPosterPreview(
    { config, theme, boundaryGeometry, onViewportChange, onReadyChange },
    ref,
  ) {
    const slotRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const skipMoveEndRef = useRef(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [displaySize, setDisplaySize] = useState({ widthPx: 360, heightPx: 480 })

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      waitForIdle: async () => {
        const map = mapRef.current
        if (!map) {
          throw new Error("Map not ready")
        }
        await waitForMapIdle(map)
      },
    }))

    useEffect(() => {
      const slot = slotRef.current
      if (!slot) {
        return
      }

      const updateSize = () => {
        const maxWidth = Math.max(slot.clientWidth, 1)
        setDisplaySize(previewDisplaySize(config.widthInches, config.heightInches, maxWidth))
      }

      const observer = new ResizeObserver(updateSize)
      observer.observe(slot)
      updateSize()

      return () => {
        observer.disconnect()
      }
    }, [config.widthInches, config.heightInches])

    useEffect(() => {
      const container = containerRef.current
      if (!container || mapRef.current) {
        return
      }

      let map: maplibregl.Map | null = null
      let resizeObserver: ResizeObserver | null = null

      const initMap = () => {
        if (mapRef.current || !containerRef.current) {
          return
        }
        const width = containerRef.current.clientWidth
        if (width <= 0) {
          return
        }

        const { center, zoom } = viewportToMapView(config.viewport, width)

        map = new maplibregl.Map({
          container: containerRef.current,
          style: themeToMapStyle(theme, { layerVisibility: config.layerVisibility }),
          center,
          zoom,
          attributionControl: false,
          interactive: true,
        })

        mapRef.current = map
        onReadyChange(false)

        map.on("load", () => {
          setMapLoaded(true)
          syncBoundaryMaskLayer(map!, {
            enabled: config.boundaryMaskEnabled,
            backgroundColor: theme.bg,
            boundary: boundaryGeometry,
          })
          onReadyChange(true)
        })

        map.on("idle", () => {
          onReadyChange(true)
        })

        map.on("error", (event) => {
          console.error("MapLibre error", event.error ?? event)
        })

        map.on("moveend", () => {
          if (skipMoveEndRef.current || !map) {
            return
          }
          const centerPoint = map.getCenter()
          const zoomLevel = map.getZoom()
          const mapWidth = map.getContainer().clientWidth
          onViewportChange({
            latitude: centerPoint.lat,
            longitude: centerPoint.lng,
            radiusMeters: mapViewToRadiusMeters(centerPoint.lat, zoomLevel, mapWidth),
          })
        })

        resizeObserver?.disconnect()
        resizeObserver = null
      }

      resizeObserver = new ResizeObserver(() => {
        initMap()
      })
      resizeObserver.observe(container)
      initMap()

      return () => {
        resizeObserver?.disconnect()
        onReadyChange(false)
        map?.remove()
        mapRef.current = null
        setMapLoaded(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
    }, [])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !mapLoaded) {
        return
      }
      onReadyChange(false)
      map.setStyle(themeToMapStyle(theme, { layerVisibility: config.layerVisibility }))
      map.once("idle", () => {
        syncBoundaryMaskLayer(map, {
          enabled: config.boundaryMaskEnabled,
          backgroundColor: theme.bg,
          boundary: boundaryGeometry,
        })
        onReadyChange(true)
      })
    }, [theme, config.layerVisibility, mapLoaded, onReadyChange])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !mapLoaded) {
        return
      }
      syncBoundaryMaskLayer(map, {
        enabled: config.boundaryMaskEnabled,
        backgroundColor: theme.bg,
        boundary: boundaryGeometry,
      })
    }, [boundaryGeometry, config.boundaryMaskEnabled, theme.bg, mapLoaded])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !mapLoaded) {
        return
      }

      map.resize()

      const width = map.getContainer().clientWidth
      if (width <= 0) {
        return
      }

      const { center, zoom } = viewportToMapView(config.viewport, width)
      skipMoveEndRef.current = true
      map.jumpTo({ center, zoom })
      map.once("moveend", () => {
        skipMoveEndRef.current = false
      })
    }, [
      config.viewport.latitude,
      config.viewport.longitude,
      config.viewport.radiusMeters,
      displaySize.widthPx,
      displaySize.heightPx,
      mapLoaded,
    ])

    const city = formatCityLabel(config.display.city)
    const coords = formatCoordinates(config.viewport.latitude, config.viewport.longitude)

    const overlayStyle = {
      "--poster-text": theme.text,
      "--poster-gradient": theme.gradient_color,
    } as CSSProperties

    return (
      <div ref={slotRef} className="flex w-full justify-center">
        <div
          className="relative shrink-0 overflow-hidden shadow-lg"
          style={{
            width: displaySize.widthPx,
            height: displaySize.heightPx,
            backgroundColor: theme.bg,
            ...overlayStyle,
          }}
        >
          <div
            ref={containerRef}
            className="absolute inset-x-0 top-0"
            style={{ height: `${MAP_BAND_HEIGHT_RATIO * 100}%` }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: `${MAP_BAND_HEIGHT_RATIO * 100}%`,
              background: `linear-gradient(to bottom, transparent 45%, var(--poster-gradient) 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-3 text-center"
            style={{ color: "var(--poster-text)" }}
          >
            <p
              className="font-bold tracking-wide"
              style={{ fontSize: Math.max(14, displaySize.widthPx * 0.055) }}
            >
              {city}
            </p>
            <div className="h-px w-1/3 bg-current opacity-80" />
            <p className="font-medium" style={{ fontSize: Math.max(11, displaySize.widthPx * 0.028) }}>
              {config.display.country}
            </p>
            <p className="opacity-80" style={{ fontSize: Math.max(10, displaySize.widthPx * 0.018) }}>
              {coords}
            </p>
            <p
              className="self-end opacity-70"
              style={{ fontSize: Math.max(8, displaySize.widthPx * 0.012) }}
            >
              {EXPORT_ATTRIBUTION}
            </p>
          </div>
        </div>
      </div>
    )
  },
)
