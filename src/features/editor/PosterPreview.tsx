import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { panViewportByDisplayDelta } from "@/features/render/projection"
import { DPI, type PosterConfig } from "@/lib/types"

interface PosterPreviewProps {
  previewUrl: string
  alt: string
  config: PosterConfig
  canPan: boolean
  onPanCenter: (latitude: number, longitude: number) => void
}

export function PosterPreview({
  previewUrl,
  alt,
  config,
  canPan,
  onPanCenter,
}: PosterPreviewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{
    pointerId: number
    lastX: number
    lastY: number
  } | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  const onPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!canPan || event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    }
    setGrabbing(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current
    const img = imgRef.current
    if (!drag || drag.pointerId !== event.pointerId || !img) {
      return
    }

    const displayWidth = img.clientWidth
    const displayHeight = img.clientHeight
    if (displayWidth <= 0 || displayHeight <= 0) {
      return
    }

    const deltaX = event.clientX - drag.lastX
    const deltaY = event.clientY - drag.lastY
    drag.lastX = event.clientX
    drag.lastY = event.clientY

    if (deltaX === 0 && deltaY === 0) {
      return
    }

    const posterWidthPx = Math.round(config.widthInches * DPI)
    const posterHeightPx = Math.round(config.heightInches * DPI)
    const next = panViewportByDisplayDelta(
      config.viewport,
      deltaX,
      deltaY,
      displayWidth,
      displayHeight,
      posterWidthPx,
      posterHeightPx,
    )
    onPanCenter(next.latitude, next.longitude)
  }

  const endDrag = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    setGrabbing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <img
      ref={imgRef}
      src={previewUrl}
      alt={alt}
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`h-full w-auto max-w-full object-contain shadow-lg touch-none ${
        canPan ? (grabbing ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
    />
  )
}
