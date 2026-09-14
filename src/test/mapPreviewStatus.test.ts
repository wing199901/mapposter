import { describe, expect, it, vi } from "vitest"

import {
  INITIAL_MAP_PREVIEW_STATUS,
  createMapPreviewStatusPublisher,
  mapPreviewStatusesEqual,
  readMapPreviewStatus,
} from "@/features/tiles/mapPreviewStatus"

function mockMap(options: { loaded?: boolean; tilesLoaded?: boolean }) {
  return {
    loaded: () => options.loaded ?? false,
    areTilesLoaded: () => options.tilesLoaded ?? false,
  }
}

describe("readMapPreviewStatus", () => {
  it("reports initializing when map is missing", () => {
    expect(readMapPreviewStatus(null)).toEqual(INITIAL_MAP_PREVIEW_STATUS)
  })

  it("reports style loading before the map is loaded", () => {
    const status = readMapPreviewStatus(mockMap({ loaded: false }) as never)
    expect(status.phase).toBe("loading-style")
    expect(status.ready).toBe(false)
  })

  it("reports tile fetching when style is loaded but tiles are not", () => {
    const status = readMapPreviewStatus(mockMap({ loaded: true, tilesLoaded: false }) as never)
    expect(status.phase).toBe("loading-tiles")
    expect(status.message).toContain("Fetching map tiles")
  })

  it("reports ready when style and tiles are loaded", () => {
    const status = readMapPreviewStatus(mockMap({ loaded: true, tilesLoaded: true }) as never)
    expect(status.phase).toBe("ready")
    expect(status.ready).toBe(true)
    expect(status.tilesLoaded).toBe(true)
  })
})

describe("map preview status publisher", () => {
  it("treats identical statuses as equal", () => {
    const a = readMapPreviewStatus(mockMap({ loaded: true, tilesLoaded: true }) as never)
    const b = readMapPreviewStatus(mockMap({ loaded: true, tilesLoaded: true }) as never)
    expect(mapPreviewStatusesEqual(a, b)).toBe(true)
  })

  it("does not notify parent on repeated identical map polls", () => {
    const onStatusChange = vi.fn()
    const publish = createMapPreviewStatusPublisher(onStatusChange)
    const map = mockMap({ loaded: true, tilesLoaded: true }) as never

    expect(publish(map)).toBe(true)
    expect(publish(map)).toBe(false)
    expect(publish(map)).toBe(false)
    expect(onStatusChange).toHaveBeenCalledTimes(1)
  })

  it("notifies again when tiles finish loading after a loading poll", () => {
    const onStatusChange = vi.fn()
    const publish = createMapPreviewStatusPublisher(onStatusChange)

    expect(publish(mockMap({ loaded: true, tilesLoaded: false }) as never)).toBe(true)
    expect(publish(mockMap({ loaded: true, tilesLoaded: true }) as never)).toBe(true)
    expect(onStatusChange).toHaveBeenCalledTimes(2)
    expect(onStatusChange.mock.calls[1]?.[0]?.phase).toBe("ready")
  })
})
