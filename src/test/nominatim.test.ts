import { describe, expect, it } from "vitest"

import {
  buildGeocodeSearchAttempts,
  buildNominatimSearchUrl,
  buildNominatimUserAgent,
  centerFromBoundingBox,
  NOMINATIM_APP_URL,
  parseNominatimNameDetails,
  suggestedRadiusFromBoundingBox,
} from "../../shared/nominatim"

describe("nominatim request helpers", () => {
  it("builds a policy-compliant user agent", () => {
    expect(buildNominatimUserAgent("ops@example.com")).toBe(
      `mapposter-web/1.0 (+${NOMINATIM_APP_URL}; mailto:ops@example.com)`,
    )
  })

  it("includes the email query parameter", () => {
    const url = new URL(buildNominatimSearchUrl({ q: "Paris, France" }, "ops@example.com"))
    expect(url.searchParams.get("q")).toBe("Paris, France")
    expect(url.searchParams.get("email")).toBe("ops@example.com")
    expect(url.searchParams.get("format")).toBe("json")
    expect(url.searchParams.get("namedetails")).toBe("1")
    expect(url.searchParams.get("addressdetails")).toBe("1")
    expect(url.searchParams.get("polygon_geojson")).toBeNull()
  })

  it("parses Kyoto namedetails and address into local/latin place and country names", () => {
    const parsed = parseNominatimNameDetails({
      display_name: "Kyoto, Kyoto, Japan",
      namedetails: {
        "name:zh": "京都",
        "name:ja": "京都",
        "name:en": "Kyoto",
      },
      address: {
        country: "日本",
        country_code: "jp",
      },
    })
    expect(parsed).toEqual({
      placeLocalName: "京都",
      placeLatinName: "Kyoto",
      countryLocalName: "日本",
      countryLatinName: "Japan",
      countryCode: "jp",
    })
  })

  it("includes zh-Hans local names for simplified Chinese places", () => {
    const parsed = parseNominatimNameDetails({
      display_name: "Guangzhou, Guangdong, China",
      namedetails: {
        "name:zh-Hans": "广州",
        "name:en": "Guangzhou",
      },
      address: {
        country: "中国",
        country_code: "cn",
      },
    })
    expect(parsed.placeLocalName).toBe("广州")
  })

  it("does not invent country local when only latin country is available", () => {
    const parsed = parseNominatimNameDetails({
      display_name: "Kyoto, Kyoto, Japan",
      namedetails: {
        "name:ja": "京都",
        "name:en": "Kyoto",
      },
      address: {
        country: "Japan",
        country_code: "jp",
      },
    })
    expect(parsed).toMatchObject({
      placeLocalName: "京都",
      countryLocalName: undefined,
      countryLatinName: "Japan",
      countryCode: "jp",
    })
  })

  it("keeps Paris Latin-only when no CJK namedetails exists", () => {
    const parsed = parseNominatimNameDetails({
      display_name: "Paris, Île-de-France, France",
      namedetails: {
        "name:en": "Paris",
      },
      address: {
        "country:en": "France",
        country: "France",
      },
    })
    expect(parsed).toEqual({
      placeLocalName: undefined,
      placeLatinName: "Paris",
      countryLocalName: undefined,
      countryLatinName: "France",
      countryCode: undefined,
    })
  })

  it("prefers HK-scoped geocode queries for Hong Kong places", () => {
    const attempts = buildGeocodeSearchAttempts("Hong Kong Island", "Hong Kong")
    expect(attempts[0]).toEqual({
      q: "Hong Kong Island, Hong Kong",
      countrycodes: "hk",
    })
    expect(attempts.some((attempt) => attempt.q === "Hong Kong Island" && attempt.countrycodes === "hk")).toBe(
      true,
    )
  })

  it("centers on the geometric midpoint of a bounding box", () => {
    expect(centerFromBoundingBox([22.15, 22.55, 113.8, 114.4])).toEqual({
      latitude: 22.35,
      longitude: 114.1,
    })
  })

  it("suggests a clamped radius from a place bounding box", () => {
    // Rough Hong Kong–scale bbox should push toward a large metro / SAR radius.
    const radius = suggestedRadiusFromBoundingBox(
      [22.15, 22.56, 113.83, 114.41],
      22.3,
    )
    expect(radius).toBeGreaterThanOrEqual(10000)
    expect(radius).toBeLessThanOrEqual(50000)
  })

  it("clamps tiny places up to the minimum radius", () => {
    const radius = suggestedRadiusFromBoundingBox(
      [48.85, 48.86, 2.34, 2.36],
      48.8566,
    )
    expect(radius).toBe(4000)
  })
})
