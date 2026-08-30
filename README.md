# Map Poster Studio

Browser-based map poster generator inspired by [originalankur/maptoposter](https://github.com/originalankur/maptoposter). Renders entirely client-side and deploys to Cloudflare Pages.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI components
- Overpass API + Nominatim geocoding
- Canvas 2D rendering at 300 DPI

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Functions: `functions/` (geocode proxy at `/api/geocode`)

## Features

- 17 ported themes from upstream JSON
- City/country geocoding with manual coordinate override
- Radius control, display labels, Google Fonts family
- Export presets (Instagram, A4, 4K, default poster)
- Shareable URL state + local autosave
- Theme JSON editor + batch all-themes ZIP export

## License

MIT
