import { describe, expect, it } from "vitest"

import {
  isGenerationBusy,
  resolveProgressPercent,
} from "@/features/editor/generationProgress"

describe("generationProgress", () => {
  it("maps phases to progress percentages", () => {
    expect(resolveProgressPercent({ phase: "fetching", message: "Fetching…" })).toBe(40)
    expect(
      resolveProgressPercent({ phase: "rendering", message: "Rendering…", progress: 0.75 }),
    ).toBe(75)
  })

  it("detects busy generation phases", () => {
    expect(isGenerationBusy({ phase: "rendering", message: "Rendering…" })).toBe(true)
    expect(isGenerationBusy({ phase: "done", message: "Poster ready" })).toBe(false)
  })
})
