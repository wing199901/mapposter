import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { BoundaryBlurOverlay } from "@/features/boundary/BoundaryBlurOverlay"
import { posterFontStack } from "@/lib/notoFonts"
import { formatCoordinates, formatPosterDisplayLines } from "@/lib/scriptDetection"
import type { PosterConfig, PosterTheme } from "@/lib/types"

import { EXPORT_ATTRIBUTION } from "./constants"
import type { MapPosterHandle } from "./mapPosterRef"
import {
  createMapPreviewStatusPublisher,
  type MapPreviewStatus,
} from "./mapPreviewStatus"
import { fitPairLineTypographyForPoster, placeRuleSpan } from "./pairLineTypography"
import {
  POSTER_ATTRIBUTION_FROM_RIGHT,
  posterTypographyLayout,
} from "./posterTypographyLayout"
import { posterBottomVignetteCss, posterTopVignetteCss } from "./posterVignette"
import { previewDisplaySize } from "./previewDisplaySize"
import { themeToMapStyle } from "./themeToMapStyle"
import { mapViewToRadiusMeters, viewportToMapView } from "./viewportToMapView"
import { waitForMapIdle } from "./waitForMapIdle"

interface MapPosterPreviewProps {
  config: PosterConfig
  theme: PosterTheme
  boundaryGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  onViewportChange: (patch: Partial<PosterConfig["viewport"]>) => void
  onStatusChange: (status: MapPreviewStatus) => void
}

