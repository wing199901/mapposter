import type { Map } from "maplibre-gl"

export function waitForMapIdle(map: Map, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (map.loaded() && !map.isMoving()) {
      resolve()
      return
    }

    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error("Map tiles did not finish loading in time"))
    }, timeoutMs)

    const onIdle = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      window.clearTimeout(timer)
      map.off("idle", onIdle)
    }

    map.once("idle", onIdle)
  })
}
