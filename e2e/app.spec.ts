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
})
