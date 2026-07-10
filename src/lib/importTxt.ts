export interface ParsedChapter {
  title: string
  content: string
  number: number | null
}

/** 识别行首章节标题，如 1.标题、1、标题、第1章 等 */
function parseChapterHeader(line: string): { number: number | null; title: string } | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const numbered = trimmed.match(/^(\d+)\s*[.、．，,]\s*(.+)$/)
  if (numbered) {
    return { number: Number(numbered[1]), title: numbered[2].trim() }
  }

  const cnNumbered = trimmed.match(/^第(\d+)章\s*(.*)$/)
  if (cnNumbered) {
    const title = cnNumbered[2].trim() || `第${cnNumbered[1]}章`
    return { number: Number(cnNumbered[1]), title }
  }

  const cnChar = trimmed.match(/^第([一二三四五六七八九十百千零]+)章\s*(.*)$/)
  if (cnChar) {
    const title = cnChar[2].trim() || `第${cnChar[1]}章`
    return { number: null, title: title || `第${cnChar[1]}章` }
  }

  return null
}

/** 去掉正文末尾的 // 注释块 */
function stripTrailingComments(content: string): string {
  const lines = content.split('\n')
  let end = lines.length

  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim()
    if (
      t === '' ||
      t.startsWith('//') ||
      t === '**' ||
      t.startsWith('**//') ||
      /^\/\/\*+$/.test(t)
    ) {
      end = i
      continue
    }
    break
  }

  return lines.slice(0, end).join('\n').trim()
}

function formatChapterTitle(number: number | null, title: string): string {
  if (number !== null) return `${number}. ${title}`
  return title
}

/**
 * 将 TXT 全文拆分为章节。
 * 支持：1.标题 / 1、标题 / 1，标题 / 第1章 标题
 * 第一个章节标记之前的内容会作为「前言」章节。
 */
export function parseTxtToChapters(text: string): ParsedChapter[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  type Marker = { lineIndex: number; number: number | null; title: string }
  const markers: Marker[] = []

  for (let i = 0; i < lines.length; i++) {
    const header = parseChapterHeader(lines[i])
    if (header) {
      markers.push({
        lineIndex: i,
        number: header.number,
        title: header.title,
      })
    }
  }

  if (markers.length === 0) {
    const content = stripTrailingComments(normalized.trim())
    if (!content) return []
    return [{ title: '正文', content, number: null }]
  }

  const chapters: ParsedChapter[] = []

  const preface = lines.slice(0, markers[0].lineIndex).join('\n').trim()
  if (preface) {
    chapters.push({
      title: '前言',
      content: stripTrailingComments(preface),
      number: null,
    })
  }

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].lineIndex + 1
    const end = i + 1 < markers.length ? markers[i + 1].lineIndex : lines.length
    const body = lines.slice(start, end).join('\n')
    chapters.push({
      title: formatChapterTitle(markers[i].number, markers[i].title),
      content: stripTrailingComments(body),
      number: markers[i].number,
    })
  }

  return chapters.filter((c) => c.title || c.content.trim())
}

export function readTxtFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

export function titleFromFilename(filename: string): string {
  return filename.replace(/\.txt$/i, '').trim() || '导入的小说'
}
