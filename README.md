# 小说助手 · Novel Assistant

AI 辅助网文创作工具，帮助作者解决「卡文」问题。数据保存在本地，支持浏览器（PWA）与安卓 App。

## 功能

- **小说 / 章节管理** — 创建、删除、拖拽排序
- **正文与大纲** — Tab 切换编辑，自动保存
- **AI 大纲** — 纯文字大纲 / 流程图大纲（可导出 PNG）
- **AI 剧情助手** — 基于总纲与章节大纲给建议
- **导入** — 粘贴文字、TXT、ZIP 压缩包
- **导出** — 单章 / 全书 TXT；安卓走系统分享

## 快速开始

```bash
npm install
npm run dev
```

打开终端提示的地址（通常是 http://localhost:5173）。

## 工程化

| 命令                   | 说明                                                     |
| ---------------------- | -------------------------------------------------------- |
| `npm run format`       | 用 Prettier 格式化全部代码                               |
| `npm run format:check` | 检查格式是否符合规范                                     |
| `npm run lint`         | Oxlint 静态检查                                          |
| `git commit`           | 提交前自动对暂存文件执行 Prettier（Husky + lint-staged） |

## 配置 AI

1. 点击左侧栏 ⚙️ 打开设置
2. 填入 API Key（支持 DeepSeek、OpenAI 等兼容接口）
3. 默认：`https://api.deepseek.com`，模型 `deepseek-chat`

## 安卓版

详见 [ANDROID.md](./ANDROID.md)。常用：

```bash
npm run android:sync   # 构建并同步到 android/
npm run android:open   # 用 Android Studio 打开
```

## 构建发布（Web）

```bash
npm run build
npm run preview
```

将 `dist/` 部署到静态托管。上线后请把 `index.html` 里的 `canonical` / Open Graph URL，以及 `public/sitemap.xml` 中的地址改成你的正式域名。

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Capacitor · PWA · Prettier · Husky
