import { canvasToPngBlob, drawPoster, type DrawPosterInput } from "@/features/render/drawPoster"
import type { OsmFeature } from "@/lib/types"

interface PendingPreview {
  resolve: (bitmap: ImageBitmap) => void
  reject: (error: Error) => void
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

let worker: Worker | null = null
let nextRequestId = 0
const pending = new Map<number, PendingPreview>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./poster.worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (event: MessageEvent<PosterWorkerResponse>) => {
      const { id, bitmap, error } = event.data
      const current = pending.get(id)
      if (!current) {
        return
      }

      pending.delete(id)
      if (error || !bitmap) {
        current.reject(new Error(error ?? "Preview render failed"))
        return
      }

      current.resolve(bitmap)
    }
    worker.onerror = (event) => {
      for (const current of pending.values()) {
        current.reject(new Error(event.message || "Preview worker failed"))
      }
      pending.clear()
      worker?.terminate()
      worker = null
    }
  }

  return worker
}

export function renderPreviewInWorker(
  input: DrawPosterInput & { features: OsmFeature[] },
): Promise<ImageBitmap> {
  const id = nextRequestId
  nextRequestId += 1

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    const request: PosterWorkerRequest = { id, input }
    getWorker().postMessage(request)
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
