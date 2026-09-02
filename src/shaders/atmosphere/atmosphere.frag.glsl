uniform vec3 uColor;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float shape = smoothstep(0.5, 0.0, d);

  if (shape < 0.01) discard;

  gl_FragColor = vec4(uColor, shape * vAlpha);
}
