uniform vec3 uColor;

varying float vAlpha;
varying float vCore;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float core = smoothstep(0.5, 0.0, d) * vCore;
  float glow = smoothstep(0.5, 0.1, d) * 0.5;
  float shape = core + glow;

  if (shape < 0.01) discard;

  gl_FragColor = vec4(uColor, shape * vAlpha);
}
