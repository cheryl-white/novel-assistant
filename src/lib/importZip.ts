import JSZip from 'jszip'
import type { ParsedChapter } from './importTxt'
import { titleFromFilename } from './importTxt'

export interface ParsedZipChapter extends ParsedChapter {
  outline?: string
}

export interface ParsedZipNovel {
  novelTitle: string
  totalOutline: string
  chapters: ParsedZipChapter[]
}

const SKIP_PATH_RE = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/i
const TEXT_EXT_RE = /\.(txt|md|text)$/i

const TOTAL_OUTLINE_NAMES = new Set([
  '大纲',
  '全书总纲',
  '总纲',
  '小说大纲',
  'outline',
  'total_outline',
  'total-outline',
])

const CHAPTER_CONTENT_NAMES = new Set(['正文', 'content', '正文内容', '章节正文'])
const CHAPTER_OUTLINE_NAMES = new Set(['大纲', 'outline', '章节大纲', '章纲'])

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function stripExt(name: string): string {
  return name.replace(TEXT_EXT_RE, '').trim()
}

function isTextFile(path: string): boolean {
  return TEXT_EXT_RE.test(path) && !SKIP_PATH_RE.test(path)
}

function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    try {
      // 部分 Windows 压缩包为 GBK
      return new TextDecoder('gbk' as 'utf-8').decode(bytes)
    } catch {
      return new TextDecoder('utf-8').decode(bytes)
    }
  }
}

function parseChapterOrder(name: string): { order: number; title: string } {
  const trimmed = name.trim()

  const numbered = trimmed.match(/^(\d+)\s*[.、．，,\-_]\s*(.+)$/)
  if (numbered) {
    return { order: Number(numbered[1]), title: `${numbered[1]}. ${numbered[2].trim()}` }
  }

  const cn = trimmed.match(/^第(\d+)章\s*(.*)$/)
  if (cn) {
    const title = cn[2].trim() || `第${cn[1]}章`
    return { order: Number(cn[1]), title: `${cn[1]}. ${title}` }
  }

  const leading = trimmed.match(/^(\d+)(.*)$/)
  if (leading?.[1]) {
    const rest = leading[2].replace(/^[\s.\-_]+/, '').trim()
    return {
      order: Number(leading[1]),
      title: rest ? `${leading[1]}. ${rest}` : `第${leading[1]}章`,
    }
  }

  return { order: Number.MAX_SAFE_INTEGER, title: trimmed }
}

function isTotalOutlineName(name: string): boolean {
  const lower = name.toLowerCase()
  return [...TOTAL_OUTLINE_NAMES].some((n) => n.toLowerCase() === lower)
}

/**
 * 解析小说压缩包。
 * 支持：
 * 1) 小说名/大纲.txt + 1.章名.txt + 2.章名.txt
 * 2) 小说名/1.章名/正文.txt + 大纲.txt
 * 3) 扁平：大纲.txt + 各章 txt
 */
export async function parseNovelZip(file: File): Promise<ParsedZipNovel> {
  const zip = await JSZip.loadAsync(file)
  const entries: { path: string; content: string }[] = []

  const tasks: Promise<void>[] = []
  zip.forEach((relativePath, entry) => {
    if (entry.dir) return
    const path = normalizePath(relativePath)
    if (!isTextFile(path)) return
    tasks.push(
      entry.async('uint8array').then((bytes) => {
        entries.push({ path, content: decodeText(bytes).replace(/^\uFEFF/, '') })
      }),
    )
  })
  await Promise.all(tasks)

  if (entries.length === 0) {
    throw new Error('压缩包中未找到 TXT/MD 文本文件')
  }

  const topSegments = entries.map((e) => e.path.split('/')[0])
  const uniqueTops = [...new Set(topSegments)]
  const hasCommonRoot =
    uniqueTops.length === 1 &&
    entries.every((e) => e.path.includes('/')) &&
    !TEXT_EXT_RE.test(uniqueTops[0])

  const rootPrefix = hasCommonRoot ? `${uniqueTops[0]}/` : ''
  const novelTitle = hasCommonRoot
    ? uniqueTops[0]
    : titleFromFilename(file.name.replace(/\.zip$/i, '.txt')).replace(/\.txt$/i, '') || '导入的小说'

  const rel = (path: string) =>
    rootPrefix && path.startsWith(rootPrefix) ? path.slice(rootPrefix.length) : path

  let totalOutline = ''
  type Draft = {
    title: string
    content: string
    outline: string
    order: number
    number: number | null
  }
  const drafts: Draft[] = []
  const folderChapters = new Map<string, { content?: string; outline?: string }>()

  for (const entry of entries) {
    const relPath = rel(entry.path)
    if (!relPath || SKIP_PATH_RE.test(relPath)) continue

    const parts = relPath.split('/').filter(Boolean)
    const fileBase = stripExt(parts[parts.length - 1])
    const nameLower = fileBase.toLowerCase()

    // 根目录全书总纲
    if (parts.length === 1 && isTotalOutlineName(fileBase)) {
      totalOutline = entry.content.trim()
      continue
    }

    // 章节子文件夹
    if (parts.length === 2) {
      const folder = parts[0]
      const bucket = folderChapters.get(folder) ?? {}

      if (CHAPTER_OUTLINE_NAMES.has(nameLower) || CHAPTER_OUTLINE_NAMES.has(fileBase)) {
        bucket.outline = entry.content.trim()
      } else if (CHAPTER_CONTENT_NAMES.has(nameLower) || CHAPTER_CONTENT_NAMES.has(fileBase)) {
        bucket.content = entry.content.trim()
      } else if (!bucket.content) {
        bucket.content = entry.content.trim()
      } else if (!bucket.outline) {
        bucket.outline = entry.content.trim()
      }
      folderChapters.set(folder, bucket)
      continue
    }

    // 根级章节文件
    if (parts.length === 1) {
      const { order, title } = parseChapterOrder(fileBase)
      drafts.push({
        title,
        content: entry.content.trim(),
        outline: '',
        order,
        number: order === Number.MAX_SAFE_INTEGER ? null : order,
      })
    }
  }

  for (const [folder, data] of folderChapters) {
    const { order, title } = parseChapterOrder(folder)
    drafts.push({
      title,
      content: data.content ?? '',
      outline: data.outline ?? '',
      order,
      number: order === Number.MAX_SAFE_INTEGER ? null : order,
    })
  }

  drafts.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title, 'zh')
  })

  const chapters: ParsedZipChapter[] = drafts
    .filter((c) => c.title || c.content.trim() || c.outline.trim())
    .map(({ title, content, outline, number }) => ({
      title,
      content,
      outline,
      number,
    }))

  if (chapters.length === 0 && !totalOutline) {
    throw new Error('未能识别章节。请使用：小说名/大纲.txt + 1.章名.txt，或 小说名/1.章名/正文.txt')
  }

  if (chapters.length === 0 && totalOutline) {
    chapters.push({ title: '第一章', content: '', outline: '', number: 1 })
  }

  return { novelTitle, totalOutline, chapters }
}
