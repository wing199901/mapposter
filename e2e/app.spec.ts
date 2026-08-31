import { expect, test } from "@playwright/test"

const mockGeocode = {
  latitude: 48.8566,
  longitude: 2.3522,
  displayName: "Paris, France",
}

const mockOverpass = {
  elements: [
    {
      type: "way",
      id: 101,
      tags: { highway: "primary" },
      geometry: [
        { lat: 48.855, lon: 2.35 },
        { lat: 48.858, lon: 2.355 },
      ],
    },
    {
      type: "way",
      id: 102,
      tags: { natural: "water" },
      geometry: [
        { lat: 48.854, lon: 2.349 },
        { lat: 48.856, lon: 2.351 },
        { lat: 48.855, lon: 2.353 },
        { lat: 48.854, lon: 2.349 },
      ],
    },
    {
      type: "way",
      id: 103,
      tags: { leisure: "park" },
      geometry: [
        { lat: 48.857, lon: 2.351 },
        { lat: 48.859, lon: 2.354 },
        { lat: 48.858, lon: 2.356 },
        { lat: 48.857, lon: 2.351 },
      ],
    },
  ],
}

async function mockPosterApis(page: import("@playwright/test").Page) {
  await page.route("**/api/geocode**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGeocode),
    })
  })

  await page.route("**/api/overpass**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockOverpass),
    })
  })
}

test.describe("Map Poster Studio", () => {
  test("loads editor shell", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Map Poster Studio" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Generate poster" })).toBeVisible()
    await expect(page.getByText("Generate a poster to see the live preview.")).toBeVisible()
  })

  test("generates a mocked poster preview", async ({ page }) => {
    await mockPosterApis(page)
    await page.goto("/")

    await page.getByLabel("City").fill("Paris")
    await page.getByLabel("Country").fill("France")
    await page.getByRole("button", { name: "Generate poster" }).click()

    await expect(page.getByText("Poster ready")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("img", { name: /Paris map poster preview/i })).toBeVisible()
  })

  test("switches theme and updates share link hash", async ({ page }) => {
    await mockPosterApis(page)
    await page.goto("/")

    await page.getByRole("button", { name: "Noir" }).click()
    await expect(page.locator("button.border-primary", { hasText: "Noir" })).toBeVisible()

    const hash = await page.evaluate(() => window.location.hash)
    expect(hash).toMatch(/^#p=/)
  })

  test("applies export preset dimensions", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("tab", { name: "Export" }).click()
    await page.getByRole("button", { name: /Instagram Post/i }).click()

    await expect(page.getByLabel("Width (in)")).toHaveValue("3.6")
    await expect(page.getByLabel("Height (in)")).toHaveValue("3.6")
  })
})
