# 001 — Add a visible focus state to KeywordInput

- **Status**: DONE
- **Commit**: 685d3ef
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, ~5 line change

## Problem

`src/components/UI/KeywordInput.tsx` sets `outline: none` on the input with
nothing replacing it. A keyboard user tabbing to this input — the one
interactive element in the entire experience — gets no visual confirmation
it's focused.

```tsx
/* src/components/UI/KeywordInput.tsx:41-67 — current */
<input
  type="text"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  placeholder="TYPE A WORD"
  maxLength={MAX_LENGTH}
  style={{
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(238, 241, 248, 0.25)',
    color: 'rgba(238, 241, 248, 0.85)',
    fontSize: '16px',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    textAlign: 'center',
    padding: '0.5em 0.2em',
    outline: 'none',
    width: '14rem',
    maxWidth: '60vw',
  }}
/>
```

## Target

Focus brightens the border-bottom (the only visual chrome the input has)
with a short transition, using React state rather than a `:focus` pseudo
class since the style is authored inline. `outline` stays `none` — the
border-bottom *is* the focus indicator, brightened enough to read clearly.

```tsx
/* target */
const [focused, setFocused] = useState(false)
...
<input
  ...
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
  style={{
    ...
    borderBottom: focused
      ? '1px solid rgba(238, 241, 248, 0.7)'
      : '1px solid rgba(238, 241, 248, 0.25)',
    transition: 'border-color 160ms cubic-bezier(0.23, 1, 0.32, 1)',
    outline: 'none',
    ...
  }}
/>
```

`160ms` matches AUDIT.md's small-element budget (button/tooltip range) —
this is a hover/color-style change, so `ease` in the decision order maps to
this curve per this repo's own new `--ease-out`-equivalent value (see plan
003, which introduces the same cubic-bezier as a named constant — reuse
that constant here once it lands, or inline the same value if implemented
first).

## Repo conventions to follow

This codebase has no shared CSS token file (all styling is inline React
style objects, see `KeywordInput.tsx`, `InteractionHint.tsx`). Match that:
add the transition as an inline style property, not a new CSS file. Follow
`InteractionHint.tsx`'s existing pattern of `opacity: visible ? 1 : 0,
transition: 'opacity 1.2s ease'` for how this repo already expresses a
state-driven inline transition — same shape, new property.

## Steps

1. In `src/components/UI/KeywordInput.tsx`, add `const [focused, setFocused] = useState(false)` alongside the existing `const [value, setValue] = useState('')`.
2. Add `onFocus={() => setFocused(true)}` and `onBlur={() => setFocused(false)}` props to the `<input>`.
3. Change the `borderBottom` style to branch on `focused` (dim `rgba(238, 241, 248, 0.25)` unfocused, brighter `rgba(238, 241, 248, 0.7)` focused) and add `transition: 'border-color 160ms cubic-bezier(0.23, 1, 0.32, 1)'`.

## Boundaries

- Do NOT touch `InteractionHint.tsx`, `App.tsx`, or any other component.
- Do NOT change the input's layout, sizing, or the 16px font-size (that's load-bearing for iOS zoom prevention — see CLAUDE.md).
- Do NOT add a CSS file or new dependency — inline style only, matching the existing pattern.
- If `KeywordInput.tsx`'s structure has drifted from the excerpt above (drift since commit 685d3ef), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b` and `npm run lint` both clean; `npm run build` succeeds.
- **Feel check**: run the dev server, tab to the input with keyboard (or click it), and confirm:
  - The border-bottom visibly brightens on focus and dims back on blur.
  - The transition is smooth, not an instant snap — visible at normal speed, confirm the curve isn't jarring.
  - Typing and submitting still works exactly as before (this only touches focus styling).
- **Done when**: focusing the input via keyboard or pointer produces a visible, smoothly-transitioning border-bottom change, and blurring reverses it.
