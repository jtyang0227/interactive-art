# CLAUDE.md

Guidance for Claude Code (or any coding agent) working in this repo.

## What this is

**Touch the Space** — an experimental, generative-typography 3D art piece.
Any typed keyword (default **혼**, 魂, "soul") renders as a field of GPU
particles that continuously loops through precise → vibration → organic
deformation → liquid flow → dispersion → chaotic atmospheric field →
attraction → reconstruction, and reacts directly to pointer/touch input.
Monochrome, dark, minimal — no UI beyond a keyword input and a hint that
fades on first touch. See `README.md` for the full feature/interaction list
and `docs/planning/` for the roadmap and rationale behind what's built vs.
deferred.

## Commands

```bash
npm run dev      # dev server
npm run build     # tsc -b && vite build — this is the source of truth for "does it compile"
npm run lint      # eslint .
npm run preview   # serve the production build locally
```

There is no test suite. Verification is: `tsc -b` clean, `eslint .` clean,
`vite build` clean, then a manual/Playwright check in a browser — type
checking and a clean build do not prove a shader or interaction actually
looks right.

## Architecture

```
src/
  components/
    ErrorBoundary.tsx  App-level runtime-crash catcher, wraps the Canvas
    Experience/       Canvas + top-level wiring, context-loss watcher
    Camera/            Mouse-parallax + scroll-dolly camera rig
    Scene/             Background/fog, WorldGroup (the interaction hub)
    ParticleSystem/     HangulParticleField (the glyph), AtmosphereField (background dust)
    InteractiveObject/ Thin wrapper choosing which glyph/behavior is "the object"
    Effects/           Post-processing (Bloom + Vignette only)
    UI/                Interaction hint, keyword input, WebGL-fallback screen
  hooks/               One hook per input source — pointer, drag+inertia, multi-touch,
                        tap, scroll progress, device tier, reduced-motion, first-interaction
  shaders/             GLSL, one concern per file (particle/, atmosphere/)
  utils/               Glyph → point cloud sampling, WebGL feature check
```

**Data flow, top to bottom:** `Experience.tsx` owns all the input hooks
(`useMouseInteraction`, `useDragRotation`, `useTapTrigger`, `useScrollProgress`,
`useMultiTouch`) and passes their refs down through `Scene` → `WorldGroup` →
`InteractiveObject`/`ParticleSystem`. `WorldGroup` is the single "interaction
hub": it owns the drag-rotation lerp, raycasts the pointer against its own
local z=0 plane (so hit-testing tracks correctly while the group spins), and
exposes pointer position/click/mouse-trail state via `WorldPointerContext` to
whatever's mounted inside it. Multi-touch (vortex/pinch) bypasses that context
— it's plain scalars, not positions needing local-space resolution, so it's
threaded as a separate prop instead.

## Hard conventions — do not violate these

- **Never use React state inside anything that runs in the R3F render loop.**
  All live per-frame values (pointer position, drag energy, vortex strength,
  echo age, …) live in refs or directly as GPU uniforms. A `useState` update
  at 60fps defeats the entire point of this architecture. If you need a value
  to react to a prop change (like a new keyword), do it in a `useEffect`, not
  by re-rendering every frame.
- **One draw call per particle layer.** All per-particle animation (noise,
  repulsion, lens, ripple, trail, vortex, pinch) is computed in the vertex
  shader from `aBase` (the sampled target position) plus uniforms. The CPU
  side only ever writes a handful of floats/uniforms per frame — it never
  touches per-vertex buffers in the render loop. If a new interaction needs
  per-particle behavior, add it to the shader, not to a JS loop over points.
- **"Burst and decay" for anything driven by a discrete event** (a fast drag,
  a keyword change, a two-finger release): spike a ref to a target value,
  then ease it back down every frame — `value *= Math.pow(DECAY_RATE, delta)`
  or `value += (target - value) * Math.min(delta * RATE, 1)`. Don't gate
  effects with a boolean "isActive" flag; let the eased value itself reach
  ~0 and stay inert. See `dragEnergy`, `morphBurst`, `vortexStrength`,
  `pinchScale` in `HangulParticleField.tsx` for the pattern.
- **`prefers-reduced-motion` dampens ambient motion, never direct feedback.**
  The auto-cycle stretches (`CYCLE_SECONDS * 3`) and ambient jitter drops to
  ~20% via `uMotionScale`. Repulsion, lens, click ripple, trail, and vortex —
  anything that's a direct response to an actual pointer/touch action — stay
  at full strength regardless. Don't add a reduced-motion check to those.
- **A pointer effect must have an explicit "ended" state, not just a
  position.** A mouse always rests somewhere, so "have I ever seen a
  pointermove" was for a long time treated as good enough for "is the pointer
  active." Touch breaks this: a lifted finger has no resting position. Any
  new touch/pointer-driven effect needs to go inert on `pointerup`/
  `pointercancel` for non-mouse pointer types, not just decay toward a stale
  last-known position. (See `useMouseInteraction`'s `active` flag — this was
  a real, previously-shipped bug, not hypothetical.)
- **Filter drag/rotation gestures by `pointerId`.** Two simultaneous pointers
  (e.g. a two-finger touch) must never have their deltas mixed into the same
  single-pointer drag math — track which pointer a gesture belongs to and
  bail out (handing off, e.g. to multi-touch) the instant a second one joins.
- Prop-thread new input state through `Experience → Scene → WorldGroup` (if
  it needs local-space raycasting) or straight to the consuming component (if
  it's a plain scalar, like multi-touch). Don't reach for a context/global
  store for a second input source — the existing pattern (refs passed as
  props, one context only for what `WorldGroup` itself resolves) is
  deliberate and has held up through several features.

## Testing in this environment

Headless Chromium here uses SwiftShader (software rendering), which is slow
and has a real per-vertex-shader-cost ceiling — a shader with two full
curl-noise evaluations per vertex has crashed/hung it before. Prefer one
curl-noise call for large-scale flow and cheap trig for fine jitter.

When testing interactions with Playwright:
- Real multi-touch emulation is unreliable on headless desktop Chromium.
  Dispatch synthetic `PointerEvent`s directly via `page.evaluate` with
  distinct `pointerId`s and `pointerType: 'touch'` instead.
- Input actions (click/fill/press) can take 3-4s of real wall-clock time here
  even though they're instant in the page. Don't trust nominal
  `waitForTimeout` durations against the app's own animation timers —
  correlate with `performance.now()`, or use
  `page.emulateMedia({ reducedMotion: 'reduce' })` to get a slower, cleaner,
  more comparable animation state to screenshot against.
- Before concluding something is a bug because a screenshot looks wrong,
  check whether the same wait duration with **zero interaction** produces
  the same result — the auto-cycle alone can look like a lot of change over
  10-20s. If idle-only stays clean but the interaction leaves it distorted
  indefinitely, that's a real bug, not the cycle.
- If something doesn't render, prove the pipeline works first with an
  extreme/obvious debug value (huge size, red color) before tuning down —
  don't guess blindly at subtle tuning numbers when the real question is
  "is this even mounted/visible at all."

## Secrets

`GEMINI_API_KEY` lives in `.env.local` (gitignored via the existing `*.local`
pattern) for `scripts/ask-gemini.sh`, used by the `planner` subagent
(`.claude/agents/planner.md`). Never print, log, or commit this key.

## Keeping this file current

Run the `claude-md-manager` subagent (`.claude/agents/claude-md-manager.md`)
after a significant architectural change, a new hard convention, or a new
gotcha discovered the hard way — it reconciles this file against the current
codebase.
