uniform float uTime;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uBaseSize;
uniform vec2 uMouse;

attribute vec3 aBase;
attribute vec3 aSeed;

varying float vAlpha;
varying float vCore;

// --- Ashima classic 3D simplex noise -------------------------------------
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 snoiseVec3(vec3 x) {
  float s0 = snoise(x);
  float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
  float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
  return vec3(s0, s1, s2);
}

// Curl of a noise-based vector potential — a divergence-free flow field
// that never pulls particles apart or crushes them together, only swirls.
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 px0 = snoiseVec3(p - dx);
  vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy);
  vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz);
  vec3 pz1 = snoiseVec3(p + dz);

  float x = (py1.z - py0.z) - (pz1.y - pz0.y);
  float y = (pz1.x - pz0.x) - (px1.z - px0.z);
  float z = (px1.y - px0.y) - (py1.x - py0.x);

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor + 1e-4);
}

float wrapDist(float a, float b) {
  float d = abs(a - b);
  return min(d, 1.0 - d);
}

void main() {
  // Each particle drifts slightly out of lockstep with the global cycle so
  // the dissolve/reform reads as a wave passing through the form rather
  // than a single rigid keyframe.
  float t = fract(uProgress + aSeed.x * 0.06 - 0.03);

  float vibration = smoothstep(0.02, 0.10, t) * (1.0 - smoothstep(0.14, 0.30, t));
  float chaos = smoothstep(0.06, 0.55, t) * (1.0 - smoothstep(0.80, 0.99, t));

  float mouseAmount = clamp(length(uMouse), 0.0, 1.0);

  // A single curl-noise evaluation drives the large-scale flow; it is the
  // only divergence-free (six-sample) field we can afford per vertex at
  // particle-field scale. The fine high-frequency vibration only needs to
  // read as jitter, so cheap per-axis trig stands in for a second curl call.
  vec3 flow = curlNoise(aBase * 1.6 + aSeed * 4.0 + uTime * 0.05);
  vec3 fine = vec3(
    sin(uTime * 9.0 + aSeed.x * 62.0),
    sin(uTime * 8.3 + aSeed.y * 71.0 + 1.7),
    sin(uTime * 7.6 + aSeed.z * 54.0 + 3.1)
  );
  vec3 outward = normalize(aBase + vec3(0.0001));

  vec3 displacement =
      fine * vibration * (0.03 + mouseAmount * 0.01) +
      flow * chaos * (0.85 + mouseAmount * 0.15) +
      outward * chaos * chaos * 0.6;

  vec3 pos = aBase + displacement;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(-mvPosition.z, 0.001);

  float sizeVariance = mix(0.4, 1.0, aSeed.z);
  float size = uBaseSize * sizeVariance * mix(1.0, 0.72, chaos * 0.6);

  gl_PointSize = size * uPixelRatio / dist;
  gl_Position = projectionMatrix * mvPosition;

  vCore = 1.0 - chaos * 0.65;
  vAlpha = mix(0.95, 0.32, chaos * 0.7) * mix(0.6, 1.0, aSeed.y);
}
