# Pattern Tile Colorization Architecture

This notes how the American Mahjong Assistant renders AI pattern recommendations: 14 tiles shown in single-character notation, suit coloring that matches the NMJL card, and inverted colors for tiles already present in the player’s hand. Use these building blocks to recreate the same experience in another project.

## Data Pipeline Overview

1. **Pattern metadata** comes from the NMJL service, which normalizes each pattern group and guarantees a `display_color` of `blue`, `red`, or `green` for later rendering (`packages/frontend/src/lib/services/nmjl-service.ts:118`).
2. **Pattern strings** are split and colorized by group via `getColoredPatternParts`, letting the UI render “Section X #Y” lines with the correct suit colors (`packages/frontend/src/utils/pattern-color-utils.ts:16`).
3. **Tile IDs** are converted to characters with color tokens by `getTileDisplayChar`, then matched against the player’s hand in `getPatternDisplayChars`, which sets `isMatched` flags while respecting duplicate tile counts (`packages/frontend/src/utils/tile-display-utils.ts:9,64`).
4. **Visual output** is produced by `renderPatternVariation` (group-aware ordering and spacing) and `getTileCharClasses`, which handles the color inversion for matched tiles (`packages/frontend/src/utils/tile-display-utils.ts:150`).
5. **Reusable components** such as `PatternVariationDisplay` and `PatternRecommendations` tie the utilities together to render the pattern header, the 14-tile strip, and the inverted styling (`packages/frontend/src/ui-components/patterns/PatternVariationDisplay.tsx:1`, `packages/frontend/src/features/intelligence-panel/PatternRecommendations.tsx:198`).

## Key Utilities and Responsibilities

### Group Color Metadata

```ts
// packages/frontend/src/utils/pattern-color-utils.ts
export function getColoredPatternParts(
  pattern: string,
  groups: PatternGroup[],
) {
  const patternParts = pattern.split(" ");
  const groupSequence = groups.map((group) => ({
    baseName: String(group.Group).replace(/_\d+$/, ""),
    color: group.display_color,
  }));

  return patternParts.map((part, index) => ({
    text: part,
    color: groupSequence[index]?.color || "blue",
  }));
}
```

- Splits the NMJL pattern string on spaces.
- Aligns each segment with the normalized group order.
- Defaults to blue when metadata is missing.
- UIs call `getColorClasses(part.color)` to translate suit colors into Tailwind class names.

### Tile → Character Mapping and Matching

```ts
// packages/frontend/src/utils/tile-display-utils.ts
export function getTileDisplayChar(tileId: string): TileDisplayChar {
  if (tileId.match(/^[1-9][bcd]$/)) {
    return {
      char: tileId[0],
      color: tileId[1] === "b" ? "green" : tileId[1] === "c" ? "red" : "blue",
      tileId,
    };
  }
  // Dragons, winds, flowers, jokers map to G/R/D/N/E/W/S/F/J with fallback
}

export function getPatternDisplayChars(
  patternTiles: string[],
  playerTiles: string[] = [],
) {
  const playerCounts = tally(playerTiles);
  const usedCounts = new Map<string, number>();

  return patternTiles.map((tileId) => {
    const display = getTileDisplayChar(tileId);
    const normalized = normalize(tileId);
    const canMatch =
      (playerCounts.get(normalized) || 0) > (usedCounts.get(normalized) || 0);

    if (canMatch)
      usedCounts.set(normalized, (usedCounts.get(normalized) || 0) + 1);
    return { ...display, isMatched: canMatch };
  });
}
```

- `getTileDisplayChar` compresses tile IDs (e.g., `3b`, `red_dragon`) into single characters and assigns the suit color token.
- `getPatternDisplayChars` keeps duplicate counts aligned by tracking how many of each tile have been consumed from the player hand.
- The output array feeds both matched/inverted rendering and completion percentages.

### Rendering and Color Inversion

