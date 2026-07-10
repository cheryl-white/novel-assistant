import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types'
import { PanelToggle } from './PanelToggle'

interface AiChatPanelProps {
  messages: ChatMessage[]
  novelTitle: string | null
  loading: boolean
  hasApiKey: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  onSend: (message: string) => Promise<void>
  onClear: () => void
  onOpenSettings: () => void
}

export function AiChatPanel({
  messages,
  novelTitle,
  loading,
  hasApiKey,
  collapsed,
  onToggleCollapse,
  onSend,
  onClear,
  onOpenSettings,
}: AiChatPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, collapsed])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    await onSend(text)
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-l border-border bg-sidebar transition-[width] duration-200 ease-in-out dark:border-border-dark dark:bg-sidebar-dark ${
        collapsed ? 'w-12' : 'w-72 xl:w-80'
      }`}
    >
      {collapsed ? (
        <div className="flex h-full flex-col items-center py-3">
          <PanelToggle
            collapsed={collapsed}
            onToggle={onToggleCollapse}
            side="right"
            label="AI 助手"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="relative mt-3 rounded p-2 text-lg hover:bg-black/5 dark:hover:bg-white/10"
            title="展开 AI 助手"
          >
            🤖
            {messages.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between border-b border-border px-4 py-3 dark:border-border-dark">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink dark:text-stone-100">🤖 AI 写作助手</h2>
              {novelTitle ? (
                <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-stone-500">
                  上下文：{novelTitle}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-ink-muted dark:text-stone-500">
                  请先选择一本小说
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs text-ink-muted hover:text-red-500"
                >
                  清空
                </button>
              )}
              <PanelToggle
                collapsed={collapsed}
                onToggle={onToggleCollapse}
                side="right"
                label="AI 助手"
              />
            </div>
          </div>

          <div className="editor-scroll flex-1 space-y-4 overflow-y-auto p-4">
            {!hasApiKey && (
              <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
                使用 AI 功能需先配置 API Key。
                <button type="button" onClick={onOpenSettings} className="ml-1 underline">
                  去设置
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="space-y-2 text-center text-sm text-ink-muted dark:text-stone-500">
                <p>卡文了？在这里向 AI 求助吧</p>
                <p className="text-xs">试试问：「下一章该怎么写？」</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-white'
                        : 'border border-border bg-white text-ink dark:border-border-dark dark:bg-stone-900/60 dark:text-stone-200'
                    }`}
                  >
                    <p className="mb-1 text-xs opacity-70">{msg.role === 'user' ? '你' : 'AI'}</p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink-muted dark:border-border-dark dark:bg-stone-900/60">
                  AI 思考中…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3 dark:border-border-dark">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                disabled={!novelTitle || loading}
                placeholder="输入问题，如：下一章该怎么写？"
                className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50 dark:border-border-dark dark:bg-stone-900/40 dark:text-stone-300"
              />
              <button
                type="button"
                disabled={!input.trim() || !novelTitle || loading}
                onClick={() => void handleSend()}
                className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
