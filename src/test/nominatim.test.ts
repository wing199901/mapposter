import { describe, expect, it } from "vitest"

import {
  buildGeocodeSearchAttempts,
  buildNominatimSearchUrl,
  buildNominatimUserAgent,
  centerFromBoundingBox,
  NOMINATIM_APP_URL,
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
    expect(url.searchParams.get("polygon_geojson")).toBeNull()
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
