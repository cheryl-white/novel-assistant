import type { AppData, AppSettings, Chapter, ChatMessage, Novel } from '../types'
import { DEFAULT_SETTINGS } from '../types'

/** 全部业务数据存在浏览器 / App 本地，无账号、无服务器同步 */
export const STORAGE_KEY = 'novel-assistant-data'
export const SESSION_KEY = 'novel-assistant-session'

export interface SessionState {
  selectedNovelId: string | null
  selectedChapterId: string | null
}

function emptyData(): AppData {
  return {
    novels: [],
    chapters: [],
    chatMessages: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

function normalizeData(parsed: Partial<AppData>): AppData {
  return {
    novels: parsed.novels ?? [],
    chapters: (parsed.chapters ?? []).map((c) => ({
      ...c,
      outline: c.outline ?? '',
      outline_flowchart: c.outline_flowchart ?? '',
      content: c.content ?? '',
      title: c.title ?? '未命名章节',
    })),
    chatMessages: parsed.chatMessages ?? [],
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
  }
}

/** 从本地读取全部数据；首次使用返回空数据（不注入演示小说） */
export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const empty = emptyData()
      saveAppData(empty)
      return empty
    }
    return normalizeData(JSON.parse(raw) as Partial<AppData>)
  } catch (err) {
    console.error('[novel-assistant] 读取本地数据失败', err)
    return emptyData()
  }
}

/** 同步写入本地；失败时抛出，便于上层提示 */
export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('[novel-assistant] 写入本地数据失败（可能空间不足）', err)
    throw err instanceof Error ? err : new Error('本地保存失败')
  }
}

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return { selectedNovelId: null, selectedChapterId: null }
    const parsed = JSON.parse(raw) as Partial<SessionState>
    return {
      selectedNovelId: parsed.selectedNovelId ?? null,
      selectedChapterId: parsed.selectedChapterId ?? null,
    }
  } catch {
    return { selectedNovelId: null, selectedChapterId: null }
  }
}

export function saveSession(session: SessionState): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // 会话状态丢失不影响正文
  }
}

export function getChaptersForNovel(chapters: Chapter[], novelId: string): Chapter[] {
  return chapters.filter((c) => c.novel_id === novelId).sort((a, b) => a.order - b.order)
}

export function getChatForNovel(messages: ChatMessage[], novelId: string): ChatMessage[] {
  return messages
    .filter((m) => m.novel_id === novelId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export type { Novel, Chapter, ChatMessage, AppSettings, AppData }
