# Design direction

Map Poster Studio is a map-first poster editor — the live poster is the main character:

- **Poster-dominant shell**: first viewport is near full-bleed preview (soft muted stage), not a permanent controls dashboard
- **Controls behind Menu**: Location and Style (Themes, Layers, Labels) stay hidden until a header **Menu** button opens a Sheet (right drawer on wide viewports, bottom sheet on narrow)
- Export (size presets, custom inches, PNG / SVG / all-themes ZIP) stays visible as a compact Preview-toolbar popover; Share stays a compact header action
- Live MapLibre map preview with HTML typography overlay; no Generate button
- Minimal neutral palette with semantic shadcn tokens
- Compact theme grid with swatch chips inside the Menu sheet
- First session (no share hash / autosave): bilingual Hong Kong demo with regional Noto; Latin letter-spacing posters remain a first-class fallback
- Location may offer a short row of place examples (text actions, not a gallery dashboard)

This direction replaces the earlier permanent two-column desktop shell (controls ~1/2 + preview ~1/2). The UI keeps a minimalist cartographic aesthetic with the poster composition leading.
