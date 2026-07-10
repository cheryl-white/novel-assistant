import { useEffect, useId, useRef, useState } from 'react'
import type { OutlineFormat } from '../lib/ai'
import { exportFlowchartPng, exportFlowchartPngFromElement } from '../lib/export'
import {
  beautifyFlowchartSvg,
  enhanceFlowchartVisuals,
  FLOWCHART_PREVIEW_CSS,
} from '../lib/flowchartStyle'

type OutlineTab = 'text' | 'flowchart'

interface MermaidPreviewProps {
  code: string
  onSvgChange?: (svg: string) => void
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function MermaidPreview({ code, onSvgChange, containerRef }: MermaidPreviewProps) {
  const id = useId().replace(/:/g, '')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const trimmed = code.trim()
    if (!trimmed) {
      setSvg('')
      setError('')
      onSvgChange?.('')
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const styledCode = enhanceFlowchartVisuals(trimmed)
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: 'Segoe UI, PingFang SC, Microsoft YaHei, sans-serif',
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
            padding: 18,
            nodeSpacing: 55,
            rankSpacing: 60,
          },
          themeVariables: {
            fontSize: '13px',
            fontFamily: 'Segoe UI, PingFang SC, Microsoft YaHei, sans-serif',
            lineColor: '#8899aa',
            primaryTextColor: '#1a2332',
            primaryColor: '#6BA3E8',
            primaryBorderColor: '#4A88D0',
            secondaryColor: '#62C082',
            tertiaryColor: '#E8A055',
          },
        })
        const { svg: rendered } = await mermaid.render(`outline-${id}-${Date.now()}`, styledCode)
        if (!cancelled) {
          const beautified = beautifyFlowchartSvg(rendered, id)
          setSvg(beautified)
          setError('')
          onSvgChange?.(beautified)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg('')
          setError(err instanceof Error ? err.message : '流程图渲染失败')
          onSvgChange?.('')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <p className="rounded-md border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
        预览失败：{error}（可展开下方「编辑代码」修改 Mermaid 语法）
      </p>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-gradient-to-br from-slate-50 to-white py-8 dark:border-border-dark dark:from-stone-900/40 dark:to-stone-900/20">
        <p className="text-xs text-ink-muted dark:text-stone-500">流程图渲染中…</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-flowchart-preview overflow-x-auto rounded-xl border border-border bg-gradient-to-br from-[#eef2f8] via-[#f5f7fb] to-[#e8edf5] p-5 dark:border-border-dark dark:from-stone-900/50 dark:via-stone-900/30 dark:to-stone-900/20"
    >
      <style>{FLOWCHART_PREVIEW_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}

interface OutlineSectionProps {
  chapterId: string
  chapterTitle: string
  outline: string
  outlineFlowchart: string
  onChangeOutline: (v: string) => void
  onChangeOutlineFlowchart: (v: string) => void
  onExtractOutline: (format: OutlineFormat) => Promise<void>
  extracting: OutlineFormat | null
}

export function OutlineSection({
  chapterId,
  chapterTitle,
  outline,
  outlineFlowchart,
  onChangeOutline,
  onChangeOutlineFlowchart,
  onExtractOutline,
  extracting,
}: OutlineSectionProps) {
  const [tab, setTab] = useState<OutlineTab>('text')
  const [showCode, setShowCode] = useState(false)
  const [previewSvg, setPreviewSvg] = useState('')
  const [exportingPng, setExportingPng] = useState(false)
  const [exportError, setExportError] = useState('')
  const prevExtracting = useRef<OutlineFormat | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const onSvgChange = useRef((svg: string) => setPreviewSvg(svg)).current

  useEffect(() => {
    if (prevExtracting.current === 'flowchart' && extracting === null) {
      setTab('flowchart')
    }
    prevExtracting.current = extracting
  }, [extracting])

  useEffect(() => {
    setTab('text')
    setShowCode(false)
    setPreviewSvg('')
    setExportError('')
  }, [chapterId])

  const handleExportPng = async () => {
    setExportingPng(true)
    setExportError('')
    const filename = `${chapterTitle || '章节'}-流程图大纲`
    try {
      const svgEl = previewRef.current?.querySelector('svg')
      if (svgEl instanceof SVGSVGElement) {
        await exportFlowchartPngFromElement(svgEl, filename)
      } else if (previewSvg) {
        await exportFlowchartPng(previewSvg, filename)
      } else {
        throw new Error('流程图尚未渲染完成，请稍后再试')
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExportingPng(false)
    }
  }

  const tabs: { id: OutlineTab; label: string; icon: string }[] = [
    { id: 'text', label: '纯文字大纲', icon: '📝' },
    { id: 'flowchart', label: '流程图大纲', icon: '📊' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0">
        <div className="flex rounded-lg border border-border bg-white/40 p-0.5 dark:border-border-dark dark:bg-stone-900/30">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                tab === id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink dark:text-stone-500 dark:hover:text-stone-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'text' ? (
          <>
            <textarea
              value={outline}
              onChange={(e) => onChangeOutline(e.target.value)}
              placeholder="文字大纲将显示在这里，可手动编辑或通过 AI 提取……"
              className="editor-scroll min-h-[200px] w-full resize-y rounded-lg border border-border bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-accent/50 dark:border-border-dark dark:bg-stone-900/40 dark:text-stone-300"
              aria-label="纯文字大纲"
            />
            <div className="mt-3">
              <button
                type="button"
                disabled={!!extracting}
                onClick={() => void onExtractOutline('text')}
                className="rounded-md bg-accent px-4 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {extracting === 'text' ? '提取中…' : '🤖 AI 提取文字大纲'}
              </button>
            </div>
          </>
        ) : (
          <>
            {outlineFlowchart.trim() ? (
              <MermaidPreview
                code={outlineFlowchart}
                onSvgChange={onSvgChange}
                containerRef={previewRef}
              />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-10 dark:border-border-dark">
                <p className="text-xs text-ink-muted dark:text-stone-500">
                  暂无流程图，点击下方按钮由 AI 生成
                </p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!!extracting}
                onClick={() => void onExtractOutline('flowchart')}
                className="rounded-md border border-accent bg-accent/10 px-4 py-1.5 text-sm text-accent hover:bg-accent/20 disabled:opacity-60"
              >
                {extracting === 'flowchart' ? '生成中…' : '🤖 AI 生成流程图大纲'}
              </button>
              {outlineFlowchart.trim() !== '' && (
                <>
                  <button
                    type="button"
                    disabled={!previewSvg || exportingPng}
                    onClick={() => void handleExportPng()}
                    className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-border-dark dark:hover:bg-white/5"
                  >
                    {exportingPng ? '导出中…' : '🖼 导出 PNG'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    className="text-xs text-accent hover:underline"
                  >
                    {showCode ? '收起代码 ▲' : '编辑代码 ▼'}
                  </button>
                </>
              )}
            </div>
            {exportError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{exportError}</p>
            )}
            {showCode && (
              <textarea
                value={outlineFlowchart}
                onChange={(e) => onChangeOutlineFlowchart(e.target.value)}
                placeholder={'flowchart TD\n  A[开端] --> B[冲突]\n  B --> C[结局]'}
                rows={6}
                className="editor-scroll mt-3 w-full resize-y rounded-lg border border-border bg-white/60 p-3 font-mono text-sm leading-relaxed text-ink outline-none focus:border-accent/50 dark:border-border-dark dark:bg-stone-900/40 dark:text-stone-300"
                aria-label="流程图大纲 Mermaid 代码"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
