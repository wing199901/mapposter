export interface PosterFontOption {
  value: string
  label: string
  hint?: string
}

export const POSTER_FONT_OPTIONS: PosterFontOption[] = [
  { value: "Roboto", label: "Roboto", hint: "Default sans-serif" },
  { value: "Inter", label: "Inter", hint: "Modern UI sans" },
  { value: "Montserrat", label: "Montserrat", hint: "Geometric poster" },
  { value: "Oswald", label: "Oswald", hint: "Condensed display" },
  { value: "Playfair Display", label: "Playfair Display", hint: "Elegant serif" },
  { value: "Lora", label: "Lora", hint: "Classic serif" },
  { value: "Source Sans 3", label: "Source Sans 3", hint: "Neutral sans" },
  { value: "Noto Sans", label: "Noto Sans", hint: "Wide language support" },
  { value: "Noto Sans JP", label: "Noto Sans JP", hint: "Japanese" },
  { value: "Noto Sans TC", label: "Noto Sans TC", hint: "Traditional Chinese" },
]

export function isKnownPosterFont(family: string): boolean {
  return POSTER_FONT_OPTIONS.some((option) => option.value === family)
}
