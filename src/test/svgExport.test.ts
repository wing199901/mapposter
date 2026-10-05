import { describe, expect, it } from "vitest"

import { buildPosterSvg, posterLayoutFromInches } from "@/features/export/svgExport"
import { buildPosterLettering } from "@/features/tiles/posterLettering"
import {
  BUILDINGS_FILL_OPACITY,
  LAYER_STROKE,
  POSTER_STROKE_LINECAP,
  POSTER_STROKE_LINEJOIN,
  exportStrokeWidthForLayer,
  themeColorForLayer,
} from "@/features/tiles/themePaint"
import { LATIN_TRACKING_EM } from "@/lib/scriptDetection"
import type { DisplayLabels, PosterLayerVisibility, PosterTheme } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY, DPI } from "@/lib/types"

import { createExportMapStub } from "./fixtures/exportMapFixtures"

const theme: PosterTheme = {
  name: "fixture",
  description: "fixture",
  bg: "#111111",
  text: "#eeeeee",
  gradient_color: "#333333",
  water: "#0000ff",
  parks: "#00aa00",
  buildings: "#888888",
  road_motorway: "#ff0000",
  road_primary: "#ff8800",
  road_secondary: "#cccc00",
  road_tertiary: "#00cccc",
  road_residential: "#cc00cc",
  road_default: "#ffffff",
}

const viewport = { latitude: 22.3193, longitude: 114.1694, radiusMeters: 12000 }

const hkDisplay: DisplayLabels = {
  city: "香港",
  cityLatin: "Hong Kong",
  country: "中華人民共和國",
  countryLatin: "China",
  hasPlaceLocalName: true,
  scriptFamily: "hk",
}

const parisDisplay: DisplayLabels = {
  city: "Paris",
  country: "France",
}

function visibility(overrides: Partial<PosterLayerVisibility> = {}): PosterLayerVisibility {
  return { ...DEFAULT_LAYER_VISIBILITY, buildings: true, shipRoutes: true, ...overrides }
}

describe("posterLayoutFromInches", () => {
  it("converts inches to export pixels at 300 DPI with full map band", () => {
    const layout = posterLayoutFromInches(12, 16)
    expect(DPI).toBe(300)
    expect(layout.widthPx).toBe(3600)
    expect(layout.heightPx).toBe(4800)
    expect(layout.mapHeightPx).toBe(4800)
  })
})

describe("buildPosterSvg Map stub fixtures", () => {
  const layout = posterLayoutFromInches(4, 5)
  const map = createExportMapStub({
    width: layout.widthPx,
    height: layout.mapHeightPx,
  }) as Parameters<typeof buildPosterSvg>[0]

  it("emits SVG root size from layout without live tiles", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: hkDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      hkDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility() },
      lettering,
    )

    expect(svg).toContain(`width="${layout.widthPx}"`)
    expect(svg).toContain(`height="${layout.heightPx}"`)
    expect(svg).toContain(`fill="${theme.bg}"`)
    expect(svg).toContain("© OpenStreetMap contributors")
  })

  it("includes or omits buildings and ferry paths from visibility", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: parisDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })

    const withLayers = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility({ buildings: true, shipRoutes: true }) },
      lettering,
    )
    const withoutLayers = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility({ buildings: false, shipRoutes: false }) },
      lettering,
    )

    expect(withLayers).toContain('id="buildings"')
    expect(withLayers).toContain('id="road-ferry"')
    expect(withoutLayers).not.toContain('id="buildings"')
    expect(withoutLayers).not.toContain('id="road-ferry"')
  })

  it("uses theme stroke colors and Poster stroke weights with butt/miter", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: parisDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility() },
      lettering,
    )

    expect(svg).toContain(`stroke="${themeColorForLayer(theme, "road-motorway")}"`)
    expect(svg).toContain(`stroke="${themeColorForLayer(theme, "road-residential")}"`)
    expect(svg).toContain(`stroke-linecap="${POSTER_STROKE_LINECAP}"`)
    expect(svg).toContain(`stroke-linejoin="${POSTER_STROKE_LINEJOIN}"`)

    const motorwayStroke = exportStrokeWidthForLayer("road-motorway")
    expect(motorwayStroke).toBe(LAYER_STROKE["road-motorway"].poster)
    // scaleX = 1 when stub size matches layout; stroke-width equals poster weight
    expect(svg).toContain(`stroke-width="${motorwayStroke.toFixed(3)}"`)
  })

  it("applies buildings fill opacity from the shared constant", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: parisDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility({ buildings: true }) },
      lettering,
    )
    expect(svg).toContain(`fill="${theme.buildings}"`)
    expect(svg).toContain(`fill-opacity="${BUILDINGS_FILL_OPACITY}"`)
  })

  it("renders HK pair lettering without Latin letter-spacing on pair lines", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: hkDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    expect(lettering.cityApplyLatinTracking).toBe(false)
    expect(lettering.countryApplyLatinTracking).toBe(false)
    expect(lettering.city.latin).toContain("H")
    expect(lettering.city.localFontSize).toBe(lettering.city.latinFontSize)

    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      hkDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility(), omitTypography: false },
      lettering,
    )
    expect(svg).toContain("香港")
    expect(svg).toContain("H O N G")
    expect(svg).not.toMatch(/letter-spacing=/)
    expect(svg).toContain('fill-opacity="0.8"')
  })

  it("applies Latin tracking and spaced country for Paris Latin-only labels", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: parisDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    expect(lettering.cityApplyLatinTracking).toBe(true)
    expect(lettering.countryApplyLatinTracking).toBe(true)
    expect(lettering.city.local).toBe("P A R I S")
    expect(lettering.country.local).toBe("F R A N C E")

    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      { layerVisibility: visibility() },
      lettering,
    )
    expect(svg).toContain(`letter-spacing="${LATIN_TRACKING_EM}em"`)
    expect(svg).toContain("P A R I S")
    expect(svg).toContain("F R A N C E")
  })

  it("draws a solid boundary mask when enabled", () => {
    const lettering = buildPosterLettering({
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      display: parisDisplay,
      fontFamily: "Roboto",
      viewport,
      measure: () => 40,
    })
    const boundary = {
      type: "Polygon" as const,
      coordinates: [
        [
          [114.16, 22.28],
          [114.17, 22.28],
          [114.17, 22.29],
          [114.16, 22.29],
          [114.16, 22.28],
        ],
      ],
    }
    const svg = buildPosterSvg(
      map,
      theme,
      viewport,
      parisDisplay,
      "Roboto",
      layout,
      {
        layerVisibility: visibility(),
        boundaryMaskEnabled: true,
        boundaryGeometry: boundary,
      },
      lettering,
    )
    expect(svg).toContain('id="boundary-mask"')
    expect(svg).toContain(`fill="${theme.bg}"`)
    expect(svg).toContain('fill-rule="evenodd"')
  })
})
