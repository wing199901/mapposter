# Map Poster — Domain Glossary

## Poster

A finished exportable image (PNG at 300 DPI) combining map layers and typography for a chosen city viewport.

## Theme

A JSON color palette controlling background, roads by OSM highway class, water, parks, buildings, text, and gradient fade colors.

## Viewport

The center latitude/longitude plus radius in meters that defines which map area is shown in preview and export.

## Display labels

User-facing text on the poster. For a CJK poster this is two **name pairs** (place line, then country line). For a Latin-only poster this remains city then country, each a single script. Never copied from the geocode query.

## Local name

The place or country name in the local CJK script, taken from OSM Nominatim `namedetails` (`name:zh-Hant`, `name:zh`, `name:ja`, `name:ko`). Source of truth after geocode. The user can override it by hand.

## Latin name

The same place or country in Latin script from `namedetails` (`name:en`) or another romanized OSM name. Not the search box string. On the poster, Latin runs are uppercase with letter-spacing (including the small Latin side of a name pair).

## Name pair

Local name (larger) and Latin name (smaller) on the same line, local first. Example: 京都 with K Y O T O beside it, smaller. CJK is never letter-spaced.

## Display pair layout

When a local name exists, the poster has two lines:

1. Place name pair
2. Country name pair

When Nominatim has no local CJK name, keep the existing Latin-only city / country layout. Do not invent a CJK country pair for a Latin-only city. Manual label edits change only the text strings; they do not flip pair layout or script family.

## Script family

Which CJK writing system the local name uses: Traditional Chinese (Hong Kong or Taiwan), Simplified Chinese, Japanese, or Korean. All four are in v1. Selects exactly one Noto family to lazy-load.

## Geocode query

The city and country strings sent to Nominatim to resolve coordinates. May be CJK or Latin. Used only to hit the correct OSM place, never as poster lettering.

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
