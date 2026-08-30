import type { ExportPreset } from "@/lib/types"

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "instagram",
    label: "Instagram Post",
    widthInches: 3.6,
    heightInches: 3.6,
    description: "1080 × 1080 px",
  },
  {
    id: "mobile-wallpaper",
    label: "Mobile Wallpaper",
    widthInches: 3.6,
    heightInches: 6.4,
    description: "1080 × 1920 px",
  },
  {
    id: "hd-wallpaper",
    label: "HD Wallpaper",
    widthInches: 6.4,
    heightInches: 3.6,
    description: "1920 × 1080 px",
  },
  {
    id: "4k",
    label: "4K Wallpaper",
    widthInches: 12.8,
    heightInches: 7.2,
    description: "3840 × 2160 px",
  },
  {
    id: "a4",
    label: "A4 Print",
    widthInches: 8.3,
    heightInches: 11.7,
    description: "2480 × 3508 px",
  },
  {
    id: "poster-default",
    label: "Default Poster",
    widthInches: 12,
    heightInches: 16,
    description: "3600 × 4800 px",
  },
]

export function inchesToPixels(inches: number, dpi = 300): number {
  return Math.round(inches * dpi)
}

export function clampInches(value: number, max = 20): number {
  return Math.min(Math.max(value, 1), max)
}
