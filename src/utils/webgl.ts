/** Cheap, one-shot feature check — avoids mounting a Canvas that would
 * otherwise throw partway through context creation on an unsupported
 * browser/device. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}
