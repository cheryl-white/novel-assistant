export interface Novel {
  id: string
  title: string
  total_outline: string
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  novel_id: string
  title: string
  order: number
  content: string
  outline: string
  outline_flowchart: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  novel_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AppSettings {
  apiKey: string
  apiBaseUrl: string
  model: string
}

export interface AppData {
  novels: Novel[]
  chapters: Chapter[]
  chatMessages: ChatMessage[]
  settings: AppSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
}
