import { drawPoster, type DrawPosterInput } from "@/features/render/drawPoster"
import { ensureWorkerFont } from "@/features/render/workerTypography"
import type { OsmFeature } from "@/lib/types"

interface PosterWorkerRequest {
  id: number
  input: DrawPosterInput & { features: OsmFeature[] }
}

interface PosterWorkerResponse {
  id: number
  bitmap?: ImageBitmap
  error?: string
}

self.onmessage = async (event: MessageEvent<PosterWorkerRequest>) => {
  const { id, input } = event.data

  try {
    await ensureWorkerFont(input.fontFamily)
    const canvas = new OffscreenCanvas(input.widthPx, input.heightPx)
    drawPoster(canvas, input)

    const bitmap = await createImageBitmap(canvas)
    const response: PosterWorkerResponse = { id, bitmap }
    self.postMessage(response, { transfer: [bitmap] })
  } catch (caught) {
    const response: PosterWorkerResponse = {
      id,
      error: caught instanceof Error ? caught.message : "Preview render failed",
    }
    self.postMessage(response)
  }
}
