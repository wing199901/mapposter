import { canvasToPngBlob, drawPoster, type DrawPosterInput } from "@/features/render/drawPoster"
import type { OsmFeature } from "@/lib/types"

interface PendingPreview {
  resolve: (bitmap: ImageBitmap) => void
  reject: (error: Error) => void
  timer: number
}

interface PosterWorkerRequest {
  id: number
  input: DrawPosterInput & { features: OsmFeature[] }
}

interface PosterWorkerResponse {
  id: number
  bitmap?: ImageBitmap
  error?: string
}

const WORKER_FEATURE_LIMIT = 20_000
const WORKER_TIMEOUT_MS = 120_000

let worker: Worker | null = null
let nextRequestId = 0
const pending = new Map<number, PendingPreview>()

function settlePending(id: number, outcome: "resolve" | "reject", value: ImageBitmap | Error): void {
  const current = pending.get(id)
  if (!current) {
    return
  }

  pending.delete(id)
  window.clearTimeout(current.timer)
  if (outcome === "resolve") {
    current.resolve(value as ImageBitmap)
    return
  }

  current.reject(value as Error)
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./poster.worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (event: MessageEvent<PosterWorkerResponse>) => {
      const { id, bitmap, error } = event.data
      if (error || !bitmap) {
        settlePending(id, "reject", new Error(error ?? "Preview render failed"))
        return
      }

      settlePending(id, "resolve", bitmap)
    }
    worker.onerror = (event) => {
      for (const [id] of pending) {
        settlePending(id, "reject", new Error(event.message || "Preview worker failed"))
      }
      worker?.terminate()
      worker = null
    }
  }

  return worker
}

export function shouldRenderPreviewInWorker(featureCount: number): boolean {
  return featureCount <= WORKER_FEATURE_LIMIT
}

export function renderPreviewInWorker(
  input: DrawPosterInput & { features: OsmFeature[] },
): Promise<ImageBitmap> {
  if (!shouldRenderPreviewInWorker(input.features.length)) {
    return Promise.reject(new Error("Feature set too large for preview worker"))
  }

  const id = nextRequestId
  nextRequestId += 1

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      settlePending(id, "reject", new Error("Preview worker timed out"))
    }, WORKER_TIMEOUT_MS)

    pending.set(id, { resolve, reject, timer })
    const request: PosterWorkerRequest = { id, input }

    try {
      getWorker().postMessage(request)
    } catch (error) {
      settlePending(
        id,
        "reject",
        error instanceof Error ? error : new Error("Preview worker postMessage failed"),
      )
    }
  })
}

export async function bitmapToObjectUrl(bitmap: ImageBitmap): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Canvas 2D context unavailable")
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const blob = await canvasToPngBlob(canvas)
  return URL.createObjectURL(blob)
}

export async function renderPreviewOnMainThread(
  input: DrawPosterInput & { features: OsmFeature[] },
): Promise<string> {
  const canvas = document.createElement("canvas")
  drawPoster(canvas, input)
  const blob = await canvasToPngBlob(canvas)
  return URL.createObjectURL(blob)
}

export function revokePreviewUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}
