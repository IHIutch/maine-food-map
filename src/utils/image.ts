const QUALITY_START = 0.85
const QUALITY_STEP = 0.1
const QUALITY_FLOOR = 0.4
const EPSILON = 1e-6

export type DownscaleOpts = { maxEdge: number; maxBytes: number }

export type Attempt = { q: number; edge: number }

/* Pure stepping decision, called only when the encoded blob is still over
 * maxBytes: lower quality by 0.1 until the 0.4 floor, then halve dimensions
 * once and restart quality from the top; a second floor at halved dimensions
 * means the image cannot be brought under budget. */
export function nextAttempt(
  size: number,
  q: number,
  edge: number,
  opts: DownscaleOpts,
): Attempt | 'fail' {
  if (size <= opts.maxBytes) return { q, edge }
  if (q - QUALITY_FLOOR > EPSILON) {
    const lowered = Math.round((q - QUALITY_STEP) * 100) / 100
    return { q: Math.max(lowered, QUALITY_FLOOR), edge }
  }
  if (edge - opts.maxEdge / 2 > EPSILON) {
    return { q: QUALITY_START, edge: Math.round(edge / 2) }
  }
  return 'fail'
}

function encode(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE')
  ctx.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('ENCODE_FAILED'))),
      'image/webp',
      quality,
    )
  })
}

/* Re-encoding through a canvas both applies the EXIF orientation
 * ('from-image') and strips all metadata, including GPS. */
export async function downscaleImage(
  file: File,
  opts: DownscaleOpts = { maxEdge: 2048, maxBytes: 1_000_000 },
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  })
  try {
    let q = QUALITY_START
    let edge = opts.maxEdge
    for (;;) {
      const blob = await encode(bitmap, edge, q)
      if (blob.size <= opts.maxBytes) return blob
      const next = nextAttempt(blob.size, q, edge, opts)
      if (next === 'fail') throw new Error('IMAGE_TOO_LARGE')
      q = next.q
      edge = next.edge
    }
  } finally {
    bitmap.close()
  }
}
