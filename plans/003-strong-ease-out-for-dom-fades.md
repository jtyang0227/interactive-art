# 003 — Use a strong ease-out curve for the two DOM opacity fades

- **Status**: DONE
- **Commit**: 685d3ef
- **Severity**: LOW
- **Category**: Easing & duration
- **Estimated scope**: 2 files, 1 line each

## Problem

The only two CSS transitions in the codebase both use bare `ease` — a weak
built-in curve. Per AUDIT.md's decision order, entering/exiting elements
should use a strong custom ease-out, not the built-in keyword.

```tsx
/* src/App.tsx:41 — current */
<div style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.1s ease' }}>
```

```tsx
/* src/components/UI/InteractionHint.tsx:27-28 — current */
opacity: visible ? 1 : 0,
transition: 'opacity 1.2s ease',
```

Durations (1.1s/1.2s) are correct as-is and out of scope for this plan —
both are first-reveal / ambient-hint fades (rare/first-time frequency, not
frequent UI chrome), where AUDIT.md's "marketing/explanatory: can be
longer" duration guidance applies. Only the curve is a finding.

## Target

Both fades use AUDIT.md's strong ease-out: `cubic-bezier(0.23, 1, 0.32, 1)`.

```tsx
/* src/App.tsx:41 — target */
<div style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.1s cubic-bezier(0.23, 1, 0.32, 1)' }}>
```

```tsx
/* src/components/UI/InteractionHint.tsx:27-28 — target */
opacity: visible ? 1 : 0,
transition: 'opacity 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
```

## Repo conventions to follow

No shared CSS token file exists (all styling is inline React style
objects) — inline the cubic-bezier value directly at each site, matching
how these two transitions are already authored inline. Do not introduce a
constants file for a two-site change.

## Steps

1. In `src/App.tsx`, change `'opacity 1.1s ease'` to `'opacity 1.1s cubic-bezier(0.23, 1, 0.32, 1)'` on the ready-wrapper `<div>`.
2. In `src/components/UI/InteractionHint.tsx`, change `'opacity 1.2s ease'` to `'opacity 1.2s cubic-bezier(0.23, 1, 0.32, 1)'`.

## Boundaries

- Do NOT change the durations (1.1s, 1.2s) — only the easing keyword/value.
- Do NOT touch any other style property on either element.
- Do NOT touch `KeywordInput.tsx` (see plan 001 for its separate focus-transition addition).
- If either line has drifted from the excerpt above (drift since commit 685d3ef), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b`, `npm run lint`, `npm run build` all clean.
- **Feel check**: reload the page and watch the initial reveal fade in, and separately trigger the "Drag to Explore" hint fade-out (touch/click the scene). In DevTools' Animations panel (or just watching at normal speed), confirm both fades now start faster and ease off toward the end, rather than the flatter, more linear-feeling default `ease` curve — the difference is subtle but should read as slightly snappier at the start.
- **Done when**: both `transition` declarations use `cubic-bezier(0.23, 1, 0.32, 1)` in place of `ease`, durations unchanged, build clean.
