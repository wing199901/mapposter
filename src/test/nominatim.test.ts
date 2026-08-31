import { describe, expect, it } from "vitest"

import {
  buildNominatimSearchUrl,
  buildNominatimUserAgent,
  NOMINATIM_APP_URL,
} from "../../shared/nominatim"

describe("nominatim request helpers", () => {
  it("builds a policy-compliant user agent", () => {
    expect(buildNominatimUserAgent("ops@example.com")).toBe(
      `mapposter-web/1.0 (+${NOMINATIM_APP_URL}; mailto:ops@example.com)`,
    )
  })

  it("includes the email query parameter", () => {
    const url = new URL(buildNominatimSearchUrl("Paris", "France", "ops@example.com"))
    expect(url.searchParams.get("q")).toBe("Paris, France")
    expect(url.searchParams.get("email")).toBe("ops@example.com")
    expect(url.searchParams.get("format")).toBe("json")
  })
})
