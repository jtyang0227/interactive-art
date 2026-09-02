# interactive-art

**Touch the Space** — an experimental, interactive 3D main-screen built around a single
Korean Hangul character, **혼 (魂, "soul")**, rendered as a field of thousands of GPU
particles. The letterform is never a static mesh: it continuously breathes through a
looping cycle — precise → vibration → organic deformation → liquid flow → dispersion →
chaotic atmospheric field → attraction → reconstruction — while staying loosely
recognizable throughout, and it reacts directly to the pointer.

Dark, minimal, monochrome. No UI beyond a hint that fades away the moment you touch it.

## Interactions

| Input | Effect |
| --- | --- |
| Move the pointer | The camera drifts subtly off-axis (parallax); nearby particles are pushed away |
| Drag | Rotates the whole particle space — horizontal → yaw, vertical → pitch (clamped) |
| Release mid-drag | The rotation coasts on its own inertia and decays, instead of stopping dead |
| Fast drag | Spikes "drag energy", flinging particles outward like a dispersion peak before it settles |
| Click / tap | A ring expands from that point over ~0.9s, pushing particles it passes and flashing brighter, then fades |

Works with mouse and touch alike (built on the Pointer Events API).

## Tech stack

- React 18 + TypeScript + Vite
- Three.js + [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber)
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
    Experience/       Canvas + top-level wiring
    Camera/            Mouse-parallax camera rig
    Scene/             Background, WorldGroup (drag rotation + raycasting hub), fog
    ParticleSystem/     HangulParticleField (the glyph), AtmosphereField (background dust)
    InteractiveObject/ Thin wrapper choosing which glyph/behavior is "the object"
    UI/                Interaction hint, WebGL fallback
  hooks/               Pointer position, drag rotation + inertia, tap detection,
                        device tier, reduced-motion, first-interaction
  shaders/             GLSL, one concern per file
  utils/               Glyph → point cloud sampling, WebGL feature check
```

## Status

Implemented so far, in order: basic 3D scene → the Hangul particle system itself →
drag-to-rotate with smoothing → pointer repulsion + drag-energy bursts → click/tap
ripple → inertia + the interaction hint → reduced-motion and WebGL-fallback support.

Not yet built: scroll-driven transition into further page content (needs that content
decided first), audio reactivity, and a device-tiered post-processing pass (bloom /
vignette / chromatic aberration).
