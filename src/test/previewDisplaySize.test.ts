import { describe, expect, it } from "vitest"

import {
  PREVIEW_MAX_HEIGHT_PX,
  previewDisplaySize,
} from "@/features/tiles/previewDisplaySize"

describe("previewDisplaySize", () => {
  it("preserves export aspect ratio from width budget", () => {
    const poster = previewDisplaySize(12, 16, 480)
    expect(poster.widthPx / poster.heightPx).toBeCloseTo(12 / 16, 2)
    expect(poster.widthPx).toBeLessThanOrEqual(480)
  })

  it("derives height from inches instead of panel height", () => {
    const poster = previewDisplaySize(12, 16, 480)
    expect(poster.heightPx).toBe(Math.round((480 / 12) * 16))
  })

  it("scales smaller export presets down in the preview", () => {
    const poster = previewDisplaySize(12, 16, 480)
    const square = previewDisplaySize(3.6, 3.6, 480)
    expect(square.widthPx * square.heightPx).toBeLessThan(poster.widthPx * poster.heightPx)
  })

  it("caps ultra-tall posters at the safety max height", () => {
    const tall = previewDisplaySize(8, 20, 480)
    expect(tall.heightPx).toBeLessThanOrEqual(PREVIEW_MAX_HEIGHT_PX)
  })
})
