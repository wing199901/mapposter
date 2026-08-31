import type { GenerationProgress } from "@/lib/types"

const PHASE_PROGRESS: Record<GenerationProgress["phase"], number> = {
  idle: 0,
  geocoding: 0.12,
  fetching: 0.4,
  rendering: 0.78,
  exporting: 0.9,
  done: 1,
  error: 0,
}

export function resolveProgressPercent(progress: GenerationProgress): number {
  if (typeof progress.progress === "number") {
    return Math.round(progress.progress * 100)
  }

  return Math.round(PHASE_PROGRESS[progress.phase] * 100)
}

export function isGenerationBusy(progress: GenerationProgress): boolean {
  return ["geocoding", "fetching", "rendering", "exporting"].includes(progress.phase)
}
