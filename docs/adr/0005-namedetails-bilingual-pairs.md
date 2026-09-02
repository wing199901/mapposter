# ADR 0005: OSM namedetails and bilingual name pairs

## Status

Accepted

## Context

Poster lettering today is two independent fields, `display.city` and `display.country`, usually filled from the geocode query or from Nominatim's English-leaning `display_name`. The CJK wedge is: a Kyoto search should letter 京都 large and KYOTO small, with 日本 / JAPAN on the second line. Copying the search box onto the poster would treat typos and script choice as the label. `accept-language` alone would change names by browser locale, not by the place.

## Decision

After a successful geocode, take local and Latin names only from OSM Nominatim `namedetails`. The search box may be CJK or Latin and is only used to hit the correct place. If `namedetails` has a local CJK name, use **display pair layout** (place pair, then country pair). If it does not, keep the existing Latin-only city / country poster. The user can still override display text by hand.

## Consequences

**Positive**

- Poster script follows the place, not the query or the browser language
- Terraink-style TOKYO posters remain for Latin-only places
- Share URLs can store the resolved names instead of hoping the next geocode matches

**Negative**

- Search requests need `namedetails=1` (and likely `addressdetails=1` for the country pair); cache payloads grow
- OSM coverage is uneven; some CJK searches will still render Latin-only
- Labels UI is no longer two independent strings

## Alternatives considered

1. **Use the geocode query as the local name when it is CJK** — rejected; the query is a search key, not lettering
2. **Drive names with `accept-language` only** — rejected; the same place would letter differently per user locale
3. **Force a CJK country pair on Latin-only cities** (法國 / FRANCE under Paris) — rejected; that CJK-washes posters that should stay Latin
