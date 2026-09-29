import { MapPin, Palette, Share2, Sparkles } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast, Toaster } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator, Textarea } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { POSTER_EXAMPLES } from "@/features/editor/defaultPosterConfig"
import { ExportPopover } from "@/features/editor/ExportPopover"
import { PlaceNameFields } from "@/features/editor/PlaceNameFields"
import { LayerTogglesSection } from "@/features/editor/LayerTogglesSection"
import { isKnownPosterFont, POSTER_FONT_OPTIONS } from "@/features/editor/fontOptions"
import {
  applyGeocodeToPoster,
  placeLookupFailureMessage,
  placeLookupSuccessMessage,
  shouldSkipAutomaticPlaceLookup,
} from "@/features/editor/placeLookup"
import {
  isExportBusy,
  resolveProgressPercent,
} from "@/features/editor/generationProgress"
import { ThemeSwatchCard } from "@/features/editor/ThemeSwatchCard"
import { usePosterGenerator } from "@/features/editor/usePosterGenerator"
import { geocodeCity } from "@/features/geocode/nominatim"
import { usePlaceBoundary } from "@/features/boundary/usePlaceBoundary"
import { MapPosterPreview } from "@/features/tiles/MapPosterPreview"
import type { MapPosterHandle } from "@/features/tiles/mapPosterRef"
import {
  INITIAL_MAP_PREVIEW_STATUS,
  type MapPreviewStatus,
} from "@/features/tiles/mapPreviewStatus"
import { createEmptyCustomTheme, listThemes } from "@/features/themes/themeRegistry"
import { ensureNotoFamilyLoaded } from "@/lib/notoFonts"
import type { PosterTheme } from "@/lib/types"
import { encodePosterState, readStateFromLocation } from "@/lib/urlState"
import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  RADIUS_STEP_METERS,
} from "../../../shared/nominatim"

const DISTANCE_HINTS = [
  { range: "4000–6000 m", hint: "Small dense cities" },
  { range: "8000–12000 m", hint: "Medium downtown focus" },
  { range: "15000–25000 m", hint: "Large metro / regional overview" },
  { range: "30000–50000 m", hint: "Whole-city / SAR coverage (slow)" },
]

