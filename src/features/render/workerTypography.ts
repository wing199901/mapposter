const loadedFonts = new Set<string>()

export async function ensureWorkerFont(family: string): Promise<void> {
  if (!family || family === "Roboto") {
    return
  }

  if (loadedFonts.has(family)) {
    return
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;700&display=swap`
  const css = await fetch(cssUrl).then((response) => response.text())
  const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)

  if (!urlMatch?.[1]) {
    loadedFonts.add(family)
    return
  }

  const fontData = await fetch(urlMatch[1]).then((response) => response.arrayBuffer())
  const font = new FontFace(family, fontData)
  await font.load()
  await (self as unknown as { fonts: FontFaceSet }).fonts.add(font)
  loadedFonts.add(family)
}
