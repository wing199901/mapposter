import { Download } from "lucide-react"
import { useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { clampInches, EXPORT_PRESETS } from "@/features/export/presets"
import { MAX_INCHES, type PosterConfig } from "@/lib/types"

interface ExportPopoverProps {
  config: PosterConfig
  setConfig: Dispatch<SetStateAction<PosterConfig>>
  mapReady: boolean
  isBusy: boolean
  exportCurrentPng: () => Promise<void>
  exportCurrentSvg: () => Promise<void>
  exportAllThemes: () => Promise<void>
}

export function ExportPopover({
  config,
  setConfig,
  mapReady,
  isBusy,
  exportCurrentPng,
  exportCurrentSvg,
  exportAllThemes,
}: ExportPopoverProps) {
  const [open, setOpen] = useState(false)
  const canDownload = mapReady && !isBusy

  const runDownload = async (action: () => Promise<void>) => {
    setOpen(false)
    try {
      await action()
    } catch {
      // Hook / caller surfaces errors; user can reopen to retry.
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button">
          <Download data-icon="inline-start" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Size & download</p>
          {EXPORT_PRESETS.map((preset) => {
            const selected =
              config.widthInches === preset.widthInches &&
              config.heightInches === preset.heightInches
            return (
              <Button
                key={preset.id}
                variant={selected ? "default" : "outline"}
                className="justify-between"
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    widthInches: preset.widthInches,
                    heightInches: preset.heightInches,
                  }))
                }
              >
                <span>{preset.label}</span>
                <span
                  className={
                    selected ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"
                  }
                >
                  {preset.description}
                </span>
              </Button>
            )
          })}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="export-width">Width (in)</Label>
              <Input
                id="export-width"
                type="number"
                min={1}
                max={MAX_INCHES}
                step={0.1}
                value={config.widthInches}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    widthInches: clampInches(Number(event.target.value)),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="export-height">Height (in)</Label>
              <Input
                id="export-height"
                type="number"
                min={1}
                max={MAX_INCHES}
                step={0.1}
                value={config.heightInches}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    heightInches: clampInches(Number(event.target.value)),
                  }))
                }
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={!canDownload}
            onClick={() => void runDownload(exportCurrentPng)}
          >
            <Download data-icon="inline-start" />
            Download PNG
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canDownload}
            onClick={() => void runDownload(exportCurrentSvg)}
          >
            Download SVG
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canDownload}
            onClick={() => void runDownload(exportAllThemes)}
          >
            Download all themes (PNG + SVG ZIP)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
