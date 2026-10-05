# The SVG is the Poster

The Poster is drawn once as SVG. The PNG is that drawing rasterized at 300 DPI. A canvas snapshot of the live map matches the preview more closely, and the code did that for a while, but it meant two drawings to maintain. Preview stays MapLibre. Downloads do not.

The map is resized to the export pixel size before the SVG is traced, up to the existing 6000px cap, so the SVG and the PNG share one geometry. If that resize cannot be done, the Export job fails and writes neither file. The downloaded SVG keeps typeface names only. The copy that is rasterized inlines the single family already chosen for the poster, subset to the characters on that poster, because an SVG loaded as an image cannot see the page's stylesheets. If that subset cannot be inlined, the PNG is the SVG map with its text omitted, and Display labels are drawn with canvas from the same fitted layout. The downloaded SVG is unchanged.

Closable Preview↔Poster paint/typography deltas (shared stroke weight table, SVG cap/join aligned to MapLibre, buildings opacity, Latin tracking, coordinates opacity) are closed in product code. Intentional gaps remain: GL antialiasing, and Preview road width still zoom-interpolates while the Poster uses fixed stroke weights.

## Status

Accepted

## Considered options

1. **One SVG drawing, PNG rasterized from it (chosen).** Preview can differ in antialiasing and zoom-dependent road width.
2. **Canvas PNG plus vector SVG.** PNG matches the preview. Two map drawings.
3. **Keep both paths and only hide them behind one module.** The ADR would keep disagreeing with the code.
