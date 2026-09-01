import type { ExportProgress } from "@/lib/types"

const PHASE_PROGRESS: Record<ExportProgress["phase"], number> = {
  idle: 0,
  exporting: 0.75,
  done: 1,
  error: 0,
}

export function resolveProgressPercent(progress: ExportProgress): number {
  if (typeof progress.progress === "number") {
    return Math.round(progress.progress * 100)
  }

  return Math.round(PHASE_PROGRESS[progress.phase] * 100)
}

export function isExportBusy(progress: ExportProgress): boolean {
  return progress.phase === "exporting"
}

/** @deprecated Use isExportBusy */
export function isGenerationBusy(progress: ExportProgress): boolean {
  return isExportBusy(progress)
}
