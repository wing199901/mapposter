import { describe, expect, it } from "vitest"

import { inlinePosterFont } from "@/features/export/inlinePosterFont"

const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>京都</text></svg>`

describe("inline poster font", () => {
  it("embeds the subset font into a raster copy and leaves the source string's text", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("fonts.googleapis.com")) {
        expect(url).toContain("family=Noto%20Sans%20JP")
        expect(url).toContain("text=")
        return new Response(
          "@font-face{font-family:'Noto Sans JP';font-weight:400;src:url(https://fonts.example/jp.woff2) format('woff2');}",
        )
      }
      expect(url).toBe("https://fonts.example/jp.woff2")
      return new Response(new Uint8Array([9, 8, 7]))
    }) as typeof fetch

    const inlined = await inlinePosterFont(svg, {
      fontFamily: "Noto Sans JP",
      characters: "京都京",
      fetchImpl,
    })

    expect(inlined).toContain("data:font/woff2;base64,")
    expect(inlined).toContain("font-family:'Noto Sans JP'")
    expect(inlined).toContain("<text>京都</text>")
    expect(svg).not.toContain("data:font/woff2")
  })

  it("returns null when the font stylesheet cannot be fetched", async () => {
    const fetchImpl = (async () => {
      throw new Error("offline")
    }) as typeof fetch

    await expect(
      inlinePosterFont(svg, {
        fontFamily: "Roboto",
        characters: "Paris",
        fetchImpl,
      }),
    ).resolves.toBeNull()
  })
})
