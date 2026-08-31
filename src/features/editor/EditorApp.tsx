import { Layers, MapPin, Palette, Share2, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
import { isKnownPosterFont, POSTER_FONT_OPTIONS } from "@/features/editor/fontOptions"
import {
  isGenerationBusy,
  resolveProgressPercent,
} from "@/features/editor/generationProgress"
import { ExportPopover } from "@/features/editor/ExportPopover"
import { PosterPreview } from "@/features/editor/PosterPreview"
import { ThemeSwatchCard } from "@/features/editor/ThemeSwatchCard"
import { usePosterGenerator } from "@/features/editor/usePosterGenerator"
import { geocodeCity } from "@/features/geocode/nominatim"
import { createEmptyCustomTheme, listThemes } from "@/features/themes/themeRegistry"
import type { PosterTheme } from "@/lib/types"
import { encodePosterState } from "@/lib/urlState"
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
  const {
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
    pixelSize,
  } = usePosterGenerator()

  const [themeJson, setThemeJson] = useState("")
  const [locationMode, setLocationMode] = useState<"search" | "coordinates">("search")
  const [placeCity, setPlaceCity] = useState(config.geocode.city)
  const [placeCountry, setPlaceCountry] = useState(config.geocode.country)
  const [placeLookupMessage, setPlaceLookupMessage] = useState<string | null>(null)
  const [isPlaceLookingUp, setIsPlaceLookingUp] = useState(false)
  const [mapDataStale, setMapDataStale] = useState(false)
  const themes = useMemo(() => listThemes(), [])
  const isBusy = isGenerationBusy(progress)
  const progressPercent = resolveProgressPercent(progress)
  const canPanPreview = features.length > 0 && Boolean(previewUrl)
  const generateDisabled = isBusy || isPlaceLookingUp
  const generateLabel = isBusy
    ? progress.message
    : isPlaceLookingUp
      ? "Looking up place…"
      : "Generate poster"

  const shareLink = `${window.location.origin}${window.location.pathname}#p=${encodePosterState(config)}`

  useEffect(() => {
    setPlaceCity(config.geocode.city)
    setPlaceCountry(config.geocode.country)
  }, [config.geocode.city, config.geocode.country])

  useEffect(() => {
    if (progress.phase === "done" && progress.message === "Poster ready") {
      setMapDataStale(false)
    }
  }, [progress.phase, progress.message])

  useEffect(() => {
    if (locationMode !== "search") {
      setPlaceLookupMessage(null)
      setIsPlaceLookingUp(false)
      return
    }

    const city = placeCity.trim()
    const country = placeCountry.trim()

    const syncTimer = window.setTimeout(() => {
      setConfig((current) => {
        const placeChanged =
          current.geocode.city !== placeCity || current.geocode.country !== placeCountry
        if (
          !placeChanged &&
          current.display.city === placeCity &&
          current.display.country === placeCountry
        ) {
          return current
        }

        return {
          ...current,
          // Changing City/Country unlocks auto-center for the next lookup.
          centerLocked: placeChanged ? false : current.centerLocked,
          geocode: { city: placeCity, country: placeCountry },
          display: { city: placeCity, country: placeCountry },
        }
      })
    }, 200)

    if (!city || !country) {
      setPlaceLookupMessage(null)
      setIsPlaceLookingUp(false)
      return () => {
        window.clearTimeout(syncTimer)
      }
    }

    let cancelled = false
    const lookupTimer = window.setTimeout(() => {
      void (async () => {
        setIsPlaceLookingUp(true)
        setPlaceLookupMessage("Looking up place size…")
        try {
          const result = await geocodeCity({ city, country })
          if (cancelled) {
            return
          }

          const suggested = result.suggestedRadiusMeters
          setConfig((current) => ({
            ...current,
            geocode: { city: placeCity, country: placeCountry },
            display: { city: placeCity, country: placeCountry },
            viewport: {
              ...current.viewport,
              ...(current.centerLocked
                ? {}
                : {
                    latitude: result.latitude,
                    longitude: result.longitude,
                  }),
              radiusMeters: suggested ?? current.viewport.radiusMeters,
            },
          }))
          setPlaceLookupMessage(
            suggested != null
              ? `Suggested fetch radius ${Math.round(suggested)} m from place size. Click Generate to download map data.`
              : "Place found. Click Generate to download map data.",
          )
        } catch {
          if (!cancelled) {
            setPlaceLookupMessage(
              "Place lookup failed — check spelling, or use Coordinates.",
            )
          }
        } finally {
          if (!cancelled) {
            setIsPlaceLookingUp(false)
          }
        }
      })()
    }, 700)

    return () => {
      cancelled = true
      setIsPlaceLookingUp(false)
      window.clearTimeout(syncTimer)
      window.clearTimeout(lookupTimer)
    }
  }, [locationMode, placeCity, placeCountry, setConfig])

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles data-icon="inline-start" className="size-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Map Poster Studio</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Turn any city into a minimalist map poster — client-side, print-ready, Cloudflare Pages friendly.
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-2 sm:max-w-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{progress.message}</Badge>
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
            </div>
            {isBusy ? (
              <div className="w-full space-y-1">
                <Progress value={progressPercent} />
                <p className="text-right text-xs text-muted-foreground">{progressPercent}%</p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-2 lg:p-6">
        <div className="flex flex-col gap-4">
          <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Location
            </CardTitle>
            <CardDescription>
              Choose a place name to look up coordinates, or enter lat/lon directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
                  Type a city and country — labels and suggested fetch radius update after you pause
                  typing. Click Generate to download map data.
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={placeCity}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setPlaceCity(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={placeCountry}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setPlaceCountry(event.target.value)}
                  />
                </div>
                {placeLookupMessage ? (
                  <p className="text-xs text-muted-foreground">{placeLookupMessage}</p>
                ) : null}
              </TabsContent>

              <TabsContent value="coordinates" className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                  Use this when you already know the center point. Geocoding is skipped; set radius
                  below before generating.
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
                        setMapDataStale(features.length > 0)
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
                        setMapDataStale(features.length > 0)
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

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Fetch radius</Label>
                <Badge variant="outline">{Math.round(config.viewport.radiusMeters)} m</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls how much OpenStreetMap data is downloaded when you generate. Place name
                mode auto-sets this from the place size (about 4–50 km). Adjust before Generate if
                you want a tighter or wider map. Radii above about 15–20 km can be slow or fail
                because Overpass returns a lot of data.
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
                  Large fetch radius — Generate may take a long time or fail on public Overpass
                  servers.
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
            <Button
              className="relative w-full overflow-hidden disabled:opacity-100"
              onClick={() => void generate(locationMode === "coordinates")}
              disabled={generateDisabled}
              aria-busy={generateDisabled}
            >
              {isBusy ? (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-primary-foreground/25 transition-[width] duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              ) : null}
              <span className="relative z-10 inline-flex items-center gap-2">
                {generateDisabled ? <Spinner className="text-primary-foreground" /> : null}
                <span className="truncate">{generateLabel}</span>
                {isBusy ? (
                  <span className="tabular-nums opacity-80">{progressPercent}%</span>
                ) : null}
              </span>
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
          </Card>

          <Card className="h-fit">
          <CardHeader>
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
                <TabsTrigger value="labels">Labels</TabsTrigger>
              </TabsList>

              <TabsContent value="themes">
                <p className="mb-3 text-xs text-muted-foreground">
                  Each card shows a mini map preview and color chips for background, water, parks,
                  roads, and label text.
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

              <TabsContent value="labels">
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">
                    Poster text synced from Location when using place name. Edit here to override.
                  </p>
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

        <Card className="flex min-h-0 flex-col lg:min-h-[calc(100vh-8rem)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {pixelSize.widthPx} × {pixelSize.heightPx} px at 300 DPI
              </CardDescription>
            </div>
            <ExportPopover
              config={config}
              setConfig={setConfig}
              featureCount={features.length}
              isBusy={isBusy}
              exportCurrent={exportCurrent}
              exportAllThemes={exportAllThemes}
            />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-[520px] flex-1 flex-col gap-3">
              <div className="flex flex-1 items-start justify-center rounded-xl border bg-muted/30 p-4">
                {previewUrl ? (
                  <PosterPreview
                    previewUrl={previewUrl}
                    alt={`${config.display.city} map poster preview`}
                    config={config}
                    canPan={canPanPreview}
                    onPanCenter={(latitude, longitude) => {
                      setMapDataStale(true)
                      setConfig((current) => ({
                        ...current,
                        centerLocked: true,
                        viewport: {
                          ...current.viewport,
                          latitude,
                          longitude,
                        },
                      }))
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                    <Layers className="size-10 opacity-40" />
                    <p>Generate a poster to see the live preview.</p>
                  </div>
                )}
              </div>
              {mapDataStale ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Center moved — Generate to refresh map data
                </p>
              ) : canPanPreview ? (
                <p className="text-xs text-muted-foreground">
                  Drag the preview to pan the map center. Radius stays the same.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
