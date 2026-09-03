import type { ScriptFamily } from "@/lib/types"

const NOTO_BY_SCRIPT: Record<ScriptFamily, string> = {
  hk: "Noto Sans HK",
  tc: "Noto Sans TC",
  sc: "Noto Sans SC",
  jp: "Noto Sans JP",
  kr: "Noto Sans KR",
}

const loadedScripts = new Set<ScriptFamily>()

export function notoFamilyForScript(scriptFamily: ScriptFamily): string {
  return NOTO_BY_SCRIPT[scriptFamily]
}

function unloadOtherNotoFamilies(keep: ScriptFamily): void {
  if (typeof document === "undefined") {
    return
  }

  for (const link of Array.from(
    document.head.querySelectorAll<HTMLLinkElement>("link[data-noto-script-family]"),
  )) {
    const family = link.dataset.notoScriptFamily as ScriptFamily | undefined
    if (family && family !== keep) {
      link.remove()
      loadedScripts.delete(family)
    }
  }
}

export function ensureNotoFamilyLoaded(scriptFamily: ScriptFamily | undefined): void {
  if (!scriptFamily || typeof document === "undefined") {
    return
  }

  unloadOtherNotoFamilies(scriptFamily)

  if (loadedScripts.has(scriptFamily)) {
    return
  }

  const family = notoFamilyForScript(scriptFamily)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;700&display=swap`
  link.dataset.notoScriptFamily = scriptFamily
  document.head.appendChild(link)
  loadedScripts.add(scriptFamily)
}

export function posterFontStack(fontFamily: string, scriptFamily: ScriptFamily | undefined): string {
  const baseFamily = scriptFamily ? notoFamilyForScript(scriptFamily) : fontFamily
  return `${baseFamily}, Roboto, system-ui, sans-serif`
}