export const MapPosterPreview = forwardRef<MapPosterHandle, MapPosterPreviewProps>(
  function MapPosterPreview(
    { config, theme, boundaryGeometry, onViewportChange, onStatusChange },
    ref,
  ) {
    const slotRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const skipMoveEndRef = useRef(false)
    const onStatusChangeRef = useRef(onStatusChange)
    const onViewportChangeRef = useRef(onViewportChange)
    const publishStatusRef = useRef(
      createMapPreviewStatusPublisher((status) => {
        onStatusChangeRef.current(status)
      }),
    )
    const [mapLoaded, setMapLoaded] = useState(false)
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)
    const [displaySize, setDisplaySize] = useState({ widthPx: 360, heightPx: 480 })

    onStatusChangeRef.current = onStatusChange
    onViewportChangeRef.current = onViewportChange

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
      const publishStatus = publishStatusRef.current

      const initMap = () => {
        if (mapRef.current || !containerRef.current) {
          return
        }
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        if (width <= 0 || height <= 0) {
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
          canvasContextAttributes: { preserveDrawingBuffer: true },
        })

        mapRef.current = map
        setMapInstance(map)
        publishStatus(map)

        const refreshStatus = () => {
          publishStatus(map)
        }

        map.on("load", () => {
          setMapLoaded(true)
          refreshStatus()
        })

        // Avoid MapLibre's chatty `data` event — it can re-render the app continuously.
        map.on("idle", refreshStatus)
        map.on("sourcedataloading", refreshStatus)
        map.on("sourcedata", refreshStatus)

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
          onViewportChangeRef.current({
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
        publishStatus(null)
        map?.remove()
        mapRef.current = null
        setMapInstance(null)
        setMapLoaded(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
    }, [])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !mapLoaded) {
        return
      }
      publishStatusRef.current(map)
      map.setStyle(themeToMapStyle(theme, { layerVisibility: config.layerVisibility }))
      map.once("idle", () => {
        publishStatusRef.current(map)
      })
      // Do not depend on status callbacks — unstable parents previously re-ran setStyle in a loop.
    }, [theme, config.layerVisibility, mapLoaded])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !mapLoaded) {
        return
      }
      map.resize()
    }, [displaySize.widthPx, displaySize.heightPx, mapLoaded])

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

    const displayLines = formatPosterDisplayLines(config.display)
    const coords = formatCoordinates(config.viewport.latitude, config.viewport.longitude)
    const typography = posterTypographyLayout(displaySize.widthPx, displaySize.heightPx)
    const { fonts, fromBottom, fadeBottomStart } = typography
    const fontStack = posterFontStack(config.fontFamily, config.display.scriptFamily)

    const pairFits = useMemo(() => {
      if (typeof document === "undefined") {
        return { city: null, country: null }
      }
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return { city: null, country: null }
      }
      return {
        city: fitPairLineTypographyForPoster({
          role: "city",
          baseFontSize: fonts.city,
          local: displayLines.city.local,
          latin: displayLines.city.latin,
          posterWidthPx: displaySize.widthPx,
          fontStack,
          ctx,
        }),
        country: fitPairLineTypographyForPoster({
          role: "country",
          baseFontSize: fonts.country,
          local: displayLines.country.local,
          latin: displayLines.country.latin,
          posterWidthPx: displaySize.widthPx,
          fontStack,
          ctx,
        }),
      }
    }, [
      displayLines.city.local,
      displayLines.city.latin,
      displayLines.country.local,
      displayLines.country.latin,
      displaySize.widthPx,
      fonts.city,
      fonts.country,
      fontStack,
    ])

    const cityFontSize = pairFits.city?.fontSize ?? fonts.city
    const countryFontSize = pairFits.country?.fontSize ?? fonts.country
    const cityLocalWeight = pairFits.city?.localWeight ?? 700
    const cityLatinWeight = pairFits.city?.latinWeight ?? 500
    const countryLocalWeight = pairFits.country?.localWeight ?? 500
    const countryLatinWeight = pairFits.country?.latinWeight ?? 400
    const cityGap = pairFits.city?.gapPx ?? Math.max(8, Math.round(fonts.city * 0.2))
    const countryGap = pairFits.country?.gapPx ?? Math.max(6, Math.round(fonts.country * 0.18))
    const placeRule = placeRuleSpan(displaySize.widthPx, pairFits.city?.widthPx)

    const overlayStyle = {
      "--poster-text": theme.text,
      "--poster-gradient": theme.gradient_color,
    } as CSSProperties

    return (
      <div ref={slotRef} className="flex w-full justify-center">
        <div
          data-poster-shell
          className="relative shrink-0 overflow-hidden shadow-lg"
          style={{
            width: displaySize.widthPx,
            height: displaySize.heightPx,
            backgroundColor: theme.bg,
            ...overlayStyle,
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div ref={containerRef} className="size-full" />
          </div>
          <BoundaryBlurOverlay
            map={mapInstance}
            boundary={boundaryGeometry}
            enabled={config.boundaryMaskEnabled}
            backgroundColor={theme.bg}
          />
          <div
            className="pointer-events-none absolute inset-0 z-2"
            style={{
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              maskImage: `linear-gradient(to bottom, transparent ${fadeBottomStart * 100}%, black 100%)`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${fadeBottomStart * 100}%, black 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-3"
            style={{ background: posterTopVignetteCss() }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-3"
            style={{ background: posterBottomVignetteCss(fadeBottomStart) }}
          />
          <p
            className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${
              !displayLines.city.latin && displayLines.city.applyLatinTracking
                ? "tracking-wide"
                : ""
            }`}
            style={{
              bottom: `${fromBottom.city * 100}%`,
              color: theme.text,
              fontSize: cityFontSize,
              fontFamily: fontStack,
              fontWeight: cityLocalWeight,
            }}
          >
            {displayLines.city.local}
            {displayLines.city.latin ? (
              <span
                className="align-baseline whitespace-nowrap"
                style={{
                  fontSize: cityFontSize,
                  fontWeight: cityLatinWeight,
                  marginLeft: cityGap,
                }}
              >
                {displayLines.city.latin}
              </span>
            ) : null}
          </p>
          <div
            className="pointer-events-none absolute left-1/2 z-10 h-px -translate-x-1/2 bg-current opacity-80"
            style={{
              bottom: `${fromBottom.line * 100}%`,
              width: placeRule.widthPx,
              color: theme.text,
            }}
          />
          <p
            className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap"
            style={{
              bottom: `${fromBottom.country * 100}%`,
              color: theme.text,
              fontSize: countryFontSize,
              fontFamily: fontStack,
              fontWeight: countryLocalWeight,
            }}
          >
            {displayLines.country.local}
            {displayLines.country.latin ? (
              <span
                className="align-baseline whitespace-nowrap"
                style={{
                  fontSize: countryFontSize,
                  fontWeight: countryLatinWeight,
                  marginLeft: countryGap,
                }}
              >
                {displayLines.country.latin}
              </span>
            ) : null}
          </p>
          <p
            className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 opacity-80"
            style={{
              bottom: `${fromBottom.coordinates * 100}%`,
              color: theme.text,
              fontSize: fonts.coordinates,
            }}
          >
            {coords}
          </p>
          <p
            className="pointer-events-none absolute z-10 opacity-50"
            style={{
              right: `${POSTER_ATTRIBUTION_FROM_RIGHT * 100}%`,
              bottom: `${fromBottom.attribution * 100}%`,
              color: theme.text,
              fontSize: fonts.attribution,
              lineHeight: 1,
            }}
          >
            {EXPORT_ATTRIBUTION}
          </p>
        </div>
      </div>
    )
  },
)
