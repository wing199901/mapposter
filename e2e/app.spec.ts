import { expect, test } from "@playwright/test"

const mockGeocode = {
  latitude: 22.2644,
  longitude: 114.1912,
  displayName: "香港島 Hong Kong Island, 香港 Hong Kong, 中国",
  placeLocalName: "香港島",
  placeLatinName: "Hong Kong Island",
  countryLocalName: "香港",
  countryLatinName: "Hong Kong",
  countryCode: "hk",
  suggestedRadiusMeters: 12000,
  osmType: "relation",
  osmId: 22000550,
}

const mockBoundary = {
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [114.1, 22.2],
        [114.26, 22.2],
        [114.26, 22.29],
        [114.1, 22.29],
        [114.1, 22.2],
      ],
    ],
  },
}

async function mockGeocodeApi(page: import("@playwright/test").Page) {
  await page.route("**/api/geocode**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGeocode),
    })
  })
}

async function mockBoundaryApi(page: import("@playwright/test").Page) {
  await page.route("**/api/boundary**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockBoundary),
    })
  })
}

function encodeShareHash(payload: Record<string, unknown>): string {
  return Buffer.from(
    unescape(encodeURIComponent(JSON.stringify(payload))),
    "latin1",
  ).toString("base64")
}

test.describe("Map Poster Studio", () => {
  test("loads editor shell with live preview", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Map Poster Studio" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible()
    await expect(page.getByText("Drag to pan and scroll to zoom")).toBeVisible()
  })

  test("switches theme and updates share link hash", async ({ page }) => {
    await mockGeocodeApi(page)
    await page.goto("/")

    await page.getByRole("button", { name: "Noir" }).click()
    await expect(page.locator("button.border-primary", { hasText: "Noir" })).toBeVisible()

    await expect
      .poll(async () => page.evaluate(() => window.location.hash))
      .toMatch(/^#p=/)
  })

  test("applies export preset dimensions", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Export" }).click()
    await page.getByRole("button", { name: /Instagram Post/i }).click()

    await expect(page.getByLabel("Width (in)")).toHaveValue("3.6")
    await expect(page.getByLabel("Height (in)")).toHaveValue("3.6")
  })

  test("shows place lookup hint after Hong Kong Island geocode", async ({ page }) => {
    await mockGeocodeApi(page)
    await page.goto("/")

    await page.getByLabel("City").fill("Hong Kong Island")
    await page.getByLabel("Country").fill("Hong Kong")

    await expect(
      page.getByText(/Suggested map radius \d+ m from place size|Place found\. The preview updates live/i),
    ).toBeVisible({
      timeout: 15_000,
    })
  })

  test("layers tab toggles buildings visibility", async ({ page }) => {
    await mockGeocodeApi(page)
    await mockBoundaryApi(page)
    await page.goto("/")

    await page.getByRole("tab", { name: "Layers" }).click()
    await expect(page.getByLabel("Buildings")).not.toBeChecked()
    await page.getByLabel("Buildings").check()
    await expect(page.getByLabel("Buildings")).toBeChecked()
  })

  test("restores share-hash viewport without re-geocoding", async ({ page }) => {
    let geocodeCalls = 0
    await page.route("**/api/geocode**", async (route) => {
      geocodeCalls += 1
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockGeocode),
      })
    })
    await mockBoundaryApi(page)

    const hash = encodeShareHash({
      geocodeCity: "Hong Kong Island",
      geocodeCountry: "Hong Kong",
      latitude: 22.28,
      longitude: 114.16,
      radiusMeters: 4321,
      themeId: "terracotta",
      displayCity: "香港島",
      displayCountry: "香港",
      displayCityLatin: "Hong Kong Island",
      displayCountryLatin: "Hong Kong",
      displayScriptFamily: "hk",
      displayHasPlaceLocalName: true,
      fontFamily: "Noto Sans HK",
      centerLocked: true,
      widthInches: 12,
      heightInches: 16,
    })

    await page.goto(`/#p=${hash}`)
    await expect(page.getByText("4321 m", { exact: true })).toBeVisible()
    await expect(page.getByLabel("City", { exact: true })).toHaveValue("Hong Kong Island")
    await page.waitForTimeout(1200)
    expect(geocodeCalls).toBe(0)
    await expect(page.getByText("4321 m", { exact: true })).toBeVisible()
  })

  test("keeps share-hash radius when centerLocked is false", async ({ page }) => {
    let geocodeCalls = 0
    await page.route("**/api/geocode**", async (route) => {
      geocodeCalls += 1
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockGeocode),
      })
    })

    const hash = encodeShareHash({
      geocodeCity: "Hong Kong Island",
      geocodeCountry: "Hong Kong",
      latitude: 22.28,
      longitude: 114.16,
      radiusMeters: 4321,
      themeId: "terracotta",
      displayCity: "香港島",
      displayCountry: "香港",
      fontFamily: "Roboto",
      centerLocked: false,
      widthInches: 12,
      heightInches: 16,
    })

    await page.goto(`/#p=${hash}`)
    await expect(page.getByText("4321 m", { exact: true })).toBeVisible()
    await page.waitForTimeout(1200)
    expect(geocodeCalls).toBe(0)
    await expect(page.getByText("4321 m", { exact: true })).toBeVisible()
  })

  test("looks up place after the user edits city on a restored share link", async ({ page }) => {
    await mockGeocodeApi(page)
    await mockBoundaryApi(page)

    const hash = encodeShareHash({
      geocodeCity: "Hong Kong Island",
      geocodeCountry: "Hong Kong",
      latitude: 22.28,
      longitude: 114.16,
      radiusMeters: 4321,
      themeId: "terracotta",
      displayCity: "香港島",
      displayCountry: "香港",
      fontFamily: "Noto Sans HK",
      centerLocked: true,
      widthInches: 12,
      heightInches: 16,
    })

    await page.goto(`/#p=${hash}`)
    await expect(page.getByText("4321 m", { exact: true })).toBeVisible()

    await page.getByLabel("City", { exact: true }).fill("Kowloon")
    await expect(
      page.getByText(/Suggested map radius \d+ m from place size|Place found\. The preview updates live/i),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText("12000 m", { exact: true })).toBeVisible()
  })
})
