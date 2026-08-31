import type { PosterTheme } from "@/lib/types"
import { cn } from "@/lib/utils"

const SWATCH_KEYS: Array<{ key: keyof PosterTheme; label: string }> = [
  { key: "bg", label: "Background" },
  { key: "water", label: "Water" },
  { key: "parks", label: "Parks" },
  { key: "road_motorway", label: "Motorway" },
  { key: "road_primary", label: "Primary roads" },
  { key: "text", label: "Labels" },
]

function ThemeMiniPreview({ theme }: { theme: PosterTheme }) {
  return (
    <div
      className="relative mb-2 h-16 overflow-hidden rounded-md border"
      style={{ backgroundColor: theme.bg }}
      aria-hidden="true"
    >
      <div
        className="absolute bottom-2 left-3 size-5 rounded-full opacity-90"
        style={{ backgroundColor: theme.water }}
      />
      <div
        className="absolute top-3 right-4 h-2 w-10 rotate-[35deg] rounded-full"
        style={{ backgroundColor: theme.road_motorway }}
      />
      <div
        className="absolute top-8 left-4 h-1.5 w-12 rotate-[12deg] rounded-full"
        style={{ backgroundColor: theme.road_primary }}
      />
      <div
        className="absolute right-5 bottom-3 h-1 w-9 -rotate-[18deg] rounded-full"
        style={{ backgroundColor: theme.road_residential }}
      />
      <div
        className="absolute top-2 left-2 h-3 w-6 rounded-sm opacity-80"
        style={{ backgroundColor: theme.parks }}
      />
    </div>
  )
}

export function ThemeSwatchCard({
  theme,
  selected,
  onSelect,
}: {
  theme: PosterTheme
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        selected ? "border-primary bg-accent ring-1 ring-primary/30" : "hover:bg-muted/50",
      )}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <ThemeMiniPreview theme={theme} />
      <div className="mb-2 flex flex-wrap gap-1">
        {SWATCH_KEYS.map(({ key, label }) => (
          <span
            key={key}
            className="size-4 rounded-sm border border-border/60"
            style={{ backgroundColor: theme[key] as string }}
            title={`${theme.name} — ${label}`}
          />
        ))}
      </div>
      <p className="text-sm font-medium">{theme.name}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{theme.description}</p>
    </button>
  )
}
