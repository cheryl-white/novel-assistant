import { useRef, useState } from 'react'
import type { ParsedChapter } from '../lib/importTxt'
import { parseTxtToChapters, readTxtFile, titleFromFilename } from '../lib/importTxt'
import { parseNovelZip } from '../lib/importZip'
import { Modal } from './Modal'

export type ImportMode = 'new' | 'replace' | 'append'
type ImportSource = 'text' | 'file' | 'zip'

interface ImportChapter extends ParsedChapter {
  outline?: string
}

interface ImportTxtModalProps {
  open: boolean
  currentNovelTitle: string | null
  onClose: () => void
  onImport: (params: {
    novelTitle: string
    chapters: ImportChapter[]
    mode: ImportMode
    totalOutline?: string
  }) => void
}

export function ImportTxtModal({
  open,
  currentNovelTitle,
  onClose,
  onImport,
}: ImportTxtModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<ImportSource>('text')
  const [fileName, setFileName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [novelTitle, setNovelTitle] = useState('')
  const [chapters, setChapters] = useState<ImportChapter[]>([])
  const [totalOutline, setTotalOutline] = useState('')
  const [mode, setMode] = useState<ImportMode>('new')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setSource('text')
    setFileName('')
    setPasteText('')
    setNovelTitle('')
    setChapters([])
    setTotalOutline('')
    setMode('new')
    setError('')
    setLoading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (zipInputRef.current) zipInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const applyParsed = (text: string, defaultTitle: string, fromFile: string, outline = '') => {
    const parsed = parseTxtToChapters(text)
    if (parsed.length === 0) {
      setError('未能识别到章节，请检查格式（如 1.章节名、第1章 等，章节标题需单独占一行）')
      setChapters([])
      return
    }
    setError('')
    setFileName(fromFile)
    setTotalOutline(outline)
    if (!novelTitle || fromFile) setNovelTitle(defaultTitle)
    setChapters(parsed)
  }

  const handleFile = async (file: File) => {
    setError('')
    setLoading(true)
    try {
      const text = await readTxtFile(file)
      applyParsed(text, titleFromFilename(file.name), file.name)
    } catch {
      setError('文件读取失败，请确认文件为 UTF-8 编码的 TXT')
    } finally {
      setLoading(false)
    }
  }

  const handleZip = async (file: File) => {
    setError('')
    setLoading(true)
    try {
      const parsed = await parseNovelZip(file)
      if (parsed.chapters.length === 0) {
        setError('压缩包中未识别到章节')
        setChapters([])
        return
      }
      setError('')
      setFileName(file.name)
      setNovelTitle(parsed.novelTitle)
      setTotalOutline(parsed.totalOutline)
      setChapters(parsed.chapters)
    } catch (err) {
      setChapters([])
      setTotalOutline('')
      setError(err instanceof Error ? err.message : '压缩包解析失败')
    } finally {
      setLoading(false)
    }
  }

  const handleParseText = () => {
    if (!pasteText.trim()) {
      setError('请先粘贴或输入 TXT 文字')
      return
    }
    applyParsed(pasteText, novelTitle.trim() || '导入的小说', '')
  }

  const handleConfirm = () => {
    if (chapters.length === 0) {
      setError(
        source === 'text'
          ? '请先粘贴文字并点击「解析预览」'
          : source === 'zip'
            ? '请先选择 ZIP 压缩包'
            : '请先选择 TXT 文件',
      )
      return
    }
    if (mode === 'new' && !novelTitle.trim()) {
      setError('请输入小说标题')
      return
    }
    if (mode !== 'new' && !currentNovelTitle) {
      setError('请先选择一本小说，或选择「创建新小说」')
      return
    }
    onImport({
      novelTitle: mode === 'new' ? novelTitle.trim() : currentNovelTitle!,
      chapters,
      mode,
      totalOutline: totalOutline || undefined,
    })
    handleClose()
  }

  const totalChars = chapters.reduce((s, c) => s + c.content.replace(/\s/g, '').length, 0)
  const outlineCount = chapters.filter((c) => c.outline?.trim()).length

  const sourceTabs: { id: ImportSource; label: string }[] = [
    { id: 'text', label: '粘贴文字' },
    { id: 'file', label: 'TXT 文件' },
    { id: 'zip', label: 'ZIP 压缩包' },
  ]

  return (
    <Modal
      open={open}
      title="📥 导入小说"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-border px-4 py-2 text-sm dark:border-border-dark"
          >
            取消
          </button>
          <button
            type="button"
            disabled={chapters.length === 0 || loading}
            onClick={handleConfirm}
            className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
          >
            确认导入
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border p-0.5 dark:border-border-dark">
          {sourceTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSource(id)
                setChapters([])
                setTotalOutline('')
                setFileName('')
                setError('')
              }}
              className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
                source === id
                  ? 'bg-accent text-white'
                  : 'text-ink-muted hover:text-ink dark:text-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">导入方式</label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
              />
              创建新小说
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 text-sm ${!currentNovelTitle ? 'opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'append'}
                disabled={!currentNovelTitle}
                onChange={() => setMode('append')}
              />
              添加到当前小说
              {currentNovelTitle && (
                <span className="text-xs text-ink-muted">（{currentNovelTitle}）</span>
              )}
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 text-sm ${!currentNovelTitle ? 'opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'replace'}
                disabled={!currentNovelTitle}
                onChange={() => setMode('replace')}
              />
              替换当前小说
              {currentNovelTitle && (
                <span className="text-xs text-ink-muted">（{currentNovelTitle}）</span>
              )}
            </label>
          </div>
          {!currentNovelTitle && (
            <p className="mt-1 text-xs text-ink-muted dark:text-stone-600">
              未选中小说时，仅可「创建新小说」
            </p>
          )}
        </div>

        {mode === 'new' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">小说标题</label>
            <input
              type="text"
              value={novelTitle}
              onChange={(e) => setNovelTitle(e.target.value)}
              placeholder="输入新小说标题"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
            />
          </div>
        )}

        {source === 'text' ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">粘贴 TXT 文字</label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={
                '将 TXT 内容粘贴到这里…\n\n章节格式示例：\n1.第一章标题\n正文内容…\n\n2.第二章标题\n正文内容…'
              }
              rows={8}
              className="editor-scroll w-full resize-y rounded-md border border-border bg-white p-3 text-sm leading-relaxed outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
            />
            <button
              type="button"
              onClick={handleParseText}
              className="mt-2 w-full rounded-md border border-accent/50 py-2 text-sm text-accent hover:bg-accent/5"
            >
              解析预览
            </button>
          </div>
        ) : source === 'file' ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-md border border-dashed border-accent/50 px-4 py-6 text-sm text-accent transition-colors hover:bg-accent/5 disabled:opacity-60"
            >
              {loading ? '读取中…' : fileName ? `已选择：${fileName}` : '点击选择 TXT 文件'}
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleZip(file)
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => zipInputRef.current?.click()}
              className="w-full rounded-md border border-dashed border-accent/50 px-4 py-6 text-sm text-accent transition-colors hover:bg-accent/5 disabled:opacity-60"
            >
              {loading ? '解析压缩包…' : fileName ? `已选择：${fileName}` : '点击选择 ZIP 压缩包'}
            </button>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-stone-600">
              推荐结构：
              <br />
              <code className="text-[11px]">小说名/大纲.txt</code> +{' '}
              <code className="text-[11px]">1.章名.txt</code>…
              <br />
              或：
              <code className="text-[11px]">小说名/1.章名/正文.txt</code> +{' '}
              <code className="text-[11px]">大纲.txt</code>
            </p>
          </div>
        )}

        {source !== 'zip' && (
          <p className="text-xs text-ink-muted dark:text-stone-600">
            自动识别「1.章节名」「1、章节名」「第1章」等格式；章节标记需单独占一行
          </p>
        )}

        {chapters.length > 0 && (
          <>
            {totalOutline && (
              <p className="rounded-md bg-accent/5 px-3 py-2 text-xs text-ink-muted dark:text-stone-400">
                已识别全书总纲（{totalOutline.replace(/\s/g, '').length} 字）
              </p>
            )}

            <div>
              <p className="mb-2 text-xs text-ink-muted">
                识别到 <strong className="text-accent">{chapters.length}</strong> 个章节，共{' '}
                {totalChars.toLocaleString()} 字
                {outlineCount > 0 && (
                  <>
                    ，其中 <strong className="text-accent">{outlineCount}</strong> 章含大纲
                  </>
                )}
              </p>
              <ul className="editor-scroll max-h-36 space-y-1 overflow-y-auto rounded-md border border-border bg-white/50 p-2 text-xs dark:border-border-dark dark:bg-stone-900/30">
                {chapters.map((ch, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 text-ink-muted dark:text-stone-400"
                  >
                    <span className="min-w-0 truncate">
                      {ch.title}
                      {ch.outline?.trim() ? ' · 有大纲' : ''}
                    </span>
                    <span className="shrink-0">{ch.content.replace(/\s/g, '').length} 字</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </Modal>
  )
}
