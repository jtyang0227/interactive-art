export interface GlyphSampleOptions {
  count: number
  canvasSize?: number
  fontFamily?: string
  fontWeight?: number
  scale?: number
  depth?: number
  alphaThreshold?: number
}

/**
 * Renders a single glyph to an offscreen canvas and reservoir-samples its
 * filled pixels into a set of 3D points centered on the origin. A soft
 * random z-jitter gives the flat glyph a thin volumetric slab of depth.
 */
export function sampleGlyphPoints(char: string, options: GlyphSampleOptions): Float32Array {
  const {
    count,
    canvasSize = 640,
    fontFamily = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', sans-serif",
    fontWeight = 900,
    scale = 1.9,
    depth = 0.32,
    alphaThreshold = 40,
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new Float32Array(count * 3)

  ctx.clearRect(0, 0, canvasSize, canvasSize)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Sized for a single Hangul syllable by default; a longer typed keyword
  // gets scaled down just enough to stay inside the canvas rather than
  // spilling off the edges and losing whatever didn't fit.
  let fontSize = canvasSize * 0.82
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  const maxTextWidth = canvasSize * 0.86
  const measuredWidth = ctx.measureText(char).width
  if (measuredWidth > maxTextWidth && measuredWidth > 0) {
    fontSize *= maxTextWidth / measuredWidth
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  }

  ctx.fillText(char, canvasSize / 2, canvasSize / 2 + fontSize * 0.03)

  const { data } = ctx.getImageData(0, 0, canvasSize, canvasSize)

  // Reservoir-sample pixel coordinates whose alpha clears the threshold,
  // so we never have to materialize the full candidate list in memory.
  const reservoirX = new Float32Array(count)
  const reservoirY = new Float32Array(count)
  let seen = 0

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const alpha = data[(y * canvasSize + x) * 4 + 3]
      if (alpha <= alphaThreshold) continue

      if (seen < count) {
        reservoirX[seen] = x
        reservoirY[seen] = y
      } else {
        const r = Math.floor(Math.random() * (seen + 1))
        if (r < count) {
          reservoirX[r] = x
          reservoirY[r] = y
        }
      }
      seen++
    }
  }

  const positions = new Float32Array(count * 3)
  const usable = Math.min(seen, count)

  for (let i = 0; i < count; i++) {
    // If the glyph didn't yield enough filled pixels for the requested
    // density, re-use sampled points with fresh jitter instead of leaving
    // unused particles collapsed at the origin.
    const source = usable > 0 ? i % usable : 0
    const px = reservoirX[source] + (Math.random() - 0.5)
    const py = reservoirY[source] + (Math.random() - 0.5)

    const nx = (px / canvasSize - 0.5) * 2 * scale
    const ny = -(py / canvasSize - 0.5) * 2 * scale
    // Two averaged randoms bias the slab thickness toward the center,
    // reading as soft volume rather than a hard-edged extrusion.
    const nz = ((Math.random() + Math.random() - 1) / 1) * depth * 0.5

    positions[i * 3] = nx
    positions[i * 3 + 1] = ny
    positions[i * 3 + 2] = nz
  }

  return positions
}
