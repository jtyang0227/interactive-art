# 004 — Give keyword submission a brief acknowledgment on the input itself

- **Status**: DONE
- **Commit**: 685d3ef
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file, ~8 line change
- **Depends on**: plan 001 (introduces the `focused` state and the border-color transition this plan reuses — apply 001 first)

## Problem

`src/components/UI/KeywordInput.tsx`'s `handleSubmit` clears the input and
blurs it immediately, with zero acknowledgment on the 2D UI layer that the
submission registered:

```tsx
/* src/components/UI/KeywordInput.tsx — current, after plan 001 is applied */
const handleSubmit = (event: FormEvent) => {
  event.preventDefault()
  const trimmed = value.trim()
  if (!trimmed) return
  onSubmit(trimmed)
  setValue('')
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
```

The only feedback right now is the 3D dissolve burst, which takes a moment
to read and happens on a completely different visual layer (the canvas)
from where the user's attention just was (the input). This is an
"occasional" action (a few times per session, not high-frequency), so a
standard, restrained animation is appropriate — not a disqualifier per
AUDIT.md's frequency table.

## Target

Reuse the border-color transition plan 001 adds (`transition: 'border-color
160ms cubic-bezier(0.23, 1, 0.32, 1)'`), driven by an additional `pulsing`
boolean that briefly forces the same brightened border-color `handleSubmit`
already blurs to, then releases it — no new transition, no `@keyframes`, no
new dependency:

```tsx
/* target */
const [focused, setFocused] = useState(false)
const [pulsing, setPulsing] = useState(false)

const handleSubmit = (event: FormEvent) => {
  event.preventDefault()
  const trimmed = value.trim()
  if (!trimmed) return
  onSubmit(trimmed)
  setValue('')
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  // Blurring already drops `focused`'s brightened border a beat before the
  // 3D dissolve reads — this briefly re-brightens it as the one
  // acknowledgment on the 2D layer that the submission registered, then
  // releases back to the same transition so it settles like a fast fade.
  setPulsing(true)
  window.setTimeout(() => setPulsing(false), 220)
}
```

```tsx
/* target — style, replacing plan 001's `focused` check with `focused || pulsing` */
borderBottom:
  focused || pulsing
    ? '1px solid rgba(238, 241, 248, 0.7)'
    : '1px solid rgba(238, 241, 248, 0.25)',
transition: 'border-color 160ms cubic-bezier(0.23, 1, 0.32, 1)',
```

220ms hold before releasing: long enough to register as a distinct pulse
rather than disappearing in the same frame as blur, short enough to still
read as "acknowledgment" rather than a lingering state change — within
AUDIT.md's small-element budget.

## Repo conventions to follow

Same inline-style, no-new-dependency pattern as plan 001 and the rest of
this codebase's UI layer. `window.setTimeout` for a one-shot delayed state
reset already has precedent in this codebase's spirit (`WorldGroup.tsx`'s
`TRAIL_MAX_AGE` sentinel pattern, `useDragRotation.ts`'s inertia loop) —
here it's the simplest correct tool since this is a single DOM element, not
per-frame shader state.

## Steps

1. Apply plan 001 first (adds `focused` state and the border-color transition this plan extends).
2. In `src/components/UI/KeywordInput.tsx`, add `const [pulsing, setPulsing] = useState(false)` alongside `focused`.
3. In `handleSubmit`, after the existing `blur()` call, add `setPulsing(true)` followed by `window.setTimeout(() => setPulsing(false), 220)`.
4. Change the `borderBottom` style's condition from `focused ? ... : ...` (as plan 001 left it) to `focused || pulsing ? ... : ...`.

## Boundaries

- Do NOT add `@keyframes`, a CSS file, or an animation library — this stays a plain state-driven transition, matching plan 001 and the rest of the codebase.
- Do NOT change what `onSubmit`/`setValue('')`/`blur()` do — only add the pulse trigger after them.
- Do NOT touch the 3D dissolve/`morphBurst` logic in `HangulParticleField.tsx` — this plan is scoped to the 2D input only.
- If `KeywordInput.tsx` doesn't already have plan 001's `focused` state and border-color transition applied, STOP and apply plan 001 first rather than improvising a parallel mechanism.

## Verification

- **Mechanical**: `npx tsc -b`, `npm run lint`, `npm run build` all clean.
- **Feel check**: type a keyword and press Enter (or tap the on-screen "Go" on mobile). Confirm:
  - The border-bottom briefly brightens right at submit, distinct from the focus-brighten plan 001 adds (it should still visibly pulse even though blur() is dropping `focused` at the same moment).
  - It settles back to the dim resting state within roughly a quarter second — not a lingering change.
  - Submitting twice in quick succession (before the first pulse's timeout fires) doesn't leave it stuck bright — the second `setPulsing(true)` extends the hold cleanly, and it still releases once the last timeout fires.
- **Done when**: every successful submission produces a brief, self-releasing border-bottom brighten, and rapid repeated submissions never leave it permanently brightened.
