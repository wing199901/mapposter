/** Default max preview width when the panel width is not yet measured. */
export const PREVIEW_MAX_WIDTH_PX = 520

/** Safety cap so ultra-tall presets do not overflow small viewports. */
export const PREVIEW_MAX_HEIGHT_PX = 640

/**
 * Size the preview from export inches, scaling to fit available width.
 * Height follows the poster aspect ratio (not the preview panel height).
 */
export function previewDisplaySize(
  widthInches: number,
  heightInches: number,
  maxWidth = PREVIEW_MAX_WIDTH_PX,
): { widthPx: number; heightPx: number } {
  const safeWidth = Math.max(widthInches, 0.1)
  const safeHeight = Math.max(heightInches, 0.1)
  let scale = maxWidth / safeWidth
  let widthPx = Math.round(safeWidth * scale)
  let heightPx = Math.round(safeHeight * scale)

  if (heightPx > PREVIEW_MAX_HEIGHT_PX) {
    scale = PREVIEW_MAX_HEIGHT_PX / safeHeight
    widthPx = Math.round(safeWidth * scale)
    heightPx = Math.round(safeHeight * scale)
  }

  return { widthPx, heightPx }
}
