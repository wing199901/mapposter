import { Download, Layers, MapPin, Palette, Share2, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
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
import { EXPORT_PRESETS } from "@/features/export/presets"
import { isKnownPosterFont, POSTER_FONT_OPTIONS } from "@/features/editor/fontOptions"
import {
  isGenerationBusy,
  resolveProgressPercent,
} from "@/features/editor/generationProgress"
import { ThemeSwatchCard } from "@/features/editor/ThemeSwatchCard"
import { usePosterGenerator } from "@/features/editor/usePosterGenerator"
import { createEmptyCustomTheme, listThemes } from "@/features/themes/themeRegistry"
import type { PosterTheme } from "@/lib/types"
import { encodePosterState } from "@/lib/urlState"

const DISTANCE_HINTS = [
  { range: "4000–6000 m", hint: "Small dense cities" },
  { range: "8000–12000 m", hint: "Medium downtown focus" },
  { range: "15000–20000 m", hint: "Large metro overview" },
]

export function EditorApp() {
  const {
    config,
    setConfig,
    theme,
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
  const themes = useMemo(() => listThemes(), [])
  const isBusy = isGenerationBusy(progress)
  const progressPercent = resolveProgressPercent(progress)

  const shareLink = `${window.location.origin}${window.location.pathname}#p=${encodePosterState(config)}`

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

      <main className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[1fr_2fr] lg:p-6">
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
                  City and country update poster labels automatically. Coordinates are resolved when
                  you generate.
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={config.geocode.city}
                    onChange={(event) => {
                      const city = event.target.value
                      setConfig((current) => ({
                        ...current,
                        geocode: { ...current.geocode, city },
                        display: { ...current.display, city },
                      }))
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={config.geocode.country}
                    onChange={(event) => {
                      const country = event.target.value
                      setConfig((current) => ({
                        ...current,
                        geocode: { ...current.geocode, country },
                        display: { ...current.display, country },
                      }))
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="coordinates" className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                  Use this when you already know the center point. Geocoding is skipped; only
                  latitude, longitude, and radius below are used.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0001"
                      value={config.viewport.latitude}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          viewport: {
                            ...current.viewport,
                            latitude: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lon">Longitude</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.0001"
                      value={config.viewport.longitude}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          viewport: {
                            ...current.viewport,
                            longitude: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="map-shape">Map shape</Label>
                <Select
                  value={config.mapShape}
                  onValueChange={(value) =>
                    setConfig((current) => ({
                      ...current,
                      mapShape: value as "circular" | "rectangular",
                    }))
                  }
                >
                  <SelectTrigger id="map-shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circular">
                      Circular — full-bleed, edges crop at poster width
                    </SelectItem>
                    <SelectItem value="rectangular">
                      Rectangular — fill map area, no circular edge
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label>Radius</Label>
                <Badge variant="outline">{Math.round(config.viewport.radiusMeters)} m</Badge>
              </div>
              <Slider
                min={4000}
                max={20000}
                step={500}
                value={[config.viewport.radiusMeters]}
                onValueChange={([value]) =>
                  setConfig((current) => ({
                    ...current,
                    viewport: { ...current.viewport, radiusMeters: value ?? 10000 },
                  }))
                }
              />
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {DISTANCE_HINTS.map((item) => (
                  <p key={item.range}>
                    {item.range}: {item.hint}
                  </p>
                ))}
              </div>
            </div>
            <Button onClick={() => void generate(locationMode === "coordinates")} disabled={isBusy}>
              {isBusy ? <Spinner className="text-primary-foreground" /> : null}
              Generate poster
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
          </Card>

          <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Style & export
            </CardTitle>
            <CardDescription>{theme.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="themes">
              <TabsList>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
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

              <TabsContent value="export">
                <div className="flex flex-col gap-3">
                  {EXPORT_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      className="justify-between"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          widthInches: preset.widthInches,
                          heightInches: preset.heightInches,
                        }))
                      }
                    >
                      <span>{preset.label}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </Button>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="width">Width (in)</Label>
                      <Input
                        id="width"
                        type="number"
                        min={1}
                        max={20}
                        step={0.1}
                        value={config.widthInches}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            widthInches: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="height">Height (in)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={1}
                        max={20}
                        step={0.1}
                        value={config.heightInches}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            heightInches: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={() => void exportCurrent()} disabled={isBusy}>
                    <Download data-icon="inline-start" />
                    Download PNG
                  </Button>
                  <Button variant="secondary" onClick={() => void exportAllThemes()} disabled={isBusy}>
                    Download all themes (ZIP)
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        <Card className="flex min-h-0 flex-col lg:min-h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {pixelSize.widthPx} × {pixelSize.heightPx} px at 300 DPI
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-[520px] flex-1 items-center justify-center rounded-xl border bg-muted/30 p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${config.display.city} map poster preview`}
                  className="h-full w-auto max-w-full object-contain shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <Layers className="size-10 opacity-40" />
                  <p>Generate a poster to see the live preview.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
