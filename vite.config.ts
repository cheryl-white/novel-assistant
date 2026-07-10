import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/novel-assistant/',
  plugins: [react(), tailwindcss()],

  // 新增：让 Vite 忽略 index.html 里的资源处理
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },

  // 关键配置：不处理 index.html 里的静态资源
  optimizeDeps: {
    entries: ['src/**/*'],
  },
})
