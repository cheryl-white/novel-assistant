# 小说助手 · Novel Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with AI](<https://img.shields.io/badge/Built%20with-AI%20(Cursor)-blueviolet>)](#作者与-ai-说明)

AI 辅助网文创作工具，可以导入 txt/zip 等文件，傻瓜式操作界面，内接 AI，帮助作者解决「卡文」问题。数据保存在本地。

> **开源声明：** 本仓库以 [MIT License](./LICENSE) 开源，欢迎学习、使用与改造。

## 作者与 AI 说明

本项目由作者提出需求与验收，**主要代码与文档在 [Cursor](https://cursor.com) 中由 AI 编程助手生成与迭代**（非纯手写）。

- 作者负责：产品方向、功能取舍、本地测试与发布决策
- AI 负责：实现代码、工程配置、安卓封装辅助、文档草稿等

若你 fork / 引用本项目，请保留本说明与 MIT 许可证声明。欢迎在 Issues 中反馈问题或改进建议。

## 功能

- **小说 / 章节管理** — 创建、删除、改名、拖拽排序；侧栏可滑动收起
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

> API Key 只保存在你本机，不会上传到本项目的服务器（本项目无自有后端）。

## 安卓版

详见 [ANDROID.md](./ANDROID.md)。常用：

```bash
npm run android:sync   # 构建并同步到 android/
npm run android:open   # 用 Android Studio 打开
```

浏览器版与安卓版共用同一套前端代码；另可用 Capacitor 自行扩展 iOS。

## 构建发布（Web）

```bash
npm run build
npm run preview
```

将 `dist/` 部署到静态托管。上线后请把 `index.html` 里的 `canonical` / Open Graph URL，以及 `public/sitemap.xml` 中的地址改成你的正式域名。

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Capacitor（Android）· Prettier · Husky

## 许可证

[MIT](./LICENSE) — 可自由使用、修改与分发，需保留版权与许可声明。
