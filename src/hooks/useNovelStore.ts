import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateId, nowIso } from '../lib/id'
import {
  getChaptersForNovel,
  getChatForNovel,
  loadAppData,
  loadSession,
  saveAppData,
  saveSession,
  type AppData,
  type AppSettings,
  type Chapter,
  type ChatMessage,
  type Novel,
} from '../lib/storage'

function resolveInitialSelection(data: AppData) {
  const session = loadSession()
  const novelExists = session.selectedNovelId
    ? data.novels.some((n) => n.id === session.selectedNovelId)
    : false
  const novelId = novelExists ? session.selectedNovelId : (data.novels[0]?.id ?? null)

  if (!novelId) {
    return { novelId: null, chapterId: null }
  }

  const list = getChaptersForNovel(data.chapters, novelId)
  const chapterExists = session.selectedChapterId
    ? list.some((c) => c.id === session.selectedChapterId)
    : false

  return {
    novelId,
    chapterId: chapterExists ? session.selectedChapterId : (list[0]?.id ?? null),
  }
}

export function useNovelStore() {
  const [boot] = useState(() => {
    const initialData = loadAppData()
    const selection = resolveInitialSelection(initialData)
    return { data: initialData, ...selection }
  })
  const [data, setData] = useState<AppData>(() => boot.data)
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(() => boot.novelId)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => boot.chapterId)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    try {
      saveAppData(data)
      setStorageError(null)
    } catch {
      setStorageError('本地存储空间不足或不可用，请导出备份后清理浏览器数据')
    }
  }, [data])

  useEffect(() => {
    saveSession({ selectedNovelId, selectedChapterId })
  }, [selectedNovelId, selectedChapterId])

  // 确保选中的章节有效且属于当前小说
  useEffect(() => {
    if (!selectedNovelId) {
      if (selectedChapterId) setSelectedChapterId(null)
      return
    }
    const list = getChaptersForNovel(data.chapters, selectedNovelId)
    if (list.length === 0) {
      if (selectedChapterId) setSelectedChapterId(null)
      return
    }
    const valid = list.some((c) => c.id === selectedChapterId)
    if (!valid) setSelectedChapterId(list[0].id)
  }, [selectedNovelId, selectedChapterId, data.chapters])

  const novels = data.novels
  const chapters = data.chapters
  const chatMessages = data.chatMessages
  const settings = data.settings

  const selectedNovel = useMemo(
    () => novels.find((n) => n.id === selectedNovelId) ?? null,
    [novels, selectedNovelId],
  )

  const novelChapters = useMemo(
    () => (selectedNovelId ? getChaptersForNovel(chapters, selectedNovelId) : []),
    [chapters, selectedNovelId],
  )

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId],
  )

  const novelChat = useMemo(
    () => (selectedNovelId ? getChatForNovel(chatMessages, selectedNovelId) : []),
    [chatMessages, selectedNovelId],
  )

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(updater)
  }, [])

  const selectNovel = useCallback(
    (novelId: string) => {
      setSelectedNovelId(novelId)
      const first = getChaptersForNovel(chapters, novelId)[0]
      setSelectedChapterId(first?.id ?? null)
    },
    [chapters],
  )

  const createNovel = useCallback(
    (title: string) => {
      const id = generateId()
      const ts = nowIso()
      const novel: Novel = { id, title, total_outline: '', created_at: ts, updated_at: ts }
      const chapter: Chapter = {
        id: generateId(),
        novel_id: id,
        title: '第一章',
        order: 1,
        content: '',
        outline: '',
        outline_flowchart: '',
        created_at: ts,
        updated_at: ts,
      }
      updateData((prev) => ({
        ...prev,
        novels: [novel, ...prev.novels],
        chapters: [...prev.chapters, chapter],
      }))
      setSelectedNovelId(id)
      setSelectedChapterId(chapter.id)
    },
    [updateData],
  )

  const deleteNovel = useCallback(
    (novelId: string) => {
      updateData((prev) => ({
        ...prev,
        novels: prev.novels.filter((n) => n.id !== novelId),
        chapters: prev.chapters.filter((c) => c.novel_id !== novelId),
        chatMessages: prev.chatMessages.filter((m) => m.novel_id !== novelId),
      }))
      if (selectedNovelId === novelId) {
        const remaining = novels.filter((n) => n.id !== novelId)
        const nextNovel = remaining[0]
        setSelectedNovelId(nextNovel?.id ?? null)
        setSelectedChapterId(
          nextNovel ? (getChaptersForNovel(chapters, nextNovel.id)[0]?.id ?? null) : null,
        )
      }
    },
    [updateData, selectedNovelId, novels, chapters],
  )

  const updateNovel = useCallback(
    (novelId: string, patch: Partial<Pick<Novel, 'title' | 'total_outline'>>) => {
      updateData((prev) => ({
        ...prev,
        novels: prev.novels.map((n) =>
          n.id === novelId ? { ...n, ...patch, updated_at: nowIso() } : n,
        ),
      }))
    },
    [updateData],
  )

  const createChapter = useCallback(
    (novelId: string) => {
      const existing = getChaptersForNovel(chapters, novelId)
      const order = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 1
      const ts = nowIso()
      const chapter: Chapter = {
        id: generateId(),
        novel_id: novelId,
        title: `第${order}章`,
        order,
        content: '',
        outline: '',
        outline_flowchart: '',
        created_at: ts,
        updated_at: ts,
      }
      updateData((prev) => ({ ...prev, chapters: [...prev.chapters, chapter] }))
      setSelectedChapterId(chapter.id)
    },
    [chapters, updateData],
  )

  const deleteChapter = useCallback(
    (chapterId: string) => {
      const chapter = chapters.find((c) => c.id === chapterId)
      if (!chapter) return
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.filter((c) => c.id !== chapterId),
      }))
      if (selectedChapterId === chapterId) {
        const remaining = getChaptersForNovel(
          chapters.filter((c) => c.id !== chapterId),
          chapter.novel_id,
        )
        setSelectedChapterId(remaining[0]?.id ?? null)
      }
    },
    [chapters, selectedChapterId, updateData],
  )

  const updateChapter = useCallback(
    (
      chapterId: string,
      patch: Partial<Pick<Chapter, 'title' | 'content' | 'outline' | 'outline_flowchart'>>,
    ) => {
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === chapterId ? { ...c, ...patch, updated_at: nowIso() } : c,
        ),
      }))
    },
    [updateData],
  )

  const reorderChapter = useCallback(
    (chapterId: string, direction: 'up' | 'down') => {
      const chapter = chapters.find((c) => c.id === chapterId)
      if (!chapter) return
      const list = getChaptersForNovel(chapters, chapter.novel_id)
      const idx = list.findIndex((c) => c.id === chapterId)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= list.length) return

      const a = list[idx]
      const b = list[swapIdx]
      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.id === a.id) return { ...c, order: b.order, updated_at: nowIso() }
          if (c.id === b.id) return { ...c, order: a.order, updated_at: nowIso() }
          return c
        }),
      }))
    },
    [chapters, updateData],
  )

  const moveChapter = useCallback(
    (fromId: string, toId: string) => {
      const from = chapters.find((c) => c.id === fromId)
      const to = chapters.find((c) => c.id === toId)
      if (!from || !to || from.novel_id !== to.novel_id || fromId === toId) return

      const list = getChaptersForNovel(chapters, from.novel_id)
      const fromIdx = list.findIndex((c) => c.id === fromId)
      const toIdx = list.findIndex((c) => c.id === toId)
      if (fromIdx === -1 || toIdx === -1) return

      const reordered = [...list]
      const [removed] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, removed)

      updateData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) => {
          if (c.novel_id !== from.novel_id) return c
          const newOrder = reordered.findIndex((r) => r.id === c.id) + 1
          return { ...c, order: newOrder, updated_at: nowIso() }
        }),
      }))
    },
    [chapters, updateData],
  )

  const addChatMessage = useCallback(
    (novelId: string, role: 'user' | 'assistant', content: string) => {
      const msg: ChatMessage = {
        id: generateId(),
        novel_id: novelId,
        role,
        content,
        timestamp: nowIso(),
      }
      updateData((prev) => ({ ...prev, chatMessages: [...prev.chatMessages, msg] }))
    },
    [updateData],
  )

  const clearChat = useCallback(
    (novelId: string) => {
      updateData((prev) => ({
        ...prev,
        chatMessages: prev.chatMessages.filter((m) => m.novel_id !== novelId),
      }))
    },
    [updateData],
  )

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      updateData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    },
    [updateData],
  )

  const importFromTxt = useCallback(
    (
      novelTitle: string,
      parsed: Array<{ title: string; content: string; outline?: string }>,
      mode: 'new' | 'replace' | 'append',
      targetNovelId?: string,
      totalOutline?: string,
    ) => {
      const ts = nowIso()

      if (mode === 'new') {
        const novelId = generateId()
        const novel: Novel = {
          id: novelId,
          title: novelTitle,
          total_outline: totalOutline?.trim() ?? '',
          created_at: ts,
          updated_at: ts,
        }
        const newChapters: Chapter[] = parsed.map((p, i) => ({
          id: generateId(),
          novel_id: novelId,
          title: p.title,
          order: i + 1,
          content: p.content,
          outline: p.outline?.trim() ?? '',
          outline_flowchart: '',
          created_at: ts,
          updated_at: ts,
        }))
        updateData((prev) => ({
          ...prev,
          novels: [novel, ...prev.novels],
          chapters: [...prev.chapters, ...newChapters],
        }))
        setSelectedNovelId(novelId)
        setSelectedChapterId(newChapters[0]?.id ?? null)
        return novelId
      }

      const novelId = targetNovelId ?? selectedNovelId
      if (!novelId) return null

      const existing = getChaptersForNovel(chapters, novelId)
      const startOrder =
        mode === 'append' && existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 1

      const newChapters: Chapter[] = parsed.map((p, i) => ({
        id: generateId(),
        novel_id: novelId,
        title: p.title,
        order: startOrder + i,
        content: p.content,
        outline: p.outline?.trim() ?? '',
        outline_flowchart: '',
        created_at: ts,
        updated_at: ts,
      }))

      updateData((prev) => {
        const withoutOld =
          mode === 'replace' ? prev.chapters.filter((c) => c.novel_id !== novelId) : prev.chapters
        return {
          ...prev,
          novels: prev.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  updated_at: ts,
                  ...(totalOutline !== undefined
                    ? { total_outline: totalOutline.trim() || n.total_outline }
                    : {}),
                }
              : n,
          ),
          chapters: [...withoutOld, ...newChapters],
        }
      })
      setSelectedNovelId(novelId)
      setSelectedChapterId(newChapters[0]?.id ?? null)
      return novelId
    },
    [updateData, selectedNovelId, chapters],
  )

  const totalWordCount = useMemo(
    () => novelChapters.reduce((sum, ch) => sum + ch.content.replace(/\s/g, '').length, 0),
    [novelChapters],
  )

  return {
    novels,
    chapters,
    settings,
    selectedNovelId,
    selectedChapterId,
    selectedNovel,
    selectedChapter,
    novelChapters,
    novelChat,
    totalWordCount,
    storageError,
    selectNovel,
    setSelectedChapterId,
    createNovel,
    deleteNovel,
    updateNovel,
    createChapter,
    deleteChapter,
    updateChapter,
    reorderChapter,
    moveChapter,
    addChatMessage,
    clearChat,
    updateSettings,
    importFromTxt,
  }
}
