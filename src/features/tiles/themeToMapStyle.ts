import type { StyleSpecification } from "maplibre-gl"

import type { PosterLayerVisibility, PosterTheme } from "@/lib/types"
import { DEFAULT_LAYER_VISIBILITY } from "@/lib/types"

import { OPENFREEMAP_GLYPHS, OPENFREEMAP_TILEJSON } from "./constants"

export interface PosterMapStyleOptions {
  layerVisibility?: PosterLayerVisibility
}

type LineLayer = Extract<StyleSpecification["layers"][number], { type: "line" }>
type FillLayer = Extract<StyleSpecification["layers"][number], { type: "fill" }>

/** Surface roads only — skip bridge/tunnel duplicates from OpenMapTiles. */
const SURFACE_ROAD_FILTER = [
  "match",
  ["get", "brunnel"],
  ["bridge", "tunnel"],
  false,
  true,
] as NonNullable<LineLayer["filter"]>

function withSurfaceFilter(filter: LineLayer["filter"]): LineLayer["filter"] {
  if (!filter) {
    return ["all", SURFACE_ROAD_FILTER] as LineLayer["filter"]
  }
  if (Array.isArray(filter) && filter[0] === "all") {
    return ["all", SURFACE_ROAD_FILTER, ...filter.slice(1)] as LineLayer["filter"]
  }
  return ["all", SURFACE_ROAD_FILTER, filter] as LineLayer["filter"]
}

function roadLayer(
  id: string,
  color: string,
  filter: LineLayer["filter"],
  width: number,
): LineLayer {
  return {
    id,
    type: "line",
    source: "openmaptiles",
    "source-layer": "transportation",
    filter: withSurfaceFilter(filter),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": color,
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        width * 0.4,
        13,
        width * 0.8,
        16,
        width * 1.4,
      ],
    },
  }
}

const ROAD_DEFAULT_FILTER = [
  "all",
  ["has", "class"],
  ["!=", ["get", "class"], "ferry"],
  ["!=", ["get", "class"], "rail"],
  ["!=", ["get", "class"], "transit"],
] as LineLayer["filter"]

function resolveVisibility(
  layerVisibility: PosterLayerVisibility = DEFAULT_LAYER_VISIBILITY,
): PosterLayerVisibility {
  return { ...DEFAULT_LAYER_VISIBILITY, ...layerVisibility }
}

export function mapFeatureLayerIds(
  options: PosterMapStyleOptions = {},
): string[] {
  const v = resolveVisibility(options.layerVisibility)
  const layers: string[] = []

  if (v.water) layers.push("water")
  if (v.waterway) layers.push("waterway")
  if (v.parks) {
    layers.push("parks", "parks-landcover")
  }
  if (v.buildings) layers.push("buildings")
  if (v.roadResidential) layers.push("road-residential")
  if (v.roadTertiary) layers.push("road-tertiary")
  if (v.roadSecondary) layers.push("road-secondary")
  if (v.roadPrimary) layers.push("road-primary")
  if (v.roadMotorway) layers.push("road-motorway")
  if (v.roadDefault) layers.push("road-default")
  if (v.rail) layers.push("road-rail")
  if (v.shipRoutes) layers.push("road-ferry")

  return layers
}

export function themeToMapStyle(
  theme: PosterTheme,
  options: PosterMapStyleOptions = {},
): StyleSpecification {
  const v = resolveVisibility(options.layerVisibility)

  const layers: StyleSpecification["layers"] = [
    {
      id: "background",
      type: "background",
      paint: { "background-color": theme.bg },
    },
  ]

  if (v.water) {
    layers.push({
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: { "fill-color": theme.water },
    })
  }

  if (v.waterway) {
    layers.push({
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: {
        "line-color": theme.water,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 1.5],
      },
    })
  }

  if (v.parks) {
    layers.push(
      {
        id: "parks",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        paint: { "fill-color": theme.parks },
      },
      {
        id: "parks-landcover",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["grass", "wood", "forest"], true, false],
        paint: { "fill-color": theme.parks },
      },
    )
  }

  if (v.buildings) {
    layers.push({
      id: "buildings",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      paint: { "fill-color": theme.buildings, "fill-opacity": 0.85 },
    } satisfies FillLayer)
  }

  if (v.roadResidential) {
    layers.push(
      roadLayer(
        "road-residential",
        theme.road_residential,
        ["match", ["get", "class"], ["minor", "service", "track", "path"], true, false],
        0.6,
      ),
    )
  }
  if (v.roadTertiary) {
    layers.push(
      roadLayer("road-tertiary", theme.road_tertiary, ["==", ["get", "class"], "tertiary"], 1),
    )
  }
  if (v.roadSecondary) {
    layers.push(
      roadLayer(
        "road-secondary",
        theme.road_secondary,
        ["==", ["get", "class"], "secondary"],
        1.4,
      ),
    )
  }
  if (v.roadPrimary) {
    layers.push(
      roadLayer(
        "road-primary",
        theme.road_primary,
        ["match", ["get", "class"], ["primary", "trunk"], true, false],
        2,
      ),
    )
  }
  if (v.roadMotorway) {
    layers.push(
      roadLayer(
        "road-motorway",
        theme.road_motorway,
        ["all", ["==", ["get", "class"], "motorway"], ["!=", ["get", "ramp"], 1]],
        2.8,
      ),
    )
  }
  if (v.roadDefault) {
    layers.push(roadLayer("road-default", theme.road_default, ROAD_DEFAULT_FILTER, 0.8))
  }
  if (v.rail) {
    layers.push(
      roadLayer(
        "road-rail",
        theme.road_default,
        ["match", ["get", "class"], ["rail", "transit"], true, false],
        1.2,
      ),
    )
  }
  if (v.shipRoutes) {
    layers.push(roadLayer("road-ferry", theme.road_default, ["==", ["get", "class"], "ferry"], 1))
  }

  return {
    version: 8,
    glyphs: OPENFREEMAP_GLYPHS,
    sources: {
      openmaptiles: {
        type: "vector",
        url: OPENFREEMAP_TILEJSON,
      },
    },
    layers,
  }
}

/** @deprecated Use mapFeatureLayerIds() */
export const MAP_FEATURE_LAYER_IDS = mapFeatureLayerIds()