```ts
// packages/frontend/src/utils/tile-display-utils.ts
export function getTileCharClasses(tileChar: TileDisplayChar, inverted = true) {
  const base = "font-mono text-sm font-bold px-1 rounded";
  const shouldInvert = inverted && tileChar.isMatched;

  if (shouldInvert) {
    if (tileChar.color === "green")
      return `${base} bg-green-600 text-white border border-green-700`;
    if (tileChar.color === "red")
      return `${base} bg-red-600 text-white border border-red-700`;
    if (tileChar.color === "blue")
      return `${base} bg-blue-600 text-white border border-blue-700`;
    return `${base} bg-gray-800 text-white border border-gray-900`;
  }

  if (tileChar.color === "green")
    return `${base} bg-white text-green-600 border border-green-200`;
  if (tileChar.color === "red")
    return `${base} bg-white text-red-600 border border-red-200`;
  if (tileChar.color === "blue")
    return `${base} bg-white text-blue-600 border border-blue-200`;
  return `${base} bg-white text-gray-800 border border-gray-300`;
}
```

- When `inverted` is `true` (the default), any `TileDisplayChar` with `isMatched === true` renders with a solid suit-colored background and white text.
- Unmatched tiles use a white background with colored text, mirroring the NMJL card.
- Consumer components can disable inversion (`invertMatches={false}`) when they only want suit-colored text.

```ts
export function renderPatternVariation(
  patternTiles: string[],
  playerTiles: string[],
  options,
) {
  const chars = getPatternDisplayChars(
    patternTiles,
    options.showMatches ? playerTiles : [],
  );
  // Adds spacing either from `handPattern`, explicit groups, or every four tiles by default
  return applySpacing(chars, options);
}
```

- Returns the ordered `TileDisplayChar[]` with optional group spacing so that 14-tile patterns are visually chunked like the physical card.

### Ready-to-Use UI Layer

```tsx
// packages/frontend/src/ui-components/patterns/PatternVariationDisplay.tsx
const displayChars = renderPatternVariation(patternTiles, playerTiles, {
  showMatches,
  invertMatches,
  spacing,
  patternGroups,
  handPattern,
});

return (
  <div className="flex gap-1">
    {displayChars.map((char) =>
      char.char === " " ? (
        <span key={i} className="mx-1" />
      ) : (
        <span key={i} className={getTileCharClasses(char, invertMatches)}>
          {char.char}
        </span>
      ),
    )}
  </div>
);
```

- Handles scrollable layout, optional completion stats, and exposes knobs (`showMatches`, `invertMatches`, `spacing`) for different contexts (analysis card, gameplay panel, etc.).

## Recreating This Design Elsewhere

1. **Normalize pattern data** so each group carries a `display_color` token and your tile list has 14 canonical tile IDs.
2. **Port the utilities** (`getTileDisplayChar`, `getPatternDisplayChars`, `getTileCharClasses`, `renderPatternVariation`) or replicate them with equivalent logic.
3. **Render the header** by splitting the pattern string and applying suit colors to each chunk (`getColoredPatternParts` + `getColorClasses`).
4. **Render the tile strip** by feeding `patternTiles` and the user’s current hand into `renderPatternVariation`, then map over the result to produce `<span>` tags styled via `getTileCharClasses`.
5. **Expose controls** like `invertMatches` when you need a non-highlighted view (e.g., reference patterns without considering the player’s hand).

### Integration Example

```tsx
import {
  renderPatternVariation,
  getTileCharClasses,
} from "./tile-display-utils";
import { getColoredPatternParts, getColorClasses } from "./pattern-color-utils";

function PatternPreview({ pattern, playerTiles }) {
  const coloredHeader = getColoredPatternParts(pattern.pattern, pattern.groups);
  const displayChars = renderPatternVariation(pattern.tiles, playerTiles, {
    showMatches: true,
    invertMatches: true,
    spacing: true,
    handPattern: pattern.pattern,
  });

  return (
    <section className="space-y-2">
      <header className="font-mono text-lg flex gap-1">
        {coloredHeader.map((part, i) => (
          <span key={i} className={getColorClasses(part.color)}>
            {part.text}
          </span>
        ))}
      </header>

      <div className="flex flex-wrap gap-1">
        {displayChars.map((char, i) =>
          char.char === " " ? (
            <span key={i} className="w-2" />
          ) : (
            <span key={i} className={getTileCharClasses(char, true)}>
              {char.char}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
```

This snippet mirrors the production logic: it builds the colored header, renders the 14-tile strip, and automatically inverts suit colors for tiles that the player already holds. Porting these helpers ensures consistent behavior between projects and keeps the AI guidance visually aligned with the NMJL card.
