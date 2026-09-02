uniform vec3 uColor;
uniform float uGlobalAlpha;

varying float vAlpha;
varying float vCore;
varying float vRipple;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float core = smoothstep(0.5, 0.0, d) * vCore;
  float glow = smoothstep(0.5, 0.1, d) * 0.5;
  float shape = core + glow;

  if (shape < 0.01) discard;

  // A brief overexposed flash as the click ring passes through — additive
  // blending means pushing alpha past 1 genuinely reads as brighter, not
  // just more opaque.
  float flashAlpha = shape * vAlpha + vRipple * 0.9;
  gl_FragColor = vec4(uColor, flashAlpha * uGlobalAlpha);
}
