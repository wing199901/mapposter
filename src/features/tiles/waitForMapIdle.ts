import type { Map } from "maplibre-gl"

export function waitForMapIdle(map: Map, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error("Map tiles did not finish loading in time"))
    }, timeoutMs)

    const tryFinish = () => {
      if (map.loaded() && !map.isMoving() && map.areTilesLoaded()) {
        cleanup()
        resolve()
        return true
      }
      return false
    }

    const onIdle = () => {
      if (!tryFinish()) {
        map.once("idle", onIdle)
      }
    }

    const cleanup = () => {
      window.clearTimeout(timer)
      map.off("idle", onIdle)
    }

    map.once("idle", onIdle)
    map.triggerRepaint()
  })
}
