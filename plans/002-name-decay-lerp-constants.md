# 002 — Name the hand-typed decay/lerp rate constants

- **Status**: DONE
- **Commit**: 685d3ef
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 4 files, 7 one-line changes (no behavior change)

## Problem

Seven decay/lerp-rate magic numbers are hand-typed inline across 5 files,
with no naming — the value's role (how fast does this ease toward its
target) has to be inferred from context every time:

```ts
// src/components/Camera/CameraRig.tsx:51 — current
const lerpFactor = 1 - Math.pow(0.001, delta)
```
```ts
// src/components/Scene/WorldGroup.tsx:84 — current
const lerpFactor = 1 - Math.pow(0.02, delta)
```
```ts
// src/components/Scene/WorldGroup.tsx:102 — current
dragEnergy.current += (energyTarget - dragEnergy.current) * Math.min(delta * 4, 1)
```
```ts
// src/components/ParticleSystem/AtmosphereField.tsx:85 — current
pinchScale.current += (multiTouch.current.pinchScale - pinchScale.current) * Math.min(delta * 4, 1)
```
```ts
// src/components/ParticleSystem/HangulParticleField.tsx:302 — current
morphBurst.current *= Math.pow(0.01, delta)
```
```ts
// src/components/ParticleSystem/HangulParticleField.tsx:318 — current
vortexStrength.current += (vortexTarget - vortexStrength.current) * Math.min(delta * 6, 1)
```
```ts
// src/components/ParticleSystem/HangulParticleField.tsx:321 — current
pinchScale.current += (multiTouch.current.pinchScale - pinchScale.current) * Math.min(delta * 4, 1)
```

`WorldGroup.tsx:102` and `AtmosphereField.tsx:85` use the literally identical
rate (`delta * 4`) for a conceptually similar "ease toward target" purpose,
declared independently with no shared name.

## Target

Each constant gets a name at its own use site, module-level, immediately
above (or near) where it's used — **not** a single cross-file shared token,
since these tune independently-designed effects on different objects and
coincidentally sharing a value today doesn't mean they should be coupled
going forward. Naming makes each one legible without changing any behavior.

```ts
// src/components/Camera/CameraRig.tsx — target
const CAMERA_SETTLE_RATE = 0.001 // lower = camera drifts to target more slowly
...
const lerpFactor = 1 - Math.pow(CAMERA_SETTLE_RATE, delta)
```

```ts
// src/components/Scene/WorldGroup.tsx — target
const ROTATION_LERP_RATE = 0.02 // WorldGroup's own drag-rotation smoothing
const DRAG_ENERGY_EASE_RATE = 4 // how fast dragEnergy chases its target, per second
...
const lerpFactor = 1 - Math.pow(ROTATION_LERP_RATE, delta)
...
dragEnergy.current += (energyTarget - dragEnergy.current) * Math.min(delta * DRAG_ENERGY_EASE_RATE, 1)
```

```ts
// src/components/ParticleSystem/AtmosphereField.tsx — target
const PINCH_EASE_RATE = 4 // how fast pinchScale chases its target, per second
...
pinchScale.current += (multiTouch.current.pinchScale - pinchScale.current) * Math.min(delta * PINCH_EASE_RATE, 1)
```

```ts
// src/components/ParticleSystem/HangulParticleField.tsx — target
const MORPH_BURST_DECAY_RATE = 0.01 // fraction of morphBurst remaining after 1s
const VORTEX_EASE_RATE = 6 // how fast vortexStrength chases its target, per second
const PINCH_EASE_RATE = 4 // how fast pinchScale chases its target, per second
...
morphBurst.current *= Math.pow(MORPH_BURST_DECAY_RATE, delta)
...
vortexStrength.current += (vortexTarget - vortexStrength.current) * Math.min(delta * VORTEX_EASE_RATE, 1)
...
pinchScale.current += (multiTouch.current.pinchScale - pinchScale.current) * Math.min(delta * PINCH_EASE_RATE, 1)
```

## Repo conventions to follow

`src/hooks/useDragRotation.ts:9-11` already does exactly this — named,
commented, module-level constants for its own decay/threshold values:

```ts
const MAX_PITCH = 0.6 // radians (~34deg) — enough tilt to feel grabbed, never flips over
const VELOCITY_DECAY_PER_SECOND = 0.05 // fraction of velocity remaining after 1s of coasting
const MIN_COAST_SPEED = 0.00002 // rad/ms — below this the inertia loop just stops itself
```

Match that: `UPPER_SNAKE_CASE`, module-level (outside the component
function), a one-line trailing or same-line comment stating what the
number means in plain terms — not just restating the variable name.

## Steps

1. `src/components/Camera/CameraRig.tsx`: add `const CAMERA_SETTLE_RATE = 0.001` near the top-level constants (next to `BASE_Z`/`SCROLL_DOLLY`), replace the `0.001` literal at line 51 with it.
2. `src/components/Scene/WorldGroup.tsx`: add `const ROTATION_LERP_RATE = 0.02` and `const DRAG_ENERGY_EASE_RATE = 4` near the top-level constants (next to `FAR_SENTINEL`/`TRAIL_SAMPLE_INTERVAL`), replace the `0.02` literal at line 84 and the `4` literal at line 102 with them.
3. `src/components/ParticleSystem/AtmosphereField.tsx`: add `const PINCH_EASE_RATE = 4` near the top-level constants (next to `ATMOSPHERE_COUNT`), replace the `4` literal at line 85 with it.
4. `src/components/ParticleSystem/HangulParticleField.tsx`: add `const MORPH_BURST_DECAY_RATE = 0.01`, `const VORTEX_EASE_RATE = 6`, `const PINCH_EASE_RATE = 4` near the top-level constants (next to `PARTICLE_COUNT`/`CYCLE_SECONDS`), replace the `0.01` literal at line 302, the `6` literal at line 318, and the `4` literal at line 321 with them.

## Boundaries

- This is a pure rename — every numeric value stays byte-identical, only literals become named constants. No behavior change, no visual difference.
- Do NOT create a shared cross-file constants module — these stay local to each file, named independently even where values coincide.
- Do NOT touch any other constant already named in these files (e.g. `BASE_Z`, `CYCLE_SECONDS`) — only the 7 bare literals cited above.
- Do NOT touch `useDragRotation.ts` — it's already correctly named; it's cited here only as the exemplar.
- If any of the 7 line numbers/literals cited above don't match the code you find (drift since commit 685d3ef), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc -b`, `npm run lint`, and `npm run build` all clean. `git diff` should show only literal→identifier swaps and new `const` declarations — no logic changes.
- **Feel check**: not applicable — this plan changes no runtime values, so nothing should look or feel different. Confirm this by comparing a before/after screenshot of the default "혼" glyph at rest: pixel-identical modulo the shader's own randomness (particle jitter seed), i.e. same overall shape and motion character.
- **Done when**: all 7 literals are named constants matching the target snippets above, `git diff` shows no behavior change, and the app still builds/lints clean.