export function EditorApp() {
  const mapRef = useRef<MapPosterHandle | null>(null)
  const boundaryGeometryRef = useRef<GeoJSON.Polygon | GeoJSON.MultiPolygon | null>(null)
  const {
    config,
    setConfig,
    theme,
    mapReady,
    setMapReady,
    progress,
    error,
    exportCurrentPng,
    exportCurrentSvg,
    exportAllThemes,
    pixelSize,
  } = usePosterGenerator(mapRef, () => boundaryGeometryRef.current)

  const { boundaryGeometry, boundaryAvailable, boundaryLoading } = usePlaceBoundary(config)

  useEffect(() => {
    boundaryGeometryRef.current = boundaryGeometry
  }, [boundaryGeometry])

  const [themeJson, setThemeJson] = useState("")
  const [locationMode, setLocationMode] = useState<"search" | "coordinates">("search")
  const [placeLookupMessage, setPlaceLookupMessage] = useState<string | null>(null)
  const [isPlaceLookingUp, setIsPlaceLookingUp] = useState(false)
  const lookupSeq = useRef(0)
  const [mapStatus, setMapStatus] = useState<MapPreviewStatus>(INITIAL_MAP_PREVIEW_STATUS)
  const themes = useMemo(() => listThemes(), [])
  const isBusy = isExportBusy(progress)
  const progressPercent = resolveProgressPercent(progress)
  const hydratedFromShareHashRef = useRef(readStateFromLocation() != null)
  const initialPlaceRef = useRef({
    city: config.geocode.city,
    country: config.geocode.country,
  })
  const initialCenterLockedRef = useRef(config.centerLocked)

  const handleViewportChange = useCallback(
    (patch: Partial<typeof config.viewport>) => {
      setConfig((current) => ({
        ...current,
        centerLocked: true,
        viewport: { ...current.viewport, ...patch },
      }))
    },
    [setConfig],
  )

  const shareLink = `${window.location.origin}${window.location.pathname}#p=${encodePosterState(config)}`

  useEffect(() => {
    ensureNotoFamilyLoaded(config.display.scriptFamily)
  }, [config.display.scriptFamily])

  const cancelPlaceLookup = useCallback(() => {
    lookupSeq.current += 1
    setIsPlaceLookingUp(false)
  }, [])

  const handlePlaceDraft = useCallback(
    (city: string, country: string) => {
      setConfig((current) => {
        if (current.geocode.city === city && current.geocode.country === country) {
          return current
        }
        return {
          ...current,
          centerLocked: false,
          geocode: { city, country },
        }
      })
    },
    [setConfig],
  )

  const handlePlaceLookup = useCallback(
    (city: string, country: string) => {
      const trimmedCity = city.trim()
      const trimmedCountry = country.trim()
      if (!trimmedCity || !trimmedCountry) {
        setPlaceLookupMessage(null)
        setIsPlaceLookingUp(false)
        return
      }

      const placeEditedByUser =
        city !== initialPlaceRef.current.city || country !== initialPlaceRef.current.country
      if (
        shouldSkipAutomaticPlaceLookup({
          hydratedFromShareHash: hydratedFromShareHashRef.current,
          centerLocked: initialCenterLockedRef.current,
          placeEditedByUser,
        })
      ) {
        return
      }

      const seq = ++lookupSeq.current
      setIsPlaceLookingUp(true)
      setPlaceLookupMessage("Looking up place size…")
      void (async () => {
        try {
          const result = await geocodeCity({ city: trimmedCity, country: trimmedCountry })
          if (seq !== lookupSeq.current) {
            return
          }
          setConfig((current) => ({
            ...current,
            ...applyGeocodeToPoster(current, { city, country }, result),
          }))
          setPlaceLookupMessage(placeLookupSuccessMessage(result))
        } catch (error) {
          if (seq !== lookupSeq.current) {
            return
          }
          setPlaceLookupMessage(placeLookupFailureMessage(error))
        } finally {
          if (seq === lookupSeq.current) {
            setIsPlaceLookingUp(false)
          }
        }
      })()
    },
    [setConfig],
  )

  const applyPosterExample = useCallback(
    (exampleId: string) => {
      const example = POSTER_EXAMPLES.find((item) => item.id === exampleId)
      if (!example) {
        return
      }
      setLocationMode("search")
      setConfig((current) => ({
        ...current,
        ...example.patch,
        customTheme: undefined,
        boundaryMaskEnabled: false,
        placeOsmType: undefined,
        placeOsmId: undefined,
      }))
      setPlaceLookupMessage(null)
    },
    [setConfig],
  )

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-5 lg:px-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Sparkles data-icon="inline-start" className="size-5 shrink-0 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Map Poster Studio</h1>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Bilingual map posters with regional CJK lettering — Hong Kong–ready Noto families,
              live preview, print-ready SVG at 300 DPI.
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-2 sm:max-w-sm">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(shareLink)
                toast.success("Share link copied")
              }}
            >
              <Share2 data-icon="inline-start" />
              Share
            </Button>
            {isBusy ? (
              <div className="w-full space-y-1">
                <Progress value={progressPercent} />
                <p className="text-right text-xs text-muted-foreground">
                  {progress.message} · {progressPercent}%
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 p-4 lg:grid-cols-2 lg:gap-6 lg:p-6">
        <div className="flex flex-col gap-5">
          <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Location
            </CardTitle>
            <CardDescription>
              Search a place for bilingual OSM names, or enter coordinates. CJK places load the
              matching regional Noto family.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {POSTER_EXAMPLES.map((example) => {
                  const selected =
                    config.geocode.city === example.patch.geocode.city &&
                    config.geocode.country === example.patch.geocode.country
                  return (
                    <Button
                      key={example.id}
                      type="button"
                      size="sm"
                      variant={selected ? "secondary" : "ghost"}
                      className="h-auto px-2.5 py-1.5 text-left"
                      onClick={() => applyPosterExample(example.id)}
                    >
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium">{example.label}</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {example.hint}
                        </span>
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <Tabs
              value={locationMode}
              onValueChange={(value) => setLocationMode(value as "search" | "coordinates")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Place name</TabsTrigger>
                <TabsTrigger value="coordinates">Coordinates</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                  Type a city and country — poster labels (including local + Latin pairs when OSM
                  provides them) and map radius update after you pause typing.
                </p>
                <PlaceNameFields
                  city={config.geocode.city}
                  country={config.geocode.country}
                  active={locationMode === "search"}
                  onActivity={cancelPlaceLookup}
                  onDraft={handlePlaceDraft}
                  onLookup={handlePlaceLookup}
                />
              </TabsContent>

              <TabsContent value="coordinates" className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                  Enter the center point directly. Pan and zoom the live preview to fine-tune framing.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0001"
                      value={config.viewport.latitude}
                      onChange={(event) => {
                        setConfig((current) => ({
                          ...current,
                          centerLocked: true,
                          viewport: {
                            ...current.viewport,
                            latitude: Number(event.target.value),
                          },
                        }))
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lon">Longitude</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.0001"
                      value={config.viewport.longitude}
                      onChange={(event) => {
                        setConfig((current) => ({
                          ...current,
                          centerLocked: true,
                          viewport: {
                            ...current.viewport,
                            longitude: Number(event.target.value),
                          },
                        }))
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preview status
              </p>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  {isPlaceLookingUp || mapStatus.phase !== "ready" ? (
                    <Spinner className="mt-0.5 size-4 shrink-0" />
                  ) : null}
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm">
                      {isPlaceLookingUp ? "Looking up place…" : mapStatus.message}
                    </p>
                    {!isPlaceLookingUp && mapStatus.phase === "loading-tiles" ? (
                      <p className="text-xs text-muted-foreground">
                        Tile source: {mapStatus.tileSource}
                      </p>
                    ) : null}
                    {!isPlaceLookingUp && mapStatus.phase === "ready" ? (
                      <p className="text-xs text-muted-foreground">
                        Tiles from OpenFreeMap are loaded for the current view.
                      </p>
                    ) : null}
                  </div>
                </div>
                {locationMode === "search" && placeLookupMessage && !isPlaceLookingUp ? (
                  <p className="text-xs text-muted-foreground">{placeLookupMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Map radius</Label>
                <Badge variant="outline">{Math.round(config.viewport.radiusMeters)} m</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls how far the live map is zoomed out. Place name mode auto-sets this from the
                place size (about 4–50 km). Pan and zoom the preview to adjust framing.
              </p>
              <Slider
                min={MIN_RADIUS_METERS}
                max={MAX_RADIUS_METERS}
                step={RADIUS_STEP_METERS}
                value={[config.viewport.radiusMeters]}
                onValueChange={([value]) =>
                  setConfig((current) => ({
                    ...current,
                    viewport: {
                      ...current.viewport,
                      radiusMeters: value ?? 10000,
                    },
                  }))
                }
              />
              {config.viewport.radiusMeters > 20000 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Large map radius — tiles may load slowly on the public OpenFreeMap service.
                </p>
              ) : null}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {DISTANCE_HINTS.map((item) => (
                  <p key={item.range}>
                    {item.range}: {item.hint}
                  </p>
                ))}
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
          </Card>

          <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Style
            </CardTitle>
            <CardDescription>{theme.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="themes">
              <TabsList>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
              </TabsList>

              <TabsContent value="themes">
                <p className="mb-3 text-xs text-muted-foreground">
                  Each swatch shows a mini map and chips for background, water, parks, roads, and
                  label text.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {themes.map(({ id, theme: item }) => (
                    <ThemeSwatchCard
                      key={id}
                      theme={item}
                      selected={config.themeId === id}
                      onSelect={() =>
                        setConfig((current) => ({
                          ...current,
                          themeId: id,
                          customTheme: undefined,
                        }))
                      }
                    />
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-json">Theme editor (JSON)</Label>
                  <Textarea
                    id="theme-json"
                    value={themeJson || JSON.stringify(createEmptyCustomTheme(config.themeId), null, 2)}
                    onChange={(event) => setThemeJson(event.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(themeJson) as PosterTheme
                        setConfig((current) => ({ ...current, customTheme: parsed }))
                        toast.success("Custom theme applied")
                      } catch {
                        toast.error("Invalid theme JSON")
                      }
                    }}
                  >
                    Apply custom theme
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="layers">
                <LayerTogglesSection
                  config={config}
                  boundaryAvailable={boundaryAvailable}
                  boundaryLoading={boundaryLoading}
                  onConfigChange={setConfig}
                />
              </TabsContent>

              <TabsContent value="labels">
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">
                    When OSM supplies a local CJK name, the poster uses a bilingual pair (local +
                    Latin at the same size). Edit to override lettering only — pair layout stays
                    tied to the last geocode. Regional Noto (HK / TC / SC / JP / KR) loads from the
                    place script.
                  </p>
                  {config.display.hasPlaceLocalName ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-city-local">Place local name</Label>
                        <Input
                          id="display-city-local"
                          value={config.display.city}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: { ...current.display, city: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-city-latin">Place Latin name</Label>
                        <Input
                          id="display-city-latin"
                          value={config.display.cityLatin ?? ""}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: {
                                ...current.display,
                                cityLatin: event.target.value || undefined,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-country-local">Country local name</Label>
                        <Input
                          id="display-country-local"
                          value={config.display.country}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: { ...current.display, country: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-country-latin">Country Latin name</Label>
                        <Input
                          id="display-country-latin"
                          value={config.display.countryLatin ?? ""}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: {
                                ...current.display,
                                countryLatin: event.target.value || undefined,
                              },
                            }))
                          }
                        />
                      </div>
                      {config.display.scriptFamily ? (
                        <p className="text-xs text-muted-foreground">
                          Active script family:{" "}
                          <span className="font-medium uppercase text-foreground">
                            {config.display.scriptFamily}
                          </span>
                          {" · "}
                          Font follows the place unless you pick another family below.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-city">Display city</Label>
                        <Input
                          id="display-city"
                          value={config.display.city}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: { ...current.display, city: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="display-country">Display country</Label>
                        <Input
                          id="display-country"
                          value={config.display.country}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              display: { ...current.display, country: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Latin-only place — letter-spaced city label. Search a CJK city for bilingual
                        pairs.
                      </p>
                    </>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="font-family">Poster font</Label>
                    <Select
                      value={config.fontFamily}
                      onValueChange={(value) =>
                        setConfig((current) => ({ ...current, fontFamily: value }))
                      }
                    >
                      <SelectTrigger id="font-family">
                        <SelectValue placeholder="Choose a Google Font" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSTER_FONT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            {option.hint ? ` — ${option.hint}` : ""}
                          </SelectItem>
                        ))}
                        {!isKnownPosterFont(config.fontFamily) ? (
                          <SelectItem value={config.fontFamily}>
                            {config.fontFamily} (custom)
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        <Card className="flex h-fit flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {pixelSize.widthPx} × {pixelSize.heightPx} px at 300 DPI ·{" "}
                {config.widthInches} × {config.heightInches} in
              </CardDescription>
            </div>
            <ExportPopover
              config={config}
              setConfig={setConfig}
              mapReady={mapReady}
              isBusy={isBusy || isPlaceLookingUp}
              exportCurrentPng={exportCurrentPng}
              exportCurrentSvg={exportCurrentSvg}
              exportAllThemes={exportAllThemes}
            />
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex flex-col gap-3">
              <div className="flex justify-center rounded-xl border bg-muted/30 p-4 lg:p-5">
                <MapPosterPreview
                  ref={mapRef}
                  config={config}
                  theme={theme}
                  boundaryGeometry={boundaryGeometry}
                  onViewportChange={handleViewportChange}
                  onStatusChange={(status) => {
                    setMapStatus(status)
                    setMapReady(status.ready)
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Drag to pan and scroll to zoom. Export when preview status shows all tiles loaded.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
