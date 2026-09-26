/**
 * Export every scene as one PDF page (a picture of the scene as rendered in
 * Present mode). No network, no server: the page is drawn with html-to-image
 * and wrapped in a minimal PDF written here.
 */
import { toCanvas } from 'html-to-image'
import { SCENES } from './selection'

interface PdfPage { jpeg: Uint8Array; w: number; h: number }

const enc = new TextEncoder()

/** Minimal PDF 1.4: one full-bleed JPEG per page, page width = A4 landscape. */
export function buildPdf(pages: PdfPage[]): Blob {
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let size = 0
  const push = (c: string | Uint8Array) => { const b = typeof c === 'string' ? enc.encode(c) : c; chunks.push(b); size += b.length }
  const obj = (n: number, body: () => void) => { offsets[n] = size; push(`${n} 0 obj\n`); body(); push('\nendobj\n') }

  const W = 842
  const kids = pages.map((_, i) => 3 + i * 3)
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'))
  obj(2, () => push(`<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${pages.length} >>`))
  pages.forEach((p, i) => {
    const n = 3 + i * 3
    const H = Math.round((W * p.h) / p.w * 100) / 100
    obj(n, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`))
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`
    obj(n + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`))
    obj(n + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`)
      push(p.jpeg)
      push('\nendstream')
    })
  })
  const count = 3 + pages.length * 3
  const xref = size
  push(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

async function jpegOf(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  if (!blob) throw new Error('canvas export failed')
  return new Uint8Array(await blob.arrayBuffer())
}

/** Renders each scene (body gets `pdf-export` so the chrome/scroll limits drop away). */
export async function scenesToPdf(onProgress: (done: number, total: number) => void): Promise<Blob> {
  document.body.classList.add('pdf-export')
  window.dispatchEvent(new CustomEvent('nation:pdf', { detail: 'start' }))
  try {
    await frame(); await frame()
    const pages: PdfPage[] = []
    const pageBg = getComputedStyle(document.body).backgroundColor
    for (let i = 0; i < SCENES.length; i++) {
      onProgress(i, SCENES.length)
      const el = document.getElementById(SCENES[i].id)
      if (!el) continue
      const width = Math.max(el.clientWidth, el.scrollWidth)
      const height = Math.max(el.clientHeight, el.scrollHeight)
      const bg = getComputedStyle(el).backgroundColor
      const canvas = await toCanvas(el, {
        width, height,
        pixelRatio: width < 800 ? 2 : 1.5,
        backgroundColor: bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : pageBg,
        skipFonts: true,
        filter: (n) => !(n instanceof HTMLElement && n.classList.contains('tooltip')),
      })
      pages.push({ jpeg: await jpegOf(canvas), w: canvas.width, h: canvas.height })
    }
    onProgress(SCENES.length, SCENES.length)
    return buildPdf(pages)
  } finally {
    document.body.classList.remove('pdf-export')
    window.dispatchEvent(new CustomEvent('nation:pdf', { detail: 'end' }))
  }
}

type Downloads = { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
type ClaudeHost = { use: (name: string) => Promise<unknown> }

/** claude.ai viewer: ask the host to save (viewer confirms). Elsewhere: a normal download link. */
export async function deliverPdf(blob: Blob, filename: string): Promise<'saved' | 'downloaded'> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude
  const downloads = host ? ((await host.use('downloads').catch(() => null)) as Downloads | null) : null
  if (downloads) {
    await downloads.save({ filename, data: blob })
    return 'saved'
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  return 'downloaded'
}
