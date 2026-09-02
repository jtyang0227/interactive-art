uniform float uTime;
uniform float uPixelRatio;
uniform float uBaseSize;

attribute vec3 aSeed;

varying float vAlpha;

void main() {
  vec3 pos = position;
  float t = uTime * 0.08;

  // Cheap trig-based drift — these particles sit far from the eye, so a
  // full noise field would spend GPU cycles nobody can perceive.
  pos.x += sin(t * (0.6 + aSeed.x) + aSeed.y * 6.283) * 0.35;
  pos.y += cos(t * (0.5 + aSeed.y) + aSeed.z * 6.283) * 0.3;
  pos.z += sin(t * (0.4 + aSeed.z) + aSeed.x * 6.283) * 0.4;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(-mvPosition.z, 0.001);

  float size = uBaseSize * mix(0.5, 1.4, aSeed.x);
  gl_PointSize = size * uPixelRatio / dist;
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = mix(0.05, 0.22, aSeed.y);
}
