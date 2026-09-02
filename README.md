# interactive-art

**Touch the Space** — an experimental, interactive 3D main-screen that renders any typed
keyword (default: **혼**, 魂, "soul") as a field of thousands of GPU particles. The
letterform is never a static mesh: it continuously breathes through a looping cycle —
precise → vibration → organic deformation → liquid flow → dispersion → chaotic
atmospheric field → attraction → reconstruction — while staying loosely recognizable
throughout, and it reacts directly to the pointer.

Type a new word (Korean or Latin, up to 6 characters) into the field at the top and
press Enter — the current text dissolves into the same dispersion burst a fast drag
triggers, and reforms as the new one, instead of snapping directly to it. The word
you replaced doesn't just vanish: it lingers as a faint, cooler-toned echo for a
few seconds before fading out.

Dark, minimal, monochrome. No UI beyond that input and a hint that fades away the
moment you touch the space.

## Interactions

| Input | Effect |
| --- | --- |
| Move the pointer | The camera drifts subtly off-axis (parallax); nearby particles are pushed away and the ones right under the cursor bulge toward the camera, like a lens passing over the field |
| Drag | Rotates the whole particle space — horizontal → yaw, vertical → pitch (clamped) |
| Release mid-drag | The rotation coasts on its own inertia and decays, instead of stopping dead |
| Fast drag | Spikes "drag energy", flinging particles outward like a dispersion peak before it settles |
| Click / tap | A ring expands from that point over ~0.9s, pushing particles it passes and flashing brighter, then fades |
| Scroll | Dollies the camera back and expands the whole particle field outward, reversibly |

Works with mouse and touch alike (built on the Pointer Events API). Scroll is
wheel/scrollbar-driven — it's not layered onto the same single-finger touch gesture
already claimed by drag-to-rotate.

## Tech stack

- React 18 + TypeScript + Vite
- Three.js + [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) +
  [`@react-three/postprocessing`](https://github.com/pmndrs/react-postprocessing) (Bloom
  + Vignette only, skipped entirely on the low device tier)
- Hand-written GLSL (classic 3D simplex noise + an analytic curl-noise flow field),
  no shader-authoring libraries
- No global state library — all per-frame data lives in refs and GPU uniforms, never
  React state, so nothing re-renders 60 times a second

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build     # typecheck + production build
```

## How the particle field works

1. `utils/textSampler.ts` renders the glyph to an offscreen canvas and reservoir-samples
   its filled pixels into a 3D point cloud (with a soft z-jitter for volume).
2. Those points become the `aBase` attribute of a single `THREE.Points` draw call.
3. `shaders/particle/particle.vert.glsl` computes each particle's *current* position as
   a function of `aBase`, a per-particle random seed, and a handful of uniforms
   (elapsed time, cycle progress, pointer position, drag energy, last click) — entirely
   on the GPU. The CPU side only ever writes a few floats per frame, regardless of
   whether there are 3,500 particles or 12,000.

Particle count and post-processing quality scale down automatically on lower-end/mobile
devices (`hooks/useDevicePerformance.ts`).

## Accessibility

- Respects `prefers-reduced-motion`: the auto-cycle stretches to a third of its normal
  speed and the ambient jitter/flow is dampened to ~20% of normal amplitude. Direct
  feedback from an actual drag, tap, or hover is left at full strength, since that's the
  interaction itself rather than incidental motion.
- Browsers without WebGL get a plain-text fallback instead of a blank screen.

## Project structure

```
src/
  components/
    Experience/       Canvas + top-level wiring, context-loss watcher
    Camera/            Mouse-parallax + scroll-dolly camera rig
    Scene/             Background, WorldGroup (drag rotation + raycasting hub), fog
    ParticleSystem/     HangulParticleField (the glyph), AtmosphereField (background dust)
    InteractiveObject/ Thin wrapper choosing which glyph/behavior is "the object"
    Effects/           Post-processing (Bloom + Vignette)
    UI/                Interaction hint, keyword input, shared fallback screen
  hooks/               Pointer position, drag rotation + inertia, tap detection, scroll
                        progress, device tier, reduced-motion, first-interaction
  shaders/             GLSL, one concern per file
  utils/               Glyph → point cloud sampling, WebGL feature check
```

## Status

Implemented so far, in order: basic 3D scene → the Hangul particle system itself →
drag-to-rotate with smoothing → pointer repulsion + drag-energy bursts → click/tap
ripple → inertia + the interaction hint → reduced-motion, WebGL-fallback, and
runtime-crash/context-loss handling → Bloom/Vignette post-processing → scroll-driven
camera dolly and particle expansion → a typed keyword replacing the fixed glyph, with
the swap itself hidden inside a dispersion burst rather than an instant cut → a
cursor depth-lens effect → an echo layer that keeps the previous keyword lingering
faintly (a cooler, dimmer, lower-density copy of the same particle field) for a few
seconds after each change before fading out (see
`docs/planning/2026-09-02-next-interactive-features.md` for the fuller list these
were picked from).

Deliberately not built yet:
- **A second page section to scroll into.** The scroll effect is real and reversible,
  but there's no further content decided yet for it to hand off to — right now it just
  settles into a fully expanded atmospheric field near the bottom of the scroll range.
- **Audio reactivity.** The original brief marks this optional, and building it without
  a decided audio source (a bundled track vs. microphone input vs. something generative)
  would mean guessing at a feature with real UX and privacy implications (microphone
  permission prompts, autoplay policy, what track to even ship) rather than implementing
  something actually asked for.
