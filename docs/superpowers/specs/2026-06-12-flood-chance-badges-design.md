# Chance-of-flooding status badges — design

## Goal

Surface a gauge's computed "Chance of flooding" as a small badge icon on both the
gauge details screen and the gauge list, grouped into three risk levels. Also
restructure the gauge-details status display: move the status pill into the
Latest Reading / Peak table header and drop the dedicated Status row.

## Risk levels

The combined flood chance (forecast + observed) is already computed by
`useFloodProbability` and rounded to the nearest 5%. Group it:

- **High** — 70% or higher → `alert-high` badge
- **Medium** — >30% and <70% (i.e. 35–65 after rounding) → `alert-medium` badge
- **Low** — 30% or less → no badge

The "Very High (≥90%)" and "Very Low (≤10%)" sub-levels are **out of scope** for
the badge: Very High still uses the High badge, Very Low is Low → no badge. The
percentage text already conveys the "Very High" wording.

### Mapping from the existing `FloodChanceLevel` bucket

Percentages out of `combineFloodChance` are multiples of 5.

| `chance.level`                               | Risk   |
| -------------------------------------------- | ------ |
| `low` (<10%)                                 | Low    |
| `percent` ≥ 70                               | High   |
| `percent` 35–65                              | Medium |
| `percent` ≤ 30                               | Low    |
| `veryHighClamp` / `veryHigh` / `nearCertain` | High   |

(`veryHighClamp`/`veryHigh`/`nearCertain` are all ≥90% → always High.)

## Assets

Four SVGs (already added under `assets/images/`):

- `alert-high.svg`, `alert-medium.svg` — **halo** variants (white outline) for the
  badge that overlays a colored status pill's corner.
- `alert-high-no-halo.svg`, `alert-medium-no-halo.svg` — flat triangles for the
  badge shown **inline** to the right of the percentage number.

## Components & changes

### 1. Pure risk-level logic

- New `FloodRiskLevel` string enum (`High = "high"`, `Medium = "medium"`,
  `Low = "low"`) in `src/services/floodPrediction/types.ts`.
- New pure `floodChanceRiskLevel(chance: FloodChanceLevel): FloodRiskLevel` in
  `src/services/floodPrediction/calculations.ts`, unit-tested in
  `calculations.test.ts` (covers each bucket and the 30/35/65/70 boundaries).

### 2. `FloodRiskBadge` component

New `src/components/FloodRiskBadge.tsx`, following the `TrendIcon` pattern
(web `<img>` / mobile expo-image `Image`). Props:

- `level: FloodRiskLevel`
- `variant: "overlay" | "inline"`

Picks the halo SVG for `overlay`, the no-halo SVG for `inline`; returns `null`
for `Low`. Carries an `accessibilityLabel` from a new `t()` string. The four
SVGs are registered in `AssetsContext.tsx` for preloading (same as trend icons).

### 3. Gauge details — `CalloutReadingCard.tsx`

- **Remove** the Status `CardItem`; fix the trailing-border (`noBorder`) logic on
  the remaining rows so the last visible row has no border.
- Move the status pill (`LargeLabel`) into the `CardHeader` title row,
  right-aligned opposite the "Latest Reading" / "Peak" title, sharing the row
  with the existing fetch spinner.
- When risk is High/Medium (only reachable in live, not-already-flooding mode,
  enforced by the existing `shouldPredictFlood` gate):
  - wrap the header status pill so the **overlay** badge sits at its top-right
    corner;
  - append the **inline** badge to the right of the percentage in the
    flood-chance row.

### 4. Gauge list — `app/(root)/gage/index.tsx`

- New `useFloodRiskLevel(gage)` hook wrapping `useFloodProbability` + a shared
  at/above-red-stage gate + `floodChanceRiskLevel`, returning
  `FloodRiskLevel | null`.
- `GageStatus` wraps its `LargeLabel` so the **overlay** badge sits at the
  top-right corner when High/Medium. Hidden when the gauge is already at/above
  red stage (the flood-level pill already reads "Flooding").

### Shared gating

Extract the "reading at/above red stage" check into a tiny shared helper so the
details screen and the list agree. Details derives its risk from the
`floodChance` it already holds (it needs the percentage too); only the list uses
the `useFloodRiskLevel` hook, avoiding a redundant probability computation on
details while keeping a single source of truth for the mapping.

## Testing

- Unit tests for `floodChanceRiskLevel` covering every bucket and the
  30/35/65/70/90 boundaries.
- `npm test`, `npm run lint`, `npx tsc --noEmit` all green.
- Manual web verification under a mock-replay scenario that produces a
  High/Medium chance.
