# Glossary

Ubiquitous language for Map Poster Studio. Prefer these terms in code comments, ADRs, and plans.

**Poster** — The downloaded drawing. Under ADR 0008 it is the SVG; the PNG is that SVG rasterized at 300 DPI. Not a canvas snapshot of the live map.

**Preview** — The live MapLibre GL map plus HTML lettering overlays in the editor. Not the Poster.

**Closable delta** — A Preview↔Poster paint or typography difference that can be removed without abandoning SVG-as-Poster (shared stroke bases, cap/join, opacities, Latin tracking).

**Intentional gap** — A Preview↔Poster difference ADR 0008 accepts: GL antialiasing; zoom-dependent Preview road width vs fixed Poster strokes.

**Poster stroke weight** — Canonical per-layer thickness for the Poster (export). Preview may zoom-interpolate around related bases from the same table (`LAYER_STROKE` in `themePaint.ts`).

**Display pair** — Local CJK name + optional Latin name on one lettering line at the same font size, Latin lighter weight (ADR 0005). Gated by `hasPlaceLocalName`.

**Place line / Country line** — Primary (city/place) and secondary (country) lettering rows. Country is subordinate hierarchy, not a second hero.

**Lettering model** — The shared `PosterLettering` from `buildPosterLettering` — single source for Preview HTML, SVG `<text>`, and PNG canvas fallback.

**Export fixture** — Deterministic input (theme, visibility, GeoJSON, stub map, lettering) that asserts Poster SVG / style structure without live tiles or Nominatim.
