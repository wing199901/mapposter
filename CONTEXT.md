# Map Poster — Domain Glossary

## Poster

A finished exportable image (PNG at 300 DPI) combining map layers and typography for a chosen city viewport.

## Theme

A JSON color palette controlling background, roads by OSM highway class, water, parks, buildings, text, and gradient fade colors.

## Viewport

The center latitude/longitude plus radius in meters that defines which map area is shown in preview and export.

## Display labels

User-facing city and country text shown on the poster. May differ from the geocode query (for example 東京 instead of Tokyo).

## Geocode query

The city and country strings sent to Nominatim to resolve coordinates.

## Geocode cache

Resolved coordinates keyed by normalized city and country strings, stored in the browser to skip repeat Nominatim lookups.

## Edge geocode cache

Cross-user geocode results cached at the proxy layer so repeat lookups can skip Nominatim without relying on a single browser session.

## Layer visibility

Per-layer on/off toggles for map features (water, waterways, parks, buildings, road classes, rail, ship routes). Serialized in share URLs via `PosterConfig.layerVisibility`.

## Boundary mask

An inverted place-admin polygon fill drawn in the poster background color above map layers. Hides features outside the geocoded place visually without stopping tile fetches.

## Place boundary

The administrative boundary polygon for the geocoded place, fetched from Nominatim via `/api/boundary` using `osmType` and `osmId` from geocode.

## Preset

A named export size pairing width and height in inches at 300 DPI (for example A4, Instagram Post).

## Export job

A single SVG/PNG or batch ZIP export cycle. Map must be idle before export starts.

## Preview render

Live MapLibre map in the preview panel; pan/zoom updates viewport without a Generate button.
