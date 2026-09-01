import type { Map } from "maplibre-gl"

import { boundaryToFeatureCollection } from "./buildInvertedMask"

export const BOUNDARY_MASK_SOURCE_ID = "boundary-mask-source"
export const BOUNDARY_MASK_LAYER_ID = "boundary-mask"

/** @deprecated Preview uses CSS clip-path; export uses SVG clipPath. */
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

  // Preview blur is handled by BoundaryBlurOverlay (HTML backdrop-filter).
  void options
}

export function boundaryMaskGeoJson(
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): GeoJSON.FeatureCollection {
  return boundaryToFeatureCollection(boundary)
}
