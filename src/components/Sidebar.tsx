import { useState } from 'react'
import type { Chapter, Novel } from '../types'
import { PanelToggle } from './PanelToggle'

interface SidebarProps {
  novels: Novel[]
  chapters: Chapter[]
  selectedNovelId: string | null
  selectedChapterId: string | null
  totalWordCount: number
  onSelectNovel: (novelId: string) => void
  onSelectChapter: (chapterId: string) => void
  onCreateNovel: () => void
  onDeleteNovel: (novelId: string) => void
  onCreateChapter: () => void
  onDeleteChapter: (chapterId: string) => void
  onMoveChapter: (fromId: string, toId: string) => void
  onOpenSettings: () => void
  onImportTxt: () => void
  onOpenHelp: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  novels,
  chapters,
  selectedNovelId,
  selectedChapterId,
  totalWordCount,
  onSelectNovel,
  onSelectChapter,
  onCreateNovel,
  onDeleteNovel,
  onCreateChapter,
  onDeleteChapter,
  onMoveChapter,
  onOpenSettings,
  onImportTxt,
  onOpenHelp,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [dragId, setDragId] = useState<string | null>(null)

  const novelChapters = chapters
    .filter((c) => c.novel_id === selectedNovelId)
    .sort((a, b) => a.order - b.order)

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out dark:border-border-dark dark:bg-sidebar-dark ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      {collapsed ? (
        <div className="flex h-full flex-col items-center py-3">
          <PanelToggle
            collapsed={collapsed}
            onToggle={onToggleCollapse}
            side="left"
            label="侧边栏"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 rounded p-2 text-lg hover:bg-black/5 dark:hover:bg-white/10"
            title="展开侧边栏"
          >
            📚
          </button>
          <button
            type="button"
            onClick={onOpenHelp}
            className="mt-2 rounded p-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            title="使用说明"
          >
            ❓
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-auto rounded p-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            title="AI 设置"
          >
            ⚙️
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between border-b border-border px-4 py-3 dark:border-border-dark">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-ink dark:text-stone-100">📚 小说助手</h1>
              <p className="mt-0.5 text-xs text-ink-muted dark:text-stone-400">Novel Assistant</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenHelp}
                className="rounded p-1.5 text-sm text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
                title="使用说明"
              >
                ❓
              </button>
              <PanelToggle
                collapsed={collapsed}
                onToggle={onToggleCollapse}
                side="left"
                label="侧边栏"
              />
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded p-1.5 text-sm text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
                title="AI 设置"
              >
                ⚙️
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto editor-scroll">
            <div className="px-2 py-3">
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-stone-500">
                  我的小说
                </p>
                {selectedNovelId && (
                  <button
                    type="button"
                    onClick={() => onDeleteNovel(selectedNovelId)}
                    className="text-xs text-red-500 hover:text-red-600"
                    title="删除当前小说"
                  >
                    删除
                  </button>
                )}
              </div>
              <ul className="space-y-0.5">
                {novels.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-ink-muted">暂无小说，点击下方创建</li>
                ) : (
                  novels.map((novel) => (
                    <li key={novel.id}>
                      <button
                        type="button"
                        onClick={() => onSelectNovel(novel.id)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedNovelId === novel.id
                            ? 'bg-accent/15 font-medium text-accent dark:bg-accent/20'
                            : 'text-ink hover:bg-black/5 dark:text-stone-200 dark:hover:bg-white/5'
                        }`}
                      >
                        {novel.title}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {selectedNovelId && (
              <div className="border-t border-border px-2 py-3 dark:border-border-dark">
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-stone-500">
                    章节列表
                  </p>
                  <button
                    type="button"
                    onClick={onCreateChapter}
                    className="text-xs text-accent hover:text-accent-hover"
                  >
                    + 新建
                  </button>
                </div>
                <ul className="space-y-0.5">
                  {novelChapters.map((chapter) => (
                    <li
                      key={chapter.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragId && dragId !== chapter.id) onMoveChapter(dragId, chapter.id)
                        setDragId(null)
                      }}
                      className={`group flex items-center gap-0.5 ${dragId === chapter.id ? 'opacity-50' : ''}`}
                    >
                      <span
                        draggable
                        onDragStart={() => setDragId(chapter.id)}
                        onDragEnd={() => setDragId(null)}
                        className="shrink-0 cursor-grab px-0.5 text-xs text-ink-muted opacity-40 hover:opacity-100 active:cursor-grabbing"
                        title="拖拽排序"
                        aria-label="拖拽排序"
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectChapter(chapter.id)}
                        aria-current={selectedChapterId === chapter.id ? 'true' : undefined}
                        className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          selectedChapterId === chapter.id
                            ? 'bg-accent/15 font-medium text-accent dark:bg-accent/20'
                            : 'text-ink-muted hover:bg-black/5 hover:text-ink dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200'
                        }`}
                      >
                        <span className="line-clamp-1">{chapter.title}</span>
                        {!chapter.content && (
                          <span className="ml-1 text-xs opacity-60">（空）</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteChapter(chapter.id)}
                        className="shrink-0 rounded px-1.5 py-1 text-xs text-ink-muted opacity-0 hover:text-red-500 group-hover:opacity-100"
                        title="删除章节"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedNovelId && (
                  <p className="mt-3 px-2 text-xs text-ink-muted dark:text-stone-600">
                    全书 {totalWordCount.toLocaleString()} 字 · 拖拽可调整顺序
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border p-3 dark:border-border-dark">
            <button
              type="button"
              onClick={onImportTxt}
              className="w-full rounded-md border border-green-500/40 px-3 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 dark:border-green-600/40 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              📥 导入 TXT / ZIP
            </button>
            <button
              type="button"
              onClick={onCreateNovel}
              className="w-full rounded-md border border-dashed border-accent/50 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
            >
              + 新建小说
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
