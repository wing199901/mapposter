import type { Map } from "maplibre-gl"

import { viewportToMapView } from "@/features/tiles/viewportToMapView"
import { waitForMapIdle } from "@/features/tiles/waitForMapIdle"
import type { Viewport } from "@/lib/types"

/** Safety cap for WebGL (20 in × 300 DPI). Normal presets capture at native export width. */
export const EXPORT_CAPTURE_MAX_PX = 6000

function applyViewport(map: Map, viewport: Viewport, mapWidthPx: number): void {
  const { center, zoom } = viewportToMapView(viewport, mapWidthPx)
  map.jumpTo({ center, zoom })
}

export async function withExportMapSize<T>(
  map: Map,
  layout: { widthPx: number; heightPx: number },
  viewport: Viewport,
  fn: () => Promise<T>,
): Promise<T> {
  const shell = map.getContainer().closest("[data-poster-shell]") as HTMLElement | null
  if (!shell) {
    return fn()
  }

  const captureW = Math.min(layout.widthPx, EXPORT_CAPTURE_MAX_PX)
  const captureH = Math.round((captureW * layout.heightPx) / layout.widthPx)

  const prevWidth = shell.style.width
  const prevHeight = shell.style.height

  shell.style.width = `${captureW}px`
  shell.style.height = `${captureH}px`
  map.resize()
  applyViewport(map, viewport, captureW)
  await waitForMapIdle(map)

  try {
    return await fn()
  } finally {
    shell.style.width = prevWidth
    shell.style.height = prevHeight
    map.resize()
    applyViewport(map, viewport, map.getContainer().clientWidth)
    await waitForMapIdle(map)
  }
}
