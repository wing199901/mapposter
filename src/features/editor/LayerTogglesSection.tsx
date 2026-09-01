import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { PosterConfig, PosterLayerVisibility } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"

interface LayerToggleRowProps {
  id: string
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function LayerToggleRow({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: LayerToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <input
        id={id}
        type="checkbox"
        className="size-4 accent-primary disabled:opacity-40"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}

const LAYER_GROUPS: Array<{
  title: string
  items: Array<{
    key: keyof PosterLayerVisibility
    label: string
    description?: string
  }>
}> = [
  {
    title: "Base",
    items: [
      { key: "water", label: "Water" },
      { key: "waterway", label: "Waterways" },
      { key: "parks", label: "Parks" },
      { key: "buildings", label: "Buildings" },
    ],
  },
  {
    title: "Roads",
    items: [
      { key: "roadMotorway", label: "Motorway" },
      { key: "roadPrimary", label: "Primary" },
      { key: "roadSecondary", label: "Secondary" },
      { key: "roadTertiary", label: "Tertiary" },
      { key: "roadResidential", label: "Residential" },
      { key: "roadDefault", label: "Other roads" },
    ],
  },
  {
    title: "Transit",
    items: [
      { key: "rail", label: "Rail" },
      { key: "shipRoutes", label: "Ship routes", description: "Ferry and shipping lines." },
    ],
  },
]

interface LayerTogglesSectionProps {
  config: PosterConfig
  boundaryAvailable: boolean
  boundaryLoading: boolean
  onConfigChange: (updater: (current: PosterConfig) => PosterConfig) => void
}

export function LayerTogglesSection({
  config,
  boundaryAvailable,
  boundaryLoading,
  onConfigChange,
}: LayerTogglesSectionProps) {
  const setLayer = (key: keyof PosterLayerVisibility, value: boolean) => {
    onConfigChange((current) => ({
      ...current,
      layerVisibility: { ...current.layerVisibility, [key]: value },
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      {LAYER_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => (
            <LayerToggleRow
              key={item.key}
              id={`layer-${item.key}`}
              label={item.label}
              description={item.description}
              checked={config.layerVisibility[item.key]}
              onChange={(checked) => setLayer(item.key, checked)}
            />
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mask</p>
        <LayerToggleRow
          id="boundary-mask"
          label="City boundary mask"
          description={
            boundaryLoading
              ? "Loading place boundary…"
              : boundaryAvailable
                ? "Hide map features outside the geocoded place admin boundary."
                : "No admin boundary for this place — use place name search."
          }
          checked={config.boundaryMaskEnabled}
          disabled={!boundaryAvailable || boundaryLoading}
          onChange={(checked) =>
            onConfigChange((current) => ({ ...current, boundaryMaskEnabled: checked }))
          }
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onConfigChange((current) => ({
            ...current,
            layerVisibility: DEFAULT_LAYER_VISIBILITY,
          }))
        }
      >
        Reset layers
      </Button>
    </div>
  )
}
