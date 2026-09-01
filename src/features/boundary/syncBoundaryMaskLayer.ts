import type { Map } from "maplibre-gl"

import { boundaryToFeatureCollection } from "./buildInvertedMask"

export const BOUNDARY_MASK_SOURCE_ID = "boundary-mask-source"
export const BOUNDARY_MASK_LAYER_ID = "boundary-mask"

export function syncBoundaryMaskLayer(
  map: Map,
  options: {
    enabled: boolean
    backgroundColor: string
    boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  },
): void {
  if (map.getLayer(BOUNDARY_MASK_LAYER_ID)) {
    map.removeLayer(BOUNDARY_MASK_LAYER_ID)
  }
  if (map.getSource(BOUNDARY_MASK_SOURCE_ID)) {
    map.removeSource(BOUNDARY_MASK_SOURCE_ID)
  }

  if (!options.enabled || !options.boundary) {
    return
  }

  map.addSource(BOUNDARY_MASK_SOURCE_ID, {
    type: "geojson",
    data: boundaryToFeatureCollection(options.boundary),
  })

  map.addLayer({
    id: BOUNDARY_MASK_LAYER_ID,
    type: "fill",
    source: BOUNDARY_MASK_SOURCE_ID,
    paint: {
      "fill-color": options.backgroundColor,
      "fill-opacity": 1,
    },
  })
}
