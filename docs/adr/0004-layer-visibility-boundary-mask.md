# ADR 0004: Layer visibility, buildings, and place boundary mask

Map Poster Studio adds optional buildings, fine-grained layer toggles (12 map layers), and an inverted place-admin boundary mask. Layer visibility and mask state serialize in share URLs. Buildings use a new `buildings` key on `PosterTheme`. The boundary mask is a visual-only fill in `theme.bg` drawn above map features; it does not clip tile fetching. Place boundaries come from Nominatim via `/api/boundary` (same proxy policy as geocode). Defaults: buildings off, boundary mask off, all other layers on.
