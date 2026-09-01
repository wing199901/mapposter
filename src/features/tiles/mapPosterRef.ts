import type { Map } from "maplibre-gl"

export interface MapPosterHandle {
  getMap: () => Map | null
  waitForIdle: () => Promise<void>
}
