import { Modal } from './Modal'

interface HelpGuideModalProps {
  open: boolean
  onClose: () => void
  isFirstVisit?: boolean
}

const SECTIONS = [
  {
    title: '📚 基本操作',
    items: [
      '左侧：管理小说与章节，点击章节即可编辑',
      '中间：写作区，含章节标题、正文、大纲',
      '右侧：AI 写作助手（默认折叠，点 🤖 展开）',
      '顶部 ◀ ▶ 按钮可折叠左右面板，专注码字',
    ],
  },
  {
    title: '✍️ 写作与保存',
    items: [
      '正文、大纲修改后自动保存到浏览器本地',
      '可编辑「全书总纲」，为 AI 提供世界观上下文',
      '章节列表支持拖拽 ⠿ 图标调整顺序',
    ],
  },
  {
    title: '📥 导入',
    items: [
      '支持三种方式：粘贴文字、选择 .txt、选择 .zip 压缩包',
      'TXT：自动识别 1.章节名、1、章节名、第1章 等',
      'ZIP：可导入「文件夹」结构，含全书大纲与各章正文',
      'ZIP 推荐：小说名/大纲.txt + 1.章名.txt；或 小说名/1.章名/正文.txt + 大纲.txt',
      '可创建新小说、替换当前章节或追加到末尾',
    ],
  },
  {
    title: '🤖 AI 功能',
    items: [
      '首次使用：点 ⚙️ 配置 API Key（支持 DeepSeek / OpenAI 等）',
      '「纯文字大纲」：生成 100-200 字情节摘要',
      '「流程图大纲」：生成 Mermaid 情节流程图，支持可视化预览',
      '「AI 写作助手」：基于总纲 + 章节大纲给出剧情建议',
      'API Key 仅保存在本地，不会上传',
    ],
  },
  {
    title: '📤 导出与其他',
    items: [
      '可导出单章或全书为 TXT 文件',
      '流程图大纲可导出为 PNG 图片',
      '安卓版导出时会弹出系统分享，可保存到手机',
      '数据存在本地，清除缓存/卸载会丢失，请定期导出备份',
      '浏览器可安装为 PWA；安卓工程见项目 ANDROID.md',
    ],
  },
]

export function HelpGuideModal({ open, onClose, isFirstVisit }: HelpGuideModalProps) {
  return (
    <Modal
      open={open}
      title={isFirstVisit ? '👋 欢迎使用小说助手' : '📖 使用说明'}
      onClose={onClose}
      size="lg"
    >
      {isFirstVisit && (
        <p className="mb-4 text-sm text-ink-muted dark:text-stone-400">
          这是一款帮助网文作者解决「卡文」问题的写作工具。下面是快速上手指南：
        </p>
      )}

      <div className="editor-scroll max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="mb-2 text-sm font-semibold text-ink dark:text-stone-200">
              {section.title}
            </h3>
            <ul className="space-y-1.5 text-sm text-ink-muted dark:text-stone-400">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="shrink-0 text-accent">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-accent px-5 py-2 text-sm text-white hover:bg-accent-hover"
        >
          {isFirstVisit ? '开始写作' : '知道了'}
        </button>
      </div>
    </Modal>
  )
}
