import { mockChapters, mockNovels } from '../data/mockData'
import type { AppData, AppSettings, Chapter, ChatMessage, Novel } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const STORAGE_KEY = 'novel-assistant-data'

function seedData(): AppData {
  return {
    novels: mockNovels.map((n) => ({ ...n, total_outline: n.total_outline ?? '' })),
    chapters: mockChapters.map((c) => ({ ...c, outline_flowchart: '' })),
    chatMessages: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedData()
      saveAppData(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      novels: parsed.novels ?? [],
      chapters: (parsed.chapters ?? []).map((c) => ({
        ...c,
        outline_flowchart: c.outline_flowchart ?? '',
      })),
      chatMessages: parsed.chatMessages ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    }
  } catch {
    const seeded = seedData()
    saveAppData(seeded)
    return seeded
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
