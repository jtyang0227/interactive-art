# Animation improvement plans

Written by the `improve-animations` skill against commit `685d3ef`. This
codebase's real animation surface is the GPU/shader particle system, which
the audit found already correct (single draw call, GPU-only transform,
interruptible burst-and-decay easing, reduced-motion dampens ambient not
direct feedback, keyword swaps hidden inside a dispersion burst) — no
plans target it. These four plans cover the small DOM/CSS motion surface
instead.

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | [KeywordInput focus state](001-keyword-input-focus-state.md) | MEDIUM | Accessibility | DONE |
| 002 | [Name decay/lerp constants](002-name-decay-lerp-constants.md) | LOW | Cohesion & tokens | DONE |
| 003 | [Strong ease-out for DOM fades](003-strong-ease-out-for-dom-fades.md) | LOW | Easing & duration | DONE |
| 004 | [Keyword submit feedback](004-keyword-submit-feedback.md) | LOW | Missed opportunity | DONE |

## Execution order

1. **001** first — it's the only MEDIUM (a real accessibility gap: the
   input has no visible focus indicator at all) and 004 depends on the
   `focused` state and border-color transition it introduces.
2. **004** next, since it builds directly on 001's changes to the same
   element.
3. **002** and **003** are independent of everything else and of each
   other — pure renames and a curve swap, no shared files with 001/004.
   Order between them doesn't matter.

## Dependencies

- 004 depends on 001 (same file, same new `borderBottom`/`transition`
  mechanism — 004 extends rather than duplicates it).
- 002 and 003 are standalone.
