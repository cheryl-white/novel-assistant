import { Capacitor } from '@capacitor/core'
import type { Chapter, Novel } from '../types'

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || '未命名'
}

function downloadInBrowser(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** 浏览器下载；安卓/iOS 写入缓存并用系统分享面板保存 */
async function saveFile(filename: string, blob: Blob): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    downloadInBrowser(filename, blob)
    return
  }

  const { Directory, Encoding, Filesystem } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')

  const isText = blob.type.startsWith('text/') || filename.endsWith('.txt')
  const path = `exports/${filename}`

  if (isText) {
    const text = await blob.text()
    await Filesystem.writeFile({
      path,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    })
  } else {
    const base64 = await blobToBase64(blob)
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })
  }

  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  })

  await Share.share({
    title: filename,
    text: filename,
    url: uri,
    dialogTitle: '导出文件',
  })
}

export async function exportChapterTxt(novel: Novel, chapter: Chapter): Promise<void> {
  const content = `${chapter.title}\n\n${chapter.content}`
  const filename = `${sanitizeFilename(novel.title)}-${sanitizeFilename(chapter.title)}.txt`
  await saveFile(filename, new Blob([content], { type: 'text/plain;charset=utf-8' }))
}

export async function exportNovelTxt(novel: Novel, chapters: Chapter[]): Promise<void> {
  const body = chapters
    .sort((a, b) => a.order - b.order)
    .map((ch) => `${ch.title}\n\n${ch.content}`)
    .join('\n\n' + '─'.repeat(40) + '\n\n')
  const header = novel.total_outline
    ? `【${novel.title}】\n\n【全书总纲】\n${novel.total_outline}\n\n${'═'.repeat(40)}\n\n`
    : `【${novel.title}】\n\n`
  const filename = `${sanitizeFilename(novel.title)}-全书.txt`
  await saveFile(filename, new Blob([header + body], { type: 'text/plain;charset=utf-8' }))
}

function parseSvgLength(value: string | null): number {
  if (!value) return 0
  const n = Number.parseFloat(value.replace(/px|pt|em|rem|%/gi, '').trim())
  return Number.isFinite(n) && n > 0 ? n : 0
}

function prepareSvgForExport(svgMarkup: string): { svg: string; width: number; height: number } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgMarkup, 'image/svg+xml')
  const svgEl = doc.documentElement
  if (!(svgEl instanceof SVGSVGElement) && svgEl.tagName.toLowerCase() !== 'svg') {
    throw new Error('无效的流程图 SVG')
  }
  if (svgEl.querySelector('parsererror')) {
    throw new Error('无效的流程图 SVG')
  }

  let width = parseSvgLength(svgEl.getAttribute('width'))
  let height = parseSvgLength(svgEl.getAttribute('height'))
  const viewBox = svgEl.getAttribute('viewBox')
  if ((!width || !height) && viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      width = width || parts[2]
      height = height || parts[3]
    }
  }
  if (!width || !height) {
    width = 960
    height = 720
  }

  svgEl.setAttribute('width', String(width))
  svgEl.setAttribute('height', String(height))
  if (!viewBox) {
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  if (!svgEl.getAttribute('xmlns:xlink')) {
    svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  }

  svgEl.querySelectorAll('script').forEach((el) => el.remove())

  const serialized = new XMLSerializer().serializeToString(svgEl)
  const svg = serialized.includes('xmlns=')
    ? serialized
    : serialized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')

  return { svg, width, height }
}

function loadImageFromSvg(svg: string): Promise<HTMLImageElement> {
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('流程图图片加载失败'))
    image.src = dataUrl
  })
}

async function svgToPngBlob(svgMarkup: string, scale = 2): Promise<Blob> {
  const { svg, width, height } = prepareSvgForExport(svgMarkup)
  let img: HTMLImageElement
  try {
    img = await loadImageFromSvg(svg)
  } catch {
    const stripped = svg.replace(/\sfilter="[^"]*"/gi, '')
    img = await loadImageFromSvg(stripped)
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width * scale))
  canvas.height = Math.max(1, Math.ceil(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.fillStyle = '#eef2f8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG 导出失败'))), 'image/png')
  })
}

/** 将流程图 SVG 字符串导出为 PNG */
export async function exportFlowchartPng(
  svgMarkup: string,
  filename: string,
  scale = 2,
): Promise<void> {
  const pngBlob = await svgToPngBlob(svgMarkup, scale)
  await saveFile(`${sanitizeFilename(filename)}.png`, pngBlob)
}

/** 从页面上的 SVG 元素导出 PNG（更可靠） */
export async function exportFlowchartPngFromElement(
  svgEl: SVGSVGElement,
  filename: string,
  scale = 2,
): Promise<void> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  const rect = svgEl.getBoundingClientRect()
  let width = parseSvgLength(svgEl.getAttribute('width')) || rect.width
  let height = parseSvgLength(svgEl.getAttribute('height')) || rect.height

  try {
    const bbox = svgEl.getBBox()
    if ((!width || !height) && bbox.width && bbox.height) {
      width = bbox.width
      height = bbox.height
    }
  } catch {
    // getBBox 在未挂载时可能失败
  }

  if (!width || !height) {
    width = 960
    height = 720
  }

  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const markup = new XMLSerializer().serializeToString(clone)
  await exportFlowchartPng(markup, filename, scale)
}
