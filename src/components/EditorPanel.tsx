import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import type { OutlineFormat } from '../lib/ai'
import type { Chapter, Novel } from '../types'
import { OutlineSection } from './OutlineSection'

type MainTab = 'content' | 'outline'

interface EditorPanelProps {
  novel: Novel | null
  chapter: Chapter | null
  novelChapters: Chapter[]
  onUpdateNovel: (patch: Partial<Pick<Novel, 'title' | 'total_outline'>>) => void
  onUpdateChapter: (
    patch: Partial<Pick<Chapter, 'title' | 'content' | 'outline' | 'outline_flowchart'>>,
  ) => void
  onExtractOutline: (format: OutlineFormat) => Promise<void>
  onExportChapter: () => void
  onExportNovel: () => void
  extracting: OutlineFormat | null
  sidebarCollapsed: boolean
  aiPanelCollapsed: boolean
  onToggleSidebar: () => void
  onToggleAiPanel: () => void
}

export function EditorPanel({
  novel,
  chapter,
  onUpdateNovel,
  onUpdateChapter,
  onExtractOutline,
  onExportChapter,
  onExportNovel,
  extracting,
  sidebarCollapsed,
  aiPanelCollapsed,
  onToggleSidebar,
  onToggleAiPanel,
}: EditorPanelProps) {
  const [title, setTitle] = useState('')
  const [novelTitle, setNovelTitle] = useState('')
  const [content, setContent] = useState('')
  const [outline, setOutline] = useState('')
  const [outlineFlowchart, setOutlineFlowchart] = useState('')
  const [totalOutline, setTotalOutline] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [showTotalOutline, setShowTotalOutline] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('content')
  const prevExtracting = useRef<OutlineFormat | null>(null)

  useEffect(() => {
    if (!chapter || !novel) return
    setTitle(chapter.title)
    setNovelTitle(novel.title)
    setContent(chapter.content)
    setOutline(chapter.outline)
    setOutlineFlowchart(chapter.outline_flowchart ?? '')
    setTotalOutline(novel.total_outline)
    setSaveStatus('saved')
    setMainTab('content')
    setShowTotalOutline(false)
  }, [chapter?.id, novel?.id])

  useEffect(() => {
    if (novel) setNovelTitle(novel.title)
  }, [novel?.title])

  useEffect(() => {
    if (!chapter) return
    if (prevExtracting.current && !extracting) {
      setMainTab('outline')
      if (prevExtracting.current === 'flowchart') {
        setOutlineFlowchart(chapter.outline_flowchart ?? '')
      } else {
        setOutline(chapter.outline)
      }
    }
    prevExtracting.current = extracting
  }, [extracting, chapter])

  const debouncedSaveChapter = useDebouncedCallback(
    (patch: Partial<Pick<Chapter, 'title' | 'content' | 'outline' | 'outline_flowchart'>>) => {
      onUpdateChapter(patch)
      setSaveStatus('saved')
    },
    600,
  )

  const debouncedSaveNovelOutline = useDebouncedCallback((value: string) => {
    onUpdateNovel({ total_outline: value })
  }, 600)

  const debouncedSaveNovelTitle = useDebouncedCallback((value: string) => {
    const trimmed = value.trim()
    if (trimmed) onUpdateNovel({ title: trimmed })
    setSaveStatus('saved')
  }, 600)

  const handleTitle = (v: string) => {
    setTitle(v)
    setSaveStatus('saving')
    debouncedSaveChapter({ title: v })
  }

  const handleNovelTitle = (v: string) => {
    setNovelTitle(v)
    setSaveStatus('saving')
    debouncedSaveNovelTitle(v)
  }

  const handleContent = (v: string) => {
    setContent(v)
    setSaveStatus('saving')
    debouncedSaveChapter({ content: v })
  }

  const handleOutline = (v: string) => {
    setOutline(v)
    setSaveStatus('saving')
    debouncedSaveChapter({ outline: v })
  }

  const handleOutlineFlowchart = (v: string) => {
    setOutlineFlowchart(v)
    setSaveStatus('saving')
    debouncedSaveChapter({ outline_flowchart: v })
  }

  const handleTotalOutline = (v: string) => {
    setTotalOutline(v)
    debouncedSaveNovelOutline(v)
  }

  /** Edge swipe on the editor: open left/right panels when collapsed. */
  const edgeTouchX = useRef(0)
  const edgeTouchY = useRef(0)
  const edgeActive = useRef<'left' | 'right' | null>(null)

  const onEditorTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    const w = window.innerWidth
    edgeTouchX.current = t.clientX
    edgeTouchY.current = t.clientY
    if (sidebarCollapsed && t.clientX <= 28) edgeActive.current = 'left'
    else if (aiPanelCollapsed && t.clientX >= w - 28) edgeActive.current = 'right'
    else edgeActive.current = null
  }

  const onEditorTouchEnd = (e: TouchEvent) => {
    const side = edgeActive.current
    edgeActive.current = null
    if (!side) return
    const t = e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - edgeTouchX.current
    const dy = t.clientY - edgeTouchY.current
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    if (side === 'left' && dx > 0) onToggleSidebar()
    if (side === 'right' && dx < 0) onToggleAiPanel()
  }

  if (!novel || !chapter) {
    return (
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper dark:bg-paper-dark"
        onTouchStart={onEditorTouchStart}
        onTouchEnd={onEditorTouchEnd}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2 dark:border-border-dark">
          {sidebarCollapsed && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5"
              title="展开侧边栏"
            >
              📚 目录
            </button>
          )}
          {aiPanelCollapsed && (
            <button
              type="button"
              onClick={onToggleAiPanel}
              className="rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5"
              title="展开 AI 助手"
            >
              🤖 AI
            </button>
          )}
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-ink-muted dark:text-stone-500">
            <p className="text-4xl">📖</p>
            <p className="mt-3 text-sm">请从左侧选择一本小说和章节，或新建小说开始写作</p>
          </div>
        </div>
      </main>
    )
  }

  const wordCount = content.replace(/\s/g, '').length
  const mainTabs: { id: MainTab; label: string; icon: string }[] = [
    { id: 'content', label: '正文编辑', icon: '✍️' },
    { id: 'outline', label: '章节大纲', icon: '📋' },
  ]

  return (
    <main
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper dark:bg-paper-dark"
      onTouchStart={onEditorTouchStart}
      onTouchEnd={onEditorTouchEnd}
    >
      <header className="shrink-0 border-b border-border px-6 py-3 dark:border-border-dark">
        {(sidebarCollapsed || aiPanelCollapsed) && (
          <div className="mb-2 flex items-center gap-2">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5"
                title="展开侧边栏"
              >
                📚 目录
              </button>
            )}
            {aiPanelCollapsed && (
              <button
                type="button"
                onClick={onToggleAiPanel}
                className={`rounded-md border border-border px-2.5 py-1 text-xs hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5 ${!sidebarCollapsed ? 'ml-auto' : ''}`}
                title="展开 AI 助手"
              >
                🤖 AI
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-ink-muted dark:text-stone-500">
            <span className="shrink-0">当前小说：</span>
            <input
              type="text"
              value={novelTitle}
              onChange={(e) => handleNovelTitle(e.target.value)}
              onBlur={() => {
                const trimmed = novelTitle.trim()
                if (!trimmed && novel) setNovelTitle(novel.title)
                else if (trimmed !== novelTitle) setNovelTitle(trimmed)
              }}
              className="min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-ink outline-none hover:border-border focus:border-accent dark:text-stone-200 dark:hover:border-border-dark"
              aria-label="小说书名"
              title="点击修改书名"
            />
          </label>
          <span className="shrink-0 text-xs text-ink-muted dark:text-stone-600">
            {saveStatus === 'saving' ? '保存中…' : '已自动保存'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitle(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-lg font-medium text-ink outline-none dark:text-stone-100"
            aria-label="章节标题"
          />
          <button
            type="button"
            onClick={() => setShowTotalOutline((v) => !v)}
            className="shrink-0 text-xs text-accent hover:underline"
          >
            {showTotalOutline ? '收起全书总纲 ▲' : '编辑全书总纲 ▼'}
          </button>
        </div>
        {showTotalOutline && (
          <textarea
            value={totalOutline}
            onChange={(e) => handleTotalOutline(e.target.value)}
            placeholder="世界观、主角设定、终极目标……"
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-border bg-white/60 p-2 text-sm outline-none dark:border-border-dark dark:bg-stone-900/40"
          />
        )}
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-2 dark:border-border-dark">
        <div className="flex rounded-lg border border-border bg-white/40 p-0.5 dark:border-border-dark dark:bg-stone-900/30">
          {mainTabs.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMainTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                mainTab === id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink dark:text-stone-500 dark:hover:text-stone-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportChapter}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5"
          >
            📤 导出本章
          </button>
          <button
            type="button"
            onClick={onExportNovel}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-black/5 dark:border-border-dark dark:hover:bg-white/5"
          >
            📚 导出全书
          </button>
        </div>
      </div>

      {mainTab === 'content' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          <textarea
            value={content}
            onChange={(e) => handleContent(e.target.value)}
            placeholder="在这里开始写作……"
            className="editor-scroll min-h-0 flex-1 resize-none rounded-lg border border-border bg-white/60 p-4 font-serif text-base leading-relaxed text-ink outline-none focus:border-accent/50 dark:border-border-dark dark:bg-stone-900/40 dark:text-stone-200"
            aria-label="章节正文"
          />
          <p className="mt-2 shrink-0 text-right text-xs text-ink-muted dark:text-stone-500">
            本章 {wordCount.toLocaleString()} 字
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          <OutlineSection
            chapterId={chapter.id}
            chapterTitle={title}
            outline={outline}
            outlineFlowchart={outlineFlowchart}
            onChangeOutline={handleOutline}
            onChangeOutlineFlowchart={handleOutlineFlowchart}
            onExtractOutline={onExtractOutline}
            extracting={extracting}
          />
        </div>
      )}
    </main>
  )
}
