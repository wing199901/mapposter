import { describe, expect, it } from "vitest"
import type { Map } from "maplibre-gl"

import { ExportMapSizeError, withExportMapSize } from "@/features/export/exportMapSize"
import { viewportToMapView } from "@/features/tiles/viewportToMapView"

describe("export map framing", () => {
  it("keeps the same geographic radius when capture width changes", () => {
    const viewport = {
      latitude: 22.3,
      longitude: 114.2,
      radiusMeters: 32_000,
    }
    const preview = viewportToMapView(viewport, 1138)
    const capture = viewportToMapView(viewport, 2560)

    expect(capture.zoom).toBeGreaterThan(preview.zoom)
    expect(capture.center).toEqual(preview.center)
  })

  it("fails the export when the preview shell cannot be resized", async () => {
    const map = {
      getContainer: () => document.createElement("div"),
    } as unknown as Map

    await expect(
      withExportMapSize(
        map,
        { widthPx: 1200, heightPx: 1600 },
        { latitude: 22.3, longitude: 114.2, radiusMeters: 4000 },
        async () => "exported",
      ),
    ).rejects.toBeInstanceOf(ExportMapSizeError)
  })
})
