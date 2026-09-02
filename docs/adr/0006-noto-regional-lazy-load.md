# ADR 0006: One lazy-loaded regional Noto family

## Status

Accepted

## Context

CJK posters need glyphs Terraink's Latin poster fonts do not cover. Noto is split by region on Google Fonts: Noto Sans SC, TC, HK, JP, KR. These are not interchangeable — Hong Kong and Taiwan Traditional Chinese differ. A unified Noto Sans CJK download is too large for this web tool. Loading all regional families on every page would also be too heavy, and print-shop cost is already out of scope.

## Decision

Lazy-load exactly one Noto family per poster, from the **script family** of the local name:

- Hong Kong places: Noto Sans HK
- Other Traditional Chinese: Noto Sans TC
- Simplified Chinese: Noto Sans SC
- Japanese: Noto Sans JP
- Korean: Noto Sans KR

Keep Latin letter-spacing for Latin runs. Never track CJK. Latin-only posters keep the existing font list and do not load Noto CJK.

## Consequences

**Positive**

- Correct regional glyphs without shipping four CJK families
- HK vs Taiwan variants stay distinct
- Export still uses a webfont, no paid print pipeline

**Negative**

- First CJK poster pays a font-download hitch
- Mixed-script labels (CJK + Latin on one line) rely on Noto's Latin coverage or a fallback stack
- Switching place/script mid-session may swap the loaded family

## Alternatives considered

1. **One Noto Sans CJK file for all languages** — rejected; too large for Cloudflare/web delivery
2. **Preload all regional families** — rejected; most sessions need one script
3. **Noto Sans TC for all Traditional Chinese, including Hong Kong** — rejected; HK character variants would be wrong
