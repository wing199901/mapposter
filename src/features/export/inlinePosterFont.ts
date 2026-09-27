const FONT_CSS_WEIGHTS = "400;500;700"

export async function inlinePosterFont(
  svg: string,
  options: {
    fontFamily: string
    characters: string
    fetchImpl?: typeof fetch
  },
): Promise<string | null> {
  const characters = Array.from(new Set(Array.from(options.characters))).join("")
  if (!options.fontFamily || characters.length === 0) {
    return null
  }

  const fetchImpl = options.fetchImpl ?? fetch
  try {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(options.fontFamily)}` +
      `:wght@${FONT_CSS_WEIGHTS}&text=${encodeURIComponent(characters)}&display=swap`
    const cssResponse = await fetchImpl(cssUrl)
    if (!cssResponse.ok) {
      return null
    }
    const css = await cssResponse.text()
    const faces = await embedFontFaces(css, options.fontFamily, fetchImpl)
    if (!faces) {
      return null
    }
    const style = `<defs><style><![CDATA[${faces}]]></style></defs>`
    const svgOpen = svg.indexOf("<svg")
    if (svgOpen < 0) {
      return null
    }
    const svgTagEnd = svg.indexOf(">", svgOpen)
    if (svgTagEnd < 0) {
      return null
    }
    return `${svg.slice(0, svgTagEnd + 1)}${style}${svg.slice(svgTagEnd + 1)}`
  } catch {
    return null
  }
}

async function embedFontFaces(
  css: string,
  fontFamily: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const blocks = css.match(/@font-face\s*\{[^}]+\}/g)
  if (!blocks || blocks.length === 0) {
    return null
  }

  const embedded: string[] = []
  for (const block of blocks) {
    const urlMatch = block.match(/url\(([^)]+)\)/)
    if (!urlMatch?.[1]) {
      return null
    }
    const fontUrl = urlMatch[1].trim().replace(/^["']|["']$/g, "")
    const weightMatch = block.match(/font-weight:\s*(\d+)/)
    const weight = weightMatch?.[1] ?? "400"
    const fontResponse = await fetchImpl(fontUrl)
    if (!fontResponse.ok) {
      return null
    }
    const bytes = new Uint8Array(await fontResponse.arrayBuffer())
    const base64 = bytesToBase64(bytes)
    embedded.push(
      `@font-face{font-family:'${fontFamily.replaceAll("'", "")}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${base64}) format('woff2');}`,
    )
  }

  return embedded.join("\n")
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}
