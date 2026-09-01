# Design direction

Map Poster Studio uses a professional cartographic editor layout:

- Two-column desktop shell: location + style controls (~1/2), preview (~1/2)
- Style panel: Themes and Labels only
- Export (size presets, custom inches, PNG / SVG / all-themes ZIP) lives in a Preview header popover
- Live MapLibre map preview with HTML typography overlay; no Generate button
- Minimal neutral palette with semantic shadcn tokens
- Preview-first column with soft muted backdrop; poster preview top-aligned
- Compact theme grid with swatch chips
- Mobile: stacked panels (future enhancement via Sheet components)

This direction replaces a blocking Superdesign canvas review for automated implementation. The UI follows the plan's minimalist cartographic aesthetic with generous whitespace and preview-dominant composition.
