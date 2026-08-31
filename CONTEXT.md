# Map Poster — Domain Glossary

## Poster

A finished exportable image (PNG at 300 DPI) combining map layers and typography for a chosen city viewport.

## Theme

A JSON color palette controlling background, roads by OSM highway class, water, parks, text, and gradient fade colors.

## Viewport

The center latitude/longitude plus radius in meters that defines which OpenStreetMap features are fetched and drawn.

## Display labels

User-facing city and country text shown on the poster. May differ from the geocode query (for example 東京 instead of Tokyo).

## Geocode query

The city and country strings sent to Nominatim to resolve coordinates.

## Geocode cache

Resolved coordinates keyed by normalized city and country strings, stored in the browser to skip repeat Nominatim lookups.

## Preset

A named export size pairing width and height in inches at 300 DPI (for example A4, Instagram Post).

## Generation job

One fetch → render → export cycle. Preview rendering runs in a Web Worker when supported; export rendering stays on the main thread.

## Preview render

A low-resolution client redraw of the current poster using cached OpenStreetMap features, without refetching geocode or map data.
