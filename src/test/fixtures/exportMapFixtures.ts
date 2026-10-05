import type { Feature, FeatureCollection, Geometry } from "geojson"

/** Minimal GeoJSON fixtures for Map-stub SVG export tests (no network). */

export const FIXTURE_WATER_POLYGON: Feature<Geometry> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [114.15, 22.28],
        [114.18, 22.28],
        [114.18, 22.3],
        [114.15, 22.3],
        [114.15, 22.28],
      ],
    ],
  },
}

export const FIXTURE_PARK_POLYGON: Feature<Geometry> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [114.16, 22.285],
        [114.165, 22.285],
        [114.165, 22.29],
        [114.16, 22.29],
        [114.16, 22.285],
      ],
    ],
  },
}

export const FIXTURE_BUILDING_POLYGON: Feature<Geometry> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [114.162, 22.287],
        [114.163, 22.287],
        [114.163, 22.288],
        [114.162, 22.288],
        [114.162, 22.287],
      ],
    ],
  },
}

export const FIXTURE_MOTORWAY_LINE: Feature<Geometry> = {
  type: "Feature",
  properties: { class: "motorway" },
  geometry: {
    type: "LineString",
    coordinates: [
      [114.15, 22.29],
      [114.17, 22.29],
      [114.18, 22.295],
    ],
  },
}

export const FIXTURE_RESIDENTIAL_LINE: Feature<Geometry> = {
  type: "Feature",
  properties: { class: "minor" },
  geometry: {
    type: "LineString",
    coordinates: [
      [114.16, 22.28],
      [114.165, 22.282],
    ],
  },
}

export const FIXTURE_FERRY_LINE: Feature<Geometry> = {
  type: "Feature",
  properties: { class: "ferry" },
  geometry: {
    type: "LineString",
    coordinates: [
      [114.155, 22.275],
      [114.175, 22.278],
    ],
  },
}

export const FIXTURE_WATERWAY_LINE: Feature<Geometry> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [114.158, 22.28],
      [114.158, 22.295],
    ],
  },
}

/** Layer id → features returned by the Map stub's queryRenderedFeatures. */
export const FIXTURE_LAYER_FEATURES: Record<string, FeatureCollection> = {
  water: { type: "FeatureCollection", features: [FIXTURE_WATER_POLYGON] },
  "water-detail": { type: "FeatureCollection", features: [FIXTURE_WATER_POLYGON] },
  parks: { type: "FeatureCollection", features: [FIXTURE_PARK_POLYGON] },
  "parks-landcover": { type: "FeatureCollection", features: [] },
  buildings: { type: "FeatureCollection", features: [FIXTURE_BUILDING_POLYGON] },
  waterway: { type: "FeatureCollection", features: [FIXTURE_WATERWAY_LINE] },
  "road-residential": { type: "FeatureCollection", features: [FIXTURE_RESIDENTIAL_LINE] },
  "road-tertiary": { type: "FeatureCollection", features: [] },
  "road-secondary": { type: "FeatureCollection", features: [] },
  "road-primary": { type: "FeatureCollection", features: [] },
  "road-motorway": { type: "FeatureCollection", features: [FIXTURE_MOTORWAY_LINE] },
  "road-bridge-deck": { type: "FeatureCollection", features: [] },
  "road-default": { type: "FeatureCollection", features: [] },
  "road-rail": { type: "FeatureCollection", features: [] },
  "road-ferry": { type: "FeatureCollection", features: [FIXTURE_FERRY_LINE] },
}

/**
 * Thin MapLibre Map stub for `buildPosterSvg` unit tests.
 * Identity lon/lat → screen projection (lon*1000, lat*1000) — deterministic paths only.
 */
export function createExportMapStub(options?: {
  width?: number
  height?: number
  featuresByLayer?: Record<string, FeatureCollection>
}): {
  getContainer: () => { clientWidth: number; clientHeight: number }
  getCanvas: () => { clientWidth: number; clientHeight: number }
  project: (coord: [number, number] | number[]) => { x: number; y: number }
  queryRenderedFeatures: (
    _geometry: unknown,
    opts?: { layers?: string[] },
  ) => Feature[]
} {
  const width = options?.width ?? 600
  const height = options?.height ?? 800
  const featuresByLayer = options?.featuresByLayer ?? FIXTURE_LAYER_FEATURES

  return {
    getContainer: () => ({ clientWidth: width, clientHeight: height }),
    getCanvas: () => ({ clientWidth: width, clientHeight: height }),
    project: (coord) => ({
      x: (coord[0] as number) * 1000,
      y: (coord[1] as number) * 1000,
    }),
    queryRenderedFeatures: (_geometry, opts) => {
      const layerId = opts?.layers?.[0]
      if (!layerId) {
        return []
      }
      return featuresByLayer[layerId]?.features ?? []
    },
  }
}
