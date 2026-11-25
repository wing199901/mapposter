# Design direction

Map Poster Studio uses a responsive cartographic editor layout:

- **Desktop / wide:** two-column shell — Location + Style controls (~1/2) permanently visible, Preview (~1/2)
- **Mobile / narrow:** map-first shell — poster preview dominates; Location + Style open from a header **Menu** bottom Sheet
- Style panel: Themes, Layers, and Labels
- Export (size presets, custom inches, PNG / SVG / all-themes ZIP) lives in a Preview header / toolbar popover; Share stays a compact header action
- Live MapLibre map preview with HTML typography overlay; no Generate button
- Minimal neutral palette with semantic shadcn tokens
- Preview column with soft muted backdrop; poster preview top-aligned on desktop, stage-centered on mobile
- Compact theme grid with swatch chips
- First session (no share hash / autosave): bilingual Hong Kong demo with regional Noto; Latin letter-spacing posters remain a first-class fallback
- Location may offer a short row of place examples (text actions, not a gallery dashboard)

The UI follows a minimalist cartographic aesthetic: desktop keeps an efficient editor dashboard; mobile keeps the poster as the main character.
