import { useState } from 'react'
import type { AppSettings } from '../types'
import { Modal } from './Modal'

interface SettingsModalProps {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings) => void
}

export function SettingsModal({ open, settings, onClose, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState(settings)

  const handleOpen = () => setDraft(settings)

  return (
    <Modal
      open={open}
      title="⚙️ AI 设置"
      onClose={() => {
        handleOpen()
        onClose()
      }}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted dark:text-stone-500">
            API Key
          </label>
          <input
            type="password"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
          />
          <p className="mt-1 text-xs text-ink-muted dark:text-stone-600">
            支持 OpenAI 兼容接口（DeepSeek、OpenAI 等），密钥仅保存在本地浏览器
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted dark:text-stone-500">
            API 地址
          </label>
          <input
            type="url"
            value={draft.apiBaseUrl}
            onChange={(e) => setDraft({ ...draft, apiBaseUrl: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted dark:text-stone-500">
            模型
          </label>
          <input
            type="text"
            value={draft.model}
            onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            placeholder="deepseek-chat"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm dark:border-border-dark"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
            className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  )
}

interface PromptModalProps {
  open: boolean
  title: string
  placeholder: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptModal({
  open,
  title,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue)

  if (open && value !== defaultValue && defaultValue && !value) {
    setValue(defaultValue)
  }

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
        className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-stone-900/40"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm dark:border-border-dark"
        >
          取消
        </button>
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => onConfirm(value.trim())}
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          确定
        </button>
      </div>
    </Modal>
  )
}
