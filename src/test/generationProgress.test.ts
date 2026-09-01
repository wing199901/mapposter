import { describe, expect, it } from "vitest"

import {
  isExportBusy,
  isGenerationBusy,
  resolveProgressPercent,
} from "@/features/editor/generationProgress"

describe("generationProgress", () => {
  it("maps phases to progress percentages", () => {
    expect(resolveProgressPercent({ phase: "exporting", message: "Exporting…" })).toBe(75)
    expect(
      resolveProgressPercent({ phase: "exporting", message: "Exporting…", progress: 0.5 }),
    ).toBe(50)
  })

  it("detects busy export phases", () => {
    expect(isExportBusy({ phase: "exporting", message: "Exporting…" })).toBe(true)
    expect(isExportBusy({ phase: "done", message: "Export complete" })).toBe(false)
    expect(isGenerationBusy({ phase: "exporting", message: "Exporting…" })).toBe(true)
  })
})
