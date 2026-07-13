import { useEffect, useState } from 'react'
import { AiChatPanel } from './components/AiChatPanel'
import { EditorPanel } from './components/EditorPanel'
import { ConfirmDialog } from './components/Modal'
import { HelpGuideModal } from './components/HelpGuideModal'
import { ImportTxtModal } from './components/ImportTxtModal'
import { PromptModal, SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { askPlotAssistant, extractChapterOutline, type OutlineFormat } from './lib/ai'
import { exportChapterTxt, exportNovelTxt } from './lib/export'
import { useNovelStore } from './hooks/useNovelStore'
import { useLayoutPrefs } from './hooks/useLayoutPrefs'
import { useOnboarding } from './hooks/useOnboarding'

function App() {
  const store = useNovelStore()
  const layout = useLayoutPrefs()
  const onboarding = useOnboarding()
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createNovelOpen, setCreateNovelOpen] = useState(false)
  const [renameNovelOpen, setRenameNovelOpen] = useState(false)
  const [importTxtOpen, setImportTxtOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'novel' | 'chapter'
    id: string
  } | null>(null)
  const [extracting, setExtracting] = useState<OutlineFormat | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (store.storageError) showToast(store.storageError)
  }, [store.storageError])

  const handleExtractOutline = async (format: OutlineFormat) => {
    if (!store.selectedChapter) return
    setExtracting(format)
    try {
      const outline = await extractChapterOutline(
        store.settings,
        store.selectedChapter.content,
        format,
      )
      store.updateChapter(
        store.selectedChapter.id,
        format === 'flowchart' ? { outline_flowchart: outline } : { outline },
      )
      showToast(format === 'flowchart' ? '流程图大纲生成成功' : '文字大纲提取成功')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '提取失败')
    } finally {
      setExtracting(null)
    }
  }

  const handleChatSend = async (message: string) => {
    if (!store.selectedNovel || !store.selectedNovelId) return
    store.addChatMessage(store.selectedNovelId, 'user', message)
    setChatLoading(true)
    try {
      const reply = await askPlotAssistant(
        store.settings,
        store.selectedNovel,
        store.novelChapters,
        store.selectedChapterId,
        message,
      )
      store.addChatMessage(store.selectedNovelId, 'assistant', reply)
    } catch (err) {
      store.addChatMessage(
        store.selectedNovelId,
        'assistant',
        `❌ ${err instanceof Error ? err.message : '请求失败'}`,
      )
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-paper text-ink dark:bg-paper-dark dark:text-stone-100">
      <Sidebar
        novels={store.novels}
        chapters={store.chapters}
        selectedNovelId={store.selectedNovelId}
        selectedChapterId={store.selectedChapterId}
        totalWordCount={store.totalWordCount}
        onSelectNovel={store.selectNovel}
        onSelectChapter={store.setSelectedChapterId}
        onCreateNovel={() => setCreateNovelOpen(true)}
        onDeleteNovel={(id) => setDeleteTarget({ type: 'novel', id })}
        onRenameNovel={() => setRenameNovelOpen(true)}
        onCreateChapter={() => store.selectedNovelId && store.createChapter(store.selectedNovelId)}
        onDeleteChapter={(id) => setDeleteTarget({ type: 'chapter', id })}
        onMoveChapter={store.moveChapter}
        onOpenSettings={() => setSettingsOpen(true)}
        onImportTxt={() => setImportTxtOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        collapsed={layout.sidebarCollapsed}
        onToggleCollapse={layout.toggleSidebar}
      />

      <EditorPanel
        key={store.selectedChapterId ?? 'none'}
        novel={store.selectedNovel}
        chapter={store.selectedChapter}
        novelChapters={store.novelChapters}
        sidebarCollapsed={layout.sidebarCollapsed}
        aiPanelCollapsed={layout.aiPanelCollapsed}
        onToggleSidebar={layout.toggleSidebar}
        onToggleAiPanel={layout.toggleAiPanel}
        onUpdateNovel={(patch) =>
          store.selectedNovelId && store.updateNovel(store.selectedNovelId, patch)
        }
        onUpdateChapter={(patch) =>
          store.selectedChapter && store.updateChapter(store.selectedChapter.id, patch)
        }
        onExtractOutline={handleExtractOutline}
        onExportChapter={() => {
          if (!store.selectedNovel || !store.selectedChapter) return
          void exportChapterTxt(store.selectedNovel, store.selectedChapter)
            .then(() => showToast('本章已导出'))
            .catch((err) => showToast(err instanceof Error ? err.message : '导出失败'))
        }}
        onExportNovel={() => {
          if (!store.selectedNovel) return
          void exportNovelTxt(store.selectedNovel, store.novelChapters)
            .then(() => showToast('全书已导出'))
            .catch((err) => showToast(err instanceof Error ? err.message : '导出失败'))
        }}
        extracting={extracting}
      />

      <AiChatPanel
        messages={store.novelChat}
        novelTitle={store.selectedNovel?.title ?? null}
        loading={chatLoading}
        hasApiKey={!!store.settings.apiKey.trim()}
        collapsed={layout.aiPanelCollapsed}
        onToggleCollapse={layout.toggleAiPanel}
        onSend={handleChatSend}
        onClear={() => store.selectedNovelId && store.clearChat(store.selectedNovelId)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        open={settingsOpen}
        settings={store.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={store.updateSettings}
      />

      <HelpGuideModal
        open={onboarding.guideOpen || helpOpen}
        isFirstVisit={onboarding.guideOpen}
        onClose={() => {
          if (onboarding.guideOpen) onboarding.closeGuide()
          setHelpOpen(false)
        }}
      />

      <ImportTxtModal
        open={importTxtOpen}
        currentNovelTitle={store.selectedNovel?.title ?? null}
        onClose={() => setImportTxtOpen(false)}
        onImport={({ novelTitle, chapters, mode, totalOutline }) => {
          store.importFromTxt(
            novelTitle,
            chapters,
            mode,
            mode !== 'new' ? (store.selectedNovelId ?? undefined) : undefined,
            totalOutline,
          )
          showToast(`已导入 ${chapters.length} 个章节`)
        }}
      />

      <PromptModal
        open={createNovelOpen}
        title="新建小说"
        placeholder="输入小说标题"
        onConfirm={(title) => {
          store.createNovel(title)
          setCreateNovelOpen(false)
        }}
        onCancel={() => setCreateNovelOpen(false)}
      />

      <PromptModal
        key={`rename-${store.selectedNovelId ?? 'none'}`}
        open={renameNovelOpen}
        title="修改书名"
        placeholder="输入新的小说标题"
        defaultValue={store.selectedNovel?.title ?? ''}
        onConfirm={(title) => {
          if (store.selectedNovelId) store.updateNovel(store.selectedNovelId, { title })
          setRenameNovelOpen(false)
        }}
        onCancel={() => setRenameNovelOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget?.type === 'novel'}
        title="删除小说"
        message="确定删除这本小说吗？所有章节、大纲和聊天记录将一并删除，且无法恢复。"
        onConfirm={() => {
          if (deleteTarget) store.deleteNovel(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget?.type === 'chapter'}
        title="删除章节"
        message="确定删除这一章吗？正文和大纲将一并删除，且无法恢复。"
        onConfirm={() => {
          if (deleteTarget) store.deleteChapter(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg dark:bg-stone-800">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
