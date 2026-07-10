import type { AppSettings, Chapter, Novel } from '../types'

export type OutlineFormat = 'text' | 'flowchart'

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

async function callAi(
  settings: AppSettings,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new Error('请先在设置中配置 AI API Key')
  }

  const base = settings.apiBaseUrl.replace(/\/$/, '')
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  })

  const data = (await response.json()) as ChatCompletionResponse
  if (!response.ok) {
    throw new Error(data.error?.message ?? `API 请求失败 (${response.status})`)
  }

  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('AI 返回内容为空')
  return text
}

/** 去掉 AI 可能包裹的 markdown 代码块 */
export function normalizeAiOutline(raw: string, format: OutlineFormat): string {
  let text = raw.trim()
  const fence = text.match(/^```(?:mermaid)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fence) text = fence[1].trim()

  if (format === 'flowchart' && !/^(flowchart|graph)\s/m.test(text)) {
    const inner = text.match(/```(?:mermaid)?\s*\n?([\s\S]*?)\n?```/i)
    if (inner) text = inner[1].trim()
  }

  return text
}

export function isFlowchartOutline(text: string): boolean {
  const t = text.trim()
  return /^(flowchart|graph)\s/m.test(t) || t.includes('-->')
}

export async function extractChapterOutline(
  settings: AppSettings,
  chapterContent: string,
  format: OutlineFormat = 'text',
): Promise<string> {
  if (!chapterContent.trim()) {
    throw new Error('请先撰写章节正文')
  }

  if (format === 'flowchart') {
    const raw = await callAi(
      settings,
      `你是一位资深小说编辑。请根据章节正文，用 Mermaid flowchart TD 语法绘制情节流程图。
要求：
- 以 flowchart TD 开头
- 普通情节节点用圆括号 () 包裹，如 A(林凡重生醒来)，内容为简要中文（8-15字）
- 分支/转折节点用菱形 {} 包裹，如 B{是否暴露能力}
- 用 --> 连接情节顺序，分支标注 |是| / |否| 等
- 涵盖本章核心情节、人物行动和关键转折
- 只输出 Mermaid 代码，不要 markdown 代码块，不要额外解释`,
      `请为以下章节绘制情节流程图：\n\n${chapterContent}`,
    )
    return normalizeAiOutline(raw, 'flowchart')
  }

  const raw = await callAi(
    settings,
    '你是一位资深小说编辑。请为小说章节提炼精简大纲（100-200字），概括核心情节、人物行动和关键转折。只输出大纲，不要评价。',
    `请为以下章节提炼大纲：\n\n${chapterContent}`,
  )
  return normalizeAiOutline(raw, 'text')
}

export async function askPlotAssistant(
  settings: AppSettings,
  novel: Novel,
  chapters: Chapter[],
  currentChapterId: string | null,
  question: string,
): Promise<string> {
  const sorted = [...chapters].sort((a, b) => a.order - b.order)
  const currentIndex = currentChapterId
    ? sorted.findIndex((c) => c.id === currentChapterId)
    : sorted.length

  const priorChapters = sorted.slice(0, currentIndex === -1 ? sorted.length : currentIndex)
  const outlineList = priorChapters
    .filter((c) => c.outline.trim())
    .map((c) => `${c.title}：${c.outline}`)
    .join('\n')

  const context = `【全书总纲】
${novel.total_outline || '（暂无）'}

【已完成章节大纲】
${outlineList || '（暂无）'}

【用户的问题】
${question}

请基于以上小说的大纲和脉络，回答用户的问题，给出合理的剧情发展建议，可提供 2-3 个不同走向选项。`

  return callAi(
    settings,
    '你是一位经验丰富的网文策划编辑，擅长帮助作者解决卡文问题，给出符合前文逻辑的剧情建议。',
    context,
  )
}
