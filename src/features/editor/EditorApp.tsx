import { Download, Layers, MapPin, Palette, Share2, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
import { toast, Toaster } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator, Textarea } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EXPORT_PRESETS } from "@/features/export/presets"
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
  const themes = useMemo(() => listThemes(), [])
  const isBusy = ["geocoding", "fetching", "rendering", "exporting"].includes(progress.phase)

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
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)_340px] lg:p-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Location
            </CardTitle>
            <CardDescription>Geocode a city or override coordinates manually.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={config.geocode.city}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    geocode: { ...current.geocode, city: event.target.value },
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={config.geocode.country}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    geocode: { ...current.geocode, country: event.target.value },
                  }))
                }
              />
            </div>
            <Separator />
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
            <div className="flex flex-col gap-3">
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
            <Button onClick={() => void generate()} disabled={isBusy}>
              {isBusy ? <Spinner className="text-primary-foreground" /> : null}
              Generate poster
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {pixelSize.widthPx} × {pixelSize.heightPx} px at 300 DPI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[520px] items-center justify-center rounded-xl border bg-muted/30 p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${config.display.city} map poster preview`}
                  className="max-h-[70vh] w-full max-w-full object-contain shadow-lg"
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
                <div className="grid grid-cols-2 gap-2">
                  {themes.map(({ id, theme: item }) => (
                    <button
                      key={id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        config.themeId === id ? "border-primary bg-accent" : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          themeId: id,
                          customTheme: undefined,
                        }))
                      }
                    >
                      <div
                        className="mb-2 h-8 rounded-md border"
                        style={{ backgroundColor: item.bg }}
                      />
                      <p className="text-sm font-medium">{item.name}</p>
                    </button>
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
                    <Label htmlFor="font-family">Google Font family</Label>
                    <Input
                      id="font-family"
                      value={config.fontFamily}
                      placeholder="Noto Sans JP"
                      onChange={(event) =>
                        setConfig((current) => ({ ...current, fontFamily: event.target.value }))
                      }
                    />
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
      </main>
    </div>
  )
}
