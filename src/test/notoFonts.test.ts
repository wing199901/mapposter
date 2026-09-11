import { afterEach, describe, expect, it } from "vitest"

import { ensureNotoFamilyLoaded } from "@/lib/notoFonts"

function notoLinks(): HTMLLinkElement[] {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>("link[data-noto-script-family]"),
  )
}

describe("ensureNotoFamilyLoaded", () => {
  afterEach(() => {
    ensureNotoFamilyLoaded(undefined)
  })

  it("lazy-loads exactly one regional Noto family for CJK", () => {
    ensureNotoFamilyLoaded("hk")

    expect(notoLinks()).toHaveLength(1)
    expect(notoLinks()[0]?.dataset.notoScriptFamily).toBe("hk")
    expect(notoLinks()[0]?.href).toContain("Noto%20Sans%20HK")
  })

  it("unloads the previous family when switching CJK scripts", () => {
    ensureNotoFamilyLoaded("hk")
    ensureNotoFamilyLoaded("jp")

    expect(notoLinks()).toHaveLength(1)
    expect(notoLinks()[0]?.dataset.notoScriptFamily).toBe("jp")
  })

  it("unloads prior regional stylesheets on the Latin-only path", () => {
    ensureNotoFamilyLoaded("tc")
    expect(notoLinks()).toHaveLength(1)

    ensureNotoFamilyLoaded(undefined)

    expect(notoLinks()).toHaveLength(0)
  })

  it("reloads a CJK family after switching to Latin-only", () => {
    ensureNotoFamilyLoaded("sc")
    ensureNotoFamilyLoaded(undefined)
    expect(notoLinks()).toHaveLength(0)

    ensureNotoFamilyLoaded("sc")

    expect(notoLinks()).toHaveLength(1)
    expect(notoLinks()[0]?.dataset.notoScriptFamily).toBe("sc")
  })
})
